# 05 Stückliste, Kauf und Budget

Maßgeblich für Stufe 1: `00-spezifikation-stufe1.md`, Abschnitt 4 (H01 bis H12). Hier stehen
Kaufkriterien, Bestellreihenfolge und das Budget über alle Stufen.

Preise sind Schätzungen, Stand 09/2026, ohne Versand. Bezugsquellen: Berrybase, Reichelt,
AZ-Delivery (DE, 1 bis 3 Tage), AliExpress (2 bis 4 Wochen, günstiger, Qualität streut).

## Kaufkriterien für "kein Löten" (R13)

| Teil | Worauf achten |
|---|---|
| H01 FireBeetle 2 ESP32-C6 | Stiftleisten liegen lose bei (laut Händlerangaben 2 × 20-pol.). Entweder einmal anlöten oder für Stufe 1 ein fertig bestiftetes Board, Entscheidung E10 |
| H02 Kapazitive Sonde | v1.2 mit TLC555 oder Markenmodul, kein NE555-Klon. Kommt mit Stecker und Kabel |
| H05 DRV8833, H06 HX711 | Varianten mit vorgelöteten Stiftleisten wählen. Wägezelle per Schraubklemme oder fertig konfektioniert |
| H12 SHT40 | Modul mit STEMMA-QT/Qwiic-Stecker plus Kabel auf Stiftleiste |
| H09 | Wago- oder Schraubklemmen für Pumpenleitungen, dann braucht auch die Pumpe kein Löten |

## Bestellreihenfolge

1. M1 Messkette: H01, H02, H09, H10, optional H08 und H12.
2. M2 Aktorik: H03, H04, H05, H06, H06b, H11, optional H07.
3. Zweites Set für paralleles Arbeiten: sobald M1 läuft.

## Budget

| Block | Betrag (Schätzung) |
|---|---|
| Node 1 inklusive der Optionen H07, H08, H12 | ca. 188 € |
| Zweites Set | ca. 90 € |
| 18650-Zelle + Halter für Akkutests | ca. 15 € |
| Zentrale | 0 € (Raspi vorhanden) |
| **Summe** | **ca. 293 € von 300 €** |

Versand ist nicht enthalten, die Reserve ist damit knapp. Sparhebel in dieser Reihenfolge: H08
(25 €), H12 (8 €), H07 (10 €), Umfang des zweiten Sets. Ob die 300 € nur Stufe 1 abdecken: E5.

## Stufe 2 (nicht im Budget von Stufe 1, Schätzung)

| Teil | ca. € | Zweck |
|---|---|---|
| TPL5110-Timer | 3 | Ruhestrom unter 1 µA, optional (`06`) |
| Solarzelle 1 W | 10 bis 12 | Laden überflüssig machen, optional. Das Board unterstützt laut Herstellerangaben Solarladung, Details prüfen |
| Lochraster oder eigene Platine, Kleinteile | 15 | fester Aufbau |
| PETG-Filament, Dichtungen, Epoxid | 15 | Gehäuse vom A1 Mini, ggf. Tank |
