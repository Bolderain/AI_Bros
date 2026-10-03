# 12 Risiken und offene Fragen

Offene Entscheidungen für Stufe 1 (E1 bis E12) stehen maßgeblich in `00-spezifikation-stufe1.md`,
Abschnitt 10. Hier stehen Risiken, Fragen zu späteren Stufen und bereits Erledigtes.

## Risiken

| Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|
| Pumpe läuft durch oder Tank entleert sich | Wasserschaden | Schlauchpumpen statt Tauchpumpen (kein Heber), zentrale Pumpenfunktion mit Timeout, Watchdog, Limits, absolute Grenzen, Förderkontrolle per Wägezelle, Auffangwanne |
| Tippfehler in der Config | Überflutung | Validierung gegen absolute Grenzen (R20, T17) |
| Sonde driftet oder korrodiert | falsches Gießen über Wochen | TLC555-Modul oder Markenmodul, Kante versiegeln, nur zur Messung bestromen, Plausibilitätsprüfung, halbjährlich kontrollieren |
| Wasser geht neben den Topf | Pflanze vertrocknet unbemerkt | Anstiegsprüfung nach dem Gießen (T08) |
| Wägung verfälscht | Fehlalarm bei der Förderkontrolle | Schläuche lose und zugentlastet, Beruhigungszeit `settle_s`, nie während eines Pumpenlaufs wiegen |
| Keine Zeit nach Stromausfall ohne Netz | Gießfenster unbekannt | lokaler NTP, Notbetrieb (T18) |
| Home Assistant löscht den Verlauf nach 10 Tagen | Datenbasis für die KI fehlt | `purge_keep_days` erhöhen, InfluxDB oder CSV nach `data/` |
| SD-Karte im Raspi fällt aus | Daten weg | Backup, Schreiblast begrenzen |
| Board braucht Löten | Widerspruch zu R13 | E10 |
| Budget knapp (ca. 293 € ohne Versand) | kein Geld für Ersatzteile | Optionen streichen, E5 |
| Düngerlösung verkeimt oder kristallisiert | Schlauch verstopft | blickdicht, vorverdünnt, zur Saison neu ansetzen |
| Algen im Tank | Schlauch verstopft | blickdichte Behälter |
| Team-Zeit | März 2027 rutscht | Meilensteine klein halten, M5 Anfang Februar starten |
| Gedruckter Tank undicht (Stufe 2) | Wasser im Gerät | erst 24 h extern testen, Elektronik immer über dem Tank |

## Offene Fragen zu Stufe 2 und später

| Frage | Optionen | Wann |
|---|---|---|
| Integrierter Tank: Variante B1, B2 oder B3 (`09`) | Sockel-Tank empfohlen | Stufe 2, nach E8 |
| Düngerbehälter im Gehäuse oder außen | Formfaktor gegen Akkugröße | Stufe 2 |
| Pumpen direkt am Akku oder über Boost (`04`) | testen | Stufe 2 |
| Solarzelle, TPL5110 (`06`) | optional | Stufe 2 |

## Erledigt

| Frage | Ergebnis |
|---|---|
| Raspi vorhanden? | ja, die Zentrale kostet nichts |
| ESP-IDF oder Arduino? | ESPHome plus `plant_logic` (Spezifikation 5) |
| Home Assistant oder eigener Stack? | Home Assistant (Spezifikation 8) |
| Welcher Feuchtesensor? | kapazitiv, TLC555 oder Markenmodul (H02) |
| Füllstand per Schwimmer oder Wägezelle? | Wägezelle (H06, H06b) |
| Wasserpumpe: Tauch- oder Schlauchpumpe? | Schlauchpumpe (H03) |
| NPK-Sonde? | nicht verwenden (Spezifikation 4.2) |
| Lichtsensor? | gestrichen (`15`) |

## Verifikationsstand

| Angabe | Stand |
|---|---|
| Preise | Schätzung 09/2026 |
| Energie-Schätzungen (`06`, Spezifikation 13) | Schätzung, in M5 messen |
| Pflanzenprofile (`10`) | Startwerte, nicht verifiziert |
| FireBeetle 2: Schlafstrom 16 µA | Herstellerangabe, mehrfach gefunden |
| FireBeetle 2: Schlafstrom 36 µA für V1.2 | nicht verifiziert |
| FireBeetle 2: Stiftleisten lose im Lieferumfang | laut Händlerangaben |
| Mi Flora ab Firmware 3.2.1 in HA, ohne Batteriestand bei neueren Geräten | laut HA-Doku |
