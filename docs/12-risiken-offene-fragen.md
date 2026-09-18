# 12 Risiken und offene Fragen

## Risiken

| Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|
| Pumpe läuft durch (Softwarefehler, hängender Sensor) | Topf und Fensterbrett geflutet | Harte Laufzeitgrenze, Sperrzeit, Plausibilitätsprüfung, Untersetzer mit Überlaufsensor |
| Feuchtesensor driftet oder korrodiert | Falsches Gießen über Wochen unbemerkt | Markensensor oder versiegelter Billigsensor, Rohwert im Dashboard, halbjährliche Kontrolle |
| Ruhestrom zu hoch | Akkulaufzeit Tage statt Wochen | Sensoren schaltbar versorgen, LEDs auslöten, früh messen |
| Wasser erreicht Elektronik | Kurzschluss, Li-Ion-Risiko | Elektronik oben, Wasserpfad unten, Dichtung, Vergussmasse am Spieß |
| WLAN-Verbindung dauert lange | Aktivphase frisst Akku | Statische IP, schneller Kanal, MQTT-Timeout 10 s |
| Pi Zero 2 W nicht lieferbar | Zentrale fehlt | Vorhandenen Pi oder alten Laptop nehmen |
| Dünger kristallisiert im Schlauch | Dosierpumpe blockiert | Vorverdünnen, nach Dosierung kurz mit Wasser spülen (T-Stück vor der Dosierstelle) |
| Algen im Tank | Pumpe verstopft | Kanister lichtdicht, Filter am Pumpeneinlass |
| Team-Zeit | Termin März rutscht | Iterationen klein halten, It. 5 nicht verschieben |
| Gedruckter Tank undicht | Wasser im Gerät | Erst extern testen (24 h), Elektronik immer über dem Tank, Prototyp B erst nach stabilem Prototyp A |

## Offene Fragen (vor Iteration 1 klären)

| Frage | Optionen | Entscheidung bis |
|---|---|---|
| Welche Pflanze für den Prototyp? | Efeutute (Empfehlung), Basilikum, andere | Iteration 0 |
| Vorhandener Raspberry Pi im Team? | Ja -> 40 Euro gespart | Iteration 0 |
| Integrierter Tank: Variante B1, B2 oder B3 (siehe `09-mechanik-gehaeuse.md`)? | Sockel-Tank empfohlen | Iteration 6 |
| Feuchtesensor: DFRobot IP65 oder Billigsensor mit Epoxid? | Preis vs. Aufwand | Iteration 0 (Bestellung) |
| Düngerbehälter im Rohr oder außen angeclipst? | Formfaktor vs. Akkugröße | Iteration 4 |
| ESP-IDF oder Arduino-Core? | Vorlieben der Embedded-Leute | Iteration 1 |
| Home Assistant zusätzlich zum eigenen Stack? | Komfort vs. Basteln | Iteration 3 |

## Bewusst nicht in Stufe 1

- pH- und EC-Sensorik im Substrat (unzuverlässig), NPK-Sensoren (nicht brauchbar).
- Mehrkanal-Düngung.
- Außenbetrieb, Solar.
- Eigene App.
- Kamera.

## Ideen für später (nicht geplant, nur notiert)

- Stufe 4 Pilz-Growbox: eigene Seite `14-pilzzucht.md`. Beeinflusst jetzt schon die
  Firmware-Struktur (Module statt fest verdrahtet).

## Nicht verifiziert (Kennzeichnung)

Alle Preise sind Schätzungen mit Stand September 2026. Die Laufzeitrechnung in
`06-stromversorgung.md` basiert auf Datenblatt-Größenordnungen und ist zu messen.
Die Pflanzenprofile in `10-pflegeregeln.md` sind Startwerte aus Gärtnererfahrung, nicht
aus Messungen mit diesem Gerät.
