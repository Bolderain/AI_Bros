# 10 Pflegeregeln

Ziel: Pflanze gedeiht über Jahre, nicht nur überleben für einen Urlaub.

## Gießregel (Stufe 1)

Gemessen wird volumetrische Bodenfeuchte in Prozent (kalibriert, siehe `03-sensorik.md`).

```
wenn feuchte < feuchte_min
   und seit letztem Gießen > sperrzeit
   und tank_leer == false
   und sensor plausibel
dann gieße giessmenge_ml
```

Startwerte für einen 15-cm-Topf mit ca. 1,5 l Substrat:

| Parameter | Wert | Begründung |
|---|---|---|
| feuchte_min | 35 % | Viele Zimmerpflanzen wollen oberflächlich abtrocknen, bevor sie wieder Wasser bekommen |
| feuchte_ziel | 60 % | Nicht bis zur Sättigung, Staunässe vermeiden |
| giessmenge_ml | 80 ml | Ca. 5 % des Substratvolumens, lieber öfter klein als selten viel |
| sperrzeit | 20 h | Frühestens am nächsten Morgen wieder gießen, Wasser braucht Zeit bis der Sensor es sieht |
| prüfzeit | 1 mal täglich, morgens | Pflanze wird wie von Hand einmal am Tag kontrolliert, gegossen wird morgens |

Die Menge wird adaptiv: Wenn nach einem Gießvorgang die Feuchte unter dem Ziel bleibt, beim
nächsten Mal 20 % mehr, bis maximal das Dreifache. Umgekehrt weniger, wenn die Feuchte
überschießt.

Gewichtung nach Licht und Temperatur (Ausbau): Bei wenig Licht (Winter, unter 500 lux
Tagesmittel) und kühlem Standort braucht die Pflanze weniger, feuchte_min um 5 Punkte senken.

## Nachfüll-Erkennung Wasser

- Verbrauch der letzten 14 Tage in ml/Tag mitteln.
- Tankinhalt: 5 l Kanister, Schwimmer "halb" bei 2,5 l, "leer" bei 0,3 l (über der Pumpe).
- Vorwarnung: Wenn "halb" ausgelöst -> Meldung mit Restlaufzeit in Tagen. Bei 80 ml alle 2 Tage
  reichen 2,5 l etwa 60 Tage, die Vorwarnung kommt also Wochen vorher.
- Optional statt Schwimmer: Kanister auf Wägezelle, kontinuierlich.

## Düngeregel

Prinzip: Flüssigdünger als Konzentrat mit jedem Gießvorgang in geringer Dosis mitgeben
("Fertigation"). Das ist gleichmäßiger als Stoßdüngung alle zwei Wochen.

Rechenbeispiel mit einem üblichen Grünpflanzendünger (Herstellerangabe oft 5 ml auf 1 l Wasser,
alle 1 bis 2 Wochen in der Wachstumsphase):

| Größe | Wert |
|---|---|
| Empfohlene Dosis pro Woche | 5 ml Konzentrat auf 1 l Gießwasser |
| Gießmenge pro Woche (80 ml alle 2 Tage) | ca. 280 ml |
| Konzentrat pro Woche | 1,4 ml |
| Konzentrat pro Gießvorgang | ca. 0,4 ml |

0,4 ml sind für eine Peristaltikpumpe bei 50 ml/min eine Laufzeit von 0,5 s. Machbar,
aber an der Grenze der Reproduzierbarkeit. Praktischer: Dünger nur bei jedem dritten
Gießvorgang mit 1,2 ml, oder das Konzentrat im Vorratsbehälter 1:5 vorverdünnen und
2 ml pro Gießvorgang dosieren. Zweiteres ist die Empfehlung, weil die Pumpe dann im
gut kalibrierbaren Bereich läuft.

Saisonregel: In der Wachstumsphase (März bis September, per Kalender oder per Lichtsumme)
volle Dosis, im Winter halbe Dosis oder aus. Stichwort Lichtsumme: Tagesmittel unter
ca. 500 lux -> Winterbetrieb.

Der Düngerbehälter mit 150 ml vorverdünnter Lösung reicht bei 2 ml je Gießvorgang für 75
Gießvorgänge, also ca. 5 Monate. Nachfüllmeldung bei unter 10 ml.

## Nachführen über Jahre

| Was | Wie oft | Wer |
|---|---|---|
| EC des Drainwassers messen (Handstift), Düngermenge anpassen | monatlich | Mensch, Wert ins Dashboard |
| Feuchtesensor nachkalibrieren (Trockenwert prüfen) | halbjährlich | Mensch |
| Silikonschlauch der Dosierpumpe tauschen | jährlich | Mensch |
| Umtopfen, Substrat erneuern | alle 1 bis 3 Jahre | Mensch, danach neu kalibrieren |
| Tank reinigen (Algen, Biofilm) | bei jedem Nachfüllen kurz ausspülen | Mensch |

Das Gerät kann Umtopfen und Schlauchtausch nicht ersetzen, es kann aber daran erinnern
(Zähler in der Zentrale).

## Pflanzenprofile (Vorschlag, Werte sind Startpunkte, nicht verifiziert)

| Pflanze | feuchte_min | feuchte_ziel | Licht | Düngung | Bemerkung |
|---|---|---|---|---|---|
| Efeutute, Philodendron | 35 | 60 | mittel | normal | robust, guter Erstkandidat |
| Basilikum (Kraut) | 45 | 70 | hoch | normal | trocknet schnell aus, viel Wasser |
| Sansevieria, Sukkulenten | 15 | 40 | hoch | wenig | lieber zu trocken als zu nass |
| Farn | 50 | 75 | wenig | wenig | hohe Luftfeuchte wichtig |
| Tomate/Chili (später, Stufe 2/3) | 45 | 70 | sehr hoch | hoch | Fruchtpflanzen brauchen mehr K |

Konkrete Pflanzenart ist noch offen. Empfehlung für den Prototyp: eine Efeutute, weil sie
Fehler verzeiht und schnell zeigt, ob es ihr gut geht.
