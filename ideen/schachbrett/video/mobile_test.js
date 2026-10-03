'use strict';
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const PAGE = 'file:///' + path.join(__dirname, 'out', 'index.html').split(path.sep).join('/');

(async () => {
  const b = await puppeteer.launch({ headless: true, args: ['--mute-audio'] });
  for (const [w, h, dpr, name] of [[390, 844, 3, 'phone'], [820, 1180, 2, 'tablet']]) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: h, deviceScaleFactor: dpr, isMobile: true });
    await p.goto(PAGE, { waitUntil: 'load' });
    await p.waitForFunction('window.__ready===true', { timeout: 30000 });
    await p.evaluate(() => new Promise((res) => {
      requestAnimationFrame(() => {
        window.__renderFrame(13.4);          // a long German caption
        requestAnimationFrame(() => requestAnimationFrame(res));
      });
    }));
    const info = await p.evaluate(() => {
      const cv = document.getElementById('stage');
      return { cssW: cv.clientWidth, bufW: cv.width, scrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth };
    });
    console.log(name, JSON.stringify(info),
      info.scrollW > info.innerW + 1 ? 'HORIZONTAL OVERFLOW' : 'no overflow');
    fs.writeFileSync(path.join(__dirname, 'shots', 'm_' + name + '.png'),
      await p.$eval('#stage', () => true).then(() => p.$('#stage')).then(el => el.screenshot()));
    await p.close();
  }
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
