/* =====================================================================
   Die Aufbau-Skizze: Explosionsschnitt, Magnetspalt im Detail,
   Grundfläche und Kennzahlen. Gleiche Zeichenwerkzeuge wie das Video.
   ===================================================================== */
'use strict';

const BW = 1600, BH = 1320;
const SX0 = 446, SX1 = 1052;          // Breite der Schnittscheiben
const LBLX = 1096;                    // Beschriftung rechts, ~460 px bis zum Rand

function slab(ink, y, h, color, seed, x0, x1) {
  const a = x0 === undefined ? SX0 : x0, b = x1 === undefined ? SX1 : x1;
  ink.scrap([[a, y], [b, y - 3], [b - 4, y + h], [a + 3, y + h + 3]],
    { color, seed, serr: 2.2, blur: 16, sy: 7 });
  ink.stroke([[a, y], [b, y - 3]], { color: P.ink2, w: 2, seed: seed + 1, amp: .7, passes: 1, alpha: .8 });
}

function labelFor(ink, y, title, sub, seed, color) {
  ink.leader(LBLX - 16, y, SX1 - 26, y + 6, { seed, color: color || P.ink2, alpha: .7 });
  ink.text(title, LBLX, y + 2, { size: 31, color: color || P.ink, font: 'Caveat', weight: 700, rot: -0.015, seed: seed + 1 });
  if (sub) ink.text(sub, LBLX, y + 30, { size: 20, color: P.pencil, rot: -0.008, seed: seed + 2 });
}

function drawCoilSection(ink, cx, poleY, w, hgt, seed, live) {
  const wind = live === false ? P.pencil : '#b5553a';
  ink.rect(cx - 11, poleY + 11, 22, hgt - 11, { fill: P.paperDeep, fillAlpha: .92, color: P.ink2, w: 2, seed });
  for (let k = 0; k < 6; k++) {
    const y = poleY + 20 + k * ((hgt - 26) / 6);
    ink.stroke([[cx - w / 2, y], [cx + w / 2, y + 6]],
      { color: wind, w: 5.4, seed: seed + 10 + k, amp: .7, passes: 1, alpha: .95 });
  }
  ink.rect(cx - w / 2 - 4, poleY, w + 8, 12,
    { fill: P.blue, fillAlpha: .42, color: P.ink2, w: 2.4, seed: seed + 30 });
}

