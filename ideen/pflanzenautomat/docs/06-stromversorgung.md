# 06 Stromversorgung

Thema von **Stufe 2**. Stufe 1 läuft am 5-V-Netzteil, die Hardware ist aber akkutauglich (R16).
Maßgeblicher Ausblick: `00-spezifikation-stufe1.md`, Abschnitt 13.

## Ziel

Akkubetrieb so lange wie möglich ohne Nachladen, Laden über USB-C. Am Netzteil dauerhaft
betreibbar.

## Konzept

```
USB-C 5 V ---> Laderegler (auf dem FireBeetle 2 ESP32-C6) ---> Li-Ion 18650, 3,7 V
                                                                     |
                                +------------------------------------+
                                |                                    |
                        Board 3,3 V                          DRV8833 VM direkt am Akku (zu testen)
                        ESP32-C6, Sonde, HX711               oder Boost 5 V mit Enable
                        (Peripherie schaltbar)               2 Schlauchpumpen
```

## Akku

| Option | Kapazität | Maße | Preis (Schätzung) | Bemerkung |
|---|---|---|---|---|
| 18650 Li-Ion (z. B. Samsung 35E) | 3500 mAh | 18 x 65 mm | 6 bis 8 Euro | Passt längs in ein 70-mm-Rohr, Halter nötig, nur Zellen mit Schutzschaltung oder eigenes Schutz-IC |
| LiPo-Pouch 2000 bis 3000 mAh | 2000 bis 3000 mAh | flach | 8 bis 12 Euro | Formflexibel, Stecker passend zum Akkuanschluss des Boards wählen (prüfen) |
| 2 x 18650 parallel | 7000 mAh | | 15 Euro | Falls Laufzeit nicht reicht |

Empfehlung: eine 18650-Zelle mit Schutzschaltung im Halter. Austauschbar, ausreichend Kapazität.

## Laufzeitabschätzung Stufe 2 (Schätzung, in M5 und Stufe 2 messen)

Annahme: einmal täglich aufwachen (`15`), Werte aus Spezifikation 13 plus Selbstentladung.

| Posten | pro Tag |
|---|---|
| Board-Schlaf (16 µA laut Hersteller, 36 µA für V1.2 nicht verifiziert) | ca. 0,4 bis 0,9 mAh |
| Wachphase einmal täglich | ca. 0,3 mAh |
| Pumpen (Spezifikation 13) | ca. 4,0 mAh |
| Selbstentladung Li-Ion (2 bis 3 % pro Monat bei 3500 mAh) | ca. 2,5 bis 3,5 mAh |
| Ruhestrom der Peripherie (DRV8833, HX711, Sonde) | offen, messen |
| **Summe ohne Peripherie** | **ca. 7 bis 9 mAh** |

Bei 3500 mAh und 80 % nutzbar wären das rechnerisch rund 10 bis 13 Monate. Realistisch wird es
weniger, weil Peripherie, Pausen zwischen den Portionen und Alterung fehlen. Der Wasservorrat ist
ohnehin viel früher leer. Ein Schlafstrom von einigen mA, typisch für ein unaufgeräumtes
Breadboard, würde die Laufzeit dagegen auf Wochen drücken.

Konsequenz: Peripherie im Schlaf abschalten (Sonde per GPIO, HX711 Power-Down, DRV8833 nSLEEP),
Power-LEDs auf Modulen entfernen, Ruhestrom früh messen.

## Netzteilbetrieb

USB-C-Netzteil 5 V dauerhaft an, Akku puffert. Die Firmware kann erkennen, ob USB anliegt, und
dann auf Dauer-WLAN schalten (Pin laut Board-Pinout prüfen). Ladestrom des Board-Ladereglers
laut Datenblatt prüfen.

## Sicherheit

- Nur Zellen mit Schutzschaltung oder Schutz-IC (DW01 + FS8205) auf der Platine.
- Keine Zelle direkt an die Pumpen, immer über Boost mit Strombegrenzung.
- Gehäuse so gestalten, dass Wasser nicht zur Zelle laufen kann (Elektronik oben, Wasser unten).
- Temperaturüberwachung der Zelle ist beim Laden mit 100 mA nicht nötig, aber beim
  Standort direkt über der Heizung nachdenken.

## Ansätze, um die Akkulaufzeit zu erhöhen

Ausgangspunkt: Der Verbrauch teilt sich in drei Töpfe. Die Rangfolge bestimmt, wo sich
Aufwand lohnt.

| Topf | Anteil (Schätzung bei sauberem Aufbau) | Was ihn treibt |
|---|---|---|
| Aktivphasen mit WLAN | ca. 70 % | Wie oft aufgewacht wird, wie lange WLAN-Verbindung dauert |
| Ruhestrom | ca. 10 %, bei unsauberem Aufbau 90 % | Leckströme von Modulen, LEDs, Pullups, Boost-Wandler |
| Pumpen | ca. 15 % | Fördermenge, Wirkungsgrad des Boost |

### A. Weniger oft aufwachen (größter Hebel)

