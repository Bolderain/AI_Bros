# 03 Sensorik

Leitfrage: Welche Werte braucht man, damit eine Topfpflanze über Jahre gedeiht, und welche
davon lassen sich mit Hobby-Hardware zuverlässig messen?

## Was eine Topfpflanze braucht

| Faktor | Wirkung | Messbar mit Hobby-Hardware? |
|---|---|---|
| Wasser im Substrat | Zu trocken: Welke. Zu nass: Wurzelfäule, häufigste Todesursache bei Zimmerpflanzen | Ja, kapazitiver Bodenfeuchtesensor |
| Licht | Zu wenig Licht: Vergeilen, kein Wachstum. Bestimmt auch den Wasserbedarf | Ja, Lux-Sensor (Näherung, kein PAR) |
| Lufttemperatur | Unter ca. 10 °C leiden viele Zimmerpflanzen, Wasserbedarf steigt mit Temperatur | Ja |
| Luftfeuchte | Trockene Heizungsluft im Winter, Blattspitzen werden braun | Ja |
| Substrattemperatur | Kalte Wurzeln am Fensterbrett im Winter | Ja, DS18B20 |
| Nährstoffe (N, P, K, Spurenelemente) | Mangel über Monate: gelbe Blätter, Kümmerwuchs. Überschuss: Salzschäden | Nur indirekt über EC (Leitfähigkeit), NPK-Sensoren unzuverlässig, siehe unten |
| pH des Substrats | Bestimmt Nährstoffverfügbarkeit, driftet über Jahre durch Gießwasser und Dünger | In Erde schwierig, in Nährlösung gut |
| Wurzelraum | Topf wird über Jahre zu klein, Substrat verdichtet | Nicht messbar, Umtopfen alle 1 bis 3 Jahre bleibt Handarbeit |

## Auswahl für Stufe 1

| Größe | Sensor | Schnittstelle | Preis (Schätzung 09/2026) | Begründung |
|---|---|---|---|---|
| Bodenfeuchte | DFRobot SEN0308 (kapazitiv, wasserdicht, IP65) oder generischer "Capacitive Soil Moisture Sensor v2.0" | Analog | 15 Euro bzw. 3 Euro | Kapazitiv statt resistiv: keine korrodierenden Elektroden. Beim Billigsensor die Schnittkante mit Epoxid versiegeln, sonst zieht Feuchte in die Platine. Erfahrungsberichte: unversiegelte Billigsensoren korrodieren nach einer Saison an den Bauteilen |
| Substrattemperatur | DS18B20 wasserdicht | 1-Wire | 3 Euro | Robust, günstig, kann am Feuchtesensor mit in die Erde |
| Luft Temperatur + Feuchte | SHT40 (Sensirion) oder BME280 | I2C | 5 Euro | SHT40 ist genauer bei Feuchte, BME280 liefert zusätzlich Luftdruck (hier unwichtig) |
| Licht | gestrichen (siehe `15-messintervalle.md`) | | | Für die Gießentscheidung redundant, leicht durch Blätter verdeckt. Grobes Hell/Dunkel liefert später die Solarzelle im Deckel gratis |
| Wasserstand Tank | 2 Schwimmerschalter (halb, leer) oder Ultraschall JSN-SR04T | Digital | 3 Euro pro Schalter | Schwimmerschalter sind das simpelste Zuverlässige. Alternative: Tank auf Wägezelle (HX711, ca. 6 Euro), liefert kontinuierlichen Füllstand und misst nebenbei die tatsächlich gepumpte Menge |
| Düngerstand | Zählen der dosierten Menge plus ein Schwimmerschalter "fast leer" | Digital | 3 Euro | Peristaltikpumpe fördert reproduzierbar, Zählen reicht |
| Akkuspannung | Spannungsteiler an ADC (XIAO C6 hat das intern) | Analog | 0 Euro | Für "Akku schwach"-Meldung |
| Pumpen-Rückmeldung | Kein Durchflusssensor in Stufe 1 | | | Stattdessen: Feuchte muss nach dem Gießen steigen. Wenn nicht, Alarm "Pumpe oder Tank prüfen" |

## Nährstoffmessung: gewollt, Weg noch offen

Wir wollen die Nährstoffversorgung nicht nur nach Plan düngen, sondern einen **Trend** sehen
(reichert sich Salz an, oder zehrt es aus). Womit, ist noch offen. Zur Auswahl stehen zwei
Sensoren am ESP32, die physikalisch **dasselbe** messen (Leitfähigkeit); der NPK-Sensor legt
nur eine Umrechnungstabelle für N, P, K dahinter.

