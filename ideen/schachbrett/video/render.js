'use strict';
/* Headless renderer / checker.
   node render.js check            - load the page, sweep time, report any error
   node render.js frames [lang]    - one PNG per scene + a contact sheet
   node render.js video [lang]     - full frame sequence piped straight into ffmpeg
*/
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer');

const ROOT = __dirname;
const PAGE = 'file:///' + path.join(ROOT, 'out', 'index.html').replace(/\\/g, '/');

async function open(lang) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--font-render-hinting=none',
      '--disable-lcd-text', '--force-color-profile=srgb', '--mute-audio'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1680, height: 1000, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('requestfailed', r => errors.push('requestfailed: ' + r.url().split('/').pop() + ' ' + (r.failure() || {}).errorText));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', { timeout: 30000 });
  /* stage-only layout at exactly 1600x900 */
  await page.addStyleTag({
    content: `html,body{background:#000!important;overflow:hidden}
      .wrap{max-width:none!important;margin:0!important;padding:0!important}
      header,.bar,.notes,#audioNote,#poster{display:none!important}
      .stagebox{width:1600px!important;border-radius:0!important;box-shadow:none!important}`,
  });
  await page.evaluate((l) => { window.__setLang(l); window.dispatchEvent(new Event('resize')); }, lang);
  await new Promise(r => setTimeout(r, 300));
  return { browser, page, errors };
}

async function shot(page, t) {
  await page.evaluate((tt) => new Promise((res) => {
    requestAnimationFrame(() => {
      window.__renderFrame(tt);
      requestAnimationFrame(() => requestAnimationFrame(res));
    });
  }), t);
  const el = await page.$('#stage');
  return el.screenshot({ type: 'png', captureBeyondViewport: false });
}

(async () => {
  const mode = process.argv[2] || 'check';
  const lang = process.argv[3] || 'de';
  const { browser, page, errors } = await open(lang);
  const dur = await page.evaluate('window.__duration()');
  const beats = await page.evaluate('window.TIMELINES["' + lang + '"].beats');

  if (mode === 'check') {
    const steps = 420;
    let thrown = 0;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * dur;
      const ok = await page.evaluate((tt) => {
        try { window.__renderFrame(tt); return null; }
        catch (e) { return e.message + ' @' + tt.toFixed(2); }
      }, t);
      if (ok) { console.log('THROW ' + ok); thrown++; if (thrown > 6) break; }
    }
    /* frame cost */
    const ms = await page.evaluate((d) => {
      const n = 60, t0 = performance.now();
      for (let i = 0; i < n; i++) window.__renderFrame((i / n) * d);
      return (performance.now() - t0) / n;
    }, dur);
    console.log(`duration ${dur}s  swept ${steps + 1} frames  throws=${thrown}  ~${ms.toFixed(1)} ms/frame`);
    console.log(errors.length ? 'ISSUES:\n  ' + errors.slice(0, 14).join('\n  ') : 'no console/page errors');
  }

  if (mode === 'frames') {
    const dir = path.join(ROOT, 'shots'); fs.mkdirSync(dir, { recursive: true });
    const picks = [];
    for (const b of beats) picks.push({ name: String(b.i).padStart(2, '0') + '-' + b.id, t: b.start + b.dur * 0.62 });
    /* a few extra moments worth looking at */
    picks.push({ name: '10-hook-early', t: 0.9 });
    picks.push({ name: '11-problem-hit', t: beats[3].start + beats[3].dur * 0.52 });
    picks.push({ name: '12-lines-dims', t: beats[4].start + beats[4].dur * 0.88 });
    picks.push({ name: '13-slim-jam', t: beats[5].start + beats[5].dur * 0.86 });
    picks.push({ name: '14-release-drop', t: beats[7].start + beats[7].dur * 0.74 });
    picks.push({ name: '15-outro-end', t: dur - 0.6 });
    picks.push({ name: '16-cut-hand', t: beats[2].start + 0.12 });
    for (const p of picks) {
      const buf = await shot(page, p.t);
      fs.writeFileSync(path.join(dir, `${p.name}.png`), buf);
      console.log(`${p.name}  t=${p.t.toFixed(2)}  ${(buf.length / 1024).toFixed(0)}KB`);
    }
    if (errors.length) console.log('ISSUES:\n  ' + errors.slice(0, 10).join('\n  '));
  }

  if (mode === 'at') {
    const dir = path.join(ROOT, 'shots'); fs.mkdirSync(dir, { recursive: true });
    for (const a of process.argv.slice(4)) {
      const t = parseFloat(a);
      const buf = await shot(page, t);
      fs.writeFileSync(path.join(dir, 'at_' + a.replace('.', '_') + '.png'), buf);
      console.log('at ' + a + 's  ' + (buf.length / 1024).toFixed(0) + 'KB');
    }
    if (errors.length) console.log('ISSUES: ' + errors.slice(0, 10).join(' | '));
  }

  if (mode === 'video') {
    const fps = 30;
    const n = Math.ceil(dur * fps);
    const outFile = path.join(ROOT, 'out', `chess_${lang}.mp4`);
    const audio = path.join(ROOT, 'cache', `norm2_${lang}.wav`);
    const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
      '-i', audio,
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p',
      '-x264-params', 'aq-mode=3:aq-strength=0.9',
      '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
      '-shortest', outFile]);
    ff.stderr.on('data', d => process.stderr.write(d));
    let t0 = Date.now();
    for (let i = 0; i < n; i++) {
      const buf = await shot(page, i / fps);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 120 === 0) {
        const el = (Date.now() - t0) / 1000;
        console.log(`  ${i}/${n}  ${(i / Math.max(1, el)).toFixed(1)} fps  eta ${((n - i) / Math.max(0.1, i / Math.max(1, el)) / 60).toFixed(1)} min`);
      }
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    const sz = fs.statSync(outFile).size;
    console.log(`wrote ${outFile}  ${(sz / 1048576).toFixed(1)} MB  (${n} frames)`);
    if (errors.length) console.log('ISSUES:\n  ' + errors.slice(0, 10).join('\n  '));
  }

  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
