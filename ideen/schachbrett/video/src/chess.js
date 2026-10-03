/* =====================================================================
   Board, pieces and the grid-line router.
   Board coordinates (u,v): u = 0..8 across the files, v = 0..8 down the
   ranks. A square (file f, rank-from-top r) has its centre at
   (f+0.5, r+0.5). Safe travel happens wherever u or v is an integer -
   those are the lines between the squares.
   ===================================================================== */
'use strict';

const SQ = 110;          // square size in board-layer pixels
const KY = 0.70;         // vertical compression -> gentle three-quarter view
const BM = 46;           // board layer margin
const SLAB = 26;         // front edge thickness

/* ------------------------------------------------------------- routing */
function linePath(f1, r1, f2, r2) {
  const sx = f1 + .5, sy = r1 + .5, ex = f2 + .5, ey = r2 + .5;
  if (f1 === f2 && r1 === r2) return [[sx, sy]];
  const uL = f2 > f1 ? f1 + 1 : f2 < f1 ? f1 : f1 + 1;
  const vL = r2 > r1 ? r2 : r2 < r1 ? r2 + 1 : r1 + 1;
  const raw = [[sx, sy], [uL, sy], [uL, vL], [ex, vL], [ex, ey]];
  const out = [raw[0]];
  for (let i = 1; i < raw.length; i++) {
    const a = out[out.length - 1], b = raw[i];
    if (Math.abs(a[0] - b[0]) > 1e-6 || Math.abs(a[1] - b[1]) > 1e-6) out.push(b);
  }
  return out;
}

/* path off the board into a parking slot at (pu, pv) */
function parkPath(f, r, pu, pv) {
  const sy = r + .5;
  const uL = f + 1;
  const vL = pv < r ? r : r + 1;
  const raw = [[f + .5, sy], [uL, sy], [uL, vL], [8, vL], [pu, vL], [pu, pv]];
  const out = [raw[0]];
  for (let i = 1; i < raw.length; i++) {
    const a = out[out.length - 1], b = raw[i];
    if (Math.abs(a[0] - b[0]) > 1e-6 || Math.abs(a[1] - b[1]) > 1e-6) out.push(b);
  }
  return out;
}

/* arc-length walk along a polyline in board space */
function walk(path, p) {
  if (path.length === 1) return { pos: path[0], seg: 0 };
  const segs = [];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1][0] - path[i][0];
    const dy = (path[i + 1][1] - path[i][1]) * KY;   // measure in screen-ish metric
    const l = Math.hypot(dx, dy);
    segs.push(l); total += l;
  }
  let d = clamp(p, 0, 1) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const u = segs[i] ? clamp(d / segs[i], 0, 1) : 1;
      return {
        pos: [lerp(path[i][0], path[i + 1][0], u), lerp(path[i][1], path[i + 1][1], u)],
        seg: i, segU: u, total,
      };
    }
    d -= segs[i];
  }
  return { pos: path[path.length - 1], seg: segs.length - 1, segU: 1, total };
}

function pathUpTo(path, p) {
  const w = walk(path, p);
  const out = path.slice(0, w.seg + 1);
  out.push(w.pos);
  return out;
}

/* ------------------------------------------------------------- camera */
function cam(zoom, u0, v0, cx, cy) {
  return {
    zoom, u0, v0, cx, cy,
    pt(u, v) { return [cx + (u - u0) * SQ * zoom, cy + (v - v0) * SQ * KY * zoom]; },
    px(n) { return n * SQ * zoom; },
  };
}

/* ------------------------------------------------------------- board art */
function boardLayerSize() {
  return { w: BM * 2 + SQ * 8, h: BM * 2 + SQ * 8 * KY + SLAB };
}

