# 07 Firmware-Konzept

Maßgeblich: `00-spezifikation-stufe1.md`, Abschnitte 0 und 5 bis 7. Hier Aufbau und Begründung.

## Ansatz: ESPHome plus eigene Logik-Komponente

| Teil | Aufgabe |
|---|---|
| ESPHome (`esp32: variant: esp32c6`) | Treiber (ADC, HX711, Pumpenausgänge), WLAN, MQTT, SNTP, OTA, Deep Sleep, Persistenz über `globals` mit `restore_value` |
| `firmware/components/plant_logic/` | Reine Entscheidungsfunktion ohne I/O. Bekommt Messwerte, Zähler, Zeitstatus und Config, liefert Aktionen (gießen, düngen, sperren) und Events |
| `firmware/test/` | Unit-Tests von `plant_logic` auf dem Host (T16) |

Warum so: ESPHome nimmt die Treiberarbeit ab, M1 läuft damit schnell. Die eigentliche Intelligenz
und die Sicherheitslogik sind gekapselt und ohne Hardware testbar. Daran arbeiten die
Embedded-Entwickler (Rolle B). Eine komplett eigene ESP-IDF-Firmware, wie früher geplant, entfällt
für Stufe 1. Sie bleibt Option, falls ESPHome in Stufe 2 an Grenzen stößt.

## Zyklus (Kurzform von Spezifikation 5.1)

Sonde an, 10 Messungen mitteln, Sonde aus. Wiegen, nie während eines Pumpenlaufs. WLAN, Zeit, MQTT,
Config validieren. Plausibilität prüfen. Ohne gültige Zeit Notbetrieb. Einmal täglich im
Gießfenster entscheiden. Gießen als Wasser, Dünger, Wasser mit Wiegen vor und nach jedem Lauf.
Publizieren, warten oder schlafen.

## Grundregeln

- Alle Schwellen und Mengen als Parameter (Spezifikation 5.2), (P)-Werte im Code als `TODO(P)`.
- Absolute Grenzen fest im Code (5.3). Config außerhalb wird verworfen, Event `config_rejected`.
- Persistenz von Zählern, Sperren, fälliger Düngung und letzter gültiger Config (5.4), Flash-
  Schreibhäufigkeit begrenzen.
- Notbetrieb ohne gültige Zeit (5.5).
- Pumpen nur über eine zentrale Funktion mit Timeout, Watchdog, Eingänge beim Reset LOW (5.6).
- Pinbelegung erst nach Abgleich mit dem Board-Pinout, Strapping-Pins meiden.
- Secrets nur in `secrets.yaml`.

## Erweiterbarkeit

Das Muster "reine Entscheidungsfunktion plus ESPHome-Treiber" trägt auch die späteren Stufen: je
Anwendung eine eigene Logikfunktion mit denselben Test- und Sicherheitsregeln, zum Beispiel eine
Feuchte- und CO2-Regelung für die Pilzbox (Stufe 5). Mehrere Töpfe (Stufe 3) bedeuten eine
`plant_logic`-Instanz pro Topf.

## Stufe 2

Deep Sleep bis Uhrzeit (`deep_sleep.enter` mit `until` und SNTP), `ota_hold` für OTA, retained
Befehle mit ID und Quittung, Peripherie im Schlaf abschalten (DRV8833 nSLEEP, HX711 Power-Down,
Sonde stromlos), Pause zwischen den Portionen im Light Sleep. Messstrategie in `15`.

## Reihenfolge

Nach den Meilensteinen M1 bis M5 (`11-meilensteine.md`), nicht vorgreifen. Die Unit-Tests für
`plant_logic` dürfen schon während M1 und M2 entstehen, weil sie keine Hardware brauchen.
