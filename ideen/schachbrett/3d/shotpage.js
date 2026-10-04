'use strict';
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const PAGE = 'file:///' + path.join(__dirname, 'out', 'brett3d.html').split(path.sep).join('/');

(async () => {
  const b = await puppeteer.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
      '--disable-gpu-sandbox', '--force-color-profile=srgb'],
  });
  for (const [scheme, w, h, name] of [['light', 1280, 1000, 'page_light'],
    ['dark', 1280, 1000, 'page_dark'], ['light', 420, 900, 'page_phone']]) {
    const p = await b.newPage();
    await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
    await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 600 });
    const errs = [];
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await p.goto(PAGE, { waitUntil: 'load' });
    await p.waitForFunction('window.__ready === true', { timeout: 45000 });
    await p.evaluate(() => window.__setTime(3.2));
    await new Promise(r => setTimeout(r, 900));
    const info = await p.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
      gl: document.getElementById('gl').width,
    }));
    console.log(name, JSON.stringify(info),
      info.scrollW > info.innerW + 1 ? 'UEBERLAUF' : 'ok',
      errs.length ? 'FEHLER ' + errs.join(' | ') : 'sauber');
    fs.writeFileSync(path.join(__dirname, 'shots', name + '.png'),
      await p.screenshot({ fullPage: true }));
    await p.close();
  }
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