function makeBoardLayer(key, opt) {
  const { w, h } = boardLayerSize();
  return layer('board:' + key, w, h, (c) => {
    const ink = new Ink(c);
    ink.tick = 0;
    const pt = (u, v) => [BM + u * SQ, BM + v * SQ * KY];

    /* front slab so the board reads as a physical object */
    const bl = pt(0, 8), br = pt(8, 8);
    ink.scrap([[bl[0], bl[1]], [br[0], br[1]], [br[0] - 5, br[1] + SLAB], [bl[0] + 5, bl[1] + SLAB]],
      { color: '#c9ab7c', seed: 91, serr: 1.8, blur: 16, sy: 8, fibre: false });
    ink.hatch([[bl[0], bl[1]], [br[0], br[1]], [br[0] - 5, br[1] + SLAB], [bl[0] + 5, bl[1] + SLAB]],
      { angle: 0.1, gap: 7, alpha: .1, color: P.ink, seed: 7 });

    /* the 64 squares, each a separate little scrap of paper */
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const a = pt(f, r), b = pt(f + 1, r + 1);
        const dark = (f + r) % 2 === 1;
        const g = 1.0;
        ink.scrap([[a[0] + g, a[1] + g], [b[0] - g, a[1] + g], [b[0] - g, b[1] - g], [a[0] + g, b[1] - g]], {
          color: dark ? P.sqDark : P.sqLight,
          seed: 100 + f * 17 + r * 131, serr: 1.5,
          shadow: false, fibre: false,
        });
        if (dark) {
          ink.hatch([[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]],
            { angle: -0.62, gap: 11, alpha: .085, color: '#7a5f33', seed: 200 + f + r * 9, w: 1.5 });
        }
      }
    }
    /* outer frame, drawn like a pen border */
    const o = 7;
    const tl = pt(0, 0), tr = pt(8, 0), brr = pt(8, 8), bll = pt(0, 8);
    ink.stroke([[tl[0] - o, tl[1] - o], [tr[0] + o, tr[1] - o], [brr[0] + o, brr[1] + o], [bll[0] - o, bll[1] + o]],
      { close: true, color: P.ink, w: 3.2, seed: 11, amp: 1.6, passes: 2 });
    ink.stroke([[tl[0] - o - 5, tl[1] - o - 5], [tr[0] + o + 5, tr[1] - o - 5], [brr[0] + o + 5, brr[1] + o + 5], [bll[0] - o - 5, bll[1] + o + 5]],
      { close: true, color: P.ink2, w: 1.5, seed: 13, amp: 2.2, passes: 1, alpha: .5 });
  });
}

/* draw a cached board layer through a camera */
function drawBoard(ctx, camera, key, opt) {
  const cv = makeBoardLayer(key || 'main', opt || {});
  const z = camera.zoom;
  const originScreen = camera.pt(0, 0);
  ctx.save();
  ctx.translate(originScreen[0] - BM * z, originScreen[1] - BM * z);
  ctx.scale(z, z);
  ctx.drawImage(cv, 0, 0);
  ctx.restore();
}

/* ------------------------------------------------------------- pieces */
/* Deliberately slim: the whole point of the piece is that it fits through a
   half-square gap, so the drawing has to show that it does. */
const HS = { p: .60, r: .72, n: .80, b: .86, q: .96, k: 1.0 };
const WD = { p: .39, r: .47, n: .49, b: .39, q: .47, k: .44 };

