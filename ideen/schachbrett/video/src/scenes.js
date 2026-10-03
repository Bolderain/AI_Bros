/* =====================================================================
   The ten scenes. Every scene is a pure function of its local time, so
   scrubbing and offline rendering give identical frames.
   ===================================================================== */
'use strict';

const STR = {
  de: {
    sub: 'magnetisches Schachbrett', you: 'DU', computer: 'Computer', positions: 'Stellungen',
    magnet: 'Elektromagnet', belt: 'Riemen', motor: 'Motor ×2', driver: 'Treiber',
    half: '½ Feld', rule: 'Breite ≤ ½ Feld', stuck: 'steckt!',
    trip1: '1. Fahrt', trip2: '2. Fahrt', park: 'Parkplatz',
    power: 'Strom aus', letgo: 'los!', sensors: 'Sensoren', perSquare: 'einer pro Feld',
    end: 'Du bist dran.', credit: 'AI_Bros · Projektidee: magnetisches Schachbrett',
    pieces: ['Bauer', 'Springer', 'Läufer', 'Turm', 'Dame', 'König'],
    thousands: '.',
  },
  en: {
    sub: 'magnetic chessboard', you: 'YOU', computer: 'computer', positions: 'positions',
    magnet: 'electromagnet', belt: 'belt', motor: 'motor ×2', driver: 'driver',
    half: '½ square', rule: 'width ≤ ½ square', stuck: 'stuck!',
    trip1: 'trip 1', trip2: 'trip 2', park: 'parking',
    power: 'current off', letgo: 'let go!', sensors: 'sensors', perSquare: 'one per square',
    end: 'Your turn.', credit: 'AI_Bros · concept: magnetic chessboard',
    pieces: ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'],
    thousands: ',',
  },
};

function groupNum(n, sep) {
  const s = String(n), out = [];
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) out.push(sep);
    out.push(s[i]);
  }
  return out.join('');
}

/* pieces drawn back to front so a travelling piece passes behind the row above it */
function drawPieces(ink, camera, list) {
  const arr = list.slice().filter(p => p && (p.show === undefined || p.show > 0));
  arr.sort((a, b) => ((a.v !== undefined ? a.v : a.r + .5) - (b.v !== undefined ? b.v : b.r + .5)));
  for (const p of arr) {
    const u = p.u !== undefined ? p.u : p.f + .5;
    const v = p.v !== undefined ? p.v : p.r + .5;
    const sc = camera.pt(u, v);
    drawPiece(ink, p.t, sc[0] + (p.dx || 0), sc[1] + (p.dy || 0),
      camera.px(p.h === undefined ? 0.95 : p.h), p.side, p.seed, p.opts || {});
  }
}

/* ------------------------------------------------- shared: assembling board */
function drawBoardAssembling(ctx, camera, p, seed) {
  const cv = makeBoardLayer('main', {});
  const z = camera.zoom;
  const o = camera.pt(0, 0);
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const d = (f + r) / 14;
      const q = clamp((p - d * 0.62) / 0.38, 0, 1);
      if (q <= 0) continue;
      const e = easeOutBack(q, 1.5);
      const sx = BM + f * SQ, sy = BM + r * SQ * KY;
      const dx = o[0] + f * SQ * z, dy = o[1] + r * SQ * KY * z;
      const ang = sgn(seed, f * 13 + r, 0) * 0.5 * (1 - q);
      const fly = (1 - e) * 240;
      const fa = rnd(seed, f * 7 + r * 31, 2) * 6.283;
      ctx.save();
      ctx.globalAlpha = clamp(q * 1.6, 0, 1);
      ctx.translate(dx + SQ * z / 2 + Math.cos(fa) * fly, dy + SQ * KY * z / 2 + Math.sin(fa) * fly);
      ctx.rotate(ang);
      ctx.scale(e, e);
      ctx.drawImage(cv, sx, sy, SQ, SQ * KY, -SQ * z / 2, -SQ * KY * z / 2, SQ * z, SQ * KY * z);
      ctx.restore();
    }
  }
  const q2 = clamp((p - 0.66) / 0.3, 0, 1);
  if (q2 > 0) {
    ctx.save();
    ctx.globalAlpha = q2;
    ctx.translate(o[0] - BM * z, o[1] - BM * z);
    ctx.scale(z, z);
    ctx.drawImage(cv, 0, BM + SQ * 8 * KY, cv.width, SLAB + BM, 0, BM + SQ * 8 * KY, cv.width, SLAB + BM);
    ctx.drawImage(cv, 0, 0, cv.width, BM, 0, 0, cv.width, BM);
    ctx.drawImage(cv, 0, 0, BM, cv.height, 0, 0, BM, cv.height);
    ctx.drawImage(cv, cv.width - BM, 0, BM, cv.height, cv.width - BM, 0, BM, cv.height);
    ctx.restore();
  }
}

/* ------------------------------------------------- shared: the machine rig */
const RIG = {
  x0: 200, x1: 1400, boardTop: 384, boardBot: 410,
  railA: 498, railB: 524, beltHi: 470, beltLo: 568, axis: 519,
  motorR: 38, base: 652,
};