| | EC-Sensor (analog) | NPK-Sonde (RS485/Modbus) |
|---|---|---|
| Vorteil | misst nur die eine reale Größe, einfacher Anschluss (Analogpin) | liefert Feuchte/Temp/pH mit, gutes RS485-Lernobjekt |
| Nachteil | trennt N/P/K nicht (kann keiner), Elektroden korrodieren in Erde | NPK-Zahlen geraten und nicht belastbar, Elektroden korrodieren, mehr Code |
| Preis | ca. 50 | ca. 20 bis 60 |

Gemeinsames Problem: Blanke Elektroden korrodieren und driften über genau die Monate, in denen
der Trend entsteht. Gegenmittel: Sensor nur kurz beim Messen bestromen (ESP schaltet die
Versorgung) und mit **Wechselspannung** messen, um Elektrolyse zu vermeiden. Wirklich stabil
wird EC erst in Hydroponik-Nährlösung (Stufe 3). Für N, P, K einzeln bräuchte es Laboranalyse
oder ionenselektive Elektroden (mehrere hundert Euro pro Ion).

Entscheidung offen: EC oder NPK-Sonde, und ob im Topf überhaupt oder erst in Stufe 3. Details
unten.

## Bewertung von pH, EC und NPK

### NPK-Sensoren (RS485, "7-in-1", "Boden NPK Sensor")

Nicht verwenden. Diese Sensoren messen im Kern Leitfähigkeit und Feuchte und rechnen daraus
N, P und K per Tabelle aus. Selbst die Hersteller-Wikis (z. B. DFRobot SEN0605) schreiben, die
NPK-Werte seien nur als Referenz brauchbar und nicht mit Laborwerten vergleichbar. Für
Regelentscheidungen ungeeignet. Ein echter NPK-Wert braucht Laboranalyse oder Ionenselektive
Elektroden (mehrere hundert Euro pro Ion).

### EC (elektrische Leitfähigkeit)

In feuchter Erde ist EC ein grober Indikator für den Salzgehalt, also "ist überhaupt Dünger da"
bzw. "ist zu viel Dünger da". Die Messung hängt stark von der Feuchte ab. Brauchbar als Trend,
nicht als Absolutwert. Für Stufe 1 weglassen, für Hydroponik (Stufe 3) Pflicht, dort mit
DFRobot Gravity Analog EC (ca. 50 Euro, Schätzung).

Praktische Alternative für Erde: Drainwasser auffangen und mit einem billigen EC-Stift
(ca. 15 Euro) von Hand messen, ein- bis zweimal im Monat. Ergebnis von Hand ins Dashboard
eintragen. Das reicht, um die Düngermenge über Monate nachzuführen.

### pH

In Erde messen die Billig-pH-Sonden (die mit Glaselektrode) nur zuverlässig in einer
Aufschlämmung, nicht im Topf. Für Stufe 1 weglassen. Für Hydroponik (Stufe 3) Pflicht:
DFRobot Gravity Analog pH V2 (ca. 35 Euro, Schätzung), regelmäßig kalibrieren.

## Fazit Sensorik Stufe 1

Gemessen wird: Bodenfeuchte (Pflicht). Substrattemperatur, Lufttemperatur und Luftfeuchte
nur als optionaler Tageswert. Tankstand und Düngerstand beim Gießen, Akkuspannung bei jeder
Aktivphase. Licht wird gestrichen (siehe `15-messintervalle.md`). Alles unter 40 Euro. Nährstoffe werden nach Zeit und
Wachstumsphase dosiert und über das manuelle EC-Messen des Drainwassers nachgeführt.

## Kalibrierung Bodenfeuchte

Der kapazitive Sensor liefert einen Rohwert (ADC), der pro Sensor und Substrat anders ist.
Vorgehen: Rohwert in Luft und Rohwert in Wasser aufnehmen, linear auf 0 bis 100 % abbilden,
dann in der echten Erde "trocken" und "frisch gegossen" markieren. Diese beiden Werte sind die
Grundlage für die Schwellwerte in `10-pflegeregeln.md`.

Hinweis ESP32-ADC: Der ADC des ESP32 ist nichtlinear an den Rändern. Sensor an 3,3 V
betreiben, Rohwert mehrfach lesen und mitteln, oder einen externen ADS1115 (ca. 4 Euro) nutzen.
