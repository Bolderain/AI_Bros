# Idee: Gravel-Navi (eigenes Fahrrad-Navi fürs Gravelbiken)

Stand: 22.10.2026. Noch nicht entschieden, eine von mehreren Ideen.

## Idee

Ein eigenes Fahrrad-Navi, gebaut für das, was wir rund um Karlsruhe fahren: Schwarzwald,
Pfälzerwald, Kraichgau. Also Schotter, Waldwege, Feldwege, Wurzelpassagen und viele kleine
Abzweige, die man auf der Straßennavi-Logik nicht sieht. Das Gerät soll einen vorher
geplanten GPX-Track zuverlässig führen, offline funktionieren und auch bei Sonne lesbar
sein. Rahmen: 3 Leute, Hobby, Budget Team 300 €, Karlsruhe.

## Was ein Gravel-Navi braucht

| Anforderung | Warum | Bemerkung |
|---|---|---|
| GPX-Track folgen | Kern der Sache: geplante Route abfahren | Track als Linie auf der Karte, eigene Position darauf |
| Abbiegehinweise | Im Wald zweigen Wege dicht hintereinander ab | Aus dem Track berechnet (Winkel an Knicken), nicht aus Routing-Anweisungen |
| Off-Course-Warnung | Falsch abgebogen merkt man sonst erst nach 2 km | Abstand zum Track über Schwelle (P) für Dauer (P) |
| Offline-Karten aus OSM | Im Schwarzwald oft kein Netz | Mit Wegtypen: `highway=track`, `tracktype=grade1..5`, `surface=gravel/compacted/ground` usw. |
| Höhenprofil | Kraichgau wellig, Schwarzwald steil | Restanstieg bis Ziel und nächster Anstieg |
| Akku 10+ h | Tagestouren mit Pausen | Ziel 10 h, besser 14 h (P) |
| Ablesbarkeit in Sonne | Kernproblem bei Handys | Reflektive Displays (E-Paper, transflektives LCD) haben hier Vorteile |
| Bedienung mit Handschuhen | Herbst, Winter, Regen | Tasten statt Touchscreen bevorzugt |
| Wasserdicht, vibrationsfest | Schotter rüttelt, Regen | Siehe Gehäuse |
| Aufzeichnung | Fahrt als GPX/FIT speichern | Für Strava/Komoot-Upload später |

Nicht nötig (bewusst weggelassen): Routing auf dem Gerät, Sprachansagen, Social-Funktionen,
Trainingspläne.

## Varianten

| | A: ESP32-S3 + Display + GNSS | B: Raspberry Pi Zero 2 W | C: Altes Smartphone + eigene App | D: Handy-App + kleines BLE-Display |
|---|---|---|---|---|
| Was | Eigene Platine/Board, E-Paper oder transflektives LCD, GNSS-Modul, Tasten | Linux-Rechner mit Display und GNSS-Modul | Ausgemustertes Android-Handy, eigene oder angepasste App, Handy fest am Lenker | Handy bleibt in der Tasche und rechnet, ein kleines Display am Lenker zeigt Pfeil, Distanz, Werte |
| Karte | Vorgerenderte Kacheln, einfach, wenig Farbe | Vektor oder Raster, gut möglich | Volle Karte (z. B. Vektor, eigene Stile) | Keine Karte am Lenker, nur Hinweise |
| Ablesbarkeit Sonne | gut (reflektiv) | je nach Display, reflektiv möglich | schwach bis mittel (LCD/OLED, hell = Akku) | gut, wenn Display reflektiv |
| Akku 10+ h | gut erreichbar (Schätzung) | schwierig, Pi braucht dauerhaft Strom | eher nicht ohne Powerbank | Display gut, Handy in Tasche mit GNSS meist ok (Schätzung) |
| BLE-Sensoren | ja (ESP32-S3 hat BLE) | ja | ja (Android BLE) | über das Handy |
| Aufwand Hardware | hoch | mittel | gering | mittel |
| Aufwand Software | hoch (Firmware, Kartenformat selbst) | mittel (Linux, vorhandene Bibliotheken) | mittel (App) | mittel (App + Display-Firmware) |
| Lerneffekt Elektronik | hoch | mittel | gering | mittel |
| Budget 300 € | ja | ja | ja, sehr günstig | ja |

