# 15 Messintervalle: aus Sicht der Pflanze

Leitgedanke: nicht so oft messen, wie die Elektronik kann, sondern so oft, wie es die Pflanze
braucht. Und das Ziel ist maximale Laufzeit ohne Nachladen und Nachfüllen. Beides zeigt in die
gleiche Richtung: selten messen, selten senden.

## Wie ein Mensch gießt, so soll das Gerät messen

Ein Mensch schaut alle paar Tage nach der Pflanze, steckt den Finger in die Erde und gießt bei
Bedarf, am besten morgens. Genau das ist der Maßstab. Die Erde ist ein träger Speicher, sie
ändert sich über Tage, nicht über Minuten. 48 Messungen am Tag liefern 48 fast gleiche Werte.

## Standard: eine Aktivphase pro Tag, morgens

| Schritt | Zeitpunkt | Was passiert |
|---|---|---|
| Aufwachen | einmal täglich, früher Morgen | Sensor an, Bodenfeuchte 8-fach mitteln, Akku messen |
| Entscheiden | sofort | Feuchte unter Schwelle und Sperrzeit vorbei? Dann gießen |
| Gießen | morgens | Bester Zeitpunkt: Pflanze verbraucht das Wasser über den Tag, Wurzeln stehen nachts nicht nass und kalt |
| Melden | einmal täglich | Eine Tagesnachricht: Feuchte, ob gegossen wurde, Akku, Warnungen |
| Schlafen | Rest des Tages | Gerät ist praktisch aus |

Morgens ist keine Kür, sondern gärtnerisch richtig. Deshalb wird die eine Aktivphase per
Uhrzeit ausgelöst (RTC), nicht per festem Intervall.

## Warum eine zweite Messung am Tag Sinn haben kann (aber nicht muss)

Der einzige gute Grund für einen zweiten Blick: prüfen, ob das Gießen gewirkt hat. Ist die
Feuchte ein paar Stunden nach dem Gießen nicht gestiegen, ist der Schlauch leer, die Pumpe
hängt oder der Tank ist leer. Das ist die einzige Fehlererkennung, die Zeit braucht. Wer das
will, macht am selben Morgen einen zweiten kurzen Weck-Termin, kein Dauerbetrieb. Wer darauf
verzichtet, merkt den Fehler spätestens am nächsten Morgen. Für eine Zimmerpflanze ist ein Tag
Verzug unkritisch.

## Senden: einmal am Tag

| Was | Wann gesendet |
|---|---|
| Tagesmeldung (Feuchte, Gießen ja/nein, Akku, Temperatur falls gemessen) | einmal täglich, in der Morgen-Aktivphase |
| Warnungen (Tank leer, Feuchte nach Gießen nicht gestiegen, Akku schwach, Sensorfehler) | in derselben Aktivphase, denn genau dann fallen sie auf |

Der Trick: Ein leerer Tank fällt beim morgendlichen Gießversuch auf. Das Gerät muss dafür nicht
dauernd erreichbar sein. Es merkt und meldet das Problem in dem Moment, in dem es handeln will.
Deshalb reicht einmal senden pro Tag, ohne dass Warnungen liegen bleiben.

## Wann doch öfter?

Nur beim Entwickeln und Kalibrieren. In Iteration 1 bis 3, am Netzteil, misst und sendet man
ruhig jede Minute, um live zuzuschauen, den Feuchtesensor zu kalibrieren und die Gießregel zu
testen. Sobald der Akkubetrieb kommt (Iteration 4), wird auf eine Aktivphase pro Tag
umgestellt. Das ist kein Rückschritt, sondern der eigentliche Betriebsmodus.

## Welche Sensoren überhaupt?

| Sensor | Für die Regelung nötig? | Entscheidung |
|---|---|---|
| Bodenfeuchte | Ja, die einzige zeitkritische Größe | Pflicht |
| Bodentemperatur | Nein, ändert sich langsam, treibt keinen Aktor | Optional, im gleichen Weck-Termin fast gratis mitmessen |
| Lufttemperatur, Luftfeuchte | Nein, der Effekt auf den Wasserbedarf steckt schon in der Bodenfeuchte | Optional, nur als Tageswert, sonst weglassen |
| Licht | Nein, siehe unten | Streichen |
| Tank- und Düngerstand | Ja, aber nur beim Gießen relevant | Beim Gießen prüfen |
| Akkuspannung | Ja, für die Laufzeitprognose | Bei jeder Aktivphase, kostet nichts |

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
Tagesbudget (Schätzung, sauberer Aufbau, Ruhestrom unter 100 µA):

| Posten | pro Tag |
|---|---|
| Messen plus einmal senden | ca. 0,12 mAh |
| Pumpen (gießen alle 2 Tage, 20 s) | ca. 1,0 mAh |
| Deep Sleep unter 100 µA | ca. 2,4 mAh |
| Selbstentladung Li-Ion (2 bis 3 % pro Monat) | ca. 2,5 bis 3,5 mAh |

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