function drawRig(ink, o) {
  const c = ink.c, R = RIG;
  const carX = o.carX, phase = o.phase || 0;

  ink.stroke([[R.x0 - 36, R.base], [R.x1 + 36, R.base]], { color: P.ink2, w: 3, seed: 401, amp: 1.2 });
  ink.hatch([[R.x0 - 36, R.base], [R.x1 + 36, R.base], [R.x1 + 36, R.base + 18], [R.x0 - 36, R.base + 18]],
    { angle: -0.8, gap: 9, alpha: .3, color: P.pencil, seed: 402 });
  for (const fx of [R.x0 + 30, (R.x0 + R.x1) / 2, R.x1 - 30]) {
    ink.rect(fx - 26, R.base + 18, 52, 15, { fill: P.paperDeep, fillAlpha: .85, color: P.ink2, w: 1.8, seed: 403 + fx });
  }

  const bl = R.x0 + 48, br = R.x1 - 48, half = (R.beltLo - R.beltHi) / 2;
  c.save();
  for (const [y, dir] of [[R.beltHi, 1], [R.beltLo, -1]]) {
    ink.stroke([[bl, y], [br, y]], { color: P.ink, w: 3.4, seed: 410 + y, amp: .7, passes: 1 });
    const teeth = Math.floor((br - bl) / 17);
    c.strokeStyle = P.ink2; c.lineWidth = 2; c.globalAlpha = .55;
    for (let i = 0; i <= teeth; i++) {
      const x = bl + ((i * 17 + dir * phase * 17) % (br - bl) + (br - bl)) % (br - bl);
      c.beginPath(); c.moveTo(x, y - 4); c.lineTo(x, y + 4); c.stroke();
    }
    c.globalAlpha = 1;
  }
  for (const [px, s] of [[bl, -1], [br, 1]]) {
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const a = -Math.PI / 2 + s * (i / 14) * Math.PI;
      pts.push([px + Math.cos(a) * half * s * s, R.axis + Math.sin(a) * half]);
    }
    const flip = pts.map(p => [px + (p[0] - px) * s, p[1]]);
    ink.stroke(flip, { color: P.ink, w: 3.2, seed: 420 + px, amp: .8, passes: 1 });
  }
  c.restore();

  for (const [mx, i] of [[bl, 0], [br, 1]]) {
    const rot = (i ? -1 : 1) * phase * 0.9;
    ink.circle(mx, R.axis, R.motorR, { fill: P.paperDeep, fillAlpha: .95, color: P.ink, w: 2.8, seed: 430 + i * 9 });
    c.save(); c.translate(mx, R.axis); c.rotate(rot);
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2;
      ink.stroke([[Math.cos(a) * 7, Math.sin(a) * 7], [Math.cos(a) * (R.motorR - 9), Math.sin(a) * (R.motorR - 9)]],
        { color: P.ink2, w: 2, seed: 440 + k + i * 4, amp: .6, passes: 1, alpha: .75 });
    }
    c.restore();
    ink.circle(mx, R.axis, 7, { fill: P.ink, fillAlpha: .85, color: P.ink, w: 1.6, seed: 450 + i });
  }

  for (const y of [R.railA, R.railB]) {
    ink.stroke([[R.x0 + 10, y], [R.x1 - 10, y]], { color: P.pencil, w: 2.4, seed: 460 + y, amp: .8, passes: 1, alpha: .9 });
  }

  const cw = 150, chh = 46, cy = (R.railA + R.railB) / 2;
  ink.rect(carX - cw / 2, cy - chh / 2, cw, chh, { fill: P.paperHi, fillAlpha: .96, color: P.ink, w: 2.6, seed: 470 });
  ink.hatch([[carX - cw / 2, cy - chh / 2], [carX + cw / 2, cy - chh / 2], [carX + cw / 2, cy + chh / 2], [carX - cw / 2, cy + chh / 2]],
    { angle: 0.7, gap: 12, alpha: .14, color: P.ink, seed: 471 });
  for (const y of [R.railA, R.railB]) for (const dx of [-44, 44]) {
    ink.circle(carX + dx, y, 9, { fill: P.paperDeep, fillAlpha: .9, color: P.ink2, w: 1.8, seed: 480 + dx + y });
  }

  /* ---- electromagnet on the carriage -------------------------------- */
  const on = o.on === undefined ? 1 : o.on;        // 0..1, how energised the coil is
  const coilTop = R.boardBot + 12;                 // pole face, just under the glass
  const coilBot = cy - 23;
  const coilW = 58;
  const live = on > 0.5;
  const wind = live ? '#b5553a' : P.pencil;

  /* the field is drawn later, on top of the board, so it reads as reaching
     up through the glass to the piece instead of hiding behind the slab */
  const drawField = () => {
    if (on > 0.02) {
      c.save();
      c.globalAlpha = 0.26 * on;
      const g = c.createRadialGradient(carX, coilTop - 6, 2, carX, coilTop - 6, 104);
      g.addColorStop(0, 'rgba(203,98,52,.9)');
      g.addColorStop(1, 'rgba(203,98,52,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(carX, coilTop - 6, 104, 0, 7); c.fill();
      c.restore();
    }
    if (o.field > 0.01) {
      c.save();
      for (let k = 0; k < 3; k++) {
        const rr = (24 + k * 17) * (0.4 + 0.6 * o.field);
        const pts = [];
        for (let i = 0; i <= 18; i++) {
          const a = Math.PI + (i / 18) * Math.PI;
          pts.push([carX + Math.cos(a) * rr * 1.45, coilTop + 2 + Math.sin(a) * rr * 1.4]);
        }
        ink.dashed(pts, { color: P.blue, w: 2.6, dash: [9, 7], flow: phase * 24, alpha: (.9 - k * .2) * o.field, seed: 500 + k, amp: .8 });
      }
      c.restore();
    }
  };

  ink.rect(carX - 10, coilTop + 9, 20, coilBot - coilTop - 9,
    { fill: P.paperDeep, fillAlpha: .92, color: P.ink2, w: 2, seed: 540 });
  const turns = 6, span = coilBot - coilTop - 22;
  for (let k = 0; k < turns; k++) {
    const y = coilTop + 17 + k * (span / turns);
    ink.stroke([[carX - coilW / 2, y], [carX + coilW / 2, y + 6]],
      { color: wind, w: 5.4, seed: 550 + k, amp: .7, passes: 1, alpha: live ? .97 : .72 });
  }
  ink.rect(carX - 33, coilTop, 66, 11,
    { fill: live ? P.blue : P.paperDeep, fillAlpha: live ? .45 : .92, color: P.ink2, w: 2.4, seed: 560 });

  /* ---- cable to the driver box, with current running through it ---------- */
  const bx = 1318, by = 618;
  const cab = [[carX + 64, cy + 14], [carX + 150, cy + 74], [(carX + 150 + bx) / 2, by + 26], [bx - 36, by - 4]];
  ink.stroke(cab, { color: P.ink2, w: 3, seed: 570, amp: 1.6, passes: 1, alpha: .9 });
  if (on > 0.5) {
    ink.dashed(cab, { color: '#b5553a', w: 2.8, dash: [6, 13], flow: -(phase * 34 + 90), alpha: .95, seed: 571, amp: 1.2 });
  }
  ink.rect(bx - 36, by - 32, 72, 46, { fill: P.paperHi, fillAlpha: .96, color: P.ink, w: 2.4, seed: 580 });
  const la = live ? -0.78 : 0.38;
  ink.stroke([[bx, by - 6], [bx + Math.cos(la) * 21, by - 6 + Math.sin(la) * 21]],
    { color: live ? P.red : P.ink2, w: 4.2, seed: 581, amp: .5, passes: 1 });
  ink.circle(bx, by - 6, 4.5, { fill: P.ink, fillAlpha: .9, color: P.ink, w: 1.4, seed: 582 });
  ink.circle(bx + 19, by - 20, 3.2, { fill: live ? P.red : P.paperDeep, fillAlpha: .95, color: P.ink2, w: 1.4, seed: 583 });

  ink.scrap([[R.x0, R.boardTop], [R.x1, R.boardTop], [R.x1, R.boardBot], [R.x0, R.boardBot]],
    { color: P.sqLight, seed: 520, serr: 1.6, blur: 16, sy: 7 });
  ink.stroke([[R.x0, R.boardTop], [R.x1, R.boardTop]], { color: P.ink, w: 2.6, seed: 521, amp: .8, passes: 1 });
  ink.stroke([[R.x0, R.boardBot], [R.x1, R.boardBot]], { color: P.ink2, w: 2, seed: 522, amp: .8, passes: 1, alpha: .8 });
  for (let i = 0; i <= 10; i++) {
    const x = lerp(R.x0, R.x1, i / 10);
    ink.stroke([[x, R.boardTop], [x, R.boardTop + 7]], { color: P.ink2, w: 1.6, seed: 530 + i, amp: .4, passes: 1, alpha: .5 });
  }

  drawField();

  for (const pc of o.pieces) {
    drawPiece(ink, pc.t, pc.x, R.boardTop + 2 + (pc.dy || 0), pc.s || 118, pc.side || 'w', pc.seed || 600, {});
  }
}

