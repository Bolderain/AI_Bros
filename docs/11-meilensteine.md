# 11 Iterationen und Meilensteine

Zieltermin: Stufe 1 fertig bis März 2027. Hobby nebenbei, ca. ein Arbeitsabend pro Woche pro
Person angenommen. Kein Issue-Tracking, Fortschritt hier in den Tabellen pflegen.

## Prinzip

Jede Iteration endet mit einem **lauffähigen Gerät, das eine echte Pflanze versorgt**, und
zwar schon ab Iteration 1. Was in einer Iteration nicht fertig wird, rutscht in die nächste,
nicht umgekehrt. Am Ende jeder Iteration ein kurzes Retro (drei Zeilen in `13-retros.md`):
Was lief, was nervt, was ändern wir.

Ein Sprint dauert etwa 3 bis 4 Wochen (ein Monat). Jeder Sprint hat ein Demo-Kriterium,
das man am Fensterbrett zeigen kann.

## Iterationen

| It. | Zeitraum | Name | Demo-Kriterium (so sieht "fertig" aus) | Hardware-Stand | Tank |
|---|---|---|---|---|---|
| 0 | Sep 2026 | Kickoff | Repo, Bestellung Runde 1 raus, Pflanze steht am Fensterbrett | nichts | Gießkanne |
| 1 | Okt 2026 | Der Sensor | Breadboard am USB-Netzteil misst Feuchte und sendet MQTT, Grafana zeigt die Kurve. Gießen macht noch der Mensch, aber das Dashboard sagt wann | Breadboard, offen | Gießkanne |
| 2 | Nov 2026 | Die Pumpe | Gerät gießt selbst nach Regel, Pflanze überlebt 2 Wochen ohne Handgießen. Tauchpumpe in einem Marmeladenglas oder Kanister, Tropfring, Laufzeitgrenze, Sperrzeit | Breadboard in einem Schuhkarton, Netzteil | extern, 1 bis 5 l |
| 3 | Dez 2026 | Die Zentrale | Telegram meldet "Tank leer", "gegossen", "Gerät stumm". Befehle per Telegram. Konfig per MQTT | wie It. 2 | extern |
| 4 | Jan 2027 | Der Akku | Deep Sleep unter 1 mA, 18650 eingebaut, Lochrasterplatine statt Breadboard, erste gedruckte Hülle (Bambu A1 Mini, zwei Teile), Gerät steht frei am Topf | Prototyp A: Rohr mit Elektronik, Tank noch extern | extern |
| 5 | Feb 2027 | Der Dünger | Dosierpumpe kalibriert, Fertigation aktiv, Nachfüllmeldung für Dünger, Dauertest 4 Wochen ohne Eingriff läuft an | Prototyp A | extern |
| 6 | Mär 2027 | Abschluss Stufe 1 | Dauertest bestanden, Doku nachgezogen, Retro, Entscheidung über Stufe 1b und 2/3 | Prototyp A | extern |
| 7 | Apr bis Jun 2027 | Der Tank (Stufe 1b) | Wassertank im Gerät, gedruckt und dicht, mindestens 3 Wochen Vorrat. Gerät braucht keinen Kanister mehr | Prototyp B: Gerät mit integriertem Tank | intern, ca. 1 bis 2 l |
| 8 | ab Jul 2027 | Stufe 2 oder 3 | Mehrere Töpfe oder Hydroponik | | |

Iteration 7 liegt nach dem Zieltermin März 2027. Grund: Ein dichter, gedruckter Tank mit
Pumpe, Füllstandsmessung und Nachfüllöffnung ist ein eigenes Mechanik-Projekt. Erst muss die
Elektronik im Dauertest stabil sein, sonst debuggt man zwei Dinge gleichzeitig. Wer schneller
ist, zieht It. 7 vor.

## Was in jeder Iteration passiert (Ablauf)

1. **Planen** (30 min, zu dritt): Demo-Kriterium bestätigen, Aufgaben auf die drei Pakete
   Firmware, Zentrale, Mechanik verteilen.
2. **Bauen**: jeder an seinem Paket, Zwischenstände ins Repo.
3. **Integrieren** (ein Abend gegen Ende): alles zusammenstecken, an der echten Pflanze testen.
4. **Demo + Retro** (30 min): Kriterium erfüllt? Drei Zeilen in `13-retros.md`. Tabelle oben
   aktualisieren, Offenes in `12-risiken-offene-fragen.md` nachziehen.

## Aufteilbare Arbeitspakete (ohne Zuordnung)

| Paket | Inhalt |
|---|---|
| Firmware | Sensoren, MQTT, Deep Sleep, Pumpen, Regeln, OTA |
| Zentrale | Pi aufsetzen, Docker Compose, Grafana-Dashboard, Node-RED-Flows, Telegram-Bot |
| Mechanik | Gehäuse auf dem A1 Mini, Sensorspieß vergießen, Schlauchführung, Tank, Lochrasterplatine, Akkuhalter |

Drei Pakete, drei Personen, die Zuordnung macht das Team selbst.

## Was den Termin gefährdet

- Lieferzeiten aus China (2 bis 4 Wochen): Runde 1 sofort bestellen.
- Ruhestrom-Debugging kann sich ziehen: früh messen (It. 1 schon grob), nicht erst in It. 4.
- Dauertest braucht Kalenderzeit: It. 5 nicht nach hinten schieben.
- Integrierter Tank zu früh anfangen: erst Elektronik stabil, dann Tank (It. 7).
