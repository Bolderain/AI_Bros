'use strict';
/* Prüft die H-Bot-Regel am laufenden Modell:
   gleiche Drehrichtung -> Portal fährt in Y, gegenläufig -> Schlitten in X.
   Ausserdem: bleibt der Riemen beim Fahren gleich lang? */
const path = require('path');
const puppeteer = require('puppeteer');
const PAGE = 'file:///' + path.join(__dirname, 'out', 'brett3d.html').split(path.sep).join('/');

(async () => {
  const b = await puppeteer.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 900, height: 600 });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(PAGE, { waitUntil: 'load' });
  await p.waitForFunction('window.__ready === true', { timeout: 45000 });

  const out = await p.evaluate(() => {
    /* an das Modell kommen wir ueber den Betrachter */
    const M = window.__model ? window.__model() : null;
    if (!M) return { err: 'kein Zugriff auf das Modell' };
    const read = () => ({
      a: M.motors.A.pulley.rotation.y,
      b: M.motors.B.pulley.rotation.y,
      beltLen: M.beltSegs.reduce((s, m) => s + m.scale.x, 0),
    });
    const res = {};
    M.setPose(0, 0); const base = read();
    M.setPose(0, 100); const dY = read();
    M.setPose(100, 0); const dX = read();
    res.yMove = { da: +(dY.a - base.a).toFixed(4), db: +(dY.b - base.b).toFixed(4) };
    res.xMove = { da: +(dX.a - base.a).toFixed(4), db: +(dX.b - base.b).toFixed(4) };
    /* Riemenlaenge ueber mehrere Posen */
    const lens = [];
    for (const [x, z] of [[0, 0], [150, 0], [-150, 0], [0, 150], [0, -150], [120, -120]]) {
      M.setPose(x, z); lens.push(+read().beltLen.toFixed(2));
    }
    res.beltLens = lens;
    res.beltSpread = +(Math.max(...lens) - Math.min(...lens)).toFixed(2);
    M.setPose(0, 0);
    return res;
  });

  console.log('Y-Fahrt  Δa=%s  Δb=%s  -> %s', out.yMove.da, out.yMove.db,
    Math.sign(out.yMove.da) === Math.sign(out.yMove.db) ? 'GLEICHSINNIG ✓' : 'FEHLER');
  console.log('X-Fahrt  Δa=%s  Δb=%s  -> %s', out.xMove.da, out.xMove.db,
    Math.sign(out.xMove.da) === -Math.sign(out.xMove.db) ? 'GEGENLÄUFIG ✓' : 'FEHLER');
  console.log('Riemenlängen:', out.beltLens.join(', '));
  /* X-Fahrt darf die Summe nicht aendern (der Riemen wandert nur von einer Seite
     zur anderen), Y-Fahrt aendert sie um das Doppelte des Weges. Beides ist richtig. */
  const xConst = out.beltLens[0] === out.beltLens[1] && out.beltLens[1] === out.beltLens[2];
  console.log('X-Fahrt laesst die Summe gleich:', xConst ? 'ja ✓' : 'NEIN');
  console.log('Y-Fahrt aendert sie um', Math.abs(out.beltLens[3] - out.beltLens[0]),
    'mm bei 150 mm Weg ->', Math.abs(out.beltLens[3] - out.beltLens[0]) === 300 ? 'doppelt ✓' : 'unerwartet');
  console.log(errs.length ? 'FEHLER: ' + errs.join(' | ') : 'keine Fehler');
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
