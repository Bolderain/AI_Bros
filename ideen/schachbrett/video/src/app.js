/* =====================================================================
   Player: timeline lookup, scene dispatch, paper cuts between scenes,
   captions, chrome, audio sync. render(t) is pure - scrubbing works and
   an offline renderer can ask for any frame via window.__renderFrame.
   ===================================================================== */
'use strict';

/* A fresh sheet of paper swept across the frame. The cut happens while it
   covers, so it reads as a hand laying down the next page. Short on purpose:
   anything longer and the blank sheet starts to look like a glitch. */
const TRANS = {
  hook: null,
  brain: { dir: 'up', dur: 0.26 },
  hand: { dir: 'left', dur: 0.26 },
  problem: { dir: 'right', dur: 0.22 },
  lines: { dir: 'left', dur: 0.22 },
  slim: { dir: 'up', dur: 0.26 },
  capture: { dir: 'right', dur: 0.24 },
  release: { dir: 'left', dur: 0.26 },
  sense: { dir: 'up', dur: 0.24 },
  outro: { dir: 'right', dur: 0.28 },
};

/* page chrome copy, both languages */
const UI = {
  de: {
    title: 'Wie das Schachbrett sich selbst spielt',
    sub: 'Ein Elektromagnet unter dem Brett, <b>ein halbes Feld</b> Platz zum Durchfahren — und eine Regel, die alles bestimmt.',
    poster: 'Abspielen',
    play: 'Play', pause: 'Pause', again: 'Nochmal',
    ccTitle: 'Untertitel (C)', soundTitle: 'Ton',
    audioNote: 'Der Ton konnte nicht geladen werden. Die Animation läuft stumm weiter, die Untertitel bleiben synchron.',
    n1h: 'Worum es geht',
    n1p: 'Projektidee aus dem AI_Bros-Repo: ein Schachbrett, das die Züge der Engine selbst ausführt. Ein Elektromagnet auf einem H-Bot-Portal zieht die Figuren — und darf dabei nie über ein besetztes Feld fahren.',
    n2h: 'Die eine Regel',
    n2p: 'Gefahren wird nur auf den Linien zwischen den Feldern. Dort beträgt der Abstand zu jeder stehenden Figur genau ein halbes Feld. Also gilt: Figurenbreite ≤ halbe Feldgröße.',
    n3h: 'Gemacht mit',
    n3p: 'Alles hier wird erzeugt: Grafik als reines Canvas-2D ohne Bilddateien, Musik und Geräusche synthetisiert, Stimme per neuronalem TTS. Tasten: <span class="kbd">Space</span> <span class="kbd">←</span> <span class="kbd">→</span> <span class="kbd">R</span> <span class="kbd">C</span>',
  },
  en: {
    title: 'How the Chessboard Plays Itself',
    sub: 'An electromagnet under the board, <b>half a square</b> of room to get past — and one rule that decides everything.',
    poster: 'Play',
    play: 'Play', pause: 'Pause', again: 'Again',
    ccTitle: 'Captions (C)', soundTitle: 'Sound',
    audioNote: 'The audio could not be loaded. The animation keeps playing silently and the captions stay in sync.',
    n1h: 'What this is',
    n1p: 'A concept from the AI_Bros repo: a chessboard that plays the engine’s moves itself. An electromagnet on an H-bot gantry drags the pieces — and may never cross a square where another piece stands.',
    n2h: 'The one rule',
    n2p: 'Travel only happens on the lines between the squares. There the distance to any standing piece is exactly half a square. So: piece width ≤ half the square size.',
    n3h: 'Made with',
    n3p: 'Everything here is generated: graphics are plain canvas 2D with no image files, music and foley synthesised from scratch, the voice is neural TTS. Keys: <span class="kbd">Space</span> <span class="kbd">←</span> <span class="kbd">→</span> <span class="kbd">R</span> <span class="kbd">C</span>',
  },
};

const App = {
  lang: 'de',
  tl: null,
  audio: null,
  playing: false,
  captions: true,
  t: 0,
  clockBase: 0, clockT0: 0, haveAudio: false,
  paper: null, grain: null, vign: null,
  ctx: null, cv: null, ink: null, scale: 1,
  ended: false,
};

