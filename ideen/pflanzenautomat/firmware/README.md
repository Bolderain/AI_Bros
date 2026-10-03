# Firmware

ESPHome (`esp32: variant: esp32c6`) mit eigener Logik-Komponente. Noch leer, Inhalte ab M1.

| Pfad | Inhalt |
|---|---|
| `*.yaml` | ESPHome-Konfiguration |
| `secrets.yaml` | WLAN- und MQTT-Zugangsdaten, per `.gitignore` ausgeschlossen |
| `components/plant_logic/` | Entscheidungslogik als reine Funktion ohne I/O |
| `test/` | Unit-Tests der Logik auf dem Host |

Maßgeblich: `../docs/00-spezifikation-stufe1.md`, Abschnitte 0, 5 bis 7. Hintergrund:
`../docs/07-firmware-konzept.md`.