| Ansatz | Wirkung | Aufwand |
|---|---|---|
| Intervall adaptiv: Feuchte weit über Schwelle -> 2 h schlafen, nahe Schwelle -> 15 min | Halbiert die Aktivphasen ohne Verlust an Reaktionszeit | Firmware, klein |
| Messen ohne Senden: alle 30 min messen (ohne WLAN, ca. 20 mA für 200 ms), nur alle 2 h die gesammelten Werte senden | WLAN-Anteil sinkt auf ein Viertel, Messkurve bleibt fein | Firmware, RTC-RAM-Puffer |
| Nachts seltener: bei Dunkelheit (Lichtsensor) 4 h Intervall, Pflanzen verdunsten nachts kaum | Weitere 30 % weniger Aktivphasen | Firmware, klein |
| Senden nur bei Änderung: Werte nur schicken, wenn sie sich um mehr als x % geändert haben, sonst nur ein Lebenszeichen täglich | Bei stabilen Werten fast keine Sendungen | Firmware, klein |

### B. Aktivphasen kürzer machen

| Ansatz | Wirkung | Aufwand |
|---|---|---|
| Statische IP, kein DHCP | WLAN-Verbindung 1 bis 2 s schneller | Konfig, trivial |
| WLAN-Kanal und BSSID fest im RTC-RAM merken, kein Scan | Nochmal ca. 0,5 s schneller | Firmware, klein |
| MQTT ohne TLS im Heimnetz, QoS 0, Verbindung sofort trennen | Kein Handshake-Overhead | Konfig |
| Sensoren parallel vorwärmen, während WLAN verbindet | Aktivphase überlappt statt addiert | Firmware, klein |
| Wi-Fi 6 Target Wake Time (ESP32-C6 kann das): Verbindung bleibt bestehen, Chip schläft zwischen den Beacons | Aufwachen ohne Neuverbindung, wenn der Router Wi-Fi 6 mit TWT unterstützt | Firmware, mittel, Router muss mitspielen |
| ESP-NOW statt WLAN: Gerät sendet ohne Verbindung an einen zweiten ESP32 an der Zentrale, der ins MQTT übersetzt | Sendevorgang unter 50 ms statt 2 bis 3 s, das ist der größte Einzelhebel bei der Funkzeit | Zweiter ESP am Pi, Firmware mittel |

### C. Ruhestrom drücken

| Ansatz | Wirkung | Aufwand |
|---|---|---|
| Sensoren über Load-Switch schalten, im Schlaf komplett stromlos | Modul-Leckströme (oft 0,5 bis 3 mA zusammen) verschwinden | Hardware, klein |
| Power-LEDs von allen Modulen auslöten | 1 bis 3 mA pro LED | 5 Minuten |
| Boost-Wandler mit Enable und echtem Shutdown (unter 1 µA), kein MT3608 (Ruhestrom ca. 100 µA und keine Abschaltung) | Boost frisst im Schlaf nichts mehr | Bauteilwahl |
| Peripherie gezielt schlafen legen: Sonde per GPIO stromlos, HX711 im Power-Down, DRV8833 über nSLEEP | Ruhestrom der Module fällt weg | Hardware und Firmware, klein |
| Pullup-Widerstände auf I2C hochohmig (10 k statt 4,7 k) oder abschaltbar versorgen | Mikroampere-Bereich | Hardware, klein |
| Akkuspannungs-Teiler über MOSFET schalten oder sehr hochohmig (1 M) | Sonst fließen dauerhaft ca. 30 µA | Hardware, klein |
| Ruhestrom messen mit INA219 oder Multimeter im µA-Bereich, Ziel unter 100 µA gesamt | Ohne Messung findet man die Lecks nicht | Werkzeug, Basis aus M5, Pflicht in Stufe 2 |

### D. Pumpen effizienter

| Ansatz | Wirkung | Aufwand |
|---|---|---|
| Wasser ohne Pumpe: Tank über dem Topf, Schwerkraft, ESP öffnet nur ein Ventil (bistabiles Magnetventil, Impuls 50 ms, sonst stromlos) | Pumpstrom fällt weg, Ventil braucht nur einen Impuls | Flutrisiko: Bleibt das Ventil offen hängen, läuft der Tank leer. Widerspricht dem Sicherheitsprinzip, nicht vorgesehen |
| Pumpe nur so lange wie nötig, Förderrate kalibriert, kein Nachlauf | Weniger Laufzeit | Firmware |
| Effizienter Boost (TPS61023, über 90 %) statt MT3608 | 5 bis 10 % weniger Verlust | Bauteilwahl, entfällt wenn DRV8833 direkt am Akku reicht |

### E. Mehr Energie reinholen (kreativ)