### Ehrlich gegenüber Wahoo, Garmin, Komoot

- **Fertige Geräte** (Wahoo ELEMNT, Garmin Edge) können das alles schon: Karten, Track,
  Abbiegehinweise, Sensoren, 15+ h Akku, wasserdicht, erprobt. Gebraucht oft unter
  150 € zu haben (Schätzung). Rein vom Ergebnis her ist Selbstbauen nicht besser.
- **Komoot/andere Apps** auf dem eigenen Handy lösen Planung und Führung schon gut, Schwachpunkt
  ist Akku und Sonne.
- **Warum trotzdem:** Lernen (GNSS, Displays, Energie sparen, BLE, Kartendaten), eigene
  Darstellung genau für Gravel (Untergrund farbig, `tracktype` sichtbar), keine Abos, und
  Synergie mit dem Powermeter. Erwartung im Team klären: Es wird ein Bastelgerät, kein
  Garmin-Ersatz in der ersten Version.
- **Realistische Messlatte:** Eine Tour im Pfälzerwald, 6 bis 8 h, mit dem Gerät als
  einziger Navigation, ohne dass jemand das Handy zücken muss.

## Aufbau

![Blockdiagramm Gravel-Navi](aufbau.svg)

Zweiteilung: Alles Schwere (Routing, Kartenaufbereitung) passiert am PC zu Hause. Das Gerät
am Lenker bekommt fertige Daten (Track, Kacheln, Höhenprofil, Abbiegepunkte) und muss nur
noch anzeigen, Position bestimmen und vergleichen.

## Bildschirm (Entwurf)

![Mockup Fahransicht](display-mockup.svg)

Entwurf für die Fahransicht: oben nächster Hinweis groß, Mitte Kartenausschnitt mit Track
und Untergrund, unten Werte (Geschwindigkeit, Leistung, Puls, Restdistanz) und Höhenprofil.
Schwarz-weiß gedacht, damit es auch auf E-Paper oder einfarbigem transflektivem LCD funktioniert.
Untergrund wird durch Linienstil (durchgezogen, gestrichelt, gepunktet) statt Farbe unterschieden.

## Software

### Kartenkacheln: Vektor oder Raster

| | Raster vorgerendert | Vektor auf dem Gerät gerendert |
|---|---|---|
| Prinzip | Am PC aus OSM fertige Bilder je Zoomstufe erzeugen | Gerät bekommt Geometrie und zeichnet selbst |
| Rechenlast Gerät | gering, nur Bild kopieren | hoch (für ESP32 schwierig, Pi/Handy ok) |
| Speicher | groß, pro Zoomstufe | klein |
| Drehen in Fahrtrichtung | schwierig (Text steht schief) | gut |
| Stil ändern | neu rendern am PC | sofort |
| Passt zu | A (und B) | B, C |

- **Für A:** Rasterkacheln, wenige Zoomstufen (P), einfarbig bzw. Graustufen, Karte
  "Norden oben". Erzeugung am PC mit einem Skript aus einem OSM-Extrakt (z. B. von
  Geofabrik für Baden-Württemberg und Rheinland-Pfalz). Welches Werkzeug, ist offen.
- **Gravel-Stil:** Wege nach `highway`, `tracktype` und `surface` unterscheiden:
  Asphalt dünn, guter Schotter (`grade1/2`, `compacted`) durchgezogen, schlechtere
  Wege gestrichelt, Pfade gepunktet. Daten in OSM sind lückenhaft, fehlende Tags als
  "unbekannt" darstellen, nicht raten.
- **Speicher:** Kachelmenge für Region plus Zoomstufen ist zu schätzen, bevor eine
  SD-Kartengröße festgelegt wird. Alternativ nur einen Korridor entlang der Route
  rendern (deutlich weniger Daten).
- **Lizenz:** OSM-Daten unter ODbL, Namensnennung "© OpenStreetMap-Mitwirkende" auf dem
  Gerät bzw. in der Doku.

### Routing am PC statt auf dem Gerät

- Route wird zu Hause geplant: **BRouter** (Open Source, offline nutzbar, eigene Profile)
  mit einem Gravel-Profil, das Schotter bevorzugt und Hauptstraßen meidet. Alternativ
  Planung in Komoot oder einem Web-Frontend von BRouter und GPX-Export.
