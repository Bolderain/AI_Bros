# 15 Messintervalle: was wie oft?

Grundregel: So oft messen, wie sich der Wert tatsächlich ändert. Schneller messen liefert keine
neue Information, kostet aber Akku. Die Trägheit der Erde ist hier der Maßstab, nicht die
Fähigkeit des Sensors.

## Wie schnell ändern sich die Werte wirklich?

| Größe | Typische Änderungsrate | Sinnvolles Messintervall | Warum |
|---|---|---|---|
| Bodenfeuchte | Stunden bis Tage. Ein Topf trocknet über 1 bis 5 Tage | 15 bis 30 min | Erde ist extrem träge. Häufiger messen zeigt nur Rauschen. 30 min reicht, um rechtzeitig zu gießen |
| Bodentemperatur | Stunden | 30 min | Folgt langsam der Raumtemperatur |
| Lufttemperatur | 10 bis 30 min (Heizung, Sonne aufs Fenster) | 5 bis 15 min | Springt schneller als der Boden, aber nicht sekündlich |
| Luftfeuchte | 10 bis 30 min | 5 bis 15 min | Wie Lufttemperatur |
| Licht | Minuten (Wolke) bis Stunden (Tagesgang) | 1 bis 5 min, wenn wach; sonst Tagessumme | Für den Tagesgang reicht grob. Kurze Wolken sind für die Pflanze egal |
| Tank- und Düngerstand | Nur bei Verbrauch, also nach dem Gießen | bei jedem Gießvorgang plus 1 mal am Tag | Ändert sich sonst nicht |
| Akkuspannung | Stunden | bei jeder Aktivphase (kostet nichts, ADC ist eh an) | Für die Restlaufzeit-Prognose |

## Empfehlung nach Betriebsmodus

| Modus | Feuchte, Bodentemp. | Luft T/rF | Licht | Senden |
|---|---|---|---|---|
| Netzteil (Prototyp A/B am Kabel) | 5 min | 1 min | 1 min | jede Messung sofort |
| Akku, Modus "Beobachten" | 15 min | 15 min | 15 min | alle 15 min gebündelt |
| Akku, Modus "Sparen" (Standard) | 30 min | 30 min | 30 min, nachts 4 h | alle 2 h gebündelt |
| Akku, Modus "Urlaub" | 1 h | 1 h | nur Tagessumme | alle 6 h plus bei Ereignis |

Messen und Senden trennen: Der ESP kann alle 30 min messen (kurz, ca. 200 ms, ohne WLAN,
ca. 20 mA) und die Werte im RTC-RAM sammeln. Das teure WLAN geht nur alle 2 h an und schickt
den ganzen Block auf einmal. So bleibt die Kurve fein, ohne dass jede Messung eine
WLAN-Verbindung kostet. Details in `06-stromversorgung.md`.

## Wie oft rausschicken?

| Ansatz | Sendehäufigkeit | Für wen |
|---|---|---|
| Sofort bei jeder Messung | wie Messintervall | Nur am Netzteil oder in der Debug-Phase (Iteration 1 bis 3), wenn man live zuschauen will |
| Gebündelt | alle 2 h ein Block mit den letzten Messungen | Standard im Akkubetrieb |
| Nur bei Änderung | wenn ein Wert um mehr als x % vom letzten gesendeten abweicht, sonst 1 Lebenszeichen pro Tag | Maximale Sparsamkeit, Kurve wird gröber bei stabilen Werten |
| Sofort bei Ereignis | zusätzlich immer sofort: Gießen, Düngen, Tank leer, Sensorfehler, Akku schwach | In jedem Modus aktiv, das sind die wichtigen Nachrichten |

Wichtig: Alarme und Ereignisse gehen immer sofort raus, unabhängig vom Sendeintervall. Nur die
Routine-Messwerte werden gebündelt. Ein leerer Tank darf nicht 2 h auf das nächste Sendefenster
warten.

## Empfehlung für den Anfang (Iteration 1 bis 3, am Netzteil)

Alle 60 s messen und senden. Nicht weil es nötig ist, sondern weil man beim Entwickeln eine
feine Live-Kurve sehen will, um Sensoren zu kalibrieren und die Gießregel zu testen. Sobald der
Akkubetrieb kommt (Iteration 4), auf 30 min messen und 2 h senden umstellen.
