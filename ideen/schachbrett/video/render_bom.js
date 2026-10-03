'use strict';
// Rendert die Skizze aus out/bom.html als PNG für das Repo.
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const PAGE = 'file:///' + path.join(__dirname, 'out', 'bom.html').split(path.sep).join('/');

(async () => {
  const b = await puppeteer.launch({ headless: true, args: ['--force-color-profile=srgb'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1700, height: 1400, deviceScaleFactor: 1 });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(PAGE, { waitUntil: 'load' });
  await p.waitForFunction('window.__ready === true', { timeout: 30000 });
  await p.addStyleTag({ content: '.wrap{max-width:none!important;padding:0!important}figure{box-shadow:none!important;border-radius:0!important}header,h2,p.note,.tbl,.total,ul.save,footer{display:none!important}' });
  await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const el = await p.$('#sketch');
  fs.writeFileSync(path.join(__dirname, 'out', 'aufbau.png'), await el.screenshot({ type: 'png' }));
  console.log('png written', errs.length ? 'ISSUES: ' + errs.join(' | ') : 'clean');

  /* ganze Seite zur Sichtkontrolle */
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
