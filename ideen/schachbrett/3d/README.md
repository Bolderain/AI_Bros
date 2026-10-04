# Mechanik in 3D

Drehbares Modell der Brettmechanik. Nur Mechanik, keine Software.
Live: https://claude.ai/code/artifact/bccf5411-3ea9-42d5-b325-82ae12d8748a

Alle Maße stammen aus [`../aufbau.md`](../aufbau.md) und stehen in `src/scene.js`
ganz oben in `MM` — wer dort die Feldgröße ändert, ändert das ganze Modell.

| Befehl | Was es tut |
|---|---|
| `node build_3d.js` | baut `out/brett3d.html` (three.js, Schriften, Szene inline) |
| `node check.js` | prüft die H-Bot-Kinematik numerisch |
| `node shot3d.js` | rendert Ansichten nach `shots/` |
| `node shotpage.js` | ganze Seite, hell und dunkel, plus Telefon |

Für `check.js`, `shot3d.js` und `shotpage.js` wird Puppeteer gebraucht: `npm install`.
`build_3d.js` läuft mit Node allein.

| Datei | Inhalt |
|---|---|
| `src/scene.js` | das Modell: Maße, Bauteile, Riemenverlauf, Explosionsansicht |
| `src/viewer.js` | Kamera, Orbit, Beschriftungen, die drei Abläufe |
| `src/page3d.html` | Seitengerüst und Bedienfeld |

three.js r149, MIT-Lizenz, liegt als `three.min.js` bei.
