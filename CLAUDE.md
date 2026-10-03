# CLAUDE.md

**Dieses Repo ist eine Ideensammlung, kein einzelnes Projekt.** Jede Idee liegt in
einem eigenen Ordner unter `ideen/`. Entschieden ist noch nichts — welche Idee gebaut
wird, entscheidet das Team später. Doku und Kommentare auf Deutsch.

Überblick und Stand aller Ideen: `README.md`.

## Für alle Ideen

1. Preise und nicht gemessene Werte als Schätzung kennzeichnen, Platzhalter als (P).
2. Offene Entscheidungen nicht selbst treffen. Annahme dokumentieren und markieren.
3. Keine Bauteildaten, Pinbelegungen oder Registerwerte erfinden.
4. Eine Idee wird nicht gegen eine andere ausgespielt. Wer eine Idee ausarbeitet,
   arbeitet sie aus — die Auswahl trifft das Team.

## Pflanzenautomat (`ideen/pflanzenautomat/`)

Diese Idee ist am weitesten und hat eine eigene, verbindliche Spezifikation.

**Maßgeblich: `ideen/pflanzenautomat/docs/00-spezifikation-stufe1.md`.** Deren Abschnitt 0
enthält die vollständigen Arbeitsanweisungen. Kurzfassung (bei Änderungen beide Stellen anpassen):

1. Die Spezifikation ist maßgeblich. Bei Widerspruch zwischen Code und Spezifikation nachfragen, nicht raten.
2. Pinbelegung erst nach Abgleich mit dem Board-Pinout, Strapping-Pins meiden.
3. Schwellen, Mengen und Grenzen als Parameter (Spezifikation 5.2), nie hart im Code. Ausnahme: absolute Firmware-Grenzen (5.3). (P)-Werte im Code als `TODO(P)` markieren.
4. Entscheidungslogik als reine Funktion ohne I/O in `firmware/components/plant_logic/`, auf dem Host unit-testbar. ESPHome ruft sie nur auf.
5. Secrets nur in `secrets.yaml`, per `.gitignore` ausgeschlossen.
6. Meilensteine M1 bis M5 der Reihe nach umsetzen, nicht vorgreifen.
7. Offene Entscheidungen (Spezifikation 10) nicht selbst treffen.
8. Jede empfangene Config gegen die absoluten Grenzen prüfen. Ungültige Werte verwerfen, letzte gültige Config behalten.
9. Änderungen an der Spezifikation mit neuer Versionsnummer und Eintrag in deren Abschnitt 15.
10. Fortschritt in `docs/11-meilensteine.md`, Retros in `docs/13-retros.md`.

## Magnetisches Schachbrett (`ideen/schachbrett/`)

Mechanik durchgerechnet, nichts gebaut. Entschieden ist bisher nur: **Elektromagnet,
der geschaltet wird** (kein abgesenkter Permanentmagnet), und **H-Bot** (ein Riemen).

- Idee: `ideen/schachbrett/README.md`
- Aufbau, Magnetspalt, Stückliste: `ideen/schachbrett/aufbau.md`
- Die bestimmende Regel: gefahren wird auf den Linien zwischen den Feldern, dort ist
  der Abstand zu jeder stehenden Figur genau ein halbes Feld — also Figurenbreite ≤ halbe Feldgröße.
  Diese Regel bestimmt Feldgröße, Figurendesign und Grundfläche. Nicht daran vorbeiplanen.
- `aufbau.md` und die Skizze werden **erzeugt**, nicht von Hand gepflegt:
  Quelle ist `ideen/schachbrett/video/src/bom-data.js` und `bom-doc.js`,
  Build mit `node build_bom.js && node render_bom.js`.
