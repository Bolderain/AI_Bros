# 09 Mechanik und Gehäuse

Gehäuse, Formfaktor und integrierter Tank sind Themen von **Stufe 2**. Der Aufbau von Stufe 1 ist
ein Tischaufbau in einer Auffangwanne, Vorgaben in `00-spezifikation-stufe1.md`, Abschnitt 4.1:
fester Auslass 3 bis 5 cm neben der Sonde, Schläuche lose und zugentlastet, Elektronik oberhalb
des Wasserniveaus, blickdichte Behälter. Ob die Flaschengröße fest ist, entscheidet E8. Die
Spezifikation sagt: Formfaktor aus dem Autonomieziel ableiten, nicht umgekehrt.

## Formfaktor

Vorgabe: etwa eine 0,5-l-Bierflasche. Referenzmaße einer Euro-Bierflasche: ca. 27 cm hoch,
ca. 7 cm Durchmesser im Bauch. Das Gehäuse wird ein Rohr mit 70 mm Außendurchmesser und
ca. 220 mm Länge plus einem Erdspieß unten. Es steckt wie ein Pflanzstab am Topfrand in der Erde.

## Aufteilung von oben nach unten

```
        +----------+   Deckel: USB-C-Buchse, Status-LED, Taster
        | Kopf     |   Luftsensor SHT40 (optional) hinter Lüftungsschlitzen
        | 40 mm    |   ggf. Solarzelle im Deckel
        +----------+
        | Elektro- |   ESP32-C6-Board, DRV8833, HX711 auf Lochraster
        | nik      |   Schlauchanschlüsse seitlich: Ansaugung vom Tank, Auslass zum Topf
        | 60 mm    |
        +----------+
        | Akku     |   18650 längs im Halter
        | 70 mm    |
        +----------+
        | Pumpen   |   2 Schlauchpumpen (Wasser, Dünger), Düngerflasche 100 ml seitlich
        |          |   angeclipst oder im Rohr (dann Akku kürzer, LiPo-Pouch statt 18650)
        | 50 mm    |
        +----------+
        | Spieß    |   Kapazitive Sonde in Nut, ca. 80 mm in der Erde
        | 80 mm    |   Kabel innen nach oben
        +----------+
```

**Gehäuse-Prototyp A (Stufe 2):** Beide Schlauchpumpen sitzen im Gerät. Ein Ansaugschlauch führt
in den externen Tank, der auf einer Wägezelle steht. Vom Gerät gehen Wasser und Dünger zum festen
Auslass neben der Sonde. Keine Tauchpumpe im Tank, wegen Heberrisiko (Spezifikation 4.2).

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
| Wägezelle unter dem Tank | 4-polig, steckbar, 1,5 m Kabel |
| Wägezelle Dünger | intern |
| Ansaugschlauch Tank, Auslassschlauch Topf | Schlauchtüllen seitlich |
| USB-C Laden/Programmieren | Buchse im Deckel, Verlängerung zum Board |

## Gehäuse-Prototyp B: Tank im Gerät (Stufe 2)

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
- Ansaugschlauch am tiefsten Punkt, Tank auf Wägezelle für Füllstand und Förderkontrolle.
- Lichtdicht (dunkles Filament), sonst Algen.
- Reinigbar: Deckel groß genug für einen Flaschenbürste.

Bis der integrierte Tank existiert, bleibt der externe Tank. Prototyp B ändert an Elektronik und
Firmware nichts, nur die Wägezelle wandert in den Sockel.

## Wie klein geht es semi-professionell?

Die 0,5-l-Flasche ist eine Vorgabe aus dem Kickoff, kein Minimum. Mit eigener Platine statt
Lochraster und ohne externen Kanister lässt sich das Gerät deutlich verkleinern. Grenze ist
nicht die Elektronik, sondern der Akku und der Wasservorrat.

### Was wie viel Platz braucht

| Baugruppe | Lochraster-Aufbau (Prototyp A) | Semi-professionell (eigene Platine) |
|---|---|---|
| Controller | FireBeetle 2 oder XIAO ESP32-C6 (kleinste Fertigboard-Variante, 21 x 18 mm), gesteckt | ESP32-C6-Mini-Modul direkt auf die Platine gelötet, ca. 15 x 13 mm |
| Luftsensor | SHT40-Breakout, ca. 15 x 15 mm | SHT40 als nacktes Bauteil auf der Platine, wenige mm2 |
| Boost, MOSFETs | 3 Module | in die Platine integriert, wenige mm2 |
| Verkabelung | Steckbrücken, JST, viel Luft | Leiterbahnen, fast kein Volumen |
| Akku | 18650, 18 x 65 mm | LiPo-Pouch nach Formfaktor, z. B. 30 x 40 x 6 mm für 700 mAh |
| Feuchtesensor | Fertigplatine am Kabel | eigener vergossener Spieß, so dünn wie ein Pflanzstab |

Die reine Elektronik passt semi-professionell auf eine Platine von etwa 25 x 60 mm. Der Rest ist
Akku, Sensorspieß und, falls integriert, Wasser.

### Drei realistische Baugrößen

| Variante | Maße (ca.) | Vergleich | Akku | Wasser | Bemerkung |
|---|---|---|---|---|---|
| Kompakt am Kabel | 20 x 20 x 130 mm | dicker Bleistift, Pflanzstab | LiPo 500 mAh im Griff | extern | Nur Sensor plus Funk, Pumpe und Dünger in einer getrennten kleinen Box am Kanister. Der Teil, der in der Erde steckt, ist winzig |
| Kompakt autark | 40 x 40 x 150 mm | kleine Parfumflasche | LiPo 1000 mAh | extern | Alles außer Wasser im Gerät, Kanister daneben. Realistisch das kleinste "alles drin außer Wasser" |
| Halbe Flasche | Durchmesser 45 mm, 160 mm hoch | halbe 0,33-l-Dose | 18650 | ca. 150 ml intern (wenige Tage) | Wenn ein kleiner interner Vorrat reichen soll |

Mit eigener Platine, LiPo statt 18650 und SMD-Sensoren ist ein Gerät von der Größe eines
dicken Filzstifts machbar, das misst und funkt, während Pumpen und Tank in einer getrennten Box sitzen. Die früher erwogene Variante mit Schwerkraft und bistabilem Ventil hat ein Flutrisiko (`06`) und ist nicht vorgesehen.
Sobald ein nennenswerter Wasservorrat (Wochen) im Gerät sein soll, gewinnt das Wasser
den Kampf um das Volumen und das Gerät wird zwangsläufig größer, egal wie klein die Elektronik ist.

### Kosten der Miniaturisierung

- Eigene Platine (KiCad, Fertigung bei JLCPCB): ca. 2 Euro pro Platine bei 5 Stück plus
  Bestückung, plus Lernaufwand. Passt zu "mit HW rumspielen".
- SMD-Löten von Hand: SHT40 und ESP32-Modul sind mit Heißluft und ruhiger Hand machbar,
  QFN ist fummelig. Alternativ Bestückung bei JLCPCB mitbestellen.
- Gehäuse: kleiner heißt engere Toleranzen. Der A1 Mini druckt 0,4-mm-Wände, für ein
  20-mm-Rohr wird es knapp, aber machbar.

## Design-Freiheit

Das Mockup in `../mockup/` zeigt eine Variante. Wenn das Team lieber ein flaches Kästchen
am Topfrand will, ändert sich an der Elektronik nichts. Der Flaschen-Formfaktor ist eine
Vorgabe aus dem Kickoff, keine technische Notwendigkeit.