/* =====================================================================  1 */
function sceneHook(s) {
  const { ink, ctx } = s, p = s.p;
  const camera = cam(0.86, 4, 4, 800, 430);
  drawBoardAssembling(ctx, camera, clamp(p / 0.34, 0, 1), 31);

  const showPieces = clamp((p - 0.26) / 0.2, 0, 1);
  const extras = [
    { t: 'n', f: 6, r: 7, side: 'w', d: 0.00, seed: 701 },
    { t: 'r', f: 0, r: 7, side: 'w', d: 0.10, seed: 702 },
    { t: 'p', f: 4, r: 1, side: 'b', d: 0.20, seed: 703 },
    { t: 'n', f: 1, r: 0, side: 'b', d: 0.30, seed: 704 },
    { t: 'q', f: 3, r: 0, side: 'b', d: 0.40, seed: 705 },
    { t: 'b', f: 2, r: 5, side: 'w', d: 0.48, seed: 706 },
  ];

  const mp = clamp((p - 0.47) / 0.30, 0, 1);
  const path = linePath(4, 6, 4, 4);
  const heroPos = walk(path, ease(mp)).pos;

  if (mp > 0 && mp < 1) {
    const sc = camera.pt(heroPos[0], heroPos[1]);
    drawMagnetUnder(ink, sc[0], sc[1] + 4, camera.px(0.2), 1, 71, ink.tick);
  }
  if (mp > 0.02) {
    const tp = pathUpTo(path, ease(mp)).map(q => camera.pt(q[0], q[1]));
    ink.dashed(tp, { color: P.teal, w: 3.6, dash: [13, 9], flow: s.t * 26, alpha: mp < 1 ? .95 : .55, seed: 73 });
  }

  const list = [];
  for (const pc of extras) {
    const q = clamp((showPieces - pc.d) / 0.5, 0, 1);
    if (q <= 0) continue;
    const e = easeOutBack(q, 2);
    list.push({ t: pc.t, f: pc.f, r: pc.r, side: pc.side, seed: pc.seed, h: 0.95 * e,
      dy: camera.px(0.2) * (1 - e) * -1.4 });
  }
  if (showPieces > 0) {
    const e = easeOutBack(clamp(showPieces / 0.5, 0, 1), 2);
    list.push({ t: 'p', u: heroPos[0], v: heroPos[1], side: 'w', seed: 760, h: 0.95 * e,
      dy: mp > 0 && mp < 1 ? Math.sin(mp * 34) * 1.8 : 0 });
  }
  drawPieces(ink, camera, list);

  const lp = clamp((p - 0.80) / 0.16, 0, 1);
  if (lp > 0) {
    const e = easeOutElastic(lp);
    ctx.save();
    ctx.translate(258, 768);
    ctx.rotate(-0.055 + (1 - e) * 0.3);
    ctx.scale(0.86 + 0.14 * e, 0.86 + 0.14 * e);
    ctx.globalAlpha = clamp(lp * 2.2, 0, 1);
    ink.scrap([[-160, -36], [160, -32], [156, 36], [-156, 32]], { color: P.mustard, seed: 81, serr: 3, blur: 12, sy: 5, alpha: .95 });
    ink.text(s.STR.sub, 0, 11, { size: 35, color: '#4a3410', align: 'center', font: 'Caveat', weight: 700, rot: 0, seed: 82 });
    ctx.restore();
  }
}

/* =====================================================================  2 */
function sceneBrain(s) {
  const { ink, ctx } = s;
  const l0 = s.ln(0), l1 = s.ln(1), l2 = s.ln(2);

  /* ---- top left: the human side */
  const camera = cam(0.44, 4, 4, 400, 236);
  ctx.save();
  ctx.globalAlpha = clamp(l0.p * 3, 0, 1);
  drawBoard(ctx, camera, 'main');
  drawPieces(ink, camera, [
    { t: 'p', f: 3, r: 4, side: 'w', seed: 801 }, { t: 'n', f: 5, r: 3, side: 'b', seed: 802 },
    { t: 'r', f: 1, r: 5, side: 'w', seed: 803 }, { t: 'q', f: 4, r: 2, side: 'b', seed: 804 },
    { t: 'b', f: 2, r: 1, side: 'b', seed: 805 },
  ]);
  ctx.restore();

  if (l0.p > 0.08) {
    const hp = clamp((l0.p - 0.08) / 0.7, 0, 1);
    const hx = lerp(820, 650, easeOut(hp)), hy = lerp(120, 206, easeOut(hp));
    drawHand(ink, hx, hy, 0.95, -0.5, 91, hp > 0.75 ? 1 : 0);
    const la = clamp((hp - .2) / .3, 0, 1);
    if (la > 0) {
      ink.leader(hx + 88, hy - 46, hx + 26, hy - 2, { seed: 93, color: P.red, alpha: la * .8 });
      ink.text(s.STR.you, hx + 98, hy - 54, { size: 46, color: P.red, font: 'Caveat', weight: 700, rot: -0.07, seed: 92, alpha: la });
    }
  }

  /* ---- bottom left: the machine side */
  if (l1.on) {
    const q = clamp(l1.p / 0.4, 0, 1), e = easeOutBack(q, 1.3);
    ctx.save();
    ctx.globalAlpha = clamp(q * 2, 0, 1);
    ctx.translate(360, 644 + (1 - e) * 180);
    ctx.rotate(-0.03);
    ink.scrap([[-212, -124], [214, -130], [220, 126], [-208, 132]], { color: '#56785d', seed: 101, serr: 3.6, blur: 18, sy: 9 });
    for (let i = 0; i < 10; i++) {
      const y = -102 + i * 23;
      ink.stroke([[-190, y], [-46 + (i % 3) * 58, y], [-34 + (i % 3) * 58, y + 15]],
        { color: '#d6e8d2', w: 2.2, seed: 110 + i, amp: .8, passes: 1, alpha: .42 });
    }
    ink.rect(-66, -40, 142, 86, { fill: '#262a27', fillAlpha: .94, color: '#141714', w: 2.6, seed: 120 });
    for (let i = 0; i < 8; i++) {
      ink.stroke([[-66 + i * 18 + 7, 46], [-66 + i * 18 + 7, 62]], { color: '#cdc6ab', w: 2.6, seed: 130 + i, amp: .4, passes: 1 });
      ink.stroke([[-66 + i * 18 + 7, -40], [-66 + i * 18 + 7, -56]], { color: '#cdc6ab', w: 2.6, seed: 140 + i, amp: .4, passes: 1 });
    }
    ink.text(s.STR.computer, 5, 12, { size: 31, color: '#eee7d0', align: 'center', seed: 150, rot: -0.02 });
    ctx.restore();
  }

  /* ---- the search tree in a thought cloud */
  if (l2.on || l1.p > 0.8) {
    const q = l2.on ? clamp(l2.p / 0.16, 0, 1) : clamp((l1.p - 0.8) / 0.2, 0, 1);
    const cx = 1062, cy = 416, al = clamp(q * 1.6, 0, 1);
    ctx.save();
    ctx.globalAlpha = al;
    const cloud = cloudPath(cx, cy, 326, 212, 161);
    ink.scrap(cloud, { color: P.paperHi, seed: 162, serr: 2.4, blur: 24, sy: 10, alpha: .98 });
    ink.stroke(cloud, { close: true, color: P.ink2, w: 3, seed: 163, amp: 1.6, passes: 2, alpha: .85 });
    for (let i = 0; i < 3; i++) {
      const r = 18 - i * 5;
      ink.circle(cx - 262 - i * 36, cy + 212 + i * 36, r, { fill: P.paperHi, fillAlpha: .97, color: P.ink2, w: 2.2, seed: 170 + i });
    }
    ctx.restore();

    const tp = l2.on ? l2.p : 0;
    const grow = clamp(tp / 0.6, 0, 1);
    const pick = clamp((tp - 0.64) / 0.2, 0, 1);
    const winner = [1, 2, 1];
    ctx.save();
    const nodes = [{ x: cx - 236, y: cy + 26, d: 0, path: [] }];
    for (let d = 0; d < 3; d++) {
      for (const pn of nodes.filter(n => n.d === d)) {
        const br = d === 2 ? 2 : 3;
        for (let k = 0; k < br; k++) {
          const spread = [128, 45, 17][d];
          nodes.push({
            x: cx - 236 + (d + 1) * 134, y: pn.y + (k - (br - 1) / 2) * spread,
            d: d + 1, path: pn.path.concat([k]), px: pn.x, py: pn.y,
          });
        }
      }
    }
    for (const n of nodes) {
      if (n.d === 0) continue;
      const appear = clamp((grow - (n.d - 1) / 3 * 0.85) / 0.3, 0, 1);
      if (appear <= 0) continue;
      const isWin = n.path.every((v, i) => v === winner[i]);
      const dim = pick > 0 && !isWin ? 1 - pick * 0.86 : 1;
      ctx.globalAlpha = al * appear * dim;
      const ex = lerp(n.px, n.x, easeOut(appear)), ey = lerp(n.py, n.y, easeOut(appear));
      ink.stroke([[n.px, n.py], [ex, ey]], {
        color: isWin && pick > 0 ? P.red : P.pencil,
        w: isWin && pick > 0 ? 3.4 : 1.8, seed: 180 + n.d * 31 + n.path.length * 7, amp: 1, passes: 1,
      });
      ink.circle(ex, ey, n.d === 3 ? 6 : 8, {
        fill: isWin && pick > 0 ? P.red : P.paper, fillAlpha: .96,
        color: isWin && pick > 0 ? P.red : P.ink2, w: 1.9, seed: 190 + n.d * 13 + n.path.length,
      });
    }
    ctx.globalAlpha = al;
    ink.circle(cx - 236, cy + 26, 11, { fill: P.mustard, fillAlpha: .96, color: P.ink, w: 2.4, seed: 200 });

    const num = Math.floor(easeOut(clamp(tp / 0.7, 0, 1)) * 1247903);
    ink.text(groupNum(num, s.STR.thousands), cx - 206, cy - 148,
      { size: 54, color: P.ink, align: 'left', font: 'Caveat', weight: 700, seed: 210, rot: -0.03 });
    ink.text(s.STR.positions, cx - 202, cy - 114, { size: 26, color: P.pencil, align: 'left', seed: 211, rot: -0.02 });

    if (pick > 0) {
      const win = nodes.find(nn => nn.d === 3 && nn.path.every((v, i) => v === winner[i]));
      if (win) ink.circleAround(win.x, win.y, 32, 26, { seed: 220, p: easeOut(pick), laps: 2, w: 4.4 });
    }
    ctx.restore();
  }
}

