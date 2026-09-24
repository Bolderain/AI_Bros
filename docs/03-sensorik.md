# 03 Sensorik

Maßgeblich für Stufe 1: `00-spezifikation-stufe1.md`, Abschnitte 2 und 4. Hier die Begründung:
Welche Werte braucht eine Topfpflanze über Jahre, und welche lassen sich mit Hobby-Hardware
zuverlässig messen?

## Was eine Topfpflanze braucht

| Faktor | Wirkung | Messbar mit Hobby-Hardware? |
|---|---|---|
| Wasser im Substrat | Zu trocken: Welke. Zu nass: Wurzelfäule, häufigste Todesursache bei Zimmerpflanzen | Ja, kapazitive Sonde |
| Licht | Zu wenig Licht: Vergeilen, kein Wachstum | Ja, aber für die Gießentscheidung redundant und leicht verdeckt, deshalb gestrichen (`15`) |
| Lufttemperatur, Luftfeuchte | Treiben die Austrocknung, trockene Heizungsluft im Winter | Ja, SHT40 (optional, R22) |
| Nährstoffe (N, P, K, Spurenelemente) | Mangel über Monate: gelbe Blätter. Überschuss: Salzschäden | Nur indirekt über EC, siehe unten |
| pH des Substrats | Bestimmt die Nährstoffverfügbarkeit | In Erde schwierig, in Nährlösung gut (Stufe 4) |
| Wurzelraum | Topf wird über Jahre zu klein | Nicht messbar, Umtopfen bleibt Handarbeit |

## Auswahl Stufe 1

| Größe | Sensor | Prio | Begründung |
|---|---|---|---|
| Bodenfeuchte | Kapazitive Sonde, Markenmodul (z. B. DFRobot SEN0308) oder v1.2 mit TLC555, 2 Stück (H02) | Muss (R02) | Keine korrodierenden Elektroden. NE555-Klone laufen an 3,3 V unzuverlässig, viele billige "v2.0"-Module haben einen. Platinenkante versiegeln. Nur während der Messung per GPIO bestromen |
| Wasservorrat | Wägezelle 1 kg + HX711 unter dem Tank (H06) | Muss (R07) | Misst Restmenge und die tatsächlich geförderte Menge. Ersetzt die früher geplanten Schwimmerschalter |
| Düngervorrat | Kleine Wägezelle + HX711 (H06b) oder Dosenzähler | Soll | Förderkontrolle der Düngerpumpe |
| Topfgewicht | Wägezelle + HX711 unter dem Topf (H07) | Kann (R18) | Vergleich mit der Sonde, Datenbasis für die KI |
| Luftklima | SHT40 mit STEMMA-QT/Qwiic-Stecker (H12) | Kann (R22) | Kontext für die KI, kein Löten |
| EC | Mi Flora per BLE (H08) oder EC-Modul am ESP | Kann (R17) | Versalzungsindikator, siehe unten |
| Substrattemperatur | DS18B20 | gestrichen | Nur Diagnose bei kaltem Standort, treibt keinen Aktor. Mi Flora liefert Temperatur mit |
| Licht | – | gestrichen | siehe `15` |

Nicht verwenden (Spezifikation 4.2): resistive Feuchtesensoren, JSN-SR04T (Blindzone ca. 20 bis
25 cm, im kleinen Tank unbrauchbar), NPK-Sonden.

## Nährstoffmessung: Trend ja, NPK nein

Ziel ist ein Trend: reichert sich Salz an, oder zehrt es aus? Reines Düngen nach Plan sieht diese
langsame Drift nicht.

- **Pflicht (R06):** Trend über das Dosierprotokoll (ml pro Monat, letzte Dosierung). Das sind
  echte Daten, keine erfundenen Nährstoffwerte.
- **Optional (R17):** EC als Versalzungsindikator. Zwei Wege:

| | Mi Flora (BLE) | EC-Modul am ESP |
|---|---|---|
| Vorteil | fertig, kein Löten, liefert Feuchte und Temperatur mit, HA-Integration vorhanden | Sensor direkt am Node, volle Kontrolle über die Messung |
| Nachteil | Firmware ab 3.2.1 nötig, neuere Geräte melden keinen Batteriestand, Raspi muss in BLE-Reichweite sein | Elektroden korrodieren in Erde, nur zur Messung bestromen und mit Wechselspannung messen |
| Preis (Schätzung) | ca. 25 € | ca. 50 € |

Für beide gilt: EC in Erde hängt stark von der Feuchte ab. Werte nur bei gleicher Feuchte
vergleichen, zum Beispiel immer morgens vor dem Gießen.

NPK-Sonden messen physikalisch ebenfalls nur die Leitfähigkeit und rechnen N, P und K über eine
Tabelle aus. Die Hersteller kennzeichnen diese Werte selbst nur als Referenz. N, P und K einzeln
bräuchten Laboranalyse oder ionenselektive Elektroden (mehrere hundert Euro pro Ion). Als
RS485/Modbus-Lernobjekt wären sie brauchbar, für die Regelung nicht.

pH im Topf: Billige Glaselektroden messen nur in einer Aufschlämmung zuverlässig. Erst in der
Hydroponik (Stufe 4) sinnvoll, dort mit regelmäßiger Kalibrierung.

## Kalibrierung Bodenfeuchte

Die Sonde liefert einen Rohwert, der pro Sonde und Substrat anders ist. Vorgehen in M1: in der
echten Erde `moisture_dry_raw` (trocken) und `moisture_wet_raw` (frisch gegossen) aufnehmen,
Trocknungskurve über 7 Tage loggen, Protokoll in `../calibration/`. Die Werte gehen als Parameter
in die Config, nie hart in den Code.

Hinweis ESP32-ADC: nichtlinear an den Rändern. 10 Messungen mitteln und die Streuung prüfen
(Spezifikation 5.1). Ein externer ADC (z. B. ADS1115) bleibt Option, falls das nicht reicht.