- Gerät rechnet **nicht neu**, wenn man abweicht. Es zeigt nur Richtung und Abstand zurück
  zum Track. Neuplanung unterwegs wäre ein spätere Ausbaustufe (bei C/D über das Handy).
- Vorverarbeitung am PC: Abbiegepunkte aus dem Track ableiten (Richtungsänderung über
  Winkel (P), an Kreuzungen laut OSM), Höhenprofil aus Höhendaten berechnen, alles in ein
  einfaches Format fürs Gerät packen (Format offen).

### Track-Matching und Off-Course-Warnung

- Eigene Position (GNSS) auf das nächste Track-Segment projizieren, nur in einem Fenster um
  die letzte bekannte Stelle suchen. Sonst springt man bei Schleifen oder Hin-und-zurück
  auf den falschen Abschnitt.
- Fortschritt entlang des Tracks (gefahrene Strecke) bestimmt nächsten Hinweis und Rest.
- Off-Course: Abstand > Schwelle (P, z. B. Größenordnung 30 bis 50 m, Schätzung) für länger
  als Zeit (P) dann Warnung (Signalton/Vibration, Anzeige Pfeil zurück zum Track).
  Hysterese, damit es im Wald bei schlechtem GNSS nicht ständig piept.
- GNSS im Wald und in Tälern (Murgtal, Pfälzerwald) ist ungenauer. Messen statt annehmen.
- Logik als reine Funktion ohne I/O (wie beim Pflanzenautomaten), damit sie am PC mit
  aufgezeichneten GPX-Fahrten getestet werden kann.

## Sensoren über BLE

- **Herzfrequenz:** Brustgurte mit BLE-Standardprofil Heart Rate. Gängig, gut dokumentiert.
- **Powermeter:** BLE-Standardprofil Cycling Power. Anzeige Watt, 3-s-Mittel, Durchschnitt.
- **Geschwindigkeit/Trittfrequenz:** Profil Cycling Speed and Cadence, optional.
- ANT+ wird nicht eingeplant (braucht eigenen Funkchip), nur BLE.
- **Synergie mit `ideen/powermeter/`** (wird parallel angelegt): Wenn das Team auch den
  Powermeter baut, ist das Navi die natürliche Anzeige dafür. Beide sollten sich an das
  Standardprofil Cycling Power halten, dann funktioniert der Powermeter auch mit fertigen
  Geräten und das Navi auch mit fertigen Powermetern. Gemeinsame Testfahrten möglich.

## Gehäuse und Halterung

- Ziel: spritzwassergeschützt und regenfest (Schutzart als Ziel, P). Gedrucktes Gehäuse
  mit Dichtung, Tasten mit Gummimembran oder abgedichtete Taster.
- Display hinter klarer Scheibe; bei Sonne auf Spiegelungen achten.
- Ladebuchse abgedeckt (USB-C mit Kappe) oder Laden per Magnetkontakt (offen).
- **Halterung:** Kompatibel zu verbreiteten Lenkerhalterungen (z. B. Viertelumdrehung wie
  bei Garmin) statt eigener Lösung. Gegenstück druckbar oder als Ersatzteil kaufen. Maße
  vom echten Teil abnehmen, nicht annehmen.
- Vibration: Schotter rüttelt stark. SD-Karte und Akku mechanisch sichern, Stecker
  vermeiden oder verriegeln.
- Kälte: Akkukapazität sinkt im Winter, E-Paper wird bei Kälte langsamer (Datenblatt
  prüfen, sobald Display gewählt).

## Energiebudget (Schätzung, Variante A)

Alle Werte Schätzung, erst nach Bauteilwahl aus Datenblättern belegen und dann messen.

| Verbraucher | Annahme | Mittlere Leistung (Schätzung) |
|---|---|---|
| GNSS-Modul, dauerhaft an | typisch einige zehn mW | 0,1 W (P) |
| ESP32-S3, meist schlafend, Aufwachen pro Fix | Duty-Cycle | 0,1 bis 0,2 W (P) |
| BLE zu 2 Sensoren | Verbindungsintervall | in obiger Zeile enthalten (P) |
| E-Paper, Teilaktualisierung alle paar Sekunden | Strom nur beim Umschalten | < 0,05 W (P) |
| oder transflektives LCD ohne Beleuchtung | dauerhaft | gering (P) |
| Beleuchtung (nur nachts) | | nicht eingerechnet |
| **Summe** | | **etwa 0,3 W (Schätzung)** |

