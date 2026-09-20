# 05 Stückliste

Alle Preise sind **Schätzungen, Stand September 2026**, Brutto, ohne Versand. Vor dem Bestellen
prüfen. Bezugsquellen: Berrybase, Reichelt, AZ-Delivery (DE, 1 bis 3 Tage), AliExpress
(2 bis 4 Wochen, ca. halber Preis, Qualität streut).

Grundsatz für den Anfang: **steckbar statt gelötet**. Großes ESP32-DevKit mit Pins, Breadboard,
Module mit Stiftleisten oder Schraubklemmen. Kein Akku, Betrieb am USB-Netzteil. Zentrale ist
der **vorhandene Raspi** (kein Kauf). Löten erst, wenn es wirklich nötig ist.

## A. Prototyp (Iteration 1 bis 3, Breadboard, kein Löten)

| Nr | Teil | Menge | Preis DE | Bemerkung |
|---|---|---|---|---|
| P1 | ESP32-C6-DevKitC-1 (oder ESP32-WROOM-DevKit) | 1 | 10 bis 12 | Großes Board mit Pins, breadboard-tauglich, USB dran. Gleiche Chip-Familie wie das spätere XIAO |
| P2 | Breadboard 830 Punkte | 1 | 5 | Alles steckbar |
| P3 | Jumperkabel-Set (m/m, m/w, w/w) | 1 | 6 | Verbindungen |
| P4 | Kapazitiver Bodenfeuchtesensor (mit Kabel/Stecker) | 1 | 15 | Pflicht, steuert das Gießen. Alternativ generischer v2.0 für 3 Euro, Kante versiegeln |
| P5 | DS18B20 wasserdicht (konfektioniert) | 1 | 3 | Optional, Substrattemperatur, nur bei kaltem Standort nützlich |
| P6 | SHT40-Breakout (I2C, mit Stiftleiste) | 1 | 5 | Optional, Luft T/rF als Tageswert |
| P7 | Pumpentreiber-Modul mit Schraubklemmen (MOSFET) | 2 | 4 | Statt MOSFET löten: Pumpe einklemmen, Steuerpin stecken |
| P8 | Boost-Modul 5 V (mit Stiftleisten) | 1 | 4 | 5 V für die Pumpen |
| P9 | Mini-Tauchpumpe 3 bis 6 V (Wasser) | 1 | 5 | Ersatz mitbestellen |
| P10 | Peristaltikpumpe 5/6 V (Dünger) | 1 | 15 | Dosiert exakt, selbstansaugend |
| P11 | Schwimmerschalter (Tank halb, Tank leer, Dünger leer) | 3 | 9 | Füllstände, reine Schalter |
| P12 | Silikonschlauch 4/6 mm, Rückschlagventil, Tropfring | 1 | 11 | Wasserweg |
| P13 | Wasserkanister 5 l, Düngerbehälter 150 ml | 1 | 8 | Vorrat |
| P14 | USB-Netzteil 5 V | 1 | 6 | Kein Akku in dieser Phase |
| | **Summe Prototyp** | | **ca. 110 bis 115** | Ohne DS18B20 und SHT40: ca. 102 |

Zentrale: vorhandener Raspi, microSD ggf. 8 Euro. Werkzeug: INA219 oder USB-Strommesser
(ca. 5 Euro) erst ab Iteration 4 nötig (Ruhestrom messen). Flüssigdünger ca. 5 Euro.

## B. Zielversion (ab Iteration 4, gelötet, mit Akku)

Wenn die steckbare Schaltung läuft, wandert dieselbe Verdrahtung auf Lochraster oder eigene
Platine und ins Gehäuse. Dann kommen dazu:

| Teil | Preis DE | Zweck |
|---|---|---|
| Seeed XIAO ESP32-C6 | 10 | Kleines Zielboard, Akku-Ladeschaltung integriert |
| Li-Ion 18650 3500 mAh + Halter | 10 | Stromspeicher |
| Load-Switch / P-MOSFET Sensorversorgung | 2 | Sensoren im Schlaf trennen, Ruhestrom senken |
| Lochraster, Stiftleisten, JST, Kabel | 10 | Fester Aufbau |
| 3D-Druck Gehäuse PETG (Bambu A1 Mini) | 8 | Hülle im Flaschenformat |
| Kleinteile (Epoxid, Kabelbinder, Dichtung) | 10 | Vergießen, Abdichten |
| **Zusatz Zielversion** | **ca. 50** | |

Optionaler Ausbau (siehe `06-stromversorgung.md`): TPL5110-Timer (ca. 3, Ruhestrom unter 1 µA),
Solarzelle 1 W + MPPT-Lader (ca. 12, macht Laden überflüssig).

## Budgetcheck

| Block | Betrag |
|---|---|
| A Prototyp | ca. 115 |
| B Zusatz Zielversion | ca. 50 |
| Werkzeug, Dünger, microSD | ca. 20 |
| **Zwischensumme** | **ca. 185** |
| Reserve (Fehlkäufe, Ersatz, Versand) | 60 |
| **Gesamt** | **ca. 245 von 300 Euro** |

Zentrale kostet 0 (Raspi vorhanden). Nicht im Budget: pH/EC-Sonden für Hydroponik (Stufe 3),
Kamera, weitere Geräte für Stufe 2.

## Bestellreihenfolge

1. Sofort (Iteration 0): P1 bis P4, P7, P8, P9, P14. Damit läuft der Breadboard-Aufbau.
2. Nach erstem Test (Iteration 1): P5, P6, P10 bis P13.
3. Ab Iteration 4: Block B (Löten, Akku, Gehäuse).
