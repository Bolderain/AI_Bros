# 06 Stromversorgung

## Ziel

Akkubetrieb mit mindestens 4 Wochen Laufzeit (Schätzung, zu verifizieren), Laden über USB-C.
Am Netzteil dauerhaft betreibbar.

## Konzept

```
USB-C 5 V ---> Ladeschaltung (auf XIAO ESP32-C6 integriert, BQ25101 oder ähnlich) ---> Li-Ion 18650, 3,7 V
                                                                                         |
                                                    +------------------------------------+
                                                    |                                    |
                                            XIAO 3,3 V LDO                     Boost 5 V (TPS61023)
                                            ESP32-C6 + Sensoren                mit Enable vom ESP
                                                                               Wasserpumpe, Dosierpumpe
```

## Akku

| Option | Kapazität | Maße | Preis (Schätzung) | Bemerkung |
|---|---|---|---|---|
| 18650 Li-Ion (z. B. Samsung 35E) | 3500 mAh | 18 x 65 mm | 6 bis 8 Euro | Passt längs in ein 70-mm-Rohr, Halter nötig, nur Zellen mit Schutzschaltung oder eigenes Schutz-IC |
| LiPo-Pouch 2000 bis 3000 mAh | 2000 bis 3000 mAh | flach | 8 bis 12 Euro | Formflexibel, JST-Stecker passt direkt an XIAO |
| 2 x 18650 parallel | 7000 mAh | | 15 Euro | Falls Laufzeit nicht reicht |

Empfehlung: eine 18650-Zelle mit Schutzschaltung im Halter. Austauschbar, ausreichend Kapazität.

## Laufzeitabschätzung (Schätzung, alle Werte zu messen)

Annahmen: Aufwachen alle 30 min, 3 s aktiv mit WLAN (ca. 120 mA), Deep Sleep 30 µA
(XIAO ESP32-C6 laut Datenblatt-Größenordnung, Sensoren im Schlaf abgeschaltet), Gießen alle 2 Tage
20 s bei 300 mA, Düngen vernachlässigbar.

| Posten | Rechnung | pro Tag |
|---|---|---|
| Aktivphasen | 48 x 3 s x 120 mA | 4,8 mAh |
| Deep Sleep | 24 h x 0,03 mA | 0,7 mAh |
| Pumpen | 20 s x 300 mA / 2 Tage, Boost-Wirkungsgrad 85 % | 1,0 mAh |
| Summe | | ca. 6,5 mAh/Tag |

Bei 3500 mAh und 80 % nutzbar: ca. 430 Tage rechnerisch. Realistisch wird die Selbstentladung
und ein schlechterer Schlafstrom (Sensormodule mit LEDs und Pullups, Boost-Leckstrom)
dominieren. Ziel von 4 Wochen ist mit Reserve erreichbar, wenn der Schlafstrom unter 1 mA bleibt.
Ein Schlafstrom von 5 mA (typisch für ein unaufgeräumtes Breadboard) ergibt nur noch ca. 3 Wochen.

Konsequenz: Alle Sensormodule über einen High-Side-Schalter (P-MOSFET oder Load Switch
TPS22918) versorgen, der im Schlaf trennt. Power-LEDs auf den Modulen auslöten.

## Netzteilbetrieb

USB-C-Netzteil 5 V dauerhaft an, Akku puffert. Firmware erkennt "USB da" (VBUS-Pin) und
schaltet auf Dauer-WLAN. Ladeschaltung des XIAO liefert nur ca. 100 mA Ladestrom (zu prüfen),
für Dauerbetrieb reicht das.

## Sicherheit

- Nur Zellen mit Schutzschaltung oder Schutz-IC (DW01 + FS8205) auf der Platine.
- Keine Zelle direkt an die Pumpen, immer über Boost mit Strombegrenzung.
- Gehäuse so gestalten, dass Wasser nicht zur Zelle laufen kann (Elektronik oben, Wasser unten).
- Temperaturüberwachung der Zelle ist beim Laden mit 100 mA nicht nötig, aber beim
  Standort direkt über der Heizung nachdenken.
