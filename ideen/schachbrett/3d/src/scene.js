/* =====================================================================
   Das Brett als 3D-Modell. Alle Maße in Millimetern, Y zeigt nach oben,
   X sind die Linien a..h, Z die Reihen (der Spieler sitzt bei +Z).
   Die Zahlen stammen aus ideen/schachbrett/aufbau.md.
   ===================================================================== */
'use strict';

const MM = {
  SQ: 50,
  GLASS_W: 540, GLASS_D: 460, GLASS_T: 4,
  PCB_TOP: -5, PCB_BOT: -6,
  POLE: -7,                       // Polfläche: 8 mm unter der Stahlscheibe
  COIL_BOT: -39, COIL_R: 14,
  PLANE: -50,                     // Ebene von Wellen, Riemen, Schlitten
  ROD_R: 4, RAIL_X: 252, ROD_HALF: 228,
  BELT_X: 276, BELT_DZ: 13, MOTOR_Z: -292,
  TRAVEL_X: 225, TRAVEL_Z: 175,
  BASE_Y: -104,
};

const COL = {
  glass: 0xcfe0e4, pcb: 0x2d5340, pcbDot: 0xe8e2d0,
  copper: 0xb5553a, copperOff: 0x8d7f74, core: 0x8a8578, steel: 0x9aa0a6,
  block: 0xefe4cc, belt: 0x33302c, motorA: 0x3a6a9e, motorB: 0xcb4733,
  motor: 0x50555c, base: 0xd8c9a8, frame: 0xcdbb97,
};

/* ---------------------------------------------------------- Hilfsmittel */
function mat(THREE, color, o) {
  return new THREE.MeshStandardMaterial(Object.assign({
    color, roughness: 0.72, metalness: 0.05,
  }, o || {}));
}

function box(THREE, w, h, d, material, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x || 0, y || 0, z || 0);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function cyl(THREE, r, h, material, axis) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 28), material);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/* dünne Kantenlinien für den technischen Look */
function edged(THREE, mesh, color, opacity) {
  const e = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 28),
    new THREE.LineBasicMaterial({ color: color === undefined ? 0x2f2b28 : color,
      transparent: true, opacity: opacity === undefined ? 0.3 : opacity }));
  mesh.add(e);
  return mesh;
}

