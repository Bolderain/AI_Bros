# Schachbrett: Aufbau und Stückliste

Stand: 04.10.2026. Gehört zur Projektidee in [`README.md`](README.md).
Preise und nicht gemessene Werte sind **Schätzungen**, Werte mit **(P)** sind Vorschläge.
Entschieden ist noch nichts.

![Aufbau-Skizze](aufbau.png)

Wer die Mechanik lieber dreht statt liest: unter [`3d/`](3d/) liegt ein

drehbares 3D-Modell mit Explosionsansicht und den Fahrbewegungen.

## Kennzahlen

| Größe | Wert | Bemerkung |
|---|---|---|
| Feldgröße | 50 mm (P) | Spielfeld 400 × 400 mm |
| Figurenbreite | ≤ 24 mm | auf jeder Höhe — halbe Feldgröße minus Reserve |
| Magnetspalt | ≈ 8 mm | Spulen-Polfläche bis Stahlscheibe im Fuß |
| Verfahrweg | 500 × 450 mm | Spielfeld plus zwei Parkspuren |
| Bauhöhe | ≈ 55 mm | Brettoberkante bis Fußunterkante |
| Zugdauer | 2–3 s | rund 150–250 mm Fahrt bei 80 mm/s |

Die bestimmende Regel: gefahren wird nur auf den Linien zwischen den Feldern.
Dort beträgt der Abstand zu jeder stehenden Figur genau ein halbes Feld, also gilt
`r_fahrend + r_stehend ≤ s/2` und damit **Figurenbreite ≤ halbe Feldgröße**.

## Schichtaufbau von oben nach unten

| Schicht | Dicke | Was und warum |
|---|---|---|
| Figur | — | Stahlscheibe Ø12 × 2 mm im Fuß, PTFE-Gleiter unten |
| Brettplatte | 4,0 mm | Floatglas, Motiv rückseitig gedruckt |
| Sensorlage | 1,0 mm | SMD-Hall auf dünner Platine — liegt im Magnetspalt |
| Luftspalt | 1,5 mm | Reserve für Durchbiegung und Toleranz |
| Elektromagnet | — | Topfmagnet auf dem Schlitten, Polfläche nach oben |
| H-Bot-Portal | — | 8-mm-Wellen, LM8UU, ein GT2-Riemen |
| Antrieb | — | 2 × NEMA 17 Pancake, TMC2209, Spulentreiber |
| Bodenplatte | 5,0 mm | plus Filzfüße |

Der Magnetspalt ist die Summe aus Figurenboden, Glas, Sensorlage und Luft:
rund **8 mm**. Jeder Millimeter mehr kostet spürbar Kopplung, deshalb muss die
Sensorlage dünn bleiben — oder ganz entfallen (siehe Sparhebel).

## Stückliste

Der Raspi ist laut Repo vorhanden und steht nicht in der Liste. Versand ist nicht eingerechnet.

### Brett und Figuren

| Pos | Bauteil | Menge | ca. € | Hinweis |
|---|---|---|---|---|
| B01 | Floatglas 4 mm, 440 × 440 mm, Kanten geschliffen | 1 | 25 | Zuschnitt; bleibt ohne Mittelstütze eben |
| B02 | Druck/Folie Schachbrettmotiv, rückseitig | 1 | 15 | Oberseite bleibt blankes Glas |
| B03 | PTFE-Gleiter selbstklebend Ø 12 mm | 32 | 8 | μ ≈ 0,05–0,1; Filz ruckelt und sammelt Staub |
| B04 | Stahlscheibe Ø 12 × 2 mm, verzinkt | 32 | 6 | im Fuß; Stahl statt Magnet → keine Polarität |
| B05 | Filament für 32 Figuren (A1 Mini) | 1 Satz | 10 | max. 24 mm Breite auf jeder Höhe |
| B06 | Rahmen, 6 gedruckte Segmente + Schrauben | 1 | 12 | A1 Mini schafft nur 180 mm am Stück |
| B07 | Bodenplatte 5 mm, 520 × 470 mm + Filzfüße | 1 | 12 | Sperrholz oder Acryl |
| | **Zwischensumme** | | **88** | |

### Magnet und Elektronik

