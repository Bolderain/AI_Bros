/* =====================================================================
   Betrachter: Kamera, Orbit per Maus und Finger, Beschriftungen als
   2D-Overlay, und die Abläufe (Zug fahren, Y-Fahrt, X-Fahrt).
   ===================================================================== */
'use strict';

const V = {
  renderer: null, scene: null, cam: null, M: null,
  cv: null, ov: null, octx: null,
  // Kamera in Kugelkoordinaten um das Ziel
  theta: -0.70, phi: 1.14, dist: 1000,
  target: null,
  mode: 'idle', t0: 0, playing: false,
  showLabels: true, explode: 0,
  needsRender: true,
};

const B = { uX: u => (u - 4) * 50, vZ: v => (v - 4) * 50 };

/* ------------------------------------------------------------- Aufbau */
function initViewer() {
  V.cv = document.getElementById('gl');
  V.ov = document.getElementById('ov');
  V.octx = V.ov.getContext('2d');

  V.renderer = new THREE.WebGLRenderer({ canvas: V.cv, antialias: true, alpha: false });
  V.renderer.shadowMap.enabled = true;
  V.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  V.renderer.outputEncoding = THREE.sRGBEncoding;

  V.scene = new THREE.Scene();
  V.scene.fog = new THREE.Fog(0xe9dfca, 1400, 2600);
  V.target = new THREE.Vector3(0, -34, -24);
  applyTheme();
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  }
  new MutationObserver(applyTheme).observe(document.documentElement,
    { attributes: true, attributeFilter: ['data-theme'] });

  V.cam = new THREE.PerspectiveCamera(32, 1, 10, 6000);

  const hemi = new THREE.HemisphereLight(0xfff6e2, 0xb09a78, 0.72);
  V.scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff3dd, 1.05);
  key.position.set(420, 760, 520);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const s = key.shadow.camera;
  s.left = -600; s.right = 600; s.top = 600; s.bottom = -600; s.near = 100; s.far = 2200;
  key.shadow.bias = -0.0012;
  V.scene.add(key);
  const fill = new THREE.DirectionalLight(0xdce8f0, 0.32);
  fill.position.set(-500, 300, -420);
  V.scene.add(fill);

  /* Schattenfänger unter dem Gerät */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(3000, 3000),
    new THREE.ShadowMaterial({ opacity: 0.17 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -126;
  floor.receiveShadow = true;
  V.scene.add(floor);

  V.M = buildMachine(THREE);
  V.scene.add(V.M.root);

  bindInput();
  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(loop);
}

/* Die Bühne übernimmt die Hintergrundfarbe des Themes, damit im Dunkelmodus
   kein helles Rechteck mitten auf der Seite steht. */
function applyTheme() {
  const css = getComputedStyle(document.documentElement).getPropertyValue('--stage').trim();
  const col = new THREE.Color(css || '#e9dfca');
  V.renderer.setClearColor(col, 1);
  if (V.scene.fog) V.scene.fog.color.copy(col);
  V.needsRender = true;
}

function resize() {
  const host = V.cv.parentElement;
  const w = host.clientWidth, h = host.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  V.renderer.setPixelRatio(dpr);
  V.renderer.setSize(w, h, false);
  V.ov.width = Math.round(w * dpr); V.ov.height = Math.round(h * dpr);
  V.ov.style.width = w + 'px'; V.ov.style.height = h + 'px';
  V.cam.aspect = w / h;
  V.cam.updateProjectionMatrix();
  V.needsRender = true;
}

/* ------------------------------------------------------------- Eingabe */
function bindInput() {
  const el = V.ov;
  let drag = null;
  const pos = e => ({ x: e.clientX, y: e.clientY });

  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    drag = { ...pos(e), pan: e.button === 2 || e.shiftKey };
    el.style.cursor = 'grabbing';
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = pos(e), dx = p.x - drag.x, dy = p.y - drag.y;
    drag.x = p.x; drag.y = p.y;
    if (drag.pan) {
      const k = V.dist * 0.0016;
      const right = new THREE.Vector3().setFromMatrixColumn(V.cam.matrix, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(V.cam.matrix, 1);
      V.target.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
    } else {
      V.theta -= dx * 0.007;
      V.phi = Math.max(0.08, Math.min(Math.PI - 0.08, V.phi - dy * 0.007));
    }
    V.needsRender = true;
  });
  const end = (e) => { drag = null; el.style.cursor = 'grab'; };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('contextmenu', e => e.preventDefault());
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    V.dist = Math.max(260, Math.min(2600, V.dist * (1 + Math.sign(e.deltaY) * 0.12)));
    V.needsRender = true;
  }, { passive: false });

  /* zwei Finger: zoomen */
  let pinch = 0;
  el.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 2) return;
    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY);
    if (pinch) {
      V.dist = Math.max(260, Math.min(2600, V.dist * (pinch / d)));
      V.needsRender = true;
    }
    pinch = d;
  }, { passive: true });
  el.addEventListener('touchend', () => { pinch = 0; });
}

