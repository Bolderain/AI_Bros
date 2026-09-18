# 09 Mechanik und Gehäuse

## Formfaktor

Vorgabe: etwa eine 0,5-l-Bierflasche. Referenzmaße einer Euro-Bierflasche: ca. 27 cm hoch,
ca. 7 cm Durchmesser im Bauch. Das Gehäuse wird ein Rohr mit 70 mm Außendurchmesser und
ca. 220 mm Länge plus einem Erdspieß unten. Es steckt wie ein Pflanzstab am Topfrand in der Erde.

## Aufteilung von oben nach unten

```
        +----------+   Deckel: USB-C-Buchse, Status-LED, Taster
        | Kopf     |   Luftsensor SHT40 und Lichtsensor BH1750 hinter Lüftungsschlitzen
        | 40 mm    |   (Licht braucht ein klares Fenster nach oben)
        +----------+
        | Elektro- |   XIAO ESP32-C6, Boost, MOSFETs auf Lochraster
        | nik      |   Schlauchanschlüsse seitlich: Wasser rein, Wasser raus (Tropfring)
        | 60 mm    |
        +----------+
        | Akku     |   18650 längs im Halter
        | 70 mm    |
        +----------+
        | Dosier-  |   Peristaltikpumpe, Düngerflasche 100 bis 150 ml seitlich angeclipst
        | einheit  |   oder im Rohr (dann Akku kürzer, LiPo-Pouch statt 18650)
        | 50 mm    |
        +----------+
        | Spieß    |   Kapazitiver Feuchtesensor und DS18B20 in Nut, ca. 80 mm in der Erde
        | 80 mm    |   Kabel innen nach oben
        +----------+
```

**Prototyp A (Iteration 4 bis 6):** Die Wasserpumpe sitzt nicht im Gerät, sondern im Kanister (Tauchpumpe). Vom Kanister geht
ein Schlauch zum Gerät, vom Gerät ein Schlauch zum Tropfring. Im Gerät wird der Dünger in
diese Leitung eingespeist (T-Stück), so mischt sich das Konzentrat mit dem Gießwasser.

## Fertigung auf dem Bambu A1 Mini

Bauraum des A1 Mini: 180 x 180 x 180 mm. Das Rohr mit 220 mm Länge wird deshalb in zwei
Teilen gedruckt (Oberteil 120 mm, Unterteil 100 mm) und mit Bajonett oder Gewinde verbunden.
Der Spieß wird separat gedruckt und mit Epoxid eingesetzt.

Druckhinweise:

- Material PETG (feuchteresistent, nicht spröde). Für Tankteile PETG mit 4 Wänden und
  100 % Infill in den Böden, damit sie dicht werden. PLA nimmt Wasser auf und verzieht sich.
- Rohrteile stehend drucken, Wandstärke 2,4 mm (6 Linien bei 0,4-mm-Düse), keine Stützen nötig.
- Gewinde: Bambu Studio druckt M-Gewinde ab ca. 60 mm Durchmesser sauber, alternativ
  Bajonett mit drei Nasen, das ist toleranter.
- Dichtungen: O-Ring-Nut mit 2 mm Schnur, oder gedruckte Nut und Silikon aus der Tube.

## Fertigungsoptionen

| Option | Vorteil | Nachteil |
|---|---|---|
| **3D-Druck PETG** (empfohlen) | Frei gestaltbar, Nuten und Halterungen direkt drin, Druckdienst falls kein Drucker | Nicht wasserdicht ohne Dichtung, Schichtlinien |
| HT-Abflussrohr DN 75 (Baumarkt) | 2 Euro, wasserdicht, sofort da | Innenausbau nur mit gedruckten Einsätzen |
| Echte Bierflasche | Optik | Glas bohren, keine Chance auf Zugang zur Elektronik |

Kombination: HT-Rohr als Außenhülle plus gedruckte Einsätze (Deckel, Spieß, Akkuhalter,
Pumpenhalter). Das ist schnell und dicht, und lässt sich später durch ein komplett gedrucktes
Gehäuse ersetzen.

## Feuchteschutz

- Elektronik über dem Wasserpfad, alle Schläuche seitlich raus, nie durch das Elektronikfach.
- Sensorspieß mit Epoxid vergossen, nur die Sensorfläche frei.
- Deckel mit O-Ring oder Silikondichtung. Das Gerät wird beim Gießen nass.
- Kondenswasser: kleine Bohrung unten im Elektronikfach als Abfluss.

## Kabel und Anschlüsse

| Anschluss | Typ |
|---|---|
| Sensorspieß | intern, fest |
| Tauchpumpe im Kanister | 2-polig JST, 1,5 m Kabel |
| Schwimmerschalter Kanister | 2 x 2-polig JST |
| Schwimmerschalter Dünger | intern |
| USB-C Laden/Programmieren | Buchse im Deckel, Verlängerung zum XIAO |

## Prototyp B: Tank im Gerät (Iteration 7, Stufe 1b)

Endziel laut Team: Der Wassertank ist im Gerät, kein Kanister mehr. Rechnung: Bei 80 ml alle
2 Tage braucht die Pflanze ca. 1,2 l pro Monat. Für 3 Wochen Vorrat sind ca. 1 l Tank nötig.

Ein Zylinder mit 70 mm Innendurchmesser fasst 38 ml pro cm Höhe. 1 l wären 26 cm nur Tank.
Das passt nicht mehr in die 0,5-l-Flasche. Optionen:

| Option | Maße (ca.) | Tank | Bemerkung |
|---|---|---|---|
| B1: Dickere Flasche | 100 mm Durchmesser, 300 mm hoch | ca. 1,5 l im unteren Teil | Sieht noch aus wie eine Flasche (Magnum), Elektronik oben, Akku mittig, Tank unten. Zwei Drucke auf dem A1 Mini |
| B2: Sockel-Tank | Rohr 70 mm wie Prototyp A, steht auf einem flachen Tank 160 x 160 x 60 mm | ca. 1,2 l | Tank in einem Stück druckbar (unter 180 mm), Rohr bleibt gleich. Gerät steht neben dem Topf, nicht drin |
| B3: Topfmanschette | Ring um den Topf herum | 1 bis 2 l | Tank ist unsichtbar, aber jeder Topf braucht seinen Ring |

Empfehlung: **B2**, weil Prototyp A unverändert bleibt und der Tank ein eigenes, austauschbares
Druckteil ist. Wenn B2 dicht ist, kann B1 als Designvariante folgen.

Anforderungen an den gedruckten Tank:

- Dicht: 4 Wände, Böden 100 % Infill, innen mit Epoxid oder XTC-3D beschichten, 24 h Wassertest.
- Nachfüllöffnung oben mit Deckel, Durchmesser mindestens 30 mm (Gießkanne).
- Tauchpumpe im tiefsten Punkt, Schwimmerschalter "leer" 1 cm über der Pumpe.
- Lichtdicht (dunkles Filament), sonst Algen.
- Reinigbar: Deckel groß genug für einen Flaschenbürste.

Bis der integrierte Tank existiert, bleibt der externe Kanister. Prototyp B ändert an
Elektronik und Firmware nichts, nur der Pumpenstecker wandert nach innen.

## Design-Freiheit

Das Mockup in `../mockup/` zeigt eine Variante. Wenn das Team lieber ein flaches Kästchen
am Topfrand will, ändert sich an der Elektronik nichts. Der Flaschen-Formfaktor ist eine
Vorgabe aus dem Kickoff, keine technische Notwendigkeit.