| Pos | Bauteil | Menge | ca. € | Hinweis |
|---|---|---|---|---|
| E01 | Topf-Elektromagnet 12 V, Ø 20–25 mm, ca. 5 W | 1 | 8 | Kern nach oben; Einschaltdauer ≈ 5 %, Wärme unkritisch |
| E02 | Logic-Level-MOSFET + Freilaufdiode | 1 | 5 | Freilaufdiode zwingend, sonst stirbt der FET |
| E03 | Netzteil 12 V / 3 A | 1 | 12 | Motoren und Spule gemeinsam |
| E04 | Schrittmotor NEMA 17 Pancake | 2 | 24 | flach, damit die Bauhöhe stimmt |
| E05 | Treiber TMC2209 | 2 | 12 | StealthChop — ein lautes Brett zerstört den Effekt |
| E06 | Steuerung ESP32 | 1 | 8 | FluidNC kann H-Bot-Kinematik und Homing fertig |
| E07 | SMD-Hall-Sensoren + 8 Platinenstreifen | 64 | 35 | dünn bauen; eine große Platine wäre unbezahlbar |
| E08 | Endschalter | 2 | 3 | Referenzfahrt beim Einschalten |
| E09 | Schleppkette / flexible Leitung zum Schlitten | 1 | 8 | führt den Spulenstrom mit |
| | **Zwischensumme** | | **115** | |

### Mechanik

| Pos | Bauteil | Menge | ca. € | Hinweis |
|---|---|---|---|---|
| M01 | Rundwelle 8 mm, 450 mm (Y) | 2 | 12 | gehärtet und geschliffen |
| M02 | Rundwelle 8 mm, 520 mm (X) | 1 | 7 | trägt den Schlitten |
| M03 | Linearlager LM8UU | 6 | 9 | je 2 pro Y-Seite gegen Verwinden |
| M04 | GT2-Riemen 6 mm, 2,5 m | 1 | 7 | H-Bot: genau ein Riemen, eine Ebene |
| M05 | GT2-Pulley 20 Z (2) + Umlenkrollen F623 (6) | 8 | 10 |  |
| | **Zwischensumme** | | **45** | |

**Summe ca. 248 €** von 300 € Budget, Reserve ca. 52 € (Schätzung, ohne Versand).


### Optional: Identifikation und Anzeige

Noch nicht entschieden, deshalb getrennt gerechnet.

| Pos | Bauteil | Menge | ca. € | Hinweis |
|---|---|---|---|---|
| O01 | NFC-Lesemodul PN532, auf dem Schlitten | 1 | 8 | einer statt 64 — er fährt ja ohnehin überall hin |
| O02 | NFC-Tags on-metal, Ø 15 mm | 32 | 10 | Störung durch die Stahlscheibe im Fuß vorher messen |
| O03 | E-Paper 2,9" SPI, in der Rahmenleiste | 1 | 25 | behält den Text ohne Strom und blendet nicht |
| | **Zwischensumme** | | **43** | |

Mit Option **ca. 291 €**, Reserve dann nur noch ca. 9 €.
Dann wird es Zeit, bei der Zugerkennung von Hall auf Reed zu gehen oder die Kamera-Variante ernsthaft zu rechnen.

## Wo man sparen kann

| Hebel | Ersparnis | Preis dafür |
|---|---|---|
| Kamera statt 64 Sensoren | −20 € | spart E07/E08 teilweise, verlagert alles in Software, und die Sensorlage verschwindet aus dem Magnetspalt |
| Feldgröße 45 mm statt 50 mm | −12 € | kleineres Glas, kürzere Wellen — aber Figuren nur noch 21 mm breit |
| Raspi direkt statt ESP32 | −8 € | Raspi ist laut Repo vorhanden; dann fehlt aber die fertige H-Bot-Kinematik |

## Zugerkennung: das Brett weiß nicht, welche Figur wo steht

Ein Hall-Sensor beantwortet genau eine Frage: liegt gerade Stahl über mir, ja oder nein. Er weiß nicht, ob das ein Bauer oder die Dame ist, und auch nicht, welche Farbe. Aus 64 Sensoren kommt also nur ein Belegungsbild, kein Stellungsbild.

Die Identität der Figuren kommt nie aus der Hardware, sondern aus der Software: der Rechner führt die Stellung ohnehin mit, weil die Engine sie braucht. Das Brett liefert nur den Auslöser. **Aus der Differenz zweier Belegungsbilder plus der bekannten Stellung lässt sich der Zug eindeutig rekonstruieren.**

Hebst du den Springer von b1 und setzt ihn auf c3, wird b1 frei und c3 besetzt. Die Software weiß, dass dort dein Springer stand, bildet `b1c3` und prüft gegen die Liste der legalen Züge. Spannend wird es bei den Sonderfällen:

