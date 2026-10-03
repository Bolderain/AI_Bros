'use strict';
/* End-to-end: serve out/ over HTTP the way the artifact host does, press play,
   and confirm the audio stream drives the animation clock. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const DIR = path.join(__dirname, 'out');
const TYPES = { '.html': 'text/html; charset=utf-8', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4' };

const server = http.createServer((req, res) => {
  const name = decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '') || 'index.html';
  const file = path.join(DIR, name);
  if (!file.startsWith(DIR) || !fs.existsSync(file)) { res.writeHead(404); return res.end('no'); }
  const body = fs.readFileSync(file);
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
    'Content-Length': body.length,
    'Accept-Ranges': 'bytes',
  });
  res.end(body);
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const b = await puppeteer.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  p.on('requestfailed', r => errs.push('reqfail: ' + r.url().split('/').pop() + ' ' + (r.failure() || {}).errorText));
  const served = [];
  p.on('response', r => served.push(r.status() + ' ' + r.url().split('/').pop()));

  await p.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle0' });
  await p.waitForFunction('window.__ready===true', { timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));

  await p.click('#poster');
  await new Promise(r => setTimeout(r, 4000));
  const mid = await p.evaluate(() => {
    const a = document.querySelector('audio') || null;
    return {
      currentTime: window.App ? null : null,
      t: document.getElementById('time').textContent,
      fill: document.getElementById('scrubFill').style.width,
      posterHidden: document.getElementById('poster').hidden,
      noteHidden: document.getElementById('audioNote').hidden,
      play: document.getElementById('btnPlay').textContent.trim(),
    };
  });
  console.log('after 4s of playback:', JSON.stringify(mid));
  fs.writeFileSync(path.join(__dirname, 'shots', 'http_playing.png'),
    await p.$eval('#stage', el => el).then(() => p.screenshot({ clip: { x: 50, y: 120, width: 1180, height: 664 } })));

  /* language switch while playing */
  await p.click('#btnEN');
  await new Promise(r => setTimeout(r, 2500));
  const after = await p.evaluate(() => ({
    t: document.getElementById('time').textContent,
    title: document.getElementById('pageTitle').textContent,
    lang: document.documentElement.lang,
    noteHidden: document.getElementById('audioNote').hidden,
  }));
  console.log('after switching to EN:', JSON.stringify(after));
  console.log('served:', served.filter(s => !s.includes('index.html')).join(', ') || '(only the page)');
  console.log(errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no errors');

  await b.close();
  server.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
