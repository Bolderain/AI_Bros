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

Die Wasserpumpe sitzt nicht im Gerät, sondern im Kanister (Tauchpumpe). Vom Kanister geht
ein Schlauch zum Gerät, vom Gerät ein Schlauch zum Tropfring. Im Gerät wird der Dünger in
diese Leitung eingespeist (T-Stück), so mischt sich das Konzentrat mit dem Gießwasser.

## Fertigung

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

## Design-Freiheit

Das Mockup in `../mockup/` zeigt eine Variante. Wenn das Team lieber ein flaches Kästchen
am Topfrand will, ändert sich an der Elektronik nichts. Der Flaschen-Formfaktor ist eine
Vorgabe aus dem Kickoff, keine technische Notwendigkeit.