| Fall | Was die Sensoren sehen | Auflösung |
|---|---|---|
| Schlagen | nur **ein** Feld ändert sich, das Zielfeld bleibt besetzt | auf dem Zielfeld stand laut Stellung eine gegnerische Figur |
| Rochade | vier Felder auf einmal | eindeutig, kein anderer Zug fasst vier Felder an |
| En passant | drei Felder, das verschwindende liegt **neben** dem Ziel | eindeutig an der Geometrie |
| Umwandlung | wie ein normaler Bauernzug auf die Grundreihe | **nicht auflösbar** — hier muss gefragt werden: Dame, Turm, Läufer oder Springer? |

Beim Hochheben ist die Stellung kurzzeitig ungültig: Startfeld schon frei, Zielfeld noch leer. Deshalb wird nicht jede Änderung sofort ausgewertet, sondern erst, wenn die Belegung für etwa 300 bis 500 ms (P) ruhig ist. Ergibt die Differenz dann keinen legalen Zug, passiert nichts — lieber warten als raten.

Zwei harte Regeln aus dem Aufbau:

- **Der Elektromagnet blendet die Sensorik.** Er ist viel stärker als die Stahlscheibe in einer Figur, also meldet jedes Feld, über das er fährt, „besetzt". Sensorwerte gelten nur, wenn der Schlitten außerhalb des Spielfelds in der Home-Ecke parkt. Während der Roboter fährt, zieht ohnehin niemand.
- **Jeder Roboterzug prüft sich selbst.** Danach muss die Belegung exakt so aussehen wie erwartet. Tut sie das nicht, ist eine Figur verloren gegangen oder das Portal hat Schritte verloren — dann anhalten, statt blind weiterzufahren.

## Welche Figur ist das? (optional)

Die Identität braucht man nur an drei Stellen: beim **Aufbau**, bei der **Umwandlung** und im **Fehlerfall**, wenn die Belegung nicht mehr zur Stellung passt. Alles seltene Momente ohne Zeitdruck. Damit braucht es kein System, das 64 Felder permanent identifiziert — ein langsamer Scan auf Abruf reicht.

Daraus folgt die entscheidende Vereinfachung: **der Leser fährt mit.** Das Portal kommt ohnehin überall hin, also sitzt ein einziger Leser auf dem Schlitten statt 64 in der Platine. Kein Multiplexer, keine 64-fach-Verkabelung, und die Sensorlage im Magnetspalt bleibt dünn. Ein Komplettscan dauert dann geschätzt 30 bis 60 Sekunden — beim Spielstart einmal, danach nur im Zweifel.

| Verfahren | Wie | Bewertung |
|---|---|---|
| **RFID / NFC** | Tag im Fuß, Leser auf dem Schlitten | **Favorit.** Tags kosten Cent, eindeutige UID, Reichweite passt zum Magnetspalt. Achtung: die Stahlscheibe stört die Antenne — On-Metal-Tag oder exzentrisch setzen |
| LC-Schwingkreis | passive Spule plus Kondensator, je Figurenart eine andere Resonanzfrequenz | So machen es die DGT-Turnierbretter. Völlig passiv und robust, aber Spulen wickeln und abgleichen ist Fummelarbeit |
| Analoger Hall | abgestufte Magnetstärken je Figurenart | Billigste Variante, braucht keinen zweiten Sensortyp. Nur grob, und sie bringt die Polarität zurück, die wir mit der Stahlscheibe losgeworden sind |
| Polarität | Nordpol oben = Weiß, Südpol oben = Schwarz | Kostet fast nichts und löst immerhin die halbe Frage. Gut kombinierbar |
| Kontakte im Feld | Federkontakte, je Figur ein anderer Widerstand | **Scheidet aus.** Die Figuren sollen über glattes Glas gleiten — Kontakte bedeuten Vertiefungen, Verschleiß und Dreck |
| Gewicht | Wägezelle unter dem Brett | **Unbrauchbar.** Unterschiede zu klein, und man misst immer die Summe |

Offener Punkt vor dem Kauf: **wie stark stört die Stahlscheibe den Tag?** Beides sitzt im selben Fuß, rund zwei Zentimeter auseinander. Das ist ein Zehn-Euro-Test mit zwei Mustern, bevor 32 Figuren gedruckt werden.

## Engine, Spielstärke und Training

Stockfish läuft auf einem Raspberry Pi 5 problemlos — es ist C++ mit ARM64-Builds, `apt install stockfish` genügt. Selbst kompilieren lohnt trotzdem (`make ARCH=armv8-dotprod`), weil der Cortex-A76 Dot-Product-Befehle hat, die das NNUE-Netz beschleunigen. Geschätzt ein bis drei Millionen Knoten pro Sekunde über alle vier Kerne, also weit mehr als nötig. Den aktiven Kühler nicht weglassen.