| Ansatz | Wirkung | Bemerkung |
|---|---|---|
| Kleine Solarzelle am Fensterbrett (5 V, 1 W, ca. 100 x 60 mm) | Am Südfenster reichen wenige mW Tagesmittel, um den Tagesverbrauch von einigen mAh zu decken (Schätzung). Gerät wird "unendlich" | 8 bis 15 Euro. Das FireBeetle 2 unterstützt laut Hersteller Solarladung, Details prüfen. Sonst externer Lader wie CN3791 |
| Solarzelle als grobes Hell/Dunkel-Signal (Ladestrom steigt mit Licht) | Ersetzt den gestrichenen Lichtsensor, falls doch ein Lichtwert gewünscht ist | Kalibrierung nötig, kein Lux-Absolutwert |
| Laden beim Nachfüllen: USB-C am Gerät, wer Wasser nachfüllt, steckt kurz das Kabel an, Push erinnert daran | Kein Akkuwechsel, kein Solar | Nur Gewohnheit |
| Kontakte im Sockel-Tank (Stufe 2, Variante B2): Tank steht auf einer Ladeschale mit Federkontakten oder Qi-Spule | Gerät ist immer geladen, solange es steht | Qi-Empfänger ca. 5 Euro, Wirkungsgrad schlecht, aber egal am Netz |
| Thermoelektrisch am Heizkörper (Peltier als Generator) | Realistisch nur wenige mW, Spielerei | Kreativ, nicht empfohlen |

### F. Größerer Speicher

| Ansatz | Wirkung | Bemerkung |
|---|---|---|
| Zwei 18650 parallel | Doppelte Laufzeit | Nur mit Schutzschaltung pro Zelle oder BMS, Rohr wird länger oder dicker |
| LiFePO4 statt Li-Ion (z. B. 18650 LiFePO4, 3,2 V, 1500 mAh) | Weniger Kapazität, aber 2000+ Zyklen, kein Brandrisiko, 3,2 V passt ohne LDO-Verluste direkt an ESP32 | Braucht anderen Lader (3,6 V Ladeschluss), Boost auf 5 V trotzdem nötig |
| Li-Ion mit Ladeschluss 4,1 V statt 4,2 V | Ca. 10 % weniger Kapazität, doppelte Zyklenzahl, Akku hält Jahre | Ladechip mit einstellbarer Schlussspannung |

### G. Ganz anders denken

| Ansatz | Idee |
|---|---|
| Keine Elektronik im Schlaf, nur ein Nano-Timer: TPL5110 (35 nA) schaltet den ESP komplett stromlos und weckt ihn per Hardware. Ruhestrom des gesamten Geräts unter 1 µA | Gilt als Königsweg für Akkusensoren. ESP32-Deep-Sleep ist gut, aber Module und Wandler bleiben am Akku. Mit TPL5110 ist wirklich alles aus |
| Feuchte messen ohne Strom: Tensiometer oder Gipsblock, ein Schwimmer oder Schalter wechselt den Zustand, der ESP wird nur durch den Zustandswechsel geweckt (ext. Wakeup) | Gerät schläft, bis die Erde tatsächlich trocken ist, dann erst arbeitet es. Reaktionszeit und Messkurve gehen verloren, dafür monatelange Laufzeit |
| Zwei Betriebsmodi im Dashboard umschaltbar: "Urlaub" (nur gießen, keine Kurven, 4 h Intervall, ESP-NOW) und "Beobachten" (feine Kurven, 15 min) | Der Nutzer entscheidet, wann Laufzeit und wann Daten wichtiger sind |
| Akkuprognose in der Zentrale: aus Spannungsverlauf die Restlaufzeit in Tagen berechnen und melden, bevor es knapp wird | Verlängert nicht die Laufzeit, macht sie aber planbar. Nachfüllen und Laden fallen auf den gleichen Tag |

### Der eigentliche Flaschenhals bei täglicher Messung

Wenn nur einmal am Tag gemessen und gesendet wird (siehe `15-messintervalle.md`), ist die
Elektronik nicht mehr der größte Verbraucher. Dann begrenzen zwei andere Dinge die Zeit bis zum
Nachladen:

- Selbstentladung des Li-Ion (ca. 2 bis 3 % pro Monat, grob 2,5 bis 3,5 mAh am Tag), oft mehr
  als der Arbeitsverbrauch.
- Der Wasservorrat, der ohnehin nach Wochen leer ist.

Konsequenz: Ruhestrom per TPL5110 (unter 1 µA) fast auf Selbstentladungs-Niveau drücken, dann
lohnt weiteres Sparen an der Messung nicht mehr. Akku und Tank so wählen, dass beide etwa gleich
lang halten, damit Nachladen und Nachfüllen ein einziger Termin sind. Mit Solarzelle im Deckel
entfällt das Laden ganz, dann bestimmt nur der Tank den Rhythmus.

### Empfehlung nach Reihenfolge

1. Ruhestrom messen und unter 100 µA bringen (C). Ohne das bringt nichts anderes etwas.
2. Adaptives Intervall, Messen ohne Senden, nachts seltener (A). Firmware, kostet nichts.
3. Statische IP, feste BSSID (B). Trivial.
4. Wenn die Laufzeit dann noch nicht reicht: ESP-NOW (B) oder Solarzelle im Deckel (E).
5. TPL5110 (G) als Experiment für die Embedded-Leute, wenn alles andere läuft.