/* =====================================================================  3 */
function sceneHand(s) {
  const { ink, ctx } = s;
  const l0 = s.ln(0), l1 = s.ln(1);
  const travel = easeInOut(clamp((l1.lt - 0.28) / 1.5, 0, 1));
  const carX = lerp(470, 1010, travel);
  const live = clamp((l0.lt - 0.28) / 0.12, 0, 1);   // the coil is switched on

  drawRig(ink, {
    carX, phase: travel * 26, on: live, field: live,
    pieces: [
      { t: 'p', x: 470, s: 118, side: 'w', seed: 601 },
      { t: 'b', x: 790, s: 124, side: 'b', seed: 602 },
      { t: 'r', x: 1010, s: 118, side: 'w', seed: 603 },
    ],
  });

  const near = [470, 790, 1010].reduce((a, x) => Math.abs(x - carX) < Math.abs(a - carX) ? x : a, 470);
  if (Math.abs(near - carX) < 30 && live > 0.5) {
    ctx.save();
    ctx.globalAlpha = .55;
    ink.circle(near, RIG.boardTop - 10, 22, { stroke: true, color: P.blue, w: 2.4, seed: 230, rough: .13 });
    ctx.restore();
  }

  const labels = [
    { t: s.STR.magnet, x: 196, y: 268, tx: carX - 36, ty: RIG.boardBot + 58, col: P.blue, align: 'left', lx: 316, size: 42 },
    { t: s.STR.motor, x: 172, y: 622, tx: RIG.x0 + 48, ty: RIG.axis + 42, col: P.ink2, align: 'left', lx: 190, size: 42 },
    { t: s.STR.belt, x: 600, y: 730, tx: 760, ty: RIG.beltLo, col: P.ink2, align: 'left', lx: 124, size: 42 },
    { t: s.STR.driver, x: 1402, y: 724, tx: 1300, ty: 636, col: P.ink2, align: 'right', lx: -16, size: 42 },
  ];
  const stages = [
    clamp((l0.p - 0.30) / 0.3, 0, 1),
    clamp((l1.p - 0.30) / 0.18, 0, 1),
    clamp((l1.p - 0.48) / 0.18, 0, 1),
    clamp((l1.p - 0.66) / 0.18, 0, 1),
  ];
  for (let i = 0; i < labels.length; i++) {
    const L = labels[i], base = stages[i];
    if (base <= 0) continue;
    ctx.save();
    ctx.globalAlpha = clamp(base * 1.6, 0, 1);
    ink.leader(L.x + L.lx, L.y + 8, L.tx, L.ty, { seed: 240 + i * 11, color: L.col, alpha: .8 });
    ink.textReveal(L.t, L.x, L.y, clamp(base * 2.4, 0, 1),
      { size: L.size, color: L.col, font: 'Caveat', weight: 700, rot: -0.03, seed: 250 + i, align: L.align });
    ctx.restore();
  }
}