Das eigentliche Problem ist das Gegenteil: **Stockfish ist viel zu stark.** `UCI_Elo` hört bei etwa 1320 auf, und schon darüber fühlt es sich falsch an. Gedrosselt spielt es nicht schwächer, sondern **unmenschlich** — zwanzig starke Züge, dann stellt es grundlos eine Figur ein. Ein Anfänger lernt daraus nichts.

Für echte Anfänger ist **Maia** die bessere Antwort: ein neuronales Netz, das nicht auf Gewinnen trainiert wurde, sondern darauf, den Zug vorherzusagen, **den ein Mensch dieser Spielstärke spielen würde**. Es gibt fertige Netze für 1100, 1200, 1300 bis 1900. Maia macht die Fehler, die Menschen machen, nicht die, die ein Würfel macht. Es läuft über lc0 mit einem einzigen Knoten, also eine Netzauswertung pro Zug — auf dem Pi 5 über die CPU-Backends unkritisch. Aufwand: lc0 für ARM selbst bauen.

Saubere Rollentrennung, beide Engines passen gleichzeitig auf den Pi:

| Rolle | Engine | Aufgabe |
|---|---|---|
| Gegner | Maia 1100 bis 1500, einstellbar | spielt menschlich auf dem gewünschten Niveau |
| Trainer | Stockfish | bewertet deine Züge und sagt, was besser gewesen wäre |

Falls lc0 zu viel Aufwand ist: Stockfish auf `Skill Level 0` **ohne Dame** ist für einen Anfänger ein realistischer und erklärbarer Gegner, und es ist eine Zeile Code.

Zum Training: Stockfish erklärt nichts, es liefert Zahlen. Die Bewertung **vor** und **nach** deinem Zug ergibt den Verlust in Bauernhundertsteln, und daraus wird die übliche Einstufung — unter 50 gut, 50 bis 100 Ungenauigkeit, 100 bis 300 Fehler, darüber Patzer. Mit `MultiPV` bekommt man die besten Alternativen dazu und damit schon einen brauchbaren Satz: „Dein Lf4 kostet 2,1 Bauern, besser war Sxe5."

Für das **Warum** braucht es eine Schicht darüber. Entweder selbst gestrickte Mustererkennung — python-chess kennt Angreifer, Fesselungen und Schachgebote, damit deckt man „Figur eingestellt", „Gabel übersehen" und „Matt verpasst" ab, also das meiste im Hobbybereich. Oder ein Sprachmodell, das Stellung, Zug, Bewertungsdifferenz und die besten Varianten bekommt und daraus einen Satz formt. Weniger Code, natürlichere Erklärung, braucht aber Netz — und das Modell darf die Zahlen nur erklären, nicht selbst bewerten.

Und der schönste Ausgabekanal kostet keine Hardware: **der Magnet kann den besseren Zug einfach vorspielen.** Figur nehmen, auf das richtige Feld fahren, zurückstellen. Das kann kein Bildschirm.

## Anzeige am Gerät

Statt einer App ein Display im Rahmen — und dafür **E-Paper** statt TFT: es sieht aus wie bedrucktes Papier statt wie ein leuchtender Bildschirm neben Holz und Glas, es behält den Text ohne Strom, und der Refresh von ein bis zwei Sekunden ist für „Das war ein Patzer, schau dir f7 an" völlig egal. 2,9 Zoll (296 × 128) reichen für zwei, drei Zeilen; 4,2 Zoll könnten zusätzlich ein kleines Stellungsdiagramm zeigen.

**LEDs unter den Feldern** wären die naheliegende Alternative — sind es aber nicht. Sie müssten unters Glas, also in den Magnetspalt, und der ist mit 8 mm schon knapp. Das Display außen am Rahmen umgeht das Problem komplett.

## Offene Punkte

- Sensorlage oder Kamera? Das entscheidet den Magnetspalt und einen großen Teil der Software.
- Feldgröße 50 mm fixieren, bevor Glas und Wellen bestellt werden — davon hängt alles ab.
- Spulenstrom und Haltekraft messen, bevor 32 Figuren gedruckt werden.
- Einschaltdauer der Spule im Dauerbetrieb prüfen (geschätzt ≈ 5 %, damit unkritisch).
- Stört die Stahlscheibe im Fuß den NFC-Tag? Zwei Muster bauen, bevor 32 Figuren gedruckt werden.
- Maia über lc0 auf ARM bauen — oder erst mit Stockfish ohne Dame anfangen?
