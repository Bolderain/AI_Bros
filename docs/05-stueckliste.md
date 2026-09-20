# 05 Stückliste (Stufe 1)

Alle Preise sind **Schätzungen, Stand September 2026**, Brutto, ohne Versand. Vor dem
Bestellen prüfen. Suchergebnisse zeigten für Peristaltikpumpen 9 bis 15 Euro, für den Pi Zero 2 W
16 bis 20 Euro bei schlechter Verfügbarkeit; die übrigen Werte sind Erfahrungswerte.

Bezugsquellen: Berrybase und Reichelt (DE, 1 bis 3 Tage), AZ-Delivery (DE, Sets), AliExpress
(2 bis 4 Wochen, ca. halber Preis bei Modulen, Qualität streut). Empfehlung: Kernteile
(ESP, Sensoren mit Markenherkunft, Akku) in DE kaufen, Verbrauchsteile (Pumpen, Schlauch,
MOSFET-Module, Schwimmerschalter) parallel bei AliExpress als Reserve.

## A. Gerät am Topf

| Nr | Teil | Menge | Preis DE (Schätzung) | Preis Ali (Schätzung) | Bemerkung |
|---|---|---|---|---|---|
| A1 | Seeed XIAO ESP32-C6 | 1 | 10 | 8 | Alternativ XIAO ESP32-C3 (ohne Zigbee, ähnlich) |
| A2 | Bodenfeuchtesensor DFRobot SEN0308 (kapazitiv, IP65) | 1 | 15 | | Alternativ generischer v2.0 für 3 Euro, Kante versiegeln |
| A3 | DS18B20 wasserdicht mit Kabel | 1 | 3 | 1,5 | |
| A4 | SHT40 Breakout (I2C) | 1 | 5 | 3 | oder BME280 |
| A5 | BH1750 Breakout (I2C) | 0 | - | - | Gestrichen, siehe `15-messintervalle.md`. Nur einbauen, wenn ein Lichtlog ausdrücklich gewünscht ist |
| A6 | Li-Ion 18650 3500 mAh mit Schutzschaltung | 1 | 8 | | In DE kaufen |
| A7 | 18650-Halter mit Kabel | 1 | 2 | 1 | |
| A8 | Boost-Modul 5 V mit Enable (TPS61023 oder MT3608) | 1 | 4 | 1,5 | |
| A9 | Load-Switch oder P-MOSFET für Sensorversorgung | 1 | 2 | 1 | |
| A10 | N-MOSFET-Modul (Logic Level) für Pumpen | 2 | 4 | 2 | |
| A11 | Peristaltikpumpe 5/6 V (Dünger) | 1 | 15 | 7 | |
| A12 | Mini-Tauchpumpe 3 bis 6 V (Wasser) | 1 | 5 | 2 | Ersatz mitbestellen |
| A13 | Schwimmerschalter (Tank halb, Tank leer, Dünger leer) | 3 | 9 | 4 | |
| A14 | Silikonschlauch 4/6 mm, 3 m | 1 | 6 | 3 | Lebensmittelecht |
| A15 | Rückschlagventil 6 mm | 1 | 2 | 1 | |
| A16 | Tropfring / Tropfer | 1 | 3 | 2 | oder selbst aus Schlauch |
| A17 | Düngerbehälter 150 ml (Flasche mit Deckel, Bohrung) | 1 | 2 | | |
| A18 | Wasserkanister 5 l mit Bohrung im Deckel | 1 | 6 | | Baumarkt |
| A19 | Lochrasterplatine, Stiftleisten, JST-Stecker, Kabel | 1 Set | 10 | 5 | |
| A20 | 3D-Druck Gehäuse, PETG auf dem Bambu A1 Mini | ca. 200 g | 8 | | Für den integrierten Tank (Stufe 1b) nochmal ca. 300 g plus Epoxid |
| A21 | Kleinteile: Epoxid, Heißkleber, Kabelbinder, Dichtungen | | 10 | | |
| | **Summe Gerät** | | **ca. 129** | | |

## B. Zentrale

| Nr | Teil | Menge | Preis (Schätzung) | Bemerkung |
|---|---|---|---|---|
| B1 | Raspberry Pi Zero 2 W (oder vorhandener Pi 3/4) | 1 | 20 | Verfügbarkeit im Sep 2026 schlecht, alternativ vorhandenen Pi nehmen, 0 Euro |
| B2 | microSD 32 GB | 1 | 8 | |
| B3 | Netzteil 5 V USB | 1 | 8 | |
| B4 | Gehäuse | 1 | 5 | |
| | **Summe Zentrale** | | **ca. 41** | |

## C. Werkzeug und Verbrauch (falls nicht vorhanden)

| Teil | Preis (Schätzung) |
|---|---|
| Multimeter, Lötkolben | vorhanden laut Team |
| USB-Strommessgerät oder INA219-Modul für Ruhestrommessung | 5 |
| EC-Messstift für Drainwasser (manuelle Kontrolle) | 15 |
| Flüssigdünger (z. B. universeller Grünpflanzendünger NPK 7-3-6) | 5 |
| **Summe** | **ca. 25** |

## Budgetcheck

| Block | Betrag |
|---|---|
| A Gerät | 129 |
| B Zentrale | 41 |
| C Werkzeug | 25 |
| **Zwischensumme** | **195** |
| Reserve für Fehlkäufe, Ersatzteile, Versand | 60 |
| **Gesamt** | **ca. 255 von 300 Euro** |

Nicht im Budget von Stufe 1: pH- und EC-Sonden für Hydroponik (ca. 85 Euro zusammen),
Kamera (ca. 15 bis 30 Euro), weitere Geräte für Stufe 2 (ca. 90 Euro je Topf ohne Zentrale).

## Bestellreihenfolge

1. Sofort (Iteration 0): A1 bis A5, A10, A12, A19. Damit läuft der Breadboard-Aufbau.
2. Nach erstem Test (Iteration 1): A6 bis A9, A11, A13 bis A18.
3. Wenn Gehäuseform steht (Iteration 4): A20, A21.