Bei 0,3 W braucht man für 12 h etwa 3,6 Wh, also z. B. ein Li-Ion-Akku um 1000 mAh bei
3,7 V plus Reserve. Ein Akku mit 2000 bis 3000 mAh gibt Luft für Kälte und Alterung
(Schätzung). Für Variante B (Pi Zero 2 W) liegt die Grundlast deutlich höher; dort ist
10 h nur mit größerem Akku realistisch (Zahl erst nach Messung).

## Stückliste Variante A (Schätzpreise)

| Teil | Schätzpreis |
|---|---|
| ESP32-S3-Entwicklungsboard (mit PSRAM) | 10 bis 20 € |
| Display: E-Paper ca. 3 bis 4 Zoll oder transflektives LCD | 20 bis 50 € |
| GNSS-Modul (mehrere Systeme, z. B. GPS+Galileo) mit Antenne | 15 bis 40 € |
| microSD-Slot + Karte | 10 € |
| Li-Ion-Akku 2000 bis 3000 mAh + Lade-/Schutzschaltung | 15 bis 25 € |
| Tasten (abgedichtet), Summer/Vibrationsmotor | 10 € |
| Gehäuse (Druck), Dichtungen, Scheibe | 15 € |
| Lenkerhalterung (Kaufteil, kompatibel) | 10 bis 15 € |
| Kleinteile, Platine/Lochraster, Kabel | 20 € |
| Reserve (zweites Display, Fehlkäufe) | 40 € |
| **Summe** | **etwa 165 bis 245 € (Schätzung)** |

Wenn ein zweites Gerät gebaut werden soll (jeder will eins), wird es knapp. Variante C
kostet fast nichts, wenn alte Handys vorhanden sind. Variante D: Display, kleiner
Mikrocontroller, Akku, Gehäuse, etwa 60 bis 100 € (Schätzung).

## Meilensteine

1. **M1 Track am PC:** GPX laden, Abbiegepunkte und Höhenprofil berechnen, Track-Matching
   und Off-Course-Logik mit aufgezeichneten Fahrten am PC testen. Noch keine Hardware.
2. **M2 Gravel-Karte:** OSM-Extrakt, Gravel-Stil, Kacheln für einen Korridor rendern, am
   PC anschauen. BRouter-Gravel-Profil ausprobieren.
3. **M3 Brettaufbau:** Board, GNSS, Display auf dem Tisch. Position anzeigen, Kachel
   anzeigen, Track zeichnen. GNSS-Qualität auf einer Runde im Wald messen.
4. **M4 Erste Ausfahrt:** Provisorisch am Lenker (Beutel), kurze Runde Hardtwald/Kraichgau,
   Abbiegehinweise und Off-Course-Warnung im Feld.
5. **M5 BLE-Sensoren:** Puls und Powermeter anbinden (ggf. mit Powermeter-Idee).
6. **M6 Gehäuse und Akku:** Dichtes Gehäuse, Halterung, Akkulaufzeit messen (Ziel 10+ h).
7. **M7 Tagestour:** Schwarzwald oder Pfälzerwald, nur mit dem Gerät.

M1 und M2 sind für alle Varianten gleich und lohnen sich auch, wenn am Ende C oder D gewählt wird.

## Offene Entscheidungen

- Variante A, B, C oder D (oder A nach Prototyp in C).
- Displaytyp: E-Paper oder transflektives LCD; Größe; Graustufen ja/nein.
- Konkretes GNSS-Modul und Display (Datenblätter prüfen, bevor etwas festgelegt wird).
- Kartenformat: Raster oder Vektor; Werkzeug zum Rendern; Zoomstufen; Region oder Korridor.
- Dateiformat für Track und Hinweise auf dem Gerät.
- Off-Course-Schwelle und Zeit (P), erst nach GNSS-Messung im Wald.
- Bedienung: Anzahl Tasten, Belegung.
- Laden: USB-C mit Kappe oder Magnetkontakt.
- Halterungssystem.
- Ein Gerät fürs Team oder eins pro Person (Budget).
- Zusammenspiel mit dem Powermeter.
