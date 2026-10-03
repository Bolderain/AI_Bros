/* =====================================================================
   Hand-drawn collage engine - deterministic, pure canvas 2D.
   Every wobble comes from a hash of (seed, index, tick) so a frame at
   time t always looks identical. Nothing uses Math.random at draw time.
   ===================================================================== */
'use strict';

const W = 1600, H = 900;          // internal stage size
const BOIL = 9;                   // hand-drawn "boil" rate, frames per second

/* --------------------------------------------------------------- hashing */
function ihash(x, y, z) {
  let h = 2166136261 >>> 0;
  h = Math.imul(h ^ (x | 0), 16777619) >>> 0;
  h = Math.imul(h ^ (y | 0), 16777619) >>> 0;
  h = Math.imul(h ^ (z | 0), 16777619) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 2246822507) >>> 0; h ^= h >>> 16;
  return h >>> 0;
}
const rnd = (a, b, c) => ihash(a, b, c) / 4294967296;
const sgn = (a, b, c) => rnd(a, b, c) * 2 - 1;
/* smooth value noise along a 1-D parameter */
function vn(seed, u, tick) {
  const i = Math.floor(u), f = u - i;
  const a = sgn(seed, i, tick), b = sgn(seed, i + 1, tick);
  const s = f * f * (3 - 2 * f);
  return a + (b - a) * s;
}