/* =====================================================================  4 */
function sceneProblem(s) {
  const { ink, ctx } = s, p = s.p;
  const camera = cam(1.35, 3.5, 4.4, 790, 440);
  drawBoard(ctx, camera, 'main');

  const hit = 0.46;
  const mp = clamp(p / hit, 0, 1);
  const after = clamp((p - hit) / (1 - hit), 0, 1);
  const from = 2.5, blocked = 3.5;
  const u = lerp(from, blocked - 0.44, easeIn(mp));
  const pawn = camera.pt(blocked, 4.5);
  const wob = after > 0 ? Math.exp(-after * 7) * Math.sin(after * 44) : 0;

  ink.dashed([camera.pt(from, 4.5), camera.pt(4.6, 4.5)],
    { color: P.pencil, w: 3, dash: [13, 10], flow: s.t * 20, alpha: .5, seed: 260 });

  drawPieces(ink, camera, [
    { t: 'r', f: 1, r: 2, side: 'w', seed: 772 }, { t: 'p', f: 5, r: 3, side: 'b', seed: 773 },
    { t: 'b', f: 2, r: 6, side: 'w', seed: 774 }, { t: 'p', f: 6, r: 5, side: 'w', seed: 775 },
    { t: 'p', f: 3, r: 4, side: 'w', seed: 770, opts: { rot: wob * 0.18 } },
    { t: 'n', u, v: 4.5, side: 'b', seed: 771, dx: wob * 8, opts: { rot: -wob * 0.11 } },
  ]);

  if (after > 0 && after < 0.5) {
    ctx.save();
    ctx.globalAlpha = clamp(1 - after / 0.45, 0, 1);
    ink.burst(pawn[0] - camera.px(0.22), pawn[1] - camera.px(0.45), camera.px(0.42) * (1 + after * 2.2), 9,
      { color: P.red, w: 5, seed: 270 });
    ctx.restore();
  }
  if (after > 0.26) {
    const q = clamp((after - 0.26) / 0.3, 0, 1);
    ctx.save();
    ctx.globalAlpha = clamp(q * 1.4, 0, 1);
    ink.scribbleCross(pawn[0] - camera.px(0.18), pawn[1] - camera.px(0.38), camera.px(0.56) * easeOutBack(q, 1.2),
      { seed: 280, w: 8 });
    ctx.restore();
  }
}

/* =====================================================================  5 */
function sceneLines(s) {
  const { ink, ctx } = s;
  const l0 = s.ln(0), l1 = s.ln(1), l2 = s.ln(2);
  const camera = cam(1.46, 2.1, 6.4, 660, 452);
  drawBoard(ctx, camera, 'main');

  /* ink the lattice of travel lines */
  const inkP = clamp(l0.p / 0.7, 0, 1);
  if (inkP > 0) {
    ctx.save();
    for (let i = 0; i <= 8; i++) {
      const q = clamp((inkP - (i / 8) * 0.35) / 0.55, 0, 1);
      if (q <= 0) continue;
      ctx.globalAlpha = 0.78 * q;
      ink.stroke([camera.pt(i, 0), camera.pt(i, lerp(0, 8, easeOut(q)))], { color: P.teal, w: 3, seed: 300 + i, amp: 1.1, passes: 1 });
      ink.stroke([camera.pt(0, i), camera.pt(lerp(0, 8, easeOut(q)), i)], { color: P.teal, w: 3, seed: 320 + i, amp: 1.1, passes: 1 });
    }
    ctx.restore();
  }

  /* the move, pausing in the gap while the clearance is explained */
  const PAUSE = 0.5;                                  // lands exactly between the two pawns
  let mp;
  if (!l1.on) mp = 0;
  else if (!l2.on) mp = ease(clamp((l1.lt - 0.26) / 1.75, 0, 1)) * PAUSE;
  else mp = PAUSE + ease(clamp((l2.lt - l2.dur * 0.55) / (l2.dur * 0.40), 0, 1)) * (1 - PAUSE);

  const path = linePath(1, 7, 2, 5);
  const pos = walk(path, mp).pos;

  /* travel corridor */
  if (l2.on) {
    const q = clamp(l2.p / 0.25, 0, 1) * (1 - clamp((mp - PAUSE) / 0.3, 0, 1));
    const a = camera.pt(1.86, 5.4), b = camera.pt(2.14, 7.7);
    ctx.save();
    ctx.globalAlpha = .22 * q;
    ctx.fillStyle = P.teal;
    ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
    ctx.restore();
  }

  if (mp > 0.01) {
    const tp = pathUpTo(path, mp).map(q => camera.pt(q[0], q[1]));
    ink.dashed(tp, { color: P.red, w: 3.4, dash: [13, 9], flow: s.t * 24, alpha: .9, seed: 330 });
    const sc = camera.pt(pos[0], pos[1]);
    drawMagnetUnder(ink, sc[0], sc[1] + 4, camera.px(0.2), 1, 331, ink.tick);
  }

  drawPieces(ink, camera, [
    { t: 'r', f: 0, r: 7, side: 'w', seed: 785 }, { t: 'q', f: 5, r: 7, side: 'w', seed: 786 },
    { t: 'p', f: 1, r: 6, side: 'w', seed: 781 }, { t: 'p', f: 2, r: 6, side: 'w', seed: 782 },
    { t: 'p', f: 3, r: 6, side: 'w', seed: 783 },
    { t: 'n', u: pos[0], v: pos[1], side: 'b', seed: 790 },
  ]);

  /* the half-square clearance, called out while the knight waits */
  if (l2.on) {
    const q = clamp(l2.p / 0.26, 0, 1);
    const go = clamp((mp - PAUSE) / 0.18, 0, 1);      // fades out as the knight resumes
    ctx.save();
    ctx.globalAlpha = clamp(q * 1.6, 0, 1) * (1 - go);
    if (ctx.globalAlpha < 0.01) { ctx.restore(); return; }
    const yA = camera.pt(0, 6.86)[1], yB = yA + 62;
    const xL = camera.pt(1.5, 0)[0], xM = camera.pt(2, 0)[0], xR = camera.pt(2.5, 0)[0];
    /* dotted drop lines from the piece centres down to the dimensions */
    for (const [x, yy] of [[xL, yA], [xM, yB], [xR, yB]]) {
      ink.dashed([[x, camera.pt(0, 6.6)[1]], [x, yy - 10]], { color: P.red, w: 1.7, dash: [5, 5], alpha: .55, seed: 346 + x, amp: .3 });
    }
    ink.dim(xL, yA, xM, yA, null, { seed: 340, color: P.red, head: 11, ticks: 12, w: 2.4 });
    ink.dim(xM, yB, xR, yB, null, { seed: 345, color: P.red, head: 11, ticks: 12, w: 2.4 });
    ink.text(s.STR.half, xL - 20, yA + 13, { size: 40, color: P.red, align: 'right', font: 'Caveat', weight: 700, rot: -0.02, seed: 341, bg: P.paper });
    ink.text(s.STR.half, xR + 20, yB + 13, { size: 40, color: P.red, align: 'left', font: 'Caveat', weight: 700, rot: 0.02, seed: 342, bg: P.paper });
    ctx.restore();
  }
}