function resetView() {
  V.theta = -0.70; V.phi = 1.14; V.dist = 1000;
  V.target.set(0, -34, -24);
  V.needsRender = true;
}

/* ------------------------------------------------------------- Abläufe */
function linePath(f1, r1, f2, r2) {
  const sx = f1 + .5, sy = r1 + .5, ex = f2 + .5, ey = r2 + .5;
  const uL = f2 > f1 ? f1 + 1 : f2 < f1 ? f1 : f1 + 1;
  const vL = r2 > r1 ? r2 : r2 < r1 ? r2 + 1 : r1 + 1;
  const raw = [[sx, sy], [uL, sy], [uL, vL], [ex, vL], [ex, ey]];
  const out = [raw[0]];
  for (let i = 1; i < raw.length; i++) {
    const a = out[out.length - 1], b = raw[i];
    if (Math.abs(a[0] - b[0]) > 1e-6 || Math.abs(a[1] - b[1]) > 1e-6) out.push(b);
  }
  return out.map(([u, v]) => [B.uX(u), B.vZ(v)]);
}

const MOVE = { from: [1, 7], to: [2, 5] };          // Springer b1 -> c3
const HOME = [-225, 175];
const PATH = linePath(MOVE.from[0], MOVE.from[1], MOVE.to[0], MOVE.to[1]);

function walk(pts, p) {
  let total = 0; const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    segs.push(l); total += l;
  }
  let d = Math.max(0, Math.min(1, p)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const u = segs[i] ? Math.max(0, Math.min(1, d / segs[i])) : 1;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u,
        pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u];
    }
    d -= segs[i];
  }
  return pts[pts.length - 1];
}

const ease = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
const lerp = (a, b, u) => a + (b - a) * u;
const seg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));

const MOVE_END = 8.2;

function applyMode(t) {
  const M = V.M;
  if (V.mode === 'move') {
    const tt = t % MOVE_END;
    const start = PATH[0], end = PATH[PATH.length - 1];
    if (tt < 1.7) {                                   // leer zur Figur fahren
      const u = ease(seg(tt, 0, 1.7));
      M.setPose(lerp(HOME[0], start[0], u), lerp(HOME[1], start[1], u));
      M.setPower(0);
      M.hero.position.set(start[0], 0, start[1]);
    } else if (tt < 2.1) {                            // Strom an
      M.setPose(start[0], start[1]);
      M.setPower(seg(tt, 1.7, 2.1));
      M.hero.position.set(start[0], 0, start[1]);
    } else if (tt < 5.8) {                            // Zug fahren
      const p = ease(seg(tt, 2.1, 5.8));
      const q = walk(PATH, p);
      M.setPose(q[0], q[1]);
      M.setPower(1);
      M.hero.position.set(q[0], 0, q[1]);
    } else if (tt < 6.3) {                            // Strom aus
      M.setPose(end[0], end[1]);
      M.setPower(1 - seg(tt, 5.8, 6.3));
      M.hero.position.set(end[0], 0, end[1]);
    } else {                                          // zurück in die Ecke
      const u = ease(seg(tt, 6.3, 8.0));
      M.setPose(lerp(end[0], HOME[0], u), lerp(end[1], HOME[1], u));
      M.setPower(0);
      M.hero.position.set(end[0], 0, end[1]);
    }
  } else if (V.mode === 'axisY') {
    M.setPose(0, Math.sin(t * 1.1) * 170);
    M.setPower(0);
  } else if (V.mode === 'axisX') {
    M.setPose(Math.sin(t * 1.1) * 215, 0);
    M.setPower(0);
  }
}