/* ----------------------------------------------------------------- maths */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, u) => a + (b - a) * u;
const inv = (a, b, v) => clamp((v - a) / (b - a || 1), 0, 1);
const ease = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
const easeOut = u => 1 - Math.pow(1 - u, 3);
const easeIn = u => u * u * u;
const easeOutBack = (u, s = 1.7) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2);
const easeOutElastic = u => u === 0 ? 0 : u === 1 ? 1
  : Math.pow(2, -9 * u) * Math.sin((u * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
const pulse = (u, a, b) => clamp(Math.min((u - a) / 0.001, (b - u) / 0.001), 0, 1);

/* ---------------------------------------------------------------- palette */
const P = {
  paper: '#f4ead7', paperWarm: '#efe2c9', paperHi: '#fbf6e9', paperDeep: '#e3d4b6',
  sqLight: '#f2e7cd', sqDark: '#cfb183',
  ink: '#302b28', ink2: '#4b443d', pencil: '#8d8574', pencilL: '#a79e8b',
  red: '#cb4733', rust: '#b35a37', teal: '#2d7d79', blue: '#3a6a9e',
  mustard: '#d9a328', olive: '#6f7f49', rose: '#cf857c',
  white: '#fcf7ea', black: '#3a3632',
  shadow: 'rgba(72,58,40,.22)',
};

/* ===================================================================== ink
   Sketchy stroke primitives. `tick` is the boil frame, passed around so
   the same t always produces the same line.
   ===================================================================== */
class Ink {
  constructor(ctx) { this.c = ctx; this.tick = 0; }

  /* displace a polyline perpendicular to its own direction */
  wobble(pts, amp, seed, freq = 0.5, tick) {
    const t = tick === undefined ? this.tick : tick;
    const n = pts.length, out = new Array(n);
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const d = vn(seed, i * freq, t) * amp;
      out[i] = [p[0] - dy * d, p[1] + dx * d];
    }
    return out;
  }

  /* resample a polyline so wobble has enough vertices to breathe */
  dense(pts, step = 16, close = false) {
    const src = close ? pts.concat([pts[0]]) : pts;
    const out = [];
    for (let i = 0; i < src.length - 1; i++) {
      const [x1, y1] = src[i], [x2, y2] = src[i + 1];
      const len = Math.hypot(x2 - x1, y2 - y1);
      const n = Math.max(1, Math.round(len / step));
      for (let k = 0; k < n; k++) out.push([lerp(x1, x2, k / n), lerp(y1, y2, k / n)]);
    }
    out.push(src[src.length - 1]);
    return out;
  }

  path(pts, close) {
    const c = this.c;
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1];
      c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    const l = pts[pts.length - 1];
    c.lineTo(l[0], l[1]);
    if (close) c.closePath();
  }

  /* the workhorse: a multi-pass pencil/ink stroke */
  stroke(pts, o = {}) {
    const c = this.c;
    const col = o.color || P.ink, w = o.w || 2.2, al = o.alpha === undefined ? 1 : o.alpha;
    const amp = o.amp === undefined ? 1.5 : o.amp;
    const seed = o.seed || 1, passes = o.passes || 2, close = !!o.close;
    const dp = this.dense(pts, o.step || 18, close);
    if (dp.length < 2) return;
    c.save();
    c.lineCap = o.cap || 'round'; c.lineJoin = 'round';
    c.strokeStyle = col;
    for (let p = 0; p < passes; p++) {
      const wp = this.wobble(dp, amp * (1 + p * 0.55), seed + p * 7919, o.freq || 0.5);
      c.globalAlpha = al * (p === 0 ? 1 : 0.42 / p);
      c.lineWidth = w * (1 - p * 0.22);
      this.path(wp, close);
      c.stroke();
    }
    c.restore();
  }

  /* a soft coloured wash that deliberately misses the outline a little */
  wash(pts, o = {}) {
    const c = this.c;
    const dx = o.dx === undefined ? 2.5 : o.dx, dy = o.dy === undefined ? 2 : o.dy;
    const dp = this.dense(pts, o.step || 22, true);
    const wp = this.wobble(dp, o.amp === undefined ? 3 : o.amp, (o.seed || 1) + 311, 0.4);
    c.save();
    c.translate(dx, dy);
    c.globalAlpha = o.alpha === undefined ? 0.85 : o.alpha;
    c.fillStyle = o.color || P.paperHi;
    this.path(wp, true);
    c.fill();
    c.restore();
  }

  /* pencil hatching inside a shape */
  hatch(pts, o = {}) {
    const c = this.c;
    const ang = o.angle === undefined ? -0.7 : o.angle, gap = o.gap || 9;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    c.save();
    this.path(this.dense(pts, 20, true), true);
    c.clip();
    c.strokeStyle = o.color || P.ink;
    c.globalAlpha = o.alpha === undefined ? 0.3 : o.alpha;
    c.lineWidth = o.w || 1.2;
    c.lineCap = 'round';
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const R = Math.hypot(x1 - x0, y1 - y0);
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const n = Math.ceil(R / gap);
    for (let i = -n; i <= n; i++) {
      const off = i * gap + sgn(o.seed || 3, i, this.tick) * gap * 0.18;
      const ax = cx + ca * -R - sa * off, ay = cy + sa * -R + ca * off;
      const bx = cx + ca * R - sa * off, by = cy + sa * R + ca * off;
      const j = sgn(o.seed || 3, i + 500, this.tick) * 2;
      c.beginPath(); c.moveTo(ax, ay + j); c.lineTo(bx, by - j); c.stroke();
    }
    c.restore();
  }

  /* a torn scrap of paper: deckled edge, soft shadow, lighter core line */
  scrap(pts, o = {}) {
    const c = this.c;
    const seed = o.seed || 5, serr = o.serr === undefined ? 2.6 : o.serr;
    const dp = this.dense(pts, o.step || 9, true);
    /* paper edges do not boil - tick fixed at 0 */
    const edge = dp.map((p, i) => {
      const a = dp[(i - 1 + dp.length) % dp.length], b = dp[(i + 1) % dp.length];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const big = rnd(seed, i, 7) < 0.1 ? 2.6 : 1;
      const d = vn(seed, i * 1.35, 0) * serr * big;
      return [p[0] - dy * d, p[1] + dx * d];
    });
    c.save();
    if (o.shadow !== false) {
      c.shadowColor = o.shadowColor || P.shadow;
      c.shadowBlur = o.blur === undefined ? 13 : o.blur;
      c.shadowOffsetX = (o.sx === undefined ? 3 : o.sx);
      c.shadowOffsetY = (o.sy === undefined ? 6 : o.sy);
    }
    c.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    c.fillStyle = o.color || P.paperWarm;
    this.path(edge, true);
    c.fill();
    c.restore();
    /* torn fibre highlight just inside the edge */
    if (o.fibre !== false) {
      c.save();
      c.globalAlpha = (o.alpha === undefined ? 1 : o.alpha) * 0.5;
      c.strokeStyle = o.fibreColor || P.paperHi;
      c.lineWidth = 1.6;
      this.path(edge, true);
      c.stroke();
      c.restore();
    }
    return edge;
  }

  /* dashed guide line that animates (dash offset is a pure fn of t) */
  dashed(pts, o = {}) {
    const c = this.c;
    c.save();
    c.setLineDash(o.dash || [11, 9]);
    c.lineDashOffset = -(o.flow || 0);
    c.strokeStyle = o.color || P.pencil;
    c.lineWidth = o.w || 2;
    c.globalAlpha = o.alpha === undefined ? 0.9 : o.alpha;
    c.lineCap = 'butt';
    const dp = this.dense(pts, o.step || 24, false);
    this.path(this.wobble(dp, o.amp === undefined ? 1.1 : o.amp, o.seed || 9, 0.45), false);
    c.stroke();
    c.restore();
  }

  arrowHead(x, y, ang, size, o = {}) {
    const c = this.c;
    const a = size, sp = o.spread || 0.42;
    const p1 = [x - Math.cos(ang - sp) * a, y - Math.sin(ang - sp) * a];
    const p2 = [x - Math.cos(ang + sp) * a, y - Math.sin(ang + sp) * a];
    this.stroke([p1, [x, y]], { color: o.color || P.ink, w: o.w || 2, seed: (o.seed || 1) + 1, amp: 0.6, passes: 1 });
    this.stroke([p2, [x, y]], { color: o.color || P.ink, w: o.w || 2, seed: (o.seed || 1) + 2, amp: 0.6, passes: 1 });
  }

  /* double-headed dimension line with a label */
  dim(x1, y1, x2, y2, label, o = {}) {
    const col = o.color || P.red;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    this.stroke([[x1, y1], [x2, y2]], { color: col, w: o.w || 1.8, seed: o.seed || 21, amp: 0.7, passes: 1 });
    this.arrowHead(x2, y2, ang, o.head || 9, { color: col, seed: o.seed || 21, w: o.w || 1.8 });
    this.arrowHead(x1, y1, ang + Math.PI, o.head || 9, { color: col, seed: (o.seed || 21) + 40, w: o.w || 1.8 });
    /* tick marks at each end */
    const nx = -Math.sin(ang), ny = Math.cos(ang), e = o.ticks === undefined ? 7 : o.ticks;
    if (e) {
      this.stroke([[x1 - nx * e, y1 - ny * e], [x1 + nx * e, y1 + ny * e]], { color: col, w: 1.4, seed: 71, amp: .4, passes: 1 });
      this.stroke([[x2 - nx * e, y2 - ny * e], [x2 + nx * e, y2 + ny * e]], { color: col, w: 1.4, seed: 72, amp: .4, passes: 1 });
    }
    if (label) {
      const mx = (x1 + x2) / 2 + (o.lx || 0), my = (y1 + y2) / 2 + (o.ly || -12);
      this.text(label, mx, my, { size: o.size || 26, color: col, align: 'center', rot: o.rot || -0.02, seed: o.seed || 21, bg: o.bg });
    }
  }

  /* leader line from a label to a thing */
  leader(x1, y1, x2, y2, o = {}) {
    this.stroke([[x1, y1], [x2, y2]], { color: o.color || P.ink2, w: 1.6, seed: o.seed || 33, amp: 1.2, passes: 1, alpha: o.alpha === undefined ? .85 : o.alpha });
    const c = this.c;
    c.save();
    c.globalAlpha = o.alpha === undefined ? .85 : o.alpha;
    c.fillStyle = o.color || P.ink2;
    c.beginPath(); c.arc(x2, y2, 3.4, 0, 7); c.fill();
    c.restore();
  }

  text(s, x, y, o = {}) {
    const c = this.c;
    const size = o.size || 28;
    const fam = o.font || 'Patrick Hand';
    c.save();
    c.font = `${o.weight || 400} ${size}px "${fam}", "Segoe Print", "Bradley Hand", cursive`;
    c.textAlign = o.align || 'left';
    c.textBaseline = o.baseline || 'alphabetic';
    const rot = o.rot === undefined ? sgn(o.seed || 1, 77, 0) * 0.012 : o.rot;
    c.translate(x, y); c.rotate(rot);
    if (o.bg) {
      const m = c.measureText(s);
      const pw = m.width + size * 0.5, ph = size * 1.15;
      const ax = o.align === 'center' ? -pw / 2 : o.align === 'right' ? -pw : -size * 0.25;
      c.save();
      c.globalAlpha = o.bgAlpha === undefined ? 0.82 : o.bgAlpha;
      c.fillStyle = o.bg === true ? P.paper : o.bg;
      c.beginPath(); c.rect(ax, -ph * 0.78, pw, ph); c.fill();
      c.restore();
    }
    c.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    /* ink bleed: a faint offset copy under the main glyphs */
    if (o.bleed !== false) {
      c.save();
      c.globalAlpha = (o.alpha === undefined ? 1 : o.alpha) * 0.22;
      c.fillStyle = o.color || P.ink;
      c.translate(1.3, 1.1);
      c.fillText(s, 0, 0);
      c.restore();
    }
    c.fillStyle = o.color || P.ink;
    c.fillText(s, 0, 0);
    c.restore();
  }

  /* handwriting that writes itself: clip the glyphs to a growing box */
  textReveal(s, x, y, p, o = {}) {
    if (p <= 0) return;
    const c = this.c;
    if (p >= 1) return this.text(s, x, y, o);
    const size = o.size || 28;
    c.save();
    c.font = `${o.weight || 400} ${size}px "${o.font || 'Patrick Hand'}", cursive`;
    const wdt = c.measureText(s).width;
    const ax = o.align === 'center' ? x - wdt / 2 : o.align === 'right' ? x - wdt : x;
    c.beginPath();
    c.rect(ax - 6, y - size * 1.25, wdt * easeOut(p) + 8, size * 1.8);
    c.clip();
    this.text(s, x, y, o);
    c.restore();
  }

  blob(x, y, r, o = {}) {
    const n = o.n || 11, pts = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      const rr = r * (1 + sgn(o.seed || 4, i, o.boil ? this.tick : 0) * (o.rough || .12));
      pts.push([x + Math.cos(a) * rr * (o.kx || 1), y + Math.sin(a) * rr * (o.ky || 1)]);
    }
    return pts;
  }

  circle(x, y, r, o = {}) {
    const pts = this.blob(x, y, r, { seed: o.seed, rough: o.rough === undefined ? .045 : o.rough, n: o.n || 14, kx: o.kx, ky: o.ky, boil: true });
    if (o.fill) this.wash(pts, { color: o.fill, alpha: o.fillAlpha === undefined ? .9 : o.fillAlpha, seed: o.seed, dx: o.dx === undefined ? 1.8 : o.dx, dy: o.dy === undefined ? 1.6 : o.dy, amp: 1.6 });
    if (o.stroke !== false) this.stroke(pts, { close: true, color: o.color || P.ink, w: o.w || 2.2, seed: (o.seed || 4) + 5, amp: o.amp === undefined ? 1.1 : o.amp, passes: o.passes || 2 });
    return pts;
  }

  rect(x, y, w, h, o = {}) {
    const pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    if (o.fill) this.wash(pts, { color: o.fill, alpha: o.fillAlpha === undefined ? .9 : o.fillAlpha, seed: o.seed, dx: 2, dy: 1.8 });
    if (o.stroke !== false) this.stroke(pts, { close: true, color: o.color || P.ink, w: o.w || 2.2, seed: (o.seed || 6) + 3, amp: o.amp === undefined ? 1.3 : o.amp });
    return pts;
  }

  /* impact starburst for the collision gag */
  burst(x, y, r, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + (o.rot || 0);
      const r0 = r * (0.42 + rnd(o.seed || 8, i, 0) * 0.2);
      const r1 = r * (0.92 + rnd(o.seed || 8, i + 90, 0) * 0.45);
      this.stroke([[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a) * r1, y + Math.sin(a) * r1]],
        { color: o.color || P.red, w: o.w || 3, seed: i * 31 + 1, amp: .7, passes: 1, alpha: o.alpha });
    }
  }

  scribbleCross(x, y, r, o = {}) {
    const k = o.passes || 3;
    for (let i = 0; i < k; i++) {
      const j = () => sgn(o.seed || 12, i * 9 + 1, 0) * r * .16;
      this.stroke([[x - r + j(), y - r + j()], [x + r + j(), y + r + j()]], { color: o.color || P.red, w: o.w || 5, seed: 300 + i, amp: 2.4, passes: 1, alpha: .9 });
      this.stroke([[x + r + j(), y - r + j()], [x - r + j(), y + r + j()]], { color: o.color || P.red, w: o.w || 5, seed: 400 + i, amp: 2.4, passes: 1, alpha: .9 });
    }
  }

  /* crayon-ish ellipse used to circle things */
  circleAround(x, y, rx, ry, o = {}) {
    const laps = o.laps || 2;
    for (let l = 0; l < laps; l++) {
      const pts = [];
      const n = 26;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2 * (o.p === undefined ? 1 : o.p) - 0.4 + l * 0.3;
        const k = 1 + sgn((o.seed || 13) + l, i, 0) * 0.055;
        pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]);
      }
      if (pts.length > 1) this.stroke(pts, { color: o.color || P.red, w: o.w || 4, seed: 500 + l, amp: 1.8, passes: 1, alpha: .78 });
    }
  }
}

