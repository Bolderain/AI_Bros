'use strict';
// Baut out/brett3d.html: three.js, Schriften, Szene und Betrachter inline.
const fs = require('fs');
const path = require('path');
const ROOT = __dirname, SRC = path.join(ROOT, 'src'), OUT = path.join(ROOT, 'out');
fs.mkdirSync(OUT, { recursive: true });
const read = p => fs.readFileSync(p, 'utf8');
const b64 = p => fs.readFileSync(p).toString('base64');

let html = read(path.join(SRC, 'page3d.html'));
const subst = {
  __FONT_CAVEAT__: b64(path.join(ROOT, 'caveat.woff2')),
  __FONT_PATRICK__: b64(path.join(ROOT, 'patrick.woff2')),
  __THREE__: read(path.join(ROOT, 'three.min.js')),
  __SCENE__: read(path.join(SRC, 'scene.js')),
  __VIEWER__: read(path.join(SRC, 'viewer.js')),
};
/* Erst pruefen, dann ersetzen: three.js bringt selbst Namen wie
   __THREE_DEVTOOLS__ mit, ein Scan ueber das Ergebnis wuerde daran haengen. */
for (const k of Object.keys(subst)) {
  if (!html.includes(k)) throw new Error('Platzhalter fehlt: ' + k);
}
for (const [k, v] of Object.entries(subst)) html = html.split(k).join(v);
fs.writeFileSync(path.join(OUT, 'brett3d.html'), html, 'utf8');
console.log('brett3d.html  ' + (Buffer.byteLength(html) / 1024).toFixed(0) + ' KB');