function applyUI() {
  const u = UI[App.lang], q = id => document.getElementById(id);
  document.documentElement.lang = App.lang;
  document.title = u.title;
  q('pageTitle').textContent = u.title;
  q('pageSub').innerHTML = u.sub;
  q('posterLabel').textContent = u.poster;
  q('audioNote').textContent = u.audioNote;
  q('btnCC').title = u.ccTitle;
  q('btnMute').title = u.soundTitle;
  for (const k of ['n1h', 'n1p', 'n2h', 'n2p', 'n3h', 'n3p']) q(k).innerHTML = u[k];
}

/* ---------------------------------------------------------------- setup */
function setup() {
  App.cv = document.getElementById('stage');
  App.ctx = App.cv.getContext('2d', { alpha: false });
  App.ink = new Ink(App.ctx);
  App.paper = makePaper(W + 40, H + 40, 777, 1);
  App.grain = makeGrain(256, 4242);
  App.vign = layer('vign', W, H, (c) => {
    const g = c.createRadialGradient(W / 2, H * 0.46, H * 0.22, W / 2, H * 0.5, H * 0.95);
    g.addColorStop(0, 'rgba(60,46,26,0)');
    g.addColorStop(0.72, 'rgba(60,46,26,0.06)');
    g.addColorStop(1, 'rgba(52,40,22,0.26)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  });
  resize();
  window.addEventListener('resize', resize);
  buildChrome();
  loadLang('de', false);
  requestAnimationFrame(frame);
}

function resize() {
  const host = App.cv.parentElement;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = Math.max(320, host.clientWidth);
  const pxW = Math.min(1920, Math.round(cssW * dpr));
  App.cv.width = pxW;
  App.cv.height = Math.round(pxW * H / W);
  App.scale = pxW / W;
}

/* ---------------------------------------------------------------- timing */
function now() {
  if (App.haveAudio && App.audio) return App.audio.currentTime;
  if (!App.playing) return App.clockBase;
  return App.clockBase + (performance.now() - App.clockT0) / 1000;
}

function beatAt(t) {
  const bs = App.tl.beats;
  for (let i = 0; i < bs.length; i++) if (t < bs[i].end) return i;
  return bs.length - 1;
}

function sceneCtx(bi, t) {
  const beat = App.tl.beats[bi];
  const lines = beat.lines.map(i => App.tl.lines[i]);
  const lt = t - beat.start;
  return {
    ink: App.ink, ctx: App.ctx, t, beat, lt,
    p: clamp(lt / beat.dur, 0, 1),
    lang: App.lang, STR: STR[App.lang], shake: 0,
    ln(k) {
      const L = lines[Math.min(k, lines.length - 1)];
      const llt = t - L.start;
      return { on: llt >= 0, lt: Math.max(0, llt), dur: L.dur, p: clamp(llt / L.dur, 0, 1), t0: L.start };
    },
  };
}

/* ---------------------------------------------------------------- render */
function render(t) {
  const ctx = App.ctx, ink = App.ink;
  ink.tick = Math.floor(t * BOIL);
  const total = App.tl.total;
  t = clamp(t, 0, total);

  ctx.save();
  ctx.setTransform(App.scale, 0, 0, App.scale, 0, 0);

  const bi = beatAt(t);
  const beat = App.tl.beats[bi];
  const tr = TRANS[beat.id];
  const trp = tr ? clamp((t - beat.start) / tr.dur, 0, 1) : 1;
  const showPrev = !!tr && trp < 0.5 && bi > 0;

  /* --- paper ground, nudged per scene so each cut feels like a new sheet */
  const drawBi = showPrev ? bi - 1 : bi;
  const ox = -20 + sgn(901, drawBi, 0) * 12, oy = -20 + sgn(902, drawBi, 0) * 10;
  ctx.fillStyle = P.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(App.paper, ox, oy);

  /* --- the scene itself (previous one held during the first half of a cut) */
  const drawT = showPrev ? App.tl.beats[bi].start - 0.001 : t;
  const s = sceneCtx(drawBi, drawT);
  const fn = SCENES[App.tl.beats[drawBi].id];
  ctx.save();
  const sh = estimateShake(App.tl.beats[drawBi].id, s);
  if (sh) ctx.translate(sgn(910, ink.tick, 0) * sh, sgn(911, ink.tick, 0) * sh);
  if (fn) fn(s);
  ctx.restore();

  /* --- the paper cut */
  if (tr && trp < 1) drawTransition(ink, ctx, tr, trp, bi);

  /* --- grain */
  ctx.save();
  ctx.globalAlpha = 0.085;
  ctx.globalCompositeOperation = 'overlay';
  const gx = (ink.tick * 37) % 256, gy = (ink.tick * 61) % 256;
  for (let y = -gy; y < H; y += 256) for (let x = -gx; x < W; x += 256) ctx.drawImage(App.grain, x, y);
  ctx.restore();

  ctx.drawImage(App.vign, 0, 0);

  /* --- captions + progress */
  if (App.captions) drawCaption(ink, t);
  drawProgress(ink, t, total);

  ctx.restore();
}

function estimateShake(id, s) {
  if (id !== 'problem') return 0;
  const hit = 0.46;
  const after = clamp((s.p - hit) / (1 - hit), 0, 1);
  return after > 0 && after < 0.26 ? (1 - after / 0.26) * 11 : 0;
}

/* a torn sheet sweeping across, hiding the cut */
function drawTransition(ink, ctx, tr, p, bi) {
  const seed = 1400 + bi * 37;
  const vx = tr.dir === 'left' ? -1 : tr.dir === 'right' ? 1 : 0;
  const vy = tr.dir === 'up' ? -1 : 0;
  const span = vy ? H : W;
  const dir = p < 0.5 ? -1 : 1;
  const d = Math.abs(1 - 2 * p) * span * 1.95;
  const tone = [P.paperWarm, P.paperHi, P.paperDeep][bi % 3];

  ctx.save();
  ctx.translate(W / 2 + vx * dir * d, H / 2 + vy * dir * d);
  ctx.rotate(sgn(seed, 3, 0) * 0.03);
  ink.scrap([[-W, -H], [W, -H * .98], [W * .99, H], [-W * .98, H * .99]],
    { color: tone, seed, serr: 10, blur: 30, sy: 14 });
  /* a little collage texture so the sheet never reads as an empty rectangle */
  ctx.globalAlpha = .5;
  for (let i = 0; i < 3; i++) {
    const y = -220 + i * 210 + sgn(seed, i, 0) * 50;
    ink.scrap([[-560 + i * 90, y], [500 - i * 60, y - 18], [496 - i * 60, y + 86], [-556 + i * 90, y + 96]],
      { color: i % 2 ? P.paperDeep : P.paperHi, seed: seed + 11 + i, serr: 5, blur: 16, sy: 7 });
  }
  ctx.globalAlpha = .22;
  for (let i = 0; i < 5; i++) {
    const y = -300 + i * 150;
    ink.stroke([[-470 + i * 40, y], [420 - i * 30, y + 16]],
      { color: P.pencil, w: 7, seed: seed + i, amp: 6, passes: 1 });
  }
  ctx.restore();
}

/* ---------------------------------------------------------------- captions */
function drawCaption(ink, t) {
  if (App.tl.beats[beatAt(t)].id === 'outro') return;   // the end card already says it
  let cur = null;
  for (const L of App.tl.lines) {
    if (t >= L.start - 0.06 && t < L.end + 0.30) { cur = L; break; }
  }
  if (!cur) return;
  const ctx = ink.c;
  const inP = clamp((t - cur.start + 0.06) / 0.22, 0, 1);
  const outP = clamp((t - cur.end) / 0.30, 0, 1);
  const alpha = Math.min(clamp(inP * 2.2, 0, 1), 1 - easeIn(outP));
  if (alpha <= 0.01) return;

  /* The stage is drawn at 1600x900 and scaled to fit, so on a phone a 35px
     caption lands at ~8px. Grow it as the viewport shrinks, then shrink again
     if the line would run off the frame. */
  const cssW = App.cv.clientWidth || W;
  let size = Math.round(35 * clamp(1150 / cssW, 1, 2.1));
  const maxW = W - 190;
  ctx.save();
  ctx.font = `400 ${size}px "Patrick Hand", cursive`;
  let tw = ctx.measureText(cur.text).width;
  if (tw > maxW) {
    size = Math.max(26, Math.floor(size * maxW / tw));
    ctx.font = `400 ${size}px "Patrick Hand", cursive`;
    tw = ctx.measureText(cur.text).width;
  }
  ctx.restore();

  const bw = tw / 2 + size * 1.05, bh = size * 0.95;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(W / 2, H - 54 - size * 0.5 + (1 - easeOut(inP)) * 16);
  ctx.rotate(-0.004);
  ink.scrap([[-bw, -bh], [bw, -bh + 3], [bw - 3, bh], [-bw + 2, bh - 3]],
    { color: P.paperHi, seed: 1500 + cur.i, serr: 2.6, blur: 14, sy: 6, alpha: .97 });
  ink.textReveal(cur.text, 0, size * 0.34, clamp((t - cur.start) / 0.3, 0, 1),
    { size, color: P.ink, align: 'center', rot: 0, seed: 1600 + cur.i, bleed: false });
  ctx.restore();
}

/* a pencil rule with a tick per scene */
function drawProgress(ink, t, total) {
  const ctx = ink.c;
  const x0 = 96, x1 = W - 96, y = 892;
  ctx.save();
  ctx.globalAlpha = .45;
  ink.stroke([[x0, y], [x1, y]], { color: P.pencilL, w: 2, seed: 1700, amp: .8, passes: 1 });
  const x = lerp(x0, x1, clamp(t / total, 0, 1));
  ctx.globalAlpha = .4;
  for (const b of App.tl.beats) {
    const bx = lerp(x0, x1, b.start / total);
    ink.stroke([[bx, y - 5], [bx, y + 5]], { color: P.pencil, w: 1.6, seed: 1710 + b.i, amp: .3, passes: 1 });
  }
  ctx.globalAlpha = .9;
  ink.stroke([[x0, y], [x, y]], { color: P.red, w: 3.4, seed: 1701, amp: 1, passes: 1 });
  ctx.globalAlpha = 1;
  ink.circle(x, y, 6, { fill: P.red, fillAlpha: .95, color: P.ink, w: 1.6, seed: 1720, rough: .1 });
  ctx.restore();
}

/* ---------------------------------------------------------------- loop */
function posterTime() {
  return App.tl ? App.tl.beats[0].dur * 0.63 : 0;
}

function frame() {
  if (App.offline) {
    if (App.tl && App.forceT != null) render(App.forceT);
    requestAnimationFrame(frame); return;
  }
  const t = now();
  App.t = t;
  if (App.tl) {
    const total = App.tl.total;
    render(!App.started && !App.playing && t < 0.05 ? posterTime() : t);
    if (App.playing && t >= total - 0.02) {
      App.playing = false;
      App.ended = true;
      App.clockBase = total;
      if (App.audio) App.audio.pause();
      syncChrome();
    }
    syncTime(t, total);
  }
  requestAnimationFrame(frame);
}

/* ---------------------------------------------------------------- audio */
function loadLang(lang, autoplay) {
  App.lang = lang;
  App.tl = TIMELINES[lang];
  App.ended = false;
  App.started = false;
  App.haveAudio = false;
  layerCache.delete('board:main');
  applyUI();
  if (App.audio) { App.audio.pause(); App.audio.removeAttribute('src'); }
  const a = new Audio();
  a.preload = 'auto';
  a.src = 'track_' + lang + '.mp3';
  a.addEventListener('canplaythrough', () => { App.haveAudio = true; syncChrome(); });
  a.addEventListener('error', () => {
    App.haveAudio = false;
    const n = document.getElementById('audioNote');
    if (n) n.hidden = false;
    syncChrome();
  });
  a.addEventListener('ended', () => { App.playing = false; App.ended = true; syncChrome(); });
  App.audio = a;
  App.clockBase = 0; App.clockT0 = performance.now();
  App.playing = false;
  if (autoplay) play(); else syncChrome();
}

function play() {
  if (App.ended) seek(0);
  App.started = true;
  App.playing = true;
  App.clockT0 = performance.now();
  if (App.audio) {
    App.audio.muted = document.getElementById('btnMute').dataset.on === '1';
    const pr = App.audio.play();
    if (pr && pr.catch) pr.catch(() => { App.haveAudio = false; });
  }
  document.getElementById('poster').hidden = true;
  syncChrome();
}

function pause() {
  App.clockBase = now();
  App.playing = false;
  if (App.audio) App.audio.pause();
  syncChrome();
}

function seek(t) {
  t = clamp(t, 0, App.tl.total - 0.01);
  App.clockBase = t; App.clockT0 = performance.now();
  App.ended = false;
  if (t > 0.05) App.started = true;
  if (App.audio) { try { App.audio.currentTime = t; } catch (e) { /* not seekable yet */ } }
  syncChrome();
}

/* ---------------------------------------------------------------- chrome */
function buildChrome() {
  const q = id => document.getElementById(id);
  q('poster').addEventListener('click', () => play());
  q('btnPlay').addEventListener('click', () => (App.playing ? pause() : play()));
  q('btnRestart').addEventListener('click', () => { seek(0); play(); });
  q('btnCC').addEventListener('click', (e) => {
    App.captions = !App.captions;
    e.currentTarget.dataset.on = App.captions ? '1' : '0';
    e.currentTarget.setAttribute('aria-pressed', String(App.captions));
  });
  q('btnMute').addEventListener('click', (e) => {
    const muted = e.currentTarget.dataset.on !== '1';
    e.currentTarget.dataset.on = muted ? '1' : '0';
    e.currentTarget.setAttribute('aria-pressed', String(muted));
    e.currentTarget.textContent = muted ? '🔇' : '🔊';
    if (App.audio) App.audio.muted = muted;
  });
  for (const L of ['de', 'en']) {
    q('btn' + L.toUpperCase()).addEventListener('click', () => {
      if (App.lang === L) return;
      const wasPlaying = App.playing;
      pause();
      loadLang(L, wasPlaying);
      if (!wasPlaying) { seek(0); render(0); }
    });
  }
  const bar = q('scrub');
  const scrubTo = (ev) => {
    const r = bar.getBoundingClientRect();
    seek(clamp((ev.clientX - r.left) / r.width, 0, 1) * App.tl.total);
  };
  bar.addEventListener('pointerdown', (ev) => { bar.setPointerCapture(ev.pointerId); bar.dataset.drag = '1'; scrubTo(ev); });
  bar.addEventListener('pointermove', (ev) => { if (bar.dataset.drag === '1') scrubTo(ev); });
  bar.addEventListener('pointerup', () => { bar.dataset.drag = '0'; });
  bar.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowRight') { ev.preventDefault(); seek(now() + 2); }
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); seek(now() - 2); }
  });
  window.addEventListener('keydown', (ev) => {
    const tag = ev.target && ev.target.tagName;
    if (ev.key === ' ') {
      if (tag === 'BUTTON') return;
      ev.preventDefault(); App.playing ? pause() : play();
    } else if (ev.key === 'ArrowRight' && tag !== 'DIV') seek(now() + 3);
    else if (ev.key === 'ArrowLeft' && tag !== 'DIV') seek(now() - 3);
    else if (ev.key && ev.key.toLowerCase() === 'r') { seek(0); play(); }
    else if (ev.key && ev.key.toLowerCase() === 'c') q('btnCC').click();
  });
}

