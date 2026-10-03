'use strict';
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const PAGE = 'file:///' + path.join(__dirname, 'out', 'index.html').split(path.sep).join('/');

(async () => {
  const b = await puppeteer.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  for (const [scheme, name] of [['light', 'page_light'], ['dark', 'page_dark']]) {
    const p = await b.newPage();
    await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
    await p.setViewport({ width: 1280, height: 1100, deviceScaleFactor: 1 });
    const errs = [];
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    p.on('requestfailed', r => errs.push('reqfail: ' + r.url().split('/').pop()));
    await p.goto(PAGE, { waitUntil: 'networkidle0' });
    await p.waitForFunction('window.__ready===true', { timeout: 30000 });
    await new Promise(r => setTimeout(r, 1600));
    const state = await p.evaluate(() => ({
      audioReady: !!(window.App || {}),
      dur: window.__duration(),
      time: document.getElementById('time').textContent,
      play: document.getElementById('btnPlay').textContent.trim(),
      noteHidden: document.getElementById('audioNote').hidden,
      canvasW: document.getElementById('stage').width,
    }));
    console.log(scheme, JSON.stringify(state), errs.length ? ('ERRORS ' + errs.join(' | ')) : 'clean');
    fs.writeFileSync(path.join(__dirname, 'shots', name + '.png'), await p.screenshot({ fullPage: true }));
    await p.close();
  }
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