function pieceShapes(type, h, w) {
  /* returns a list of {pts, kind} in local coords, y up is negative */
  const bw = w * .5, out = [];
  const base = [
    [-bw, 0], [bw, 0], [bw * .96, -h * .055], [bw * .62, -h * .085],
    [bw * .55, -h * .12], [-bw * .55, -h * .12], [-bw * .62, -h * .085], [-bw * .96, -h * .055],
  ];
  out.push({ pts: base, kind: 'body' });

  const stem = (y0, y1, w0, w1) => [[-w0, y0], [w0, y0], [w1, y1], [-w1, y1]];

  if (type === 'p') {
    out.push({ pts: stem(-h * .12, -h * .55, bw * .34, bw * .26), kind: 'body' });
    out.push({ pts: [[-bw * .44, -h * .55], [bw * .44, -h * .55], [bw * .36, -h * .64], [-bw * .36, -h * .64]], kind: 'body' });
    out.push({ kind: 'circle', x: 0, y: -h * .81, r: h * .18 });
  } else if (type === 'r') {
    out.push({ pts: stem(-h * .12, -h * .66, bw * .5, bw * .44), kind: 'body' });
    out.push({ pts: [[-bw * .66, -h * .66], [bw * .66, -h * .66], [bw * .66, -h * .78], [-bw * .66, -h * .78]], kind: 'body' });
    for (let i = 0; i < 3; i++) {
      const x = -bw * .66 + bw * .44 * (i * 1.5);
      out.push({ pts: [[x, -h * .78], [x + bw * .44, -h * .78], [x + bw * .44, -h], [x, -h]], kind: 'body' });
    }
  } else if (type === 'n') {
    out.push({ pts: stem(-h * .12, -h * .32, bw * .5, bw * .40), kind: 'body' });
    /* neck + head leaning right */
    out.push({
      kind: 'body', pts: [
        [-bw * .40, -h * .32], [bw * .34, -h * .34], [bw * .50, -h * .52],
        [bw * .86, -h * .64], [bw * .95, -h * .74], [bw * .55, -h * .79],
        [bw * .62, -h * .92], [bw * .22, -h * 1.0], [-bw * .22, -h * .95],
        [-bw * .50, -h * .74], [-bw * .62, -h * .50],
      ]
    });
    out.push({ kind: 'line', pts: [[-bw * .30, -h * .88], [bw * .05, -h * .70], [bw * .02, -h * .46]] });
    out.push({ kind: 'dot', x: bw * .40, y: -h * .76, r: h * .022 });
  } else if (type === 'b') {
    out.push({ pts: stem(-h * .12, -h * .42, bw * .46, bw * .30), kind: 'body' });
    out.push({ pts: [[-bw * .52, -h * .42], [bw * .52, -h * .42], [bw * .44, -h * .50], [-bw * .44, -h * .50]], kind: 'body' });
    out.push({
      kind: 'body', pts: [
        [-bw * .40, -h * .50], [bw * .40, -h * .50], [bw * .46, -h * .66],
        [bw * .22, -h * .88], [0, -h * .94], [-bw * .22, -h * .88], [-bw * .46, -h * .66],
      ]
    });
    out.push({ kind: 'circle', x: 0, y: -h * .975, r: h * .042 });
    out.push({ kind: 'line', pts: [[bw * .06, -h * .60], [bw * .30, -h * .74]] });
  } else if (type === 'q' || type === 'k') {
    out.push({ pts: stem(-h * .12, -h * .50, bw * .5, bw * .32), kind: 'body' });
    out.push({ pts: [[-bw * .56, -h * .50], [bw * .56, -h * .50], [bw * .48, -h * .60], [-bw * .48, -h * .60]], kind: 'body' });
    out.push({
      kind: 'body', pts: [
        [-bw * .48, -h * .60], [bw * .48, -h * .60], [bw * .70, -h * .80], [-bw * .70, -h * .80],
      ]
    });
    if (type === 'q') {
      for (let i = 0; i < 5; i++) {
        const x = -bw * .58 + (bw * 1.16 / 4) * i;
        const yy = -h * (.80 + (i === 2 ? .12 : i % 2 === 0 ? .07 : .04));
        out.push({ kind: 'line', pts: [[x, -h * .80], [x, yy]] });
        out.push({ kind: 'circle', x, y: yy - h * .028, r: h * .032 });
      }
    } else {
      out.push({ pts: [[-bw * .70, -h * .80], [bw * .70, -h * .80], [bw * .52, -h * .88], [-bw * .52, -h * .88]], kind: 'body' });
      out.push({ kind: 'line', pts: [[0, -h * .88], [0, -h * 1.02]] });
      out.push({ kind: 'line', pts: [[-bw * .22, -h * .96], [bw * .22, -h * .96]] });
    }
  }
  return out;
}

