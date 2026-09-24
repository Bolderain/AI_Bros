# CLAUDE.md

Projekt: Pflanzenautomat (Smart Plant Care). Doku und Kommentare auf Deutsch.

**Maßgebliche Spezifikation: `docs/00-spezifikation-stufe1.md`.** Deren Abschnitt 0 enthält die
Arbeitsanweisungen. Kurzfassung (bei Änderungen beide Stellen anpassen):

1. Die Spezifikation ist maßgeblich. Bei Widerspruch zwischen Code und Spezifikation nachfragen, nicht raten.
2. Keine Bauteildaten, Pinbelegungen oder Registerwerte erfinden. Pinbelegung erst nach Abgleich mit dem Board-Pinout, Strapping-Pins meiden.
3. Schwellen, Mengen und Grenzen als Parameter (Spezifikation 5.2), nie hart im Code. Ausnahme: absolute Firmware-Grenzen (5.3). (P)-Werte im Code als `TODO(P)` markieren.
4. Entscheidungslogik als reine Funktion ohne I/O in `firmware/components/plant_logic/`, auf dem Host unit-testbar. ESPHome ruft sie nur auf.
5. Secrets nur in `secrets.yaml`, per `.gitignore` ausgeschlossen.
6. Meilensteine M1 bis M5 der Reihe nach umsetzen, nicht vorgreifen.
7. Offene Entscheidungen (Spezifikation 10) nicht selbst treffen. Annahme dokumentieren und markieren.
8. Jede empfangene Config gegen die absoluten Grenzen prüfen. Ungültige Werte verwerfen, letzte gültige Config behalten.

Repo-Konventionen:

- Preise und nicht gemessene Werte als Schätzung kennzeichnen, Platzhalter als (P).
- Änderungen an der Spezifikation mit neuer Versionsnummer und Eintrag in deren Abschnitt 15.
- Fortschritt in `docs/11-meilensteine.md`, Retros in `docs/13-retros.md`.