/* ------------------------------------------------- Brettmotiv als Textur */
function boardTexture(THREE) {
  const S = 1536;
  const cv = document.createElement('canvas');
  cv.width = S; cv.height = Math.round(S * MM.GLASS_D / MM.GLASS_W);
  const c = cv.getContext('2d');
  const k = S / MM.GLASS_W;                       // px je mm
  const mx = v => (v + MM.GLASS_W / 2) * k;
  const mz = v => (v + MM.GLASS_D / 2) * k;

  c.clearRect(0, 0, cv.width, cv.height);
  /* Felder */
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
    c.fillStyle = (f + r) % 2 ? '#c9ad80' : '#f2e7cd';
    c.fillRect(mx((f - 4) * MM.SQ), mz((r - 4) * MM.SQ), MM.SQ * k + 1, MM.SQ * k + 1);
  }
  /* Rahmenlinie ums Spielfeld */
  c.strokeStyle = '#3a342c'; c.lineWidth = 3 * k * 0.5;
  c.strokeRect(mx(-200), mz(-200), 400 * k, 400 * k);
  /* Parkspuren links und rechts */
  for (const sgn of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      c.fillStyle = i % 2 ? '#e6dbc2' : '#f4ecda';
      c.fillRect(mx(sgn > 0 ? 205 : -245), mz((i - 4) * MM.SQ), 40 * k, MM.SQ * k + 1);
      c.strokeStyle = 'rgba(58,52,44,.45)'; c.lineWidth = 1.5;
      c.strokeRect(mx(sgn > 0 ? 205 : -245), mz((i - 4) * MM.SQ), 40 * k, MM.SQ * k);
    }
  }
  /* Beschriftung a..h / 1..8 */
  c.fillStyle = '#5a5146';
  c.font = `${Math.round(13 * k)}px "Patrick Hand", sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let f = 0; f < 8; f++) {
    c.fillText('abcdefgh'[f], mx((f - 3.5) * MM.SQ), mz(210));
  }
  for (let r = 0; r < 8; r++) {
    c.fillText(String(8 - r), mx(-210), mz((r - 3.5) * MM.SQ));
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  return tex;
}

/* --------------------------------------------------------- Schachfiguren */
const PROFILE = {
  p: [[0, 0], [10, 0], [11, 3], [8, 5], [5, 9], [4.5, 20], [7, 23], [4, 25], [6.5, 30], [4, 34], [0, 36]],
  r: [[0, 0], [11, 0], [12, 3], [9, 5], [7, 10], [7, 30], [10, 32], [10, 40], [0, 40]],
  b: [[0, 0], [10, 0], [11, 3], [8, 5], [5, 10], [4.5, 26], [8, 30], [7, 34], [4, 42], [2, 46], [0, 47]],
  q: [[0, 0], [11, 0], [12, 3], [9, 5], [6, 12], [5, 30], [9, 36], [11, 40], [8, 44], [4, 50], [0, 52]],
  n: [[0, 0], [11, 0], [12, 3], [9, 5], [6, 10], [6, 26], [9, 30], [7, 38], [5, 44], [0, 45]],
  k: [[0, 0], [11, 0], [12, 3], [9, 5], [6, 12], [5, 32], [9, 38], [11, 42], [8, 46], [5, 50], [4, 56], [0, 56]],
};

function piece(THREE, type, white) {
  const g = new THREE.Group();
  const pts = (PROFILE[type] || PROFILE.p).map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(pts, 36);
  const body = new THREE.Mesh(geo, mat(THREE, white ? 0xf7f0e0 : 0x3a3632,
    { roughness: white ? 0.78 : 0.62 }));
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  /* Stahlscheibe im Fuß — sie ist der Grund, warum der Magnet überhaupt zieht */
  const disc = cyl(THREE, 6, 2, mat(THREE, 0x6a6a70, { metalness: 0.75, roughness: 0.4 }));
  disc.position.y = 1.4;
  g.add(disc);
  g.userData.steel = disc;
  return g;
}

/* ================================================================ Aufbau */
function buildMachine(THREE) {
  const root = new THREE.Group();
  const L = [];                       // Beschriftungen: {anchor, text, side}
  const layers = {};                  // für die Explosionsansicht

  /* ---------------- Bodenplatte und Rahmen ---------------- */
  const gBase = new THREE.Group();
  const base = box(THREE, 580, 6, 600, mat(THREE, 0xa8977a, { roughness: 0.95 }), 0, MM.BASE_Y, -36);
  gBase.add(edged(THREE, base, 0x2f2b28, 0.22));
  for (const [fx, fz] of [[-250, -300], [250, -300], [-250, 220], [250, 220]]) {
    gBase.add(box(THREE, 40, 10, 40, mat(THREE, 0xb9a98a), fx, MM.BASE_Y - 9, fz));
  }
  root.add(gBase); layers.base = gBase;

  const gFrame = new THREE.Group();
  const fm = mat(THREE, 0xcdbb97, { roughness: 0.85 });
  const RIM = 26;                        // nur ein flacher Rand, die Seiten bleiben offen
  gFrame.add(edged(THREE, box(THREE, 620, RIM, 14, fm, 0, -RIM / 2, 237), 0x2f2b28, 0.28));
  gFrame.add(edged(THREE, box(THREE, 620, RIM, 14, fm, 0, -RIM / 2, -309), 0x2f2b28, 0.28));
  gFrame.add(edged(THREE, box(THREE, 14, RIM, 560, fm, -303, -RIM / 2, -36), 0x2f2b28, 0.28));
  gFrame.add(edged(THREE, box(THREE, 14, RIM, 560, fm, 303, -RIM / 2, -36), 0x2f2b28, 0.28));
  for (const [px, pz] of [[-296, 230], [296, 230], [-296, -302], [296, -302]]) {
    gFrame.add(edged(THREE, box(THREE, 22, 78, 22, fm, px, -65, pz), 0x2f2b28, 0.28));
  }
  root.add(gFrame); layers.frame = gFrame;

  /* ---------------- Glas mit Brettmotiv ---------------- */
  const gGlass = new THREE.Group();
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: COL.glass, roughness: 0.08, metalness: 0, transparent: true,
    opacity: 0.16, depthWrite: false, side: THREE.DoubleSide,
  });
  const glass = box(THREE, MM.GLASS_W, MM.GLASS_T, MM.GLASS_D, glassMat, 0, -MM.GLASS_T / 2, 0);
  glass.castShadow = false; glass.renderOrder = 10;
  gGlass.add(edged(THREE, glass, 0x6e7f86, 0.5));
  const bt = boardTexture(THREE);
  if (THREE.sRGBEncoding !== undefined) bt.encoding = THREE.sRGBEncoding;
  const printMat = new THREE.MeshBasicMaterial({
    map: bt, transparent: true, opacity: 0.72,
    depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  });
  const print = new THREE.Mesh(new THREE.PlaneGeometry(MM.GLASS_W, MM.GLASS_D), printMat);
  print.rotation.x = -Math.PI / 2;
  print.position.y = -MM.GLASS_T - 0.1;
  print.renderOrder = 9;
  gGlass.add(print);
  root.add(gGlass); layers.glass = gGlass;
  L.push({ anchor: new THREE.Vector3(-250, -2, 200), text: 'Glas 4 mm', group: gGlass, side: 'r' });

  /* ---------------- Sensorlage ---------------- */
  const gPcb = new THREE.Group();
  const pcbMat = mat(THREE, COL.pcb, { roughness: 0.82, metalness: 0 });
  const dotMat = mat(THREE, COL.pcbDot, { roughness: 0.5 });
  for (let r = 0; r < 8; r++) {
    const z = (r - 3.5) * MM.SQ;
    const strip = box(THREE, 404, 1, 22, pcbMat, 0, -5.5, z);
    strip.castShadow = false;
    gPcb.add(strip);
    for (let f = 0; f < 8; f++) {
      const d = cyl(THREE, 3.2, 1.6, dotMat);
      d.position.set((f - 3.5) * MM.SQ, -6.3, z);
      gPcb.add(d);
    }
  }
  root.add(gPcb); layers.pcb = gPcb;
  L.push({ anchor: new THREE.Vector3(200, -5.5, -150), text: 'Sensorlage, 1 mm', group: gPcb, side: 'r' });

  /* ---------------- Y-Schienen und Motoren (fest am Rahmen) ---------------- */
  const gStatic = new THREE.Group();
  const steelMat = mat(THREE, COL.steel, { metalness: 0.6, roughness: 0.35 });
  for (const sx of [-1, 1]) {
    const rail = cyl(THREE, MM.ROD_R, 580, steelMat, 'z');
    rail.position.set(sx * MM.RAIL_X, MM.PLANE, -20);
    gStatic.add(rail);
    for (const z of [-295, 255]) {
      gStatic.add(box(THREE, 26, 26, 14, mat(THREE, COL.block), sx * MM.RAIL_X, MM.PLANE, z));
    }
  }
  L.push({ anchor: new THREE.Vector3(-MM.RAIL_X, MM.PLANE, 150), text: 'Y-Schiene', group: gStatic, side: 'l' });

  const motors = {};
  for (const [key, sx, col] of [['A', -1, COL.motorA], ['B', 1, COL.motorB]]) {
    const g = new THREE.Group();
    const body = box(THREE, 42, 42, 42, mat(THREE, COL.motor, { roughness: 0.55 }),
      0, MM.PLANE - 32, 0);
    g.add(edged(THREE, body, 0x15181b, 0.4));
    const pulley = cyl(THREE, 9, 14, mat(THREE, col, { roughness: 0.5 }));
    pulley.position.y = MM.PLANE;
    /* Markierung, damit man die Drehrichtung sieht */
    const markGrp = new THREE.Group();
    const mark = box(THREE, 3, 15, 9, mat(THREE, 0xfaf4e6), 0, 0, 5.5);
    markGrp.add(mark);
    pulley.add(markGrp);
    g.add(pulley);
    g.position.set(sx * MM.BELT_X, 0, MM.MOTOR_Z);
    gStatic.add(g);
    motors[key] = { group: g, pulley, col };
    L.push({ anchor: new THREE.Vector3(sx * MM.BELT_X, MM.PLANE - 20, MM.MOTOR_Z),
      text: 'Motor ' + key, group: gStatic, color: col, side: sx < 0 ? 'l' : 'r' });
  }
  root.add(gStatic); layers.rails = gStatic;

  /* ---------------- Portal: Y-Schlitten, X-Welle ---------------- */
  const gBeam = new THREE.Group();
  const yCars = [];
  for (const sx of [-1, 1]) {
    const yc = box(THREE, 40, 30, 82, mat(THREE, COL.block), sx * MM.RAIL_X, MM.PLANE, 0);
    edged(THREE, yc, 0x2f2b28, 0.3);
    gBeam.add(yc);
    yCars.push(yc);
    /* Umlenkrolle am Balkenende, sie fährt mit */
    const idler = cyl(THREE, 7, 12, mat(THREE, 0x6d737a, { metalness: 0.4 }));
    idler.position.set(sx * MM.BELT_X, MM.PLANE, sx < 0 ? -MM.BELT_DZ : MM.BELT_DZ);
    gBeam.add(idler);
  }
  const xrod = cyl(THREE, MM.ROD_R, MM.ROD_HALF * 2, steelMat, 'x');
  xrod.position.set(0, MM.PLANE, 0);
  gBeam.add(xrod);
  L.push({ anchor: new THREE.Vector3(120, MM.PLANE, 0), text: 'X-Welle', group: gBeam, side: 'l' });

  /* ---------------- Schlitten mit Elektromagnet ---------------- */
  const gCar = new THREE.Group();
  const carBody = box(THREE, 84, 22, 72, mat(THREE, COL.block), 0, MM.PLANE, 0);
  gCar.add(edged(THREE, carBody, 0x2f2b28, 0.32));
  for (const dz of [-MM.BELT_DZ, MM.BELT_DZ]) {
    gCar.add(box(THREE, 16, 14, 8, mat(THREE, 0x8d8378), 0, MM.PLANE, dz));
  }
  const COIL_H = MM.POLE - MM.COIL_BOT;          // 32 mm, positiv
  const windings = cyl(THREE, MM.COIL_R, COIL_H - 5, mat(THREE, COL.copper, { roughness: 0.45 }));
  windings.position.y = (MM.POLE + MM.COIL_BOT) / 2 - 1;
  gCar.add(windings);
  const core = cyl(THREE, 5.5, COIL_H, mat(THREE, COL.core, { metalness: 0.5, roughness: 0.4 }));
  core.position.y = (MM.POLE + MM.COIL_BOT) / 2;
  gCar.add(core);
  const pole = cyl(THREE, MM.COIL_R + 2, 3, mat(THREE, 0x7d858c, { metalness: 0.6, roughness: 0.35 }));
  pole.position.y = MM.POLE - 1.5;
  gCar.add(pole);
  /* Feldandeutung über der Polfläche, wird beim Einschalten sichtbar */
  const fieldMat = new THREE.MeshBasicMaterial({
    color: 0x5b8fd0, transparent: true, opacity: 0, depthWrite: false,
  });
  const field = new THREE.Mesh(new THREE.SphereGeometry(26, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), fieldMat);
  field.position.y = MM.POLE;
  field.renderOrder = 8;
  gCar.add(field);
  gBeam.add(gCar);                     // der Schlitten fährt mit dem Portal in Z
  root.add(gBeam); layers.beam = gBeam;
  L.push({ anchor: new THREE.Vector3(0, (MM.POLE + MM.COIL_BOT) / 2, 18),
    text: 'Elektromagnet', group: gCar, color: 0x3a6a9e, side: 'r' });
  L.push({ anchor: new THREE.Vector3(0, MM.PLANE - 12, 40), text: 'Schlitten', group: gCar, side: 'r' });

  /* ---------------- Riemen ---------------- */
  const beltMat = mat(THREE, COL.belt, { roughness: 0.8 });
  const beltSegs = [];
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1, 6.5, 3.6), beltMat);
    m.castShadow = true;
    beltSegs.push(m);
    root.add(m);
  }
  L.push({ anchor: new THREE.Vector3(0, MM.PLANE, MM.MOTOR_Z), text: 'Riemen', group: root, side: 'l' });

  /* ---------------- Figuren ---------------- */
  const gPieces = new THREE.Group();
  const SETUP = [
    ['r', 0, 7, true], ['p', 1, 6, true], ['p', 3, 6, true], ['q', 4, 7, true],
    ['p', 5, 6, true], ['b', 2, 7, true],
    ['p', 4, 1, false], ['r', 7, 0, false], ['b', 5, 0, false], ['p', 6, 1, false],
  ];
  for (const [t, f, r, w] of SETUP) {
    const p = piece(THREE, t, w);
    p.position.set((f - 3.5) * MM.SQ, 0, (r - 3.5) * MM.SQ);
    gPieces.add(p);
  }
  const hero = piece(THREE, 'n', false);
  hero.position.set((1 - 3.5) * MM.SQ, 0, (7 - 3.5) * MM.SQ);
  gPieces.add(hero);
  root.add(gPieces); layers.pieces = gPieces;

  /* ---------------------------------------------------------- Steuerung */
  const state = { x: 0, z: 0, power: 0, explode: 0 };

  function beltPath() {
    const y = MM.PLANE, z = state.z, x = state.x;
    return [
      [new THREE.Vector3(x - 10, y, z - MM.BELT_DZ), new THREE.Vector3(-MM.BELT_X, y, z - MM.BELT_DZ)],
      [new THREE.Vector3(-MM.BELT_X, y, z - MM.BELT_DZ), new THREE.Vector3(-MM.BELT_X, y, MM.MOTOR_Z)],
      [new THREE.Vector3(-MM.BELT_X, y, MM.MOTOR_Z), new THREE.Vector3(MM.BELT_X, y, MM.MOTOR_Z)],
      [new THREE.Vector3(MM.BELT_X, y, MM.MOTOR_Z), new THREE.Vector3(MM.BELT_X, y, z + MM.BELT_DZ)],
      [new THREE.Vector3(MM.BELT_X, y, z + MM.BELT_DZ), new THREE.Vector3(x + 10, y, z + MM.BELT_DZ)],
    ];
  }

  function setPose(x, z) {
    state.x = Math.max(-MM.TRAVEL_X, Math.min(MM.TRAVEL_X, x));
    state.z = Math.max(-MM.TRAVEL_Z, Math.min(MM.TRAVEL_Z, z));
    gBeam.position.z = state.z;
    gCar.position.x = state.x;
    /* Riemen neu spannen */
    const segs = beltPath();
    for (let i = 0; i < segs.length; i++) {
      const [a, b] = segs[i];
      const m = beltSegs[i];
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const len = a.distanceTo(b);
      m.position.copy(mid);
      m.scale.set(Math.max(len, 0.001), 1, 1);
      m.rotation.set(0, Math.atan2(-(b.z - a.z), b.x - a.x), 0);
    }
    /* Die Drehung folgt direkt aus der H-Bot-Kinematik:
       gleiche Richtung -> Y, gegeneinander -> X */
    motors.A.pulley.rotation.y = (state.x - state.z) / 9;
    motors.B.pulley.rotation.y = (-state.x - state.z) / 9;
  }

  function setPower(p) {
    state.power = p;
    windings.material.color.setHex(p > 0.5 ? COL.copper : COL.copperOff);
    windings.material.emissive.setHex(0xb5553a);
    windings.material.emissiveIntensity = 0.55 * p;
    fieldMat.opacity = 0.42 * p;
  }

  function setExplode(e) {
    state.explode = e;
    layers.glass.position.y = e * 190;
    layers.pcb.position.y = e * 120;
    layers.pieces.position.y = e * 244;
    gCar.position.y = -e * 26;
    layers.rails.position.y = -e * 60;
    layers.beam.position.y = -e * 60;
    layers.base.position.y = -e * 110;
    layers.frame.position.y = -e * 110;
    for (const s of beltSegs) s.position.y = MM.PLANE - e * 60;
  }

  setPose(0, 0); setPower(0); setExplode(0);

  return {
    root, layers, labels: L, motors, hero, pieces: gPieces,
    state, setPose, setPower, setExplode, MM,
    beltSegs,
  };
}
