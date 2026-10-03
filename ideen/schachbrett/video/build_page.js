'use strict';
// Assembles out/index.html: fonts + timelines + engine inlined, audio stays external.
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'out');
fs.mkdirSync(OUT, { recursive: true });

const read = p => fs.readFileSync(p, 'utf8');

/* ---- pull the German chrome copy straight out of app.js so it cannot drift */
function extractUI(js) {
  const i = js.indexOf('const UI = {');
  const start = js.indexOf('{', i);
  let depth = 0, end = -1;
  for (let k = start; k < js.length; k++) {
    if (js[k] === '{') depth++;
    else if (js[k] === '}') { depth--; if (depth === 0) { end = k + 1; break; } }
  }
  // eslint-disable-next-line no-eval
  return eval('(' + js.slice(start, end) + ')');
}

const appJs = read(path.join(SRC, 'app.js'));
const UI = extractUI(appJs);

/* ---- timelines (drop the audio cue list, the page does not need it) */
const tls = {};
for (const lang of ['de', 'en']) {
  const tl = JSON.parse(read(path.join(ROOT, 'cache', `timeline_${lang}.json`)));
  delete tl.cues;
  delete tl.voice;
  tls[lang] = tl;
}
const data = 'window.TIMELINES=' + JSON.stringify(tls) + ';';

/* ---- engine */
const code = ['engine.js', 'chess.js', 'scenes.js', 'app.js']
  .map(f => '/* ===== ' + f + ' ===== */\n' + read(path.join(SRC, f)))
  .join('\n\n');

/* ---- fonts */
const b64 = p => fs.readFileSync(p).toString('base64');
const caveat = b64(path.join(ROOT, 'fonts', 'f1.woff2'));
const patrick = b64(path.join(ROOT, 'fonts', 'f2.woff2'));

/* ---- page */
let html = read(path.join(SRC, 'page.html'));
const subst = {
  __TITLE__: UI.de.title,
  __SUB__: UI.de.sub,
  __POSTER__: UI.de.poster,
  __AUDIONOTE__: UI.de.audioNote,
  __N1H__: UI.de.n1h, __N1P__: UI.de.n1p,
  __N2H__: UI.de.n2h, __N2P__: UI.de.n2p,
  __N3H__: UI.de.n3h, __N3P__: UI.de.n3p,
  __FONT_CAVEAT__: caveat,
  __FONT_PATRICK__: patrick,
  __DATA__: data,
  __APP__: code,
};
for (const [k, v] of Object.entries(subst)) {
  if (!html.includes(k)) throw new Error('placeholder missing: ' + k);
  html = html.split(k).join(v);
}
const left = html.match(/__[A-Z0-9_]+__/g);
if (left) throw new Error('unfilled placeholders: ' + left.join(', '));

fs.writeFileSync(path.join(OUT, 'index.html'), html, 'utf8');
for (const lang of ['de', 'en']) {
  fs.copyFileSync(path.join(OUT, `track_${lang}.mp3`), path.join(OUT, `track_${lang}.mp3`));
}

const kb = n => (n / 1024).toFixed(0) + ' KB';
console.log('index.html   ' + kb(Buffer.byteLength(html)));
console.log('  fonts      ' + kb(caveat.length + patrick.length));
console.log('  engine     ' + kb(Buffer.byteLength(code)));
console.log('  timelines  ' + kb(Buffer.byteLength(data)));
for (const lang of ['de', 'en']) {
  const p = path.join(OUT, `track_${lang}.mp3`);
  console.log(`track_${lang}.mp3  ` + kb(fs.statSync(p).size) + `  (${tls[lang].total}s)`);
}