/* ============================================================ paper layers */
function makePaper(w, h, seed, quality) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  c.fillStyle = P.paper; c.fillRect(0, 0, w, h);

  /* broad mottling */
  const blots = Math.round(70 * quality);
  for (let i = 0; i < blots; i++) {
    const x = rnd(seed, i, 1) * w, y = rnd(seed, i, 2) * h;
    const r = 60 + rnd(seed, i, 3) * 260;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    const dark = rnd(seed, i, 4) > .5;
    g.addColorStop(0, dark ? 'rgba(150,126,86,.055)' : 'rgba(255,250,236,.075)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  /* fibres */
  const fib = Math.round(5200 * quality);
  c.lineWidth = 1;
  for (let i = 0; i < fib; i++) {
    const x = rnd(seed, i, 11) * w, y = rnd(seed, i, 12) * h;
    const a = rnd(seed, i, 13) * Math.PI * 2, l = 3 + rnd(seed, i, 14) * 13;
    const d = rnd(seed, i, 15);
    c.strokeStyle = d > .55 ? 'rgba(255,252,242,.5)' : 'rgba(120,100,70,.09)';
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
  }
  /* speckles */
  const sp = Math.round(1700 * quality);
  for (let i = 0; i < sp; i++) {
    const x = rnd(seed, i, 21) * w, y = rnd(seed, i, 22) * h;
    const r = rnd(seed, i, 23) * 1.5 + .25;
    c.fillStyle = `rgba(96,78,54,${.04 + rnd(seed, i, 24) * .11})`;
    c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  }
  return cv;
}

function makeGrain(size, seed) {
  const cv = document.createElement('canvas');
  cv.width = size; cv.height = size;
  const c = cv.getContext('2d');
  const im = c.createImageData(size, size);
  const d = im.data;
  for (let i = 0; i < size * size; i++) {
    const v = rnd(seed, i, 3);
    const g = v < .5 ? 0 : 255;
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = g;
    d[i * 4 + 3] = Math.round(Math.abs(v - .5) * 90);
  }
  c.putImageData(im, 0, 0);
  return cv;
}

/* a tiny cache so static artwork is drawn once, not 60 times a second */
const layerCache = new Map();
function layer(key, w, h, draw) {
  let v = layerCache.get(key);
  if (v) return v;
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h));
  const c = cv.getContext('2d');
  draw(c, cv);
  if (layerCache.size > 48) layerCache.clear();
  layerCache.set(key, cv);
  return cv;
}
