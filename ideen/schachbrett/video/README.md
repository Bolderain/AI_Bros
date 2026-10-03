# Erklärvideo und Aufbau-Skizze: magnetisches Schachbrett

Gehört zur Projektidee in [`../README.md`](../README.md).
Zwei Ergebnisse, beide aus denselben Zeichenwerkzeugen:

| Was | Datei | Live |
|---|---|---|
| Erklärvideo, 59 s DE / 53 s EN | `out/index.html`, `out/chess_de.mp4`, `out/chess_en.mp4` | https://claude.ai/code/artifact/b4840d0f-a8fe-4233-986c-738f61f5fc86 |
| Aufbau und Stückliste | `out/bom.html`, [`../aufbau.md`](../aufbau.md) | https://claude.ai/code/artifact/7f7f8a05-82b5-478d-a66a-a56571700903 |

Alles wird erzeugt: Grafik ist reines Canvas-2D ohne eine einzige Bilddatei,
Musik und Geräusche sind synthetisiert, die Stimme kommt von einem neuronalen TTS.

## Pipeline

| Schritt | Befehl | Ergebnis |
|---|---|---|
| 1. Stimme | `py tts.py` (Netz) oder `py tts.py de --reuse` (offline aus `audio/`) | `cache/narration_<lang>.json` |
| 2. Musik, Geräusche, Mix | `node build_audio.js` | `cache/master_<lang>.wav`, `cache/timeline_<lang>.json` |
| 3. Lautheit und MP3 | siehe unten | `cache/norm2_<lang>.wav`, `out/track_<lang>.mp3` |
| 4. Videoseite bauen | `node build_page.js` | `out/index.html` |
| 5. Prüfen | `node render.js check de` | Zeitachse abfahren, Fehler und ms/Frame |
| 6. Einzelbilder | `node render.js at de 27.0 44.9` | PNGs in `shots/` |
| 7. Video | `node render.js video de` | `out/chess_<lang>.mp4`, 1600 × 900, 30 fps |
| 8. Aufbau-Seite | `node build_bom.js` dann `node render_bom.js` | `out/bom.html`, `out/aufbau.{md,png}` |
| 9. Ende-zu-Ende | `node serve_test.js`, `node mobile_test.js` | Wiedergabe über HTTP, Telefon-Layout |

Schritt 3, zweistufiges `loudnorm` auf −16 LUFS / −1,5 dBTP, je Sprache:

```sh
M=$(ffmpeg -i cache/master_de.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
# input_i / input_tp / input_lra / input_thresh daraus in den zweiten Lauf, linear=true
```

Für die Schritte 5 bis 9 wird Puppeteer gebraucht: `npm install`.
Schritte 1 bis 4 und 8 laufen mit Node und ffmpeg allein.

## Wo was steckt

| Datei | Inhalt |
|---|---|
| `script.json` | Sprechertext, zeilenweise, mit Pausen. **Hier ändert man den Inhalt.** |
| `src/engine.js` | Zeichen-Grundlagen: Hash-Rauschen, Skizzenstriche, Papier, Risskanten, Schraffur, Körnung |
| `src/chess.js` | Brett, Figuren, Kamera und der Linienrouter `linePath` |
| `src/scenes.js` | die zehn Szenen, Beschriftungen beider Sprachen in `STR` |
| `src/app.js` | Abspieler, Untertitel, Papierschnitte, Bedienleiste, Seitentexte in `UI` |
| `src/bom-data.js` | **Stückliste und Kennzahlen** — eine Quelle für Skizze, HTML und Markdown |
| `src/bom-draw.js` | die Aufbau-Skizze |
| `lib/synth.js` | Instrumente und Geräusche, u. a. `switchClick` und `coilHum` |
| `build_audio.js` | Arrangement (`SECTIONS`, `PHRASES`) und die Geräusch-Choreografie |

## Wenn der Text geändert wird

`script.json` anpassen, dann Schritt 1 bis 4. Die Zeitachse wird neu berechnet;
Animation und Geräusche hängen beide an denselben Zeilenzeiten, die Szenen
dehnen sich also mit. Deutsch muss unter 60 s bleiben.

Alles ist deterministisch: `render(t)` liefert für dasselbe `t` immer dasselbe
Bild — gehashtes Rauschen statt `Math.random`. Deshalb kann man die Zeitachse
scrubben und offline Bild für Bild rendern.

## Nicht im Repo

`cache/*.wav` (rund 60 MB), `audio/*/pcm/` und `node_modules/` sind per
`.gitignore` ausgenommen. Die Wavs erzeugt Schritt 2 neu, das PCM
`py tts.py <lang> --reuse` aus den mitgelieferten Original-mp3s in `audio/`.