/* =====================================================================  6 */
function sceneSlim(s) {
  const { ink, ctx } = s;
  const l0 = s.ln(0), l1 = s.ln(1);
  const types = ['p', 'n', 'b', 'r', 'q', 'k'];
  const sides = ['w', 'b', 'w', 'b', 'w', 'b'];
  const y0 = 300, cards = [];

  for (let i = 0; i < 6; i++) {
    const q = clamp((l0.p - i * 0.045) / 0.22, 0, 1);
    if (q > 0) cards.push({ i, q, x: 268 + i * 196 });
  }
  /* all the cards first, so none of them covers the caption of the one before */
  for (const c of cards) {
    const e = easeOutBack(c.q, 1.6);
    ctx.save();
    ctx.globalAlpha = clamp(c.q * 2, 0, 1);
    ctx.translate(c.x, y0);
    ctx.rotate(sgn(350, c.i, 0) * 0.035);
    ctx.scale(e, e);
    ink.scrap([[-86, -212], [86, -216], [90, 58], [-90, 54]],
      { color: c.i % 2 ? P.paperWarm : P.paperHi, seed: 360 + c.i, serr: 2.8, blur: 13, sy: 6 });
    drawPiece(ink, types[c.i], 0, 20, 206, sides[c.i], 900 + c.i * 13, {});
    ctx.restore();
  }
  for (const c of cards) {
    const a = clamp((c.q - .3) / .4, 0, 1);
    if (a <= 0) continue;
    const w = 206 * WD[types[c.i]] * 0.5;
    ctx.save();
    ctx.globalAlpha = a;
    ink.dim(c.x - w, y0 + 88, c.x + w, y0 + 88, null, { seed: 370 + c.i, color: P.red, head: 7, ticks: 6, w: 1.6 });
    ink.text(s.STR.pieces[c.i], c.x, y0 + 124, { size: 24, color: P.pencil, align: 'center', seed: 380 + c.i });
    ctx.restore();
  }
  const rq = clamp((l0.p - 0.26) / 0.3, 0, 1);
  if (rq > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(rq * 1.6, 0, 1);
    ink.dim(268 - 74, 142, 268 + 74, 142, s.STR.half,
      { seed: 390, color: P.teal, size: 30, ly: -16, bg: P.paper, w: 2.2, head: 9 });
    ctx.restore();
  }

  /* the rule, written out */
  const rp = clamp((l0.p - 0.5) / 0.42, 0, 1);
  if (rp > 0) {
    ctx.save();
    ctx.translate(800, 486);
    ctx.rotate(-0.018);
    ctx.globalAlpha = clamp(rp * 2, 0, 1);
    const bw = 336, bh = 66;
    ink.scrap([[-bw, -bh], [bw, -bh + 5], [bw - 4, bh], [-bw + 3, bh - 4]], { color: P.paperHi, seed: 400, serr: 2.6, blur: 16, sy: 7 });
    ink.textReveal(s.STR.rule, 0, 22, clamp(rp * 1.8, 0, 1), { size: 62, color: P.ink, align: 'center', font: 'Caveat', weight: 700, rot: 0, seed: 401 });
    if (rp > 0.72) {
      ctx.globalAlpha = clamp((rp - .72) / .28, 0, 1);
      ink.stroke([[-bw + 18, -bh + 12], [bw - 18, -bh + 8], [bw - 22, bh - 12], [-bw + 14, bh - 8]],
        { close: true, color: P.red, w: 3.6, seed: 402, amp: 2.4, passes: 1, alpha: .88 });
    }
    ctx.restore();
  }

  /* the fat pawn that jams */
  if (l1.on) {
    const q = l1.p;
    const camera = cam(1.12, 2.0, 6.5, 800, 706);
    ctx.save();
    ctx.globalAlpha = clamp(q * 6, 0, 1);
    ctx.save();
    const a = camera.pt(0.12, 6), b = camera.pt(3.92, 7);
    ctx.beginPath(); ctx.rect(a[0], a[1] - 150, b[0] - a[0], b[1] - a[1] + 160); ctx.clip();
    drawBoard(ctx, camera, 'main');
    ctx.restore();

    const jam = 0.46;
    const mp = clamp(q / jam, 0, 1);
    const back = clamp((q - 0.72) / 0.28, 0, 1);
    let u = lerp(0.5, 1.99, easeOut(mp));
    if (back > 0) u = lerp(1.99, 1.0, easeOut(back));
    const wob = q > jam && back <= 0 ? Math.exp(-(q - jam) * 6) * Math.sin((q - jam) * 52) : 0;
    const pos = camera.pt(u, 6.5);

    drawPieces(ink, camera, [
      { t: 'r', f: 1, r: 6, side: 'w', seed: 911 },
      { t: 'b', f: 3, r: 6, side: 'w', seed: 913 },
      { t: 'p', u, v: 6.5, side: 'b', seed: 920, dx: wob * 5, opts: { fat: 2.3, rot: wob * 0.12 } },
    ]);

    if (q > jam && back < 0.4) {
      const e = clamp((q - jam) / 0.2, 0, 1) * (1 - clamp(back / .4, 0, 1));
      ctx.save();
      ctx.globalAlpha = e;
      ink.burst(pos[0] + 48, pos[1] - camera.px(0.32), 40, 7, { color: P.red, w: 4, seed: 410 });
      ink.text(s.STR.stuck, pos[0] + 160, pos[1] - camera.px(0.5),
        { size: 52, color: P.red, font: 'Caveat', weight: 700, rot: -0.1, seed: 411 });
      ctx.restore();
    }
    ctx.restore();
  }
}

/* =====================================================================  7 */
function sceneCapture(s) {
  const { ink, ctx } = s;
  const l0 = s.ln(0), l1 = s.ln(1);
  const camera = cam(0.86, 4.6, 4.0, 700, 430);
  drawBoard(ctx, camera, 'main');

  const lane = clamp(l0.p * 3, 0, 1);
  ctx.save();
  ctx.globalAlpha = lane;
  for (let i = 0; i < 8; i++) {
    const a = camera.pt(8.45, i + 0.08), b = camera.pt(9.35, i + 0.92);
    ink.scrap([[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]],
      { color: i % 2 ? P.paperWarm : P.paperHi, seed: 420 + i, serr: 2, blur: 8, sy: 4, alpha: .95 });
  }
  const lt = camera.pt(8.4, 0), lb = camera.pt(9.4, 8);
  ink.stroke([[lt[0], lt[1]], [lb[0], lt[1]], [lb[0], lb[1]], [lt[0], lb[1]]],
    { close: true, color: P.ink2, w: 2.4, seed: 430, amp: 1.6, passes: 1, alpha: .85 });
  ink.text(s.STR.park, (lt[0] + lb[0]) / 2, lt[1] - 24, { size: 27, color: P.pencil, align: 'center', seed: 431, rot: -0.03 });
  ctx.restore();

  const bishop = { f: 4, r: 3 }, knight = { f: 2, r: 4 };
  const pPark = parkPath(bishop.f, bishop.r, 8.9, 2.5);
  const pMove = linePath(knight.f, knight.r, bishop.f, bishop.r);
  const m1 = clamp((l0.lt - 0.2) / 1.45, 0, 1);
  const m2 = l1.on ? clamp((l1.lt - 0.52) / 0.95, 0, 1) : 0;

  if (m1 > 0.01) {
    ink.dashed(pathUpTo(pPark, ease(m1)).map(q => camera.pt(q[0], q[1])),
      { color: P.blue, w: 3, dash: [12, 9], flow: s.t * 22, alpha: .85, seed: 440 });
  }
  if (m2 > 0.01) {
    ink.dashed(pathUpTo(pMove, ease(m2)).map(q => camera.pt(q[0], q[1])),
      { color: P.red, w: 3.2, dash: [13, 9], flow: s.t * 24, alpha: .9, seed: 441 });
  }

  const bw = walk(pPark, ease(m1)).pos, kw = walk(pMove, ease(m2)).pos;
  for (const [w, sd] of [[bw, 450], [kw, 451]]) {
    const on = (sd === 450 ? (m1 > 0 && m1 < 1) : (m2 > 0 && m2 < 1));
    if (!on) continue;
    const sc = camera.pt(w[0], w[1]);
    drawMagnetUnder(ink, sc[0], sc[1] + 4, camera.px(0.2), 1, sd, ink.tick);
  }

  drawPieces(ink, camera, [
    { t: 'p', f: 3, r: 2, side: 'w', seed: 941 }, { t: 'p', f: 5, r: 4, side: 'b', seed: 942 },
    { t: 'r', f: 6, r: 1, side: 'w', seed: 943 },
    { t: 'b', u: bw[0], v: bw[1], side: 'w', seed: 950, h: m1 >= 1 ? 0.86 : 0.95 },
    { t: 'n', u: kw[0], v: kw[1], side: 'b', seed: 951 },
  ]);

  const badges = [
    { n: '1', t: s.STR.trip1, x: 252, y: 180, col: P.blue, show: clamp((l0.p - 0.1) / 0.2, 0, 1) },
    { n: '2', t: s.STR.trip2, x: 252, y: 304, col: P.red, show: l1.on ? clamp((l1.p - 0.04) / 0.2, 0, 1) : 0 },
  ];
  for (const b of badges) {
    if (b.show <= 0) continue;
    const e = easeOutBack(b.show, 1.8);
    ctx.save();
    ctx.globalAlpha = clamp(b.show * 2, 0, 1);
    ctx.translate(b.x, b.y);
    ctx.scale(e, e);
    ink.circle(0, 0, 31, { fill: P.paperHi, fillAlpha: .96, color: b.col, w: 3.4, seed: 460 + b.n.charCodeAt(0) });
    ink.text(b.n, 0, 14, { size: 44, color: b.col, align: 'center', font: 'Caveat', weight: 700, rot: 0, seed: 461 });
    ink.text(b.t, 52, 13, { size: 37, color: b.col, font: 'Caveat', weight: 700, rot: -0.04, seed: 462 });
    ctx.restore();
  }
}

