'use strict';
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const PAGE = 'file:///' + path.join(__dirname, 'out', 'bom.html').split(path.sep).join('/');

(async () => {
  const b = await puppeteer.launch({ headless: true });
  for (const [scheme, name] of [['light', 'bp_light'], ['dark', 'bp_dark']]) {
    const p = await b.newPage();
    await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
    await p.setViewport({ width: 1240, height: 1200, deviceScaleFactor: 1 });
    const errs = [];
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await p.goto(PAGE, { waitUntil: 'load' });
    await p.waitForFunction('window.__ready===true', { timeout: 30000 });
    await new Promise(r => setTimeout(r, 500));
    const info = await p.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
      rows: document.querySelectorAll('tbody tr').length,
      h: document.body.scrollHeight,
    }));
    console.log(scheme, JSON.stringify(info),
      info.scrollW > info.innerW + 1 ? 'OVERFLOW' : 'ok',
      errs.length ? 'ERRORS ' + errs.join(' | ') : 'clean');
    fs.writeFileSync(path.join(__dirname, 'sheet', name + '.png'), await p.screenshot({ fullPage: true }));
    await p.close();
  }
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