/* ---------------------------------------------------------- Beschriftung
   Wie in einer technischen Zeichnung: zwei Spalten am Rand, Linie zum Teil.
   So ueberlappt nichts, egal wie man dreht. */
function drawLabels() {
  const c = V.octx, dpr = V.ov.width / Math.max(1, V.ov.clientWidth);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = V.ov.clientWidth, H = V.ov.clientHeight;
  c.clearRect(0, 0, W, H);
  if (!V.showLabels) return;

  const items = [];
  for (const L of V.M.labels) {
    if (L.group && L.group.visible === false) continue;
    const w = L.anchor.clone();
    L.group.updateWorldMatrix(true, false);
    L.group.localToWorld(w);
    const p = w.clone().project(V.cam);
    if (p.z > 1 || p.z < -1) continue;
    const x = (p.x * 0.5 + 0.5) * W, y = (-p.y * 0.5 + 0.5) * H;
    if (x < -60 || x > W + 60 || y < -60 || y > H + 60) continue;
    items.push({ L, x, y });
  }

  c.font = '15px "Patrick Hand", system-ui, sans-serif';
  c.textBaseline = 'middle';

  const PAD = 12, STEP = 25;
  for (const side of [-1, 1]) {
    const col = items.filter(it => ((it.L.side === 'l' ? -1 : 1) === side));
    col.sort((p, q) => p.y - q.y);
    /* gleichmaessig verteilen, mittig zur Wolke der Ankerpunkte */
    const need = col.length * STEP;
    let top = col.length ? Math.max(PAD + 10,
      Math.min(H - PAD - need, col.reduce((a2, it) => a2 + it.y, 0) / col.length - need / 2)) : 0;
    col.forEach((it, i) => {
      it.ty = top + i * STEP + STEP / 2;
      it.tx = side < 0 ? PAD : W - PAD;
      it.right = side > 0;
    });
  }

  for (const it of items) {
    if (it.ty === undefined) continue;
    const colr = it.L.color !== undefined
      ? '#' + it.L.color.toString(16).padStart(6, '0') : '#3c352c';
    const hook = it.right ? it.tx - 8 : it.tx + 8;
    c.strokeStyle = colr; c.fillStyle = colr; c.lineWidth = 1.1;
    c.globalAlpha = 0.32;
    c.beginPath();
    c.moveTo(it.x, it.y);
    c.lineTo(hook + (it.right ? -14 : 14), it.ty);
    c.lineTo(hook, it.ty);
    c.stroke();
    c.globalAlpha = 0.95;
    c.beginPath(); c.arc(it.x, it.y, 2.6, 0, 7); c.fill();
    c.textAlign = it.right ? 'right' : 'left';
    const m = c.measureText(it.L.text);
    c.globalAlpha = 0.86;
    c.fillStyle = '#f6efdf';
    c.fillRect(it.right ? it.tx - m.width - 5 : it.tx - 3, it.ty - 10, m.width + 8, 20);
    c.globalAlpha = 1;
    c.fillStyle = colr;
    c.fillText(it.L.text, it.tx, it.ty);
  }
  c.globalAlpha = 1;
}