/* =====================================================================  8 */
function sceneRelease(s) {
  const { ink, ctx } = s;
  const l0 = s.ln(0), l1 = s.ln(1), l2 = s.ln(2);
  const arrive = easeInOut(clamp((l0.lt - 0.08) / 0.9, 0, 1));
  const carX = lerp(620, 900, arrive);
  const cutP = l1.on ? clamp((l1.lt - 0.45) / 0.09, 0, 1) : 0;      // the switch is thrown
  const on = 1 - cutP;
  const field = l1.on ? 1 - clamp((l1.lt - 0.47) / 0.30, 0, 1) : clamp(l0.p * 2.2, 0, 1);
  let settle = 0;
  if (l2.on) { const q = clamp(l2.lt / 0.9, 0, 1); settle = Math.exp(-q * 6.5) * Math.sin(q * 26) * 5; }

  drawRig(ink, {
    carX, phase: arrive * 14, on, field,
    pieces: [
      { t: 'q', x: 900, s: 132, side: 'w', seed: 611, dy: settle },
      { t: 'p', x: 440, s: 114, side: 'b', seed: 612 },
      { t: 'p', x: 1200, s: 114, side: 'w', seed: 613 },
    ],
  });

  /* the switch, called out as it is thrown */
  if (l1.on) {
    const q = clamp((l1.lt - 0.26) / 0.22, 0, 1);
    if (q > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(q * 1.6, 0, 1);
      const col = cutP > 0.5 ? P.ink : P.red;
      ink.leader(1330, 714, 1304, 640, { seed: 480, color: col, alpha: .8 });
      ink.textReveal(s.STR.power, 1402, 722, clamp(q * 2.4, 0, 1),
        { size: 46, color: col, align: 'right', font: 'Caveat', weight: 700, rot: -0.03, seed: 481 });
      ctx.restore();
    }
  }
  if (l2.on) {
    const q = clamp((l2.p - 0.16) / 0.26, 0, 1);
    if (q > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(q * 1.8, 0, 1) * clamp(1 - (l2.p - .78) / .22, 0, 1);
      const e = easeOutElastic(q);
      ctx.translate(900, 236); ctx.rotate(-0.06); ctx.scale(e, e);
      ink.text(s.STR.letgo, 0, 0, { size: 66, color: P.red, align: 'center', font: 'Caveat', weight: 700, rot: 0, seed: 490 });
      ctx.restore();
    }
  }
}

/* =====================================================================  9 */
function sceneSense(s) {
  const { ink, ctx } = s;
  const l0 = s.ln(0), l1 = s.ln(1);
  const camera = cam(0.86, 4, 4, 610, 420);
  drawBoard(ctx, camera, 'main');

  const mp = clamp((l0.lt - 0.1) / Math.max(0.9, l0.dur - 0.25), 0, 1);
  const lift = Math.sin(clamp(mp, 0, 1) * Math.PI) * camera.px(0.55);
  const pos = [4.5, lerp(1.5, 3.5, ease(mp))];

  const cascade = l1.on ? clamp(l1.p / 0.6, 0, 1) : 0;
  const early = clamp(l0.p * 1.6, 0, 1);
  const rr = camera.px(0.142);
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
    const d = (f * 0.6 + r * 1.1) / 13.6;
    const live = (f === 4 && (r === 1 || r === 3)) ? early : 0;
    const q = Math.max(live, clamp((cascade - d * 0.8) / 0.22, 0, 1));
    if (q <= 0.01) continue;
    const sc = camera.pt(f + .5, r + .5);
    const y = sc[1] + camera.px(0.18);
    const occupied = (f === 4 && r === 1 && mp < 0.5) || (f === 4 && r === 3 && mp >= 0.5);
    ctx.save();
    ctx.globalAlpha = (occupied ? 1 : 0.8) * q;
    ink.circle(sc[0], y, rr * (occupied ? 1.15 : 1), {
      fill: occupied ? P.blue : P.paperHi, fillAlpha: occupied ? .62 : .5,
      color: occupied ? P.blue : P.pencil, w: occupied ? 2.6 : 1.9,
      seed: 1000 + f * 31 + r * 7, rough: .1, ky: 0.8,
    });
    if (!occupied) {
      ctx.globalAlpha = .55 * q; ctx.fillStyle = P.pencil;
      ctx.beginPath(); ctx.arc(sc[0], y, 2, 0, 7); ctx.fill();
    } else {
      for (let k = 0; k < 7; k++) {
        const a = k / 7 * 6.283 + s.t * 0.9;
        ink.stroke([[sc[0] + Math.cos(a) * rr * 1.7, y + Math.sin(a) * rr * 1.4],
          [sc[0] + Math.cos(a) * rr * 2.5, y + Math.sin(a) * rr * 2.1]],
          { color: P.blue, w: 2.1, seed: 1100 + k, amp: .4, passes: 1, alpha: .85 });
      }
    }
    ctx.restore();
  }

  drawPieces(ink, camera, [
    { t: 'n', f: 2, r: 2, side: 'w', seed: 961 }, { t: 'b', f: 6, r: 5, side: 'b', seed: 962 },
    { t: 'r', f: 1, r: 6, side: 'w', seed: 963 }, { t: 'q', f: 3, r: 5, side: 'w', seed: 964 },
    { t: 'p', u: pos[0], v: pos[1], side: 'b', seed: 970, opts: { lift } },
  ]);
  if (mp > 0.02 && mp < 0.98) {
    const psc = camera.pt(pos[0], pos[1]);
    drawHand(ink, psc[0] + 44, psc[1] - lift - camera.px(0.55), 0.84, -0.4, 971, 1);
  }

  const q = l1.on ? clamp((l1.p - 0.12) / 0.3, 0, 1) : 0;
  if (q > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(q * 1.8, 0, 1);
    ink.text('64', 1320, 348, { size: 150, color: P.blue, align: 'center', font: 'Caveat', weight: 700, rot: -0.04, seed: 980 });
    ink.circleAround(1320, 302, 116, 98, { seed: 981, p: easeOut(q), color: P.blue, w: 4.4, laps: 1 });
    ink.textReveal(s.STR.sensors, 1320, 452, clamp(q * 2, 0, 1),
      { size: 48, color: P.blue, align: 'center', font: 'Caveat', weight: 700, rot: -0.02, seed: 982 });
    ink.textReveal(s.STR.perSquare, 1320, 496, clamp((q - .3) / .5, 0, 1),
      { size: 29, color: P.pencil, align: 'center', seed: 983 });
    ctx.restore();
  }
}

