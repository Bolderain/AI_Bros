'use strict';
// Rendert Ansichten der 3D-Seite zur Sichtkontrolle.
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const PAGE = 'file:///' + path.join(__dirname, 'out', 'brett3d.html').split(path.sep).join('/');

const VIEWS = [
  ['01-uebersicht', -0.70, 1.14, 1000, 'move', 3.4, 0, null],
  ['02-explosion',  -0.70, 1.10, 1150, 'idle', 0, 1, null],
  ['03-unten',      -0.90, 1.95,  980, 'axisX', 1.4, 0, null],
  ['04-ohne-glas',  -0.70, 0.95,  880, 'move', 3.0, 0, 'glass'],
  ['05-riemen',     -0.70, 0.30,  900, 'axisX', 1.4, 0, 'glass'],
  ['06-magnet-nah', -0.85, 1.05,  380, 'move', 3.0, 0, 'glass'],
];

(async () => {
  const b = await puppeteer.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
      '--disable-gpu-sandbox', '--force-color-profile=srgb'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(PAGE, { waitUntil: 'load' });
  await p.waitForFunction('window.__ready === true', { timeout: 45000 });
  await new Promise(r => setTimeout(r, 600));

  const info = await p.evaluate(() => {
    const cv = document.getElementById('gl');
    const gl = cv.getContext('webgl2') || cv.getContext('webgl');
    return { webgl: !!gl, w: cv.width, h: cv.height,
      renderer: gl ? (gl.getParameter(gl.VERSION) || '') : 'kein WebGL' };
  });
  console.log('WebGL:', JSON.stringify(info));

  const dir = path.join(__dirname, 'shots');
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, th, ph, d, mode, t, ex, hide] of VIEWS) {
    await p.evaluate((th, ph, d, mode, t, ex, hide) => {
      window.__setCam(th, ph, d);
      window.__setMode(mode);
      window.__explode(ex);
      window.__toggle('glass', hide !== 'glass');
      window.__setTime(t);
    }, th, ph, d, mode, t, ex, hide);
    await p.evaluate(() => new Promise(r =>
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    const el = await p.$('.stage');
    fs.writeFileSync(path.join(dir, name + '.png'), await el.screenshot({ type: 'png' }));
    console.log('  ' + name);
  }
  console.log(errs.length ? 'FEHLER: ' + errs.slice(0, 8).join(' | ') : 'keine Fehler');
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
