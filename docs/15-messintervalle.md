# 15 Messintervalle: aus Sicht der Pflanze

Leitgedanke: nicht so oft messen, wie die Elektronik kann, sondern so oft, wie es die Pflanze
braucht. Und das Ziel ist maximale Laufzeit ohne Nachladen und Nachfüllen. Beides zeigt in die
gleiche Richtung: selten messen, selten senden.

Maßgeblich: `00-spezifikation-stufe1.md`, R14 und Abschnitt 5.1. Kurz: **Entschieden wird in
beiden Stufen einmal täglich morgens.** Gemessen wird in Stufe 1 alle 15 min (P), aber nur für die
Datenbasis. In Stufe 2 misst das Gerät einmal täglich.

## Wie ein Mensch gießt, so soll das Gerät messen

Ein Mensch schaut alle paar Tage nach der Pflanze, steckt den Finger in die Erde und gießt bei
Bedarf, am besten morgens. Genau das ist der Maßstab. Die Erde ist ein träger Speicher, sie
ändert sich über Tage, nicht über Minuten. 48 Messungen am Tag liefern 48 fast gleiche Werte.

## Stufe 2: eine Aktivphase pro Tag, morgens

| Schritt | Zeitpunkt | Was passiert |
|---|---|---|
| Aufwachen | einmal täglich, früher Morgen | Sensor an, Bodenfeuchte 8-fach mitteln, Akku messen |
| Entscheiden | sofort | Feuchte unter Schwelle und Sperrzeit vorbei? Dann gießen |
| Gießen | morgens | Bester Zeitpunkt: Pflanze verbraucht das Wasser über den Tag, Wurzeln stehen nachts nicht nass und kalt |
| Melden | einmal täglich | Eine Tagesnachricht: Feuchte, ob gegossen wurde, Akku, Warnungen |
| Schlafen | Rest des Tages | Gerät ist praktisch aus |

Morgens ist keine Kür, sondern gärtnerisch richtig. Deshalb wird die eine Aktivphase per
Uhrzeit ausgelöst (Deep Sleep bis Uhrzeit, Zeit per NTP), nicht per festem Intervall. Auch in
Stufe 1 entscheidet `plant_logic` nur im Gießfenster und höchstens einmal pro Tag.

## Warum eine zweite Messung am Tag Sinn haben kann (aber nicht muss)

Der einzige gute Grund für einen zweiten Blick: prüfen, ob das Gießen gewirkt hat. Die
Spezifikation macht das zur Pflicht: Nach `rise_check_delay_min` (60 min (P)) muss die Feuchte um
`moisture_rise_min_pct` gestiegen sein, sonst Sperre und Alarm. In Stufe 1 passiert das im
laufenden 15-min-Takt. In Stufe 2 entweder mit einem zweiten kurzen Weck-Termin am selben Morgen
oder im nächsten Zyklus. Für eine Zimmerpflanze ist ein Tag Verzug unkritisch. Ob Pumpe oder
Tank versagt haben, zeigt zusätzlich die Wägezelle sofort nach dem Pumpenlauf.

## Senden

In Stufe 1 wird jede Messung publiziert. In Stufe 2 reicht einmal am Tag:

| Was | Wann gesendet |
|---|---|
| Tagesmeldung (Feuchte, Gießen ja/nein, Akku, Temperatur falls gemessen) | einmal täglich, in der Morgen-Aktivphase |
| Warnungen (Tank leer, Förderfehler, Feuchte nach Gießen nicht gestiegen, Akku schwach, Sensorfehler) | in derselben Aktivphase, denn genau dann fallen sie auf |

Der Trick: Ein leerer Tank fällt beim morgendlichen Gießversuch auf. Das Gerät muss dafür nicht
dauernd erreichbar sein. Es merkt und meldet das Problem in dem Moment, in dem es handeln will.
Deshalb reicht einmal senden pro Tag, ohne dass Warnungen liegen bleiben. Die Zentrale wertet
erst 26 h (P) ohne `state` als Ausfall, und Deep Sleep gilt nicht als Fehler (`status`-Topic).

## Stufe 1: warum trotzdem alle 15 Minuten?