function drawSketch(ctx) {
  const ink = new Ink(ctx);
  ink.tick = 0;

  /* ---------------------------------------------------------- Kopfzeile */
  ink.text('Wie das Brett aufgebaut ist', 108, 100,
    { size: 64, color: P.ink, font: 'Caveat', weight: 700, rot: -0.012, seed: 1 });
  ink.text('Schnitt durch die Mitte · Maße in mm · Preise und nicht gemessene Werte sind Schätzungen',
    112, 142, { size: 25, color: P.pencil, rot: -0.005, seed: 2 });
  ink.stroke([[106, 170], [1500, 166]], { color: P.red, w: 3, seed: 3, amp: 2.2, passes: 1, alpha: .75 });

  /* ------------------------------------------------- Explosionsschnitt */
  /* Führungslinien, damit die Scheiben als ein Stapel lesbar bleiben */
  for (const x of [SX0 + 34, SX1 - 34]) {
    ink.dashed([[x, 300], [x, 806]], { color: P.pencilL, w: 1.8, dash: [7, 9], alpha: .55, seed: 10 + x, amp: .5 });
  }

  /* Figur */
  drawPiece(ink, 'q', 749, 300, 128, 'w', 40, {});
  labelFor(ink, 262, 'Figur', 'Stahlscheibe im Fuß, PTFE-Gleiter unten', 50);

  /* Brettplatte */
  slab(ink, 346, 20, P.sqLight, 60);
  for (let i = 1; i < 8; i++) {
    const x = SX0 + (SX1 - SX0) * i / 8;
    ink.stroke([[x, 347], [x, 356]], { color: P.ink2, w: 1.6, seed: 70 + i, amp: .3, passes: 1, alpha: .45 });
  }
  labelFor(ink, 352, 'Brettplatte 4 mm', 'Floatglas, Motiv rückseitig gedruckt', 80);

  /* Sensorlage */
  slab(ink, 420, 13, '#4e6b57', 90);
  for (let i = 0; i < 12; i++) {
    const x = SX0 + 32 + i * ((SX1 - SX0 - 64) / 11);
    ink.circle(x, 426, 5, { fill: P.paperHi, fillAlpha: .9, color: '#23362a', w: 1.6, seed: 100 + i, rough: .12 });
  }
  labelFor(ink, 426, 'Sensorlage 1 mm', '64 SMD-Hall-Sensoren auf 8 dünnen Streifen', 110, '#3d5b45');

  /* Luftspalt */
  ink.dashed([[SX0 + 60, 482], [SX1 - 60, 480]], { color: P.pencil, w: 2, dash: [10, 8], alpha: .7, seed: 120, amp: .4 });
  labelFor(ink, 482, 'Luftspalt 1,5 mm', 'Reserve für Durchbiegung und Toleranz', 130);

  /* Elektromagnet */
  drawCoilSection(ink, 749, 520, 76, 96, 140, true);
  ink.text('12 V', 836, 556, { size: 23, color: '#b5553a', seed: 150, rot: -0.02 });
  labelFor(ink, 556, 'Elektromagnet', 'geschaltet — Strom aus heißt losgelassen', 160, P.blue);

  /* H-Bot-Portal */
  ink.rect(649, 640, 200, 40, { fill: P.paperHi, fillAlpha: .96, color: P.ink, w: 2.4, seed: 170 });
  ink.hatch([[649, 640], [849, 640], [849, 680], [649, 680]], { angle: .7, gap: 12, alpha: .14, color: P.ink, seed: 171 });
  for (const dx of [-70, 70]) ink.circle(749 + dx, 660, 12, { fill: P.paperDeep, fillAlpha: .9, color: P.ink2, w: 2, seed: 180 + dx });
  for (const y of [648, 674]) ink.stroke([[SX0 + 40, y], [SX1 - 40, y]], { color: P.pencil, w: 2.4, seed: 190 + y, amp: .6, passes: 1, alpha: .85 });
  ink.stroke([[SX0 + 40, 700], [SX1 - 40, 700]], { color: P.ink, w: 3.2, seed: 200, amp: .6, passes: 1 });
  for (let i = 0; i < 30; i++) {
    const x = SX0 + 48 + i * 20;
    if (x > SX1 - 48) break;
    ink.stroke([[x, 696], [x, 704]], { color: P.ink2, w: 1.8, seed: 210 + i, amp: .2, passes: 1, alpha: .5 });
  }
  labelFor(ink, 668, 'H-Bot-Portal', '8-mm-Wellen, LM8UU, ein GT2-Riemen', 220);

  /* Antrieb */
  for (const dx of [-250, 250]) {
    ink.circle(749 + dx, 752, 30, { fill: P.paperDeep, fillAlpha: .95, color: P.ink, w: 2.6, seed: 230 + dx });
    ink.circle(749 + dx, 752, 6, { fill: P.ink, fillAlpha: .85, color: P.ink, w: 1.4, seed: 240 + dx });
  }
  ink.rect(705, 736, 88, 34, { fill: P.paperHi, fillAlpha: .96, color: P.ink, w: 2.2, seed: 250 });
  ink.text('Treiber', 749, 758, { size: 19, color: P.ink2, align: 'center', seed: 251, bleed: false });
  labelFor(ink, 752, 'Antrieb', '2 × NEMA 17 Pancake + TMC2209', 260);

  /* Bodenplatte */
  slab(ink, 806, 16, P.paperDeep, 270);
  for (const fx of [SX0 + 60, 749, SX1 - 60]) ink.rect(fx - 24, 822, 48, 12, { fill: P.paperWarm, fillAlpha: .9, color: P.ink2, w: 1.8, seed: 280 + fx });
  labelFor(ink, 814, 'Bodenplatte 5 mm', 'plus Filzfüße', 290);

  /* ------------------------------------------------- Detail Magnetspalt */
  ink.scrap([[118, 262], [468, 256], [474, 606], [114, 612]],
    { color: P.paperHi, seed: 300, serr: 3.2, blur: 20, sy: 9 });
  ink.text('Der Magnetspalt', 142, 304, { size: 38, color: P.ink, font: 'Caveat', weight: 700, rot: -0.02, seed: 301 });

  const MM = 20, X0 = 192, X1 = 322;        // 1 mm = 20 px
  let y = 350;
  const bars = [
    ['Fuß', 1.3, '#efe4cc'], ['Glas', 4.0, P.sqLight], ['Platine', 1.0, '#4e6b57'], ['Luft', 1.5, null],
  ];
  /* Figurenfuß mit Stahlscheibe darüber */
  ink.rect(X0 + 8, 312, X1 - X0 - 16, 26, { fill: P.white, fillAlpha: .96, color: P.ink, w: 2, seed: 310 });
  ink.rect(X0 + 30, 330, X1 - X0 - 60, 10, { fill: '#6a6a70', fillAlpha: .95, color: P.ink, w: 1.8, seed: 311 });
  ink.text('Stahlscheibe', X1 + 14, 328, { size: 18, color: P.pencil, seed: 312 });

  const tops = [];
  for (const [name, mm, col] of bars) {
    const h = mm * MM;
    tops.push([name, mm, y, h]);
    if (col) ink.rect(X0, y, X1 - X0, h, { fill: col, fillAlpha: .95, color: P.ink2, w: 1.8, seed: 320 + y });
    else {
      ink.dashed([[X0, y + h / 2], [X1, y + h / 2]], { color: P.pencil, w: 1.8, dash: [8, 7], alpha: .7, seed: 330, amp: .3 });
    }
    y += h;
  }
  /* Polfläche der Spule */
  ink.rect(X0 - 6, y, X1 - X0 + 12, 14, { fill: P.blue, fillAlpha: .45, color: P.ink2, w: 2.2, seed: 340 });
  ink.text('Polfläche', X1 + 14, y + 12, { size: 18, color: P.blue, seed: 341 });

  /* Gesamtmaß links */
  ink.dim(176, 350, 176, y, '≈ 8 mm', { seed: 350, color: P.red, size: 30, lx: -54, ly: 6, head: 9, w: 2.2 });
  /* Einzelmaße rechts, aufgefächert */
  const fan = [338, 396, 452, 496];
  tops.forEach(([name, mm, ty, h], i) => {
    const my = ty + h / 2;
    ink.stroke([[X1 + 6, my], [X1 + 40, fan[i]]], { color: P.pencilL, w: 1.4, seed: 360 + i, amp: .4, passes: 1, alpha: .7 });
    ink.text(`${name} ${mm.toFixed(1).replace('.', ',')}`, X1 + 46, fan[i] + 6, { size: 19, color: P.pencil, seed: 370 + i });
  });
  ink.text('Je dicker die Sensorlage,', 140, 556, { size: 20, color: P.ink2, seed: 380 });
  ink.text('desto schwächer die Kopplung.', 140, 582, { size: 20, color: P.ink2, seed: 381 });

  /* ------------------------------------------------------- Grundfläche */
  ink.scrap([[116, 884], [584, 878], [590, 1268], [112, 1274]],
    { color: P.paperWarm, seed: 400, serr: 3.2, blur: 20, sy: 9 });
  ink.text('Grundfläche', 140, 930, { size: 38, color: P.ink, font: 'Caveat', weight: 700, rot: -0.02, seed: 401 });

  ink.text('8 × 50 mm Felder, zwei Parkspuren', 140, 958, { size: 20, color: P.pencil, seed: 405 });
  const S = 26, bx = 216, by = 984;          // 8 × 26 px = 400 mm
  const pc = ink.c;
  pc.save();
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
    pc.fillStyle = (f + r) % 2 ? P.sqDark : P.sqLight;
    pc.fillRect(bx + f * S, by + r * S, S + .5, S + .5);
  }
  pc.restore();
  ink.stroke([[bx, by], [bx + 8 * S, by], [bx + 8 * S, by + 8 * S], [bx, by + 8 * S]],
    { close: true, color: P.ink, w: 2.6, seed: 420, amp: 1.1 });
  /* Parkspuren */
  for (const lx of [bx - 38, bx + 8 * S + 6]) {
    ink.rect(lx, by, 32, 8 * S, { fill: P.paperHi, fillAlpha: .95, color: P.ink2, w: 2, seed: 430 + lx });
    for (let i = 1; i < 8; i++) ink.stroke([[lx, by + i * S], [lx + 32, by + i * S]], { color: P.pencilL, w: 1.2, seed: 440 + i + lx, amp: .3, passes: 1, alpha: .6 });
  }
  /* Verfahrweg */
  ink.dashed([[bx - 52, by - 16], [bx + 8 * S + 52, by - 16], [bx + 8 * S + 52, by + 8 * S + 16], [bx - 52, by + 8 * S + 16], [bx - 52, by - 16]],
    { color: P.red, w: 2.2, dash: [11, 8], alpha: .8, seed: 450, amp: .5 });
  ink.dim(bx, by + 8 * S + 28, bx + 8 * S, by + 8 * S + 28, null, { seed: 460, color: P.ink2, head: 8, ticks: 7 });
  ink.text('400 mm Spielfeld · Verfahrweg 500 × 450 mm', 352, 1250, { size: 20, color: P.ink2, align: 'center', seed: 480 });

  /* --------------------------------------------------------- Kennzahlen */
  ink.scrap([[624, 884], [1540, 876], [1544, 1268], [620, 1274]],
    { color: P.paperHi, seed: 500, serr: 3.2, blur: 20, sy: 9 });
  ink.text('Kennzahlen', 650, 930, { size: 38, color: P.ink, font: 'Caveat', weight: 700, rot: -0.02, seed: 501 });
  KEY.forEach(([name, val, note], i) => {
    const ly = 978 + i * 45;
    ink.text(name, 650, ly, { size: 24, color: P.ink, seed: 510 + i });
    ink.text(val, 952, ly, { size: 30, color: P.red, align: 'right', font: 'Caveat', weight: 700, rot: -0.015, seed: 520 + i });
    ink.text(note, 980, ly, { size: 20, color: P.pencil, seed: 530 + i });
    if (i < KEY.length - 1) ink.stroke([[650, ly + 14], [1510, ly + 13]], { color: P.pencilL, w: 1, seed: 540 + i, amp: .5, passes: 1, alpha: .4 });
  });
  ink.text('Die Halbfeld-Regel bestimmt alles andere: Figurenbreite ≤ halbe Feldgröße.',
    650, 1242, { size: 21, color: P.ink2, seed: 560 });
}
