# Idee: Magnetisches Schachbrett gegen eine Schach-KI

Stand: 04.10.2026, Vorschlag von Kevin B. Noch nicht entschieden, eine von mehreren Ideen.

> **Weiter ausgearbeitet:** Aufbau, Magnetspalt, Stückliste und die offenen Punkte stehen in
> [`aufbau.md`](aufbau.md). Ein 59-Sekunden-Erklärvideo liegt unter [`video/`](video/),
> ein drehbares 3D-Modell der Mechanik unter [`3d/`](3d/).
> Zwischenzeitlich entschieden: **geschalteter Elektromagnet** statt abgesenktem
> Permanentmagnet, und **H-Bot** (ein Riemen) statt CoreXY.

## Idee

Ein Schachbrett, auf dem man gegen eine Schach-Engine spielt. Die Züge der KI führt ein Magnet
unter dem Brett aus, der die Figuren bewegt. Viel Hardware zum Tüfteln.

## Bausteine

| Baustein | Umsetzung (Vorschlag) |
|---|---|
| KI | Stockfish (freie Schach-Engine, Suchalgorithmus) auf dem vorhandenen Raspi, angebunden über die Python-Bibliothek python-chess |
| Bewegung | H-Bot-Portal unter dem Brett (ein Riemen, eine Ebene) mit zwei Schrittmotoren, **geschalteter Elektromagnet** auf dem Schlitten |
| Figuren | 3D-Druck auf dem A1 Mini, Magnet im Fuß, Filz unten |
| Zugerkennung Mensch | Reed-Kontakte oder Hall-Sensoren unter allen 64 Feldern, Auswertung über Multiplexer |
| Steuerung | ESP32 oder Raspi direkt, Schrittmotortreiber |

## Harte Stellen

- **Figur zwischen anderen durchziehen:** Weg über die Linien zwischen den Feldern (Springer, Schlagen, Rochade).
- **Geschlagene Figuren:** Parkplatz am Rand, Mechanik muss über das Spielfeld hinaus fahren.
- **Zugerkennung:** Sensoren sehen nur "besetzt", nicht welche Figur. Zug aus der Änderung ableiten.
- **Magnetkraft:** Figur soll gleiten, ohne Nachbarn mitzureißen. Magnetstärke, Brettdicke und Filz ausprobieren.

## Budget (Schätzung)

| Posten | ca. € |
|---|---|
| Schrittmotoren, Treiber, Riemen, Schienen | 60 bis 100 |
| Elektromagnet mit MOSFET-Treiber | 10 bis 20 |
| 64 Sensoren plus Multiplexer | 20 bis 40 |
| Magnete, Brettmaterial | 20 bis 40 |
| **Summe** | **ca. 110 bis 200** |

Raspi vorhanden, passt in das Budget von 300 €.

## Bewertung gegenüber dem Pflanzenautomaten

| | Schachbrett | Pflanzenautomat |
|---|---|---|
| Schwerpunkt | Mechanik, Motorsteuerung, Algorithmik | Sensorik, Regelung, Langzeitbetrieb |
| Feedback | schnell, nach Stunden sichtbar | langsam, Dauertest über Wochen |
| Risiko | gering | Wasserschaden möglich |
| Software | KI fertig (Stockfish) | Logik selbst schreiben |

## Offene Fragen

- Zieht der Mensch von Hand und nur die KI per Magnet?
- Brettgröße: groß (ca. 40 x 40 cm) oder kompakt?
- Steuerung über ESP32 oder direkt am Raspi?
