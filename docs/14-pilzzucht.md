# 14 Stufe 5: Pilz-Growbox (Speisepilze)

Idee aus dem Team: Wenn der Pflanzenautomat läuft, die gleiche Elektronik für eine
Zuchtbox für Speisepilze nutzen (Austernpilz, Shiitake, Kräuterseitling, Champignon).
Aufbau wie eine Growbox für Pflanzen, aber die Regelgrößen sind andere.

## Was Pilze brauchen, im Vergleich zur Topfpflanze

| Größe | Topfpflanze (Stufe 1) | Speisepilze in der Fruchtungsphase | Folge für das Gerät |
|---|---|---|---|
| Wasser | Substratfeuchte 35 bis 60 %, gießen | Luftfeuchte 85 bis 95 % rF, Substrat feucht halten, nicht gießen sondern benebeln | Vernebler statt Pumpe, Feuchteregelung statt Feuchteschwelle |
| Luft | egal | Frischluft, CO2 unter ca. 800 bis 1000 ppm, sonst lange Stiele und kleine Hüte | CO2-Sensor plus Lüfter, das ist die wichtigste neue Regelgröße |
| Temperatur | 18 bis 25 °C | je nach Art 12 bis 24 °C, Austernpilz tolerant, Shiitake will Kälteschock | Temperatur messen, ggf. Heizmatte oder Peltier |
| Licht | viel | wenig, nur zur Orientierung (Fruchtkörper wachsen zum Licht), 8 bis 12 h schwaches Licht | Kleine LED-Leiste mit Zeitschaltung |
| Nährstoffe | Dünger | nichts, alles steckt im Substrat (Stroh, Holzpellets, Kaffeesatz) | Dosierpumpe entfällt |
| Hygiene | egal | Kontamination durch Schimmel ist das Hauptrisiko | Geschlossene Box, Filter am Lufteinlass, keine Erde in der Nähe |

Fazit: Elektronik, Firmware-Gerüst, MQTT, Zentrale und Telegram bleiben gleich. Anders sind
Sensorbestückung, Aktoren und die Regeln. Die Firmware kapselt die Entscheidungslogik als reine
Funktion ohne I/O (`plant_logic`, siehe `07-firmware-konzept.md`). Für die Box kommt eine eigene
Logikfunktion mit denselben Test- und Sicherheitsregeln dazu.

## Zusätzliche Hardware (Schätzung 09/2026)

| Teil | Zweck | Preis (Schätzung) | Bemerkung |
|---|---|---|---|
| Sensirion SCD40 oder SCD41 (I2C) | CO2, Temperatur, Feuchte in einem | 30 bis 45 Euro | Echter NDIR-Sensor. Billige "CO2-Sensoren" (MQ-135, CCS811) messen nur eCO2 aus VOC und sind für die Regelung unbrauchbar |
| Ultraschall-Vernebler 5 V (Mist Maker) mit Wasserbehälter | Luftfeuchte anheben | 5 bis 10 Euro | Sitzt in einem Wasserreservoir in oder neben der Box, PWM oder Ein/Aus |
| PC-Lüfter 80 mm 5 V oder 12 V, 2 Stück | Frischluft rein, Abluft raus | 10 Euro | Einlass mit HEPA- oder Vlies-Filter, Auslass mit Rückschlagklappe |
| LED-Streifen 5 V kaltweiß, 30 cm | Orientierungslicht | 5 Euro | |
| Heizmatte 12 V (optional) | Für Arten, die es wärmer wollen | 10 bis 15 Euro | Nur wenn der Raum unter 15 °C hat |
| Box | 30 bis 60 l Kunststoffbox mit Deckel (Monotub) oder Wäschekorb mit Folie ("Martha Tent" im Kleinen) | 10 bis 25 Euro | Bohrungen für Lüfter und Vernebler, Sichtfenster |
| Feuchtesensor Substrat (kapazitiv, wie Stufe 1) | Substrat austrocknen erkennen | vorhanden | Optional, bei Strohsubstrat weniger aussagekräftig |
| **Summe Erweiterung** | | **ca. 75 bis 120 Euro** | |

Kommt auf das Budget von Stufe 1 oben drauf, nicht in den 300 Euro enthalten.

## Regeln für die Fruchtungsphase (Startwerte, nicht verifiziert)

```
Luftfeuchte:   Ziel 88 bis 92 % rF. Unter 85 % -> Vernebler an, bis 92 % erreicht.
CO2:           Über 1000 ppm -> Lüfter an, bis unter 700 ppm. Mindestens 4 mal am Tag 5 min lüften,
               auch wenn CO2 niedrig ist (Sensorfehler abfangen).
Konflikt:      Lüften senkt die Feuchte. Vernebler darf während des Lüftens laufen.
               Priorität hat CO2, weil zu wenig Frischluft die Ernte ruiniert, zu trockene Luft
               nur bremst.
Temperatur:    Nur messen und melden, Heizung erst wenn nötig.
Licht:         8 h am Tag, schwach.
Substrat:      Wenn Substratfeuchte fällt oder kein Ertrag mehr: Meldung "Substrat wässern oder wechseln".
```

Die Phase davor (Durchwachsen des Substrats, "Inkubation") braucht keine Regelung, nur
Dunkelheit, Ruhe und 20 bis 25 °C. Das Gerät kann sie mit einem Zähler und Temperaturlog
begleiten und nach 2 bis 3 Wochen zum Umschalten auf Fruchtung auffordern.

## Zwei Zonen in der Firmware

| Zone | Sensoren | Aktoren |
|---|---|---|
| Topf (Stufe 1) | Bodenfeuchte, Wägezellen für Tank und Dünger, optional Luft T/rF | 2 Schlauchpumpen |
| Box (Stufe 5) | SCD41 (CO2, T, rF), Substratfeuchte, Wasserstand Vernebler | Vernebler, Lüfter, LED, Heizmatte |

Beide Zonen können am gleichen ESP32 hängen (genug GPIOs, I2C-Bus geteilt) oder es gibt einen
zweiten ESP32 mit anderer Geräte-ID. Zweiteres ist sauberer, weil die Box am Netzteil hängt
(Vernebler und Lüfter laufen nicht auf Akku) und dauerhaft messen darf.

## Was nicht mit übernommen wird

- Akkubetrieb: Vernebler und Lüfter brauchen Dauerstrom, die Box läuft am Netzteil.
- Deep Sleep: Feuchte und CO2 müssen minütlich geregelt werden.
- Dosierpumpe und fester Auslass am Topf.

## Offene Fragen für Stufe 5

| Frage | Optionen |
|---|---|
| Welche Pilzart zuerst? | Austernpilz (Empfehlung, robust, schnell, tolerant bei Temperatur), Shiitake, Kräuterseitling |
| Substratquelle? | Fertige Pilzbrut-Sets (einfach, ca. 15 bis 25 Euro), eigenes Substrat pasteurisieren (Aufwand, Kontaminationsrisiko) |
| Box-Größe? | 30 l (ein Block) oder 60 l (mehrere) |
| Eigener ESP32 oder Zone am Topf-ESP? | zweiter ESP empfohlen |