/* ===================================================================== 10 */
const START_ROW = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
function sceneOutro(s) {
  const { ink, ctx } = s, p = s.p;
  const z = lerp(0.72, 0.66, easeOut(clamp(p / 0.5, 0, 1)));
  const camera = cam(z, 4, 4, 800, 376);
  drawBoard(ctx, camera, 'main');

  const list = [];
  for (let f = 0; f < 8; f++) {
    for (const cc of [{ r: 0, side: 'b', t: START_ROW[f] }, { r: 1, side: 'b', t: 'p' },
      { r: 6, side: 'w', t: 'p' }, { r: 7, side: 'w', t: START_ROW[f] }]) {
      const q = clamp(p / 0.3 - (f + cc.r * 0.7) / 28, 0, 1);
      if (q <= 0) continue;
      list.push({ t: cc.t, f, r: cc.r, side: cc.side, seed: 1200 + f * 11 + cc.r * 3, h: 0.95 * easeOutBack(q, 1.4) });
    }
  }
  drawPieces(ink, camera, list);

  const sp = clamp((p - 0.26) / 0.22, 0, 1);
  if (sp > 0) {
    const e = easeOutElastic(sp);
    ctx.save();
    ctx.translate(800, 712);
    ctx.rotate(-0.022 + (1 - e) * 0.16);
    ctx.scale(0.8 + 0.2 * e, 0.8 + 0.2 * e);
    ctx.globalAlpha = clamp(sp * 3, 0, 1);
    ink.scrap([[-452, -84], [452, -92], [446, 84], [-446, 78]], { color: P.paperHi, seed: 1300, serr: 3.4, blur: 24, sy: 11 });
    ink.text(s.STR.end, 0, 18, { size: 96, color: P.ink, align: 'center', font: 'Caveat', weight: 700, rot: 0, seed: 1301 });
    ink.stroke([[-404, 48], [404, 44]], { color: P.red, w: 4.4, seed: 1302, amp: 2.4, passes: 1, alpha: .85 });
    ctx.restore();
    if (sp < 0.6) {
      ctx.save();
      ctx.globalAlpha = (1 - sp / 0.6) * 0.5;
      for (let i = 0; i < 14; i++) {
        const a = rnd(1310, i, 0) * 6.283, d = 420 + rnd(1310, i, 1) * 180 * sp * 4;
        ctx.fillStyle = P.ink;
        ctx.beginPath(); ctx.arc(800 + Math.cos(a) * d, 712 + Math.sin(a) * d * 0.4, 2 + rnd(1310, i, 2) * 5, 0, 7); ctx.fill();
      }
      ctx.restore();
    }
  }
  const cp = clamp((p - 0.52) / 0.3, 0, 1);
  if (cp > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(cp * 2, 0, 1) * 0.88;
    ink.text(s.STR.credit, 800, 836, { size: 25, color: P.pencil, align: 'center', seed: 1320, rot: -0.008 });
    ctx.restore();
  }
}

/* ------------------------------------------------------------- odds & ends */
function easeInOut(u) { return u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }

function cloudPath(cx, cy, rx, ry, seed) {
  /* bumps live in a unit circle, then get stretched to the ellipse */
  const bumps = [{ x: 0, y: 0, r: 0.70 }];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + 0.3;
    const rr = 0.34 + 0.09 * Math.abs(Math.sin(i * 2.3)) + sgn(seed, i, 0) * 0.025;
    bumps.push({ x: Math.cos(a) * 0.64, y: Math.sin(a) * 0.62, r: rr });
  }
  const pts = [], steps = 84;
  for (let k = 0; k < steps; k++) {
    const th = k / steps * Math.PI * 2;
    const dx = Math.cos(th), dy = Math.sin(th);
    let best = 0;
    for (const b of bumps) {
      const proj = b.x * dx + b.y * dy;
      const disc = b.r * b.r - (b.x * b.x + b.y * b.y) + proj * proj;
      if (disc <= 0) continue;
      const d = proj + Math.sqrt(disc);
      if (d > best) best = d;
    }
    pts.push([cx + dx * best * rx, cy + dy * best * ry]);
  }
  return pts;
}

/* a paper cut-out hand */
function drawHand(ink, x, y, sc, rot, seed, grab) {
  const c = ink.c;
  c.save();
  c.translate(x, y); c.rotate(rot); c.scale(sc, sc);
  const curl = grab ? 0.68 : 1;
  const m = (a, b) => a * curl + b * (1 - curl);
  const palm = [[-6, 10], [52, -2], [74, 26], [66, 74], [10, 86], [-26, 62], [-28, 30]];
  const fingers = [
    [[46, 2], [m(96, 46), m(-16, 2)], [m(104, 50), 6], [52, 22]],
    [[52, 20], [m(112, 56), 14], [m(114, 58), 36], [54, 40]],
    [[52, 38], [m(106, 56), 44], [m(106, 56), 64], [52, 60]],
    [[48, 58], [m(92, 52), 70], [m(88, 50), 86], [44, 78]],
  ];
  const thumb = [[-4, 34], [-44, 18], [-58, 38], [-26, 60]];
  const all = [palm, thumb].concat(fingers);
  for (const sh of all) ink.wash(sh, { color: '#f6e2cf', alpha: .97, seed: seed + 1, dx: 1.6, dy: 1.4, amp: 1.6 });
  for (const sh of all) ink.stroke(sh, { close: true, color: P.ink, w: 2.4, seed: seed + 2, amp: 1.2, passes: 2 });
  ink.wash([[-28, 58], [14, 84], [-4, 118], [-52, 92]], { color: P.blue, alpha: .8, seed: seed + 3 });
  ink.stroke([[-28, 58], [14, 84], [-4, 118], [-52, 92]], { close: true, color: P.ink, w: 2.4, seed: seed + 4, amp: 1.2 });
  c.restore();
}

const SCENES = {
  hook: sceneHook, brain: sceneBrain, hand: sceneHand, problem: sceneProblem,
  lines: sceneLines, slim: sceneSlim, capture: sceneCapture, release: sceneRelease,
  sense: sceneSense, outro: sceneOutro,
};