function drawPiece(ink, type, x, y, size, side, seed, o = {}) {
  const c = ink.c;
  const h = size * HS[type], w = size * WD[type] * (o.fat || 1);
  const fill = side === 'w' ? P.white : P.black;
  const line = side === 'w' ? P.ink : P.ink;
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  const shapes = pieceShapes(type, h, w);

  c.save();
  c.globalAlpha = alpha;
  c.translate(x, y);
  if (o.rot) c.rotate(o.rot);
  if (o.lift) c.translate(0, -o.lift);

  /* contact shadow stays on the board even when the piece is lifted */
  if (o.shadow !== false) {
    c.save();
    c.globalAlpha = alpha * (o.lift ? .18 : .28);
    c.fillStyle = 'rgba(70,56,40,1)';
    const sw = w * .62 * (o.lift ? 1.25 : 1);
    c.translate(0, (o.lift || 0) + 2);
    c.beginPath(); c.ellipse(1.5, 1, sw, sw * .32, 0, 0, 7); c.fill();
    c.restore();
  }

  for (const s of shapes) {
    if (s.kind === 'body') {
      ink.wash(s.pts, { color: fill, alpha: side === 'w' ? .96 : .92, seed: seed + 3, dx: 1.6, dy: 1.4, amp: 1.4 });
    } else if (s.kind === 'circle') {
      const pts = ink.blob(s.x, s.y, s.r, { seed: seed + 11, rough: .07, n: 11, boil: true });
      ink.wash(pts, { color: fill, alpha: side === 'w' ? .96 : .92, seed: seed + 12, dx: 1.4, dy: 1.2 });
    }
  }
  if (side === 'b') {
    for (const s of shapes) if (s.kind === 'body') {
      ink.hatch(s.pts, { angle: -0.9, gap: Math.max(5, h * .055), alpha: .14, color: '#0d0c0b', seed: seed + 21, w: 1.3 });
    }
  }
  for (const s of shapes) {
    if (s.kind === 'body') {
      ink.stroke(s.pts, { close: true, color: line, w: Math.max(1.5, h * .028), seed: seed + 31, amp: Math.max(.6, h * .012), passes: 2 });
    } else if (s.kind === 'circle') {
      const pts = ink.blob(s.x, s.y, s.r, { seed: seed + 11, rough: .07, n: 11, boil: true });
      ink.stroke(pts, { close: true, color: line, w: Math.max(1.4, h * .026), seed: seed + 41, amp: .7, passes: 2 });
    } else if (s.kind === 'line') {
      ink.stroke(s.pts, { color: side === 'w' ? P.ink2 : '#8d857a', w: Math.max(1.2, h * .022), seed: seed + 51, amp: .7, passes: 1, alpha: .8 });
    } else if (s.kind === 'dot') {
      c.save(); c.fillStyle = side === 'w' ? P.ink : '#cfc6b4';
      c.beginPath(); c.arc(s.x, s.y, Math.max(1.3, s.r), 0, 7); c.fill(); c.restore();
    }
  }
  c.restore();
}

/* the magnet carriage seen through the board: a soft grey disc + field dots */
function drawMagnetUnder(ink, x, y, r, strength, seed, tick) {
  const c = ink.c;
  c.save();
  c.globalAlpha = .34 * strength;
  const g = c.createRadialGradient(x, y + r * .15, 0, x, y + r * .15, r * 2.1);
  g.addColorStop(0, 'rgba(58,106,158,.85)');
  g.addColorStop(.55, 'rgba(58,106,158,.22)');
  g.addColorStop(1, 'rgba(58,106,158,0)');
  c.fillStyle = g;
  c.beginPath(); c.ellipse(x, y + r * .15, r * 2.1, r * 2.1 * KY, 0, 0, 7); c.fill();
  c.restore();
  c.save();
  c.globalAlpha = .62 * strength;
  ink.stroke(ink.blob(x, y, r, { seed, rough: .07, n: 13, boil: true }).map(p => [p[0], y + (p[1] - y) * KY]),
    { close: true, color: P.blue, w: 2.2, seed: seed + 2, amp: .9, passes: 1 });
  c.restore();
}