Nicht wegen der Pflanze, sondern wegen der Daten. Am Netzteil kostet Messen nichts, und die
Kurve wird gebraucht: Trocknungskurve über 7 Tage für die Kalibrierung (M1), Anstiegsprüfung nach
dem Gießen, Erkennung von Handgießen (R21) und eine saubere Datenbasis für die spätere KI (R12).
Jede Minute wäre zu viel, das bläht den Verlauf in Home Assistant und die Schreiblast auf der
SD-Karte auf. Mit dem Akku in Stufe 2 geht das Gerät auf eine Aktivphase pro Tag. Das ist kein
Rückschritt, sondern der eigentliche Betriebsmodus.

## Welche Sensoren überhaupt?

| Sensor | Für die Regelung nötig? | Entscheidung |
|---|---|---|
| Bodenfeuchte | Ja, die einzige zeitkritische Größe | Pflicht (R02) |
| Wägezellen Tank und Dünger | Ja, Restmenge und Förderkontrolle | Pflicht bzw. Soll (R07), vor und nach jedem Pumpenlauf |
| Lufttemperatur, Luftfeuchte | Nein, der Effekt steckt schon in der Bodenfeuchte. Für die KI aber nützlicher Kontext | Kann (R22) |
| Bodentemperatur | Nein, ändert sich langsam, treibt keinen Aktor | gestrichen |
| Licht | Nein, siehe unten | gestrichen |
| Akkuspannung | Ja, für die Laufzeitprognose | Stufe 2, bei jeder Aktivphase |

### Warum der Lichtsensor gestrichen wird

- Für die Gießentscheidung liefert Licht nichts Eigenes: Mehr Licht heißt schnelleres
  Austrocknen, und das sieht der Feuchtesensor bereits.
- Die Messung ist leicht gestört: ein Blatt, der Standort des Geräts, Gardine, Tageszeit.
- Ein Dauer-Lichtlog über Jahre hat kaum Aussagekraft.
- Der einzige echte Nutzen wäre eine einmalige Standortprüfung ("steht zu dunkel"), und die
  macht man einfacher von Hand mit dem Handy.

Konsequenz: ein Bauteil, ein I2C-Teilnehmer und dessen Ruhestrom weniger. Falls die Solarzelle
im Deckel kommt (siehe `06-stromversorgung.md`), liefert deren Ladestrom nebenbei ein grobes
Hell/Dunkel-Signal, ganz ohne eigenen Sensor.

## Was das für die Laufzeit bedeutet (der eigentliche Punkt)

Wenn man einmal am Tag misst und sendet, ist die Elektronik nicht mehr der Flaschenhals.
Tagesbudget für Stufe 2 (Schätzung, Details in `06-stromversorgung.md` und Spezifikation 13):

| Posten | pro Tag |
|---|---|
| Wachphase einmal täglich | ca. 0,3 mAh |
| Board-Schlaf | ca. 0,4 bis 0,9 mAh |
| Pumpen | ca. 4,0 mAh |
| Selbstentladung Li-Ion (2 bis 3 % pro Monat) | ca. 2,5 bis 3,5 mAh |
| Ruhestrom der Peripherie | offen, messen |

Messen und Senden ist der kleinste Posten. Die Laufzeit wird jetzt von zwei anderen Dingen
begrenzt:

1. **Selbstentladung und Alterung des Akkus.** Der Akku verliert im Kalender mehr, als das
   Gerät durch Arbeit verbraucht. Das ist der Grund, den Ruhestrom mit einem TPL5110-Timer
   (unter 1 µA) fast auf Selbstentladungs-Niveau zu drücken. Mehr Sparen an der Messung bringt
   dann nichts mehr.
2. **Der Wasservorrat.** Das Wasser ist nach Wochen leer, egal wie sparsam die Elektronik ist.

Designregel daraus, genau auf "so lange wie möglich ohne Nachladen" gemünzt: Akku und Tank so
dimensionieren, dass beide etwa gleich lang halten. Dann ist Nachfüllen und Nachladen derselbe
Termin, alle paar Wochen. Mit Solarzelle im Deckel fällt das Laden ganz weg, dann bestimmt nur
noch der Tank, wie oft man hinmuss.