/* ---------------------------------------------------------------- Loop */
function loop(now) {
  requestAnimationFrame(loop);
  const t = now / 1000;
  if (V.playing) { applyMode(t - V.t0); V.needsRender = true; }

  const sp = Math.sin(V.phi), cp = Math.cos(V.phi);
  V.cam.position.set(
    V.target.x + V.dist * sp * Math.sin(V.theta),
    V.target.y + V.dist * cp,
    V.target.z + V.dist * sp * Math.cos(V.theta));
  V.cam.lookAt(V.target);
  V.M.layers.base.visible = V.phi < 1.72;   // von unten stört die Bodenplatte

  V.renderer.render(V.scene, V.cam);
  drawLabels();
  V.needsRender = false;
}

/* ------------------------------------------------------------- Bedienung */
function setMode(m) {
  V.mode = m;
  V.playing = m !== 'idle';
  V.t0 = performance.now() / 1000;
  if (m === 'idle') { V.M.setPower(0); }
  for (const b of document.querySelectorAll('[data-mode]')) {
    b.setAttribute('aria-pressed', String(b.dataset.mode === m));
  }
  const hint = document.getElementById('hint');
  hint.textContent = {
    move: 'Der Schlitten fährt leer zur Figur, schaltet den Magneten ein, zieht sie auf den Linien zwischen den Feldern — und schaltet am Ziel wieder aus.',
    axisY: 'Beide Motoren drehen gleich herum: das ganze Portal fährt vor und zurück.',
    axisX: 'Die Motoren drehen gegeneinander: nur der Schlitten fährt am Balken entlang.',
    idle: 'Ziehen zum Drehen, Rad zum Zoomen, Umschalt-Ziehen zum Verschieben.',
  }[m];
}

function wire() {
  for (const b of document.querySelectorAll('[data-mode]')) {
    b.addEventListener('click', () => setMode(b.dataset.mode));
  }
  document.getElementById('reset').addEventListener('click', resetView);
  const ex = document.getElementById('explode');
  ex.addEventListener('input', () => {
    V.M.setExplode(ex.value / 100);
    V.needsRender = true;
  });
  const toggles = [['tGlass', 'glass'], ['tPcb', 'pcb'], ['tFrame', 'frame'], ['tPieces', 'pieces']];
  for (const [id, key] of toggles) {
    const el = document.getElementById(id);
    el.addEventListener('click', () => {
      const on = el.getAttribute('aria-pressed') !== 'true';
      el.setAttribute('aria-pressed', String(on));
      V.M.layers[key].visible = on;
      V.needsRender = true;
    });
  }
  const tl = document.getElementById('tLabels');
  tl.addEventListener('click', () => {
    V.showLabels = tl.getAttribute('aria-pressed') !== 'true';
    tl.setAttribute('aria-pressed', String(V.showLabels));
  });
}

function boot3d() {
  /* Der Artifact-Host liefert den <head>; ohne Viewport-Meta legt ein Telefon
     die Seite mit 980 px aus und zoomt alles winzig. */
  if (!document.querySelector('meta[name="viewport"]')) {
    const m = document.createElement('meta');
    m.name = 'viewport';
    m.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    document.head.appendChild(m);
  }
  const go = () => {
    initViewer();
    wire();
    setMode('move');
    window.__ready = true;
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go, go);
  else go();
}

/* Testhaken für den Offline-Renderer */
window.__setMode = (m) => setMode(m);
window.__setTime = (t) => { V.playing = false; applyMode(t); };
window.__setCam = (th, ph, d) => { V.theta = th; V.phi = ph; V.dist = d; };
window.__explode = (e) => V.M.setExplode(e);
window.__toggle = (k, on) => { V.M.layers[k].visible = on; };
window.__model = () => V.M;

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot3d);
else boot3d();