function syncChrome() {
  const q = id => document.getElementById(id), u = UI[App.lang];
  q('btnPlay').textContent = App.playing ? '❚❚  ' + u.pause
    : (App.ended ? '↺  ' + u.again : '▶  ' + u.play);
  q('btnDE').setAttribute('aria-pressed', String(App.lang === 'de'));
  q('btnEN').setAttribute('aria-pressed', String(App.lang === 'en'));
  q('btnDE').dataset.on = App.lang === 'de' ? '1' : '0';
  q('btnEN').dataset.on = App.lang === 'en' ? '1' : '0';
  q('poster').hidden = App.playing || now() > 0.05;
}

function syncTime(t, total) {
  const f = v => {
    const s = Math.max(0, Math.floor(v));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  };
  document.getElementById('time').textContent = f(t) + ' / ' + f(total);
  document.getElementById('scrubFill').style.width = (clamp(t / total, 0, 1) * 100) + '%';
}

/* ------------------------------------------------- offline render hook */
window.__renderFrame = function (t) { App.offline = true; App.forceT = t; if (App.tl) render(t); };
window.__setLang = function (l) { App.lang = l; App.tl = TIMELINES[l]; layerCache.delete('board:main'); };
window.__duration = function () { return App.tl ? App.tl.total : 0; };
window.__ready = false;

function boot() {
  /* the host supplies <head>; make sure a phone lays the page out at its real
     width instead of the 980px fallback that shrinks the captions to nothing */
  if (!document.querySelector('meta[name="viewport"]')) {
    const m = document.createElement('meta');
    m.name = 'viewport';
    m.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    document.head.appendChild(m);
  }
  const go = () => { setup(); window.__ready = true; };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go, go);
  else go();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
