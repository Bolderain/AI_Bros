'use strict';
// Baut out/bom.html (Artifact) und out/aufbau.md (Repo) aus einer Quelle.
const fs = require('fs');
const path = require('path');

const ROOT = __dirname, SRC = path.join(ROOT, 'src'), OUT = path.join(ROOT, 'out');
fs.mkdirSync(OUT, { recursive: true });
const read = p => fs.readFileSync(p, 'utf8');
const { KEY, STACK, BOM, BOM_OPT, SAVINGS, BUDGET } = require('./src/bom-data.js');
const { DOC } = require('./src/bom-doc.js');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* **fett** und `code` in HTML uebersetzen; fuers Markdown bleibt alles, wie es ist */
const inl = s => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/`(.+?)`/g, '<code>$1</code>');
const optSum = BOM_OPT.rows.reduce((a, r) => a + r[3], 0);

function docHtml() {
  return DOC.map(sec => {
    const body = sec.b.map(blk => {
      if (blk.t) return '<p class="prose">' + inl(blk.t) + '</p>';
      if (blk.list) return '<ul class="prose">' + blk.list.map(x => '<li>' + inl(x) + '</li>').join('') + '</ul>';
      if (blk.tab) return '<div class="tbl"><table><thead><tr>'
        + blk.tab.head.map(h => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>'
        + blk.tab.rows.map(r => '<tr>' + r.map(c => '<td class="hint">' + inl(c) + '</td>').join('') + '</tr>').join('')
        + '</tbody></table></div>';
      return '';
    }).join('\n');
    return '<h2>' + esc(sec.h) + '</h2>\n' + body;
  }).join('\n');
}

function docMd() {
  const out = [];
  for (const sec of DOC) {
    out.push('## ' + sec.h, '');
    for (const blk of sec.b) {
      if (blk.t) out.push(blk.t, '');
      else if (blk.list) { for (const x of blk.list) out.push('- ' + x); out.push(''); }
      else if (blk.tab) {
        out.push('| ' + blk.tab.head.join(' | ') + ' |');
        out.push('|' + blk.tab.head.map(() => '---').join('|') + '|');
        for (const r of blk.tab.rows) out.push('| ' + r.join(' | ') + ' |');
        out.push('');
      }
    }
  }
  return out;
}
const sum = BOM.reduce((a, g) => a + g.rows.reduce((b, r) => b + r[3], 0), 0);

/* ----------------------------------------------------------------- HTML */
const stackTbl = `<table>
<thead><tr><th>Schicht</th><th class="num">Dicke</th><th>Was und warum</th></tr></thead>
<tbody>${STACK.map(([a, b, c]) =>
  `<tr><td>${esc(a)}</td><td class="num">${esc(b)}</td><td class="hint">${esc(c)}</td></tr>`).join('')}
</tbody></table>`;

const bomTbls = BOM.concat([BOM_OPT]).map(g => {
  const gsum = g.rows.reduce((a, r) => a + r[3], 0);
  return `<div class="tbl"><table>
<caption>${esc(g.grp)}</caption>
<thead><tr><th>Pos</th><th>Bauteil</th><th class="num">Menge</th><th class="num">ca. €</th><th>Hinweis</th></tr></thead>
<tbody>${g.rows.map(r =>
    `<tr><td class="pos">${esc(r[0])}</td><td>${esc(r[1])}</td><td class="num">${esc(r[2])}</td><td class="num">${r[3]}</td><td class="hint">${esc(r[4])}</td></tr>`).join('')}
</tbody>
<tfoot><tr><td colspan="3">Zwischensumme</td><td class="num">${gsum}</td><td></td></tr></tfoot>
</table></div>`;
}).join('\n');

const saveList = SAVINGS.map(([t, d, n]) =>
  `<li><b>${esc(t)}</b><span class="d">${esc(d)}</span><p>${esc(n)}</p></li>`).join('');

const FOOT = 'Grundlage: die Mechanik-Analyse zur Projektidee in <code>ideen/schachbrett/README.md</code>. '
  + 'Die bestimmende Regel ist der halbe Feldabstand beim Fahren auf den Linien — '
  + 'daraus folgen Feldgröße, Figurenbreite und am Ende die ganze Grundfläche. '
  + 'Entschieden ist noch nichts.';

let html = read(path.join(SRC, 'bom-page.html'));
const engine = ['engine.js', 'chess.js', 'bom-data.js', 'bom-draw.js']
  .map(f => '/* ===== ' + f + ' ===== */\n' + read(path.join(SRC, f)))
  .join('\n\n')
  .replace(/\nif \(typeof module !== 'undefined'\) module\.exports[^\n]*\n/, '\n');

const b64 = p => fs.readFileSync(p).toString('base64');
const subst = {
  __FONT_CAVEAT__: b64(path.join(ROOT, 'fonts', 'f1.woff2')),
  __FONT_PATRICK__: b64(path.join(ROOT, 'fonts', 'f2.woff2')),
  __STACK__: stackTbl,
  __BOM__: bomTbls,
  __SAVE__: saveList,
  __SUM__: String(sum),
  __BUDGET__: String(BUDGET),
  __FOOT__: FOOT,
  __DOC__: docHtml(),
  __OPTSUM__: String(optSum),
  __TOTALOPT__: String(sum + optSum),
  __ENGINE__: engine,
};
for (const [k, v] of Object.entries(subst)) {
  if (!html.includes(k)) throw new Error('placeholder missing: ' + k);
  html = html.split(k).join(v);
}
const left = html.match(/__[A-Z0-9_]+__/g);
if (left) throw new Error('unfilled: ' + left.join(', '));
fs.writeFileSync(path.join(OUT, 'bom.html'), html, 'utf8');

/* ------------------------------------------------------------- Markdown */
const md = [];
md.push('# Schachbrett: Aufbau und Stückliste', '');
md.push('Stand: 04.10.2026. Gehört zur Projektidee in [`README.md`](README.md).');
md.push('Preise und nicht gemessene Werte sind **Schätzungen**, Werte mit **(P)** sind Vorschläge.');
md.push('Entschieden ist noch nichts.', '');
md.push('![Aufbau-Skizze](aufbau.png)', '');
md.push('## Kennzahlen', '');
md.push('| Größe | Wert | Bemerkung |', '|---|---|---|');
for (const [a, b, c] of KEY) md.push(`| ${a} | ${b} | ${c} |`);
md.push('');
md.push('Die bestimmende Regel: gefahren wird nur auf den Linien zwischen den Feldern.');
md.push('Dort beträgt der Abstand zu jeder stehenden Figur genau ein halbes Feld, also gilt');
md.push('`r_fahrend + r_stehend ≤ s/2` und damit **Figurenbreite ≤ halbe Feldgröße**.', '');
md.push('## Schichtaufbau von oben nach unten', '');
md.push('| Schicht | Dicke | Was und warum |', '|---|---|---|');
for (const [a, b, c] of STACK) md.push(`| ${a} | ${b} | ${c} |`);
md.push('');
md.push('Der Magnetspalt ist die Summe aus Figurenboden, Glas, Sensorlage und Luft:');
md.push('rund **8 mm**. Jeder Millimeter mehr kostet spürbar Kopplung, deshalb muss die');
md.push('Sensorlage dünn bleiben — oder ganz entfallen (siehe Sparhebel).', '');
md.push('## Stückliste', '');
md.push('Der Raspi ist laut Repo vorhanden und steht nicht in der Liste. Versand ist nicht eingerechnet.', '');
for (const g of BOM) {
  const gsum = g.rows.reduce((a, r) => a + r[3], 0);
  md.push(`### ${g.grp}`, '');
  md.push('| Pos | Bauteil | Menge | ca. € | Hinweis |', '|---|---|---|---|---|');
  for (const r of g.rows) md.push(`| ${r[0]} | ${r[1]} | ${r[2]} | ${r[3]} | ${r[4]} |`);
  md.push(`| | **Zwischensumme** | | **${gsum}** | |`, '');
}
md.push(`**Summe ca. ${sum} €** von ${BUDGET} € Budget, Reserve ca. ${BUDGET - sum} € (Schätzung, ohne Versand).`, '');
md.push('', `### ${BOM_OPT.grp}`, '');
md.push('Noch nicht entschieden, deshalb getrennt gerechnet.', '');
md.push('| Pos | Bauteil | Menge | ca. € | Hinweis |', '|---|---|---|---|---|');
for (const r of BOM_OPT.rows) md.push(`| ${r[0]} | ${r[1]} | ${r[2]} | ${r[3]} | ${r[4]} |`);
md.push(`| | **Zwischensumme** | | **${optSum}** | |`, '');
md.push(`Mit Option **ca. ${sum + optSum} €**, Reserve dann nur noch ca. ${BUDGET - sum - optSum} €.`);
md.push('Dann wird es Zeit, bei der Zugerkennung von Hall auf Reed zu gehen oder die Kamera-Variante ernsthaft zu rechnen.', '');
md.push('## Wo man sparen kann', '');
md.push('| Hebel | Ersparnis | Preis dafür |', '|---|---|---|');
for (const [t, d, n] of SAVINGS) md.push(`| ${t} | ${d} | ${n} |`);
md.push('');
md.push(...docMd());
md.push('## Offene Punkte', '');
md.push('- Sensorlage oder Kamera? Das entscheidet den Magnetspalt und einen großen Teil der Software.');
md.push('- Feldgröße 50 mm fixieren, bevor Glas und Wellen bestellt werden — davon hängt alles ab.');
md.push('- Spulenstrom und Haltekraft messen, bevor 32 Figuren gedruckt werden.');
md.push('- Einschaltdauer der Spule im Dauerbetrieb prüfen (geschätzt ≈ 5 %, damit unkritisch).');
md.push('- Stört die Stahlscheibe im Fuß den NFC-Tag? Zwei Muster bauen, bevor 32 Figuren gedruckt werden.');
md.push('- Maia über lc0 auf ARM bauen — oder erst mit Stockfish ohne Dame anfangen?');
md.push('');
fs.writeFileSync(path.join(OUT, 'aufbau.md'), md.join('\n'), 'utf8');

console.log('bom.html   ' + (Buffer.byteLength(html) / 1024).toFixed(0) + ' KB');
console.log('aufbau.md  ' + (Buffer.byteLength(md.join('\n')) / 1024).toFixed(1) + ' KB');
console.log('Summe ' + sum + ' € von ' + BUDGET + ' €, Reserve ' + (BUDGET - sum) + ' €');
