# 01 Anforderungen

Stand: September 2026. Ergebnis des Kickoff-Interviews.

## Rahmen

| Punkt | Festlegung |
|---|---|
| Team | 3 Personen, 2 davon Embedded-Entwickler, Löten und eigene Aufbauten möglich |
| Werkzeug | Bambu Lab A1 Mini (3D-Druck, Bauraum 180 x 180 x 180 mm) |
| Budget | 300 Euro gesamt |
| Zeit | Hobbyprojekt nebenbei, fertig bis spätestens März 2027 |
| Sprache Doku | Deutsch |
| Aufgabenverteilung | Kein Issue-Tracking, nur Meilensteinplan in der Doku |

## Muss (Stufe 1)

1. **Eine Zimmerpflanze im Topf**, drinnen am Fensterbrett.
2. **Gießen bei Bedarf**: Bodenfeuchte messen, bei Unterschreiten eines Schwellwerts definierte Wassermenge geben, danach Sperrzeit.
3. **Werte messen, die für das Gedeihen über Jahre relevant sind** und daraus handeln (Auswahl in `03-sensorik.md`).
4. **Nährstoffe automatisch geben**: Flüssigdünger dosieren, Menge und Rhythmus regelbar.
5. **Nachfüllen erkennen**: Wassertank und Düngervorrat überwachen, rechtzeitig melden.
6. **Anbindung ans Heimnetz**: Messwerte auf einer Zentrale sammeln, Dashboard im Browser, Benachrichtigung aufs Handy. Simpel, lokal, keine Cloud-Pflicht.
7. **Formfaktor**: Gerät etwa so groß wie eine 0,5-l-Bierflasche (ca. 27 cm hoch, ca. 7 cm Durchmesser).
8. **Akku eingebaut**. Anfangs darf das Gerät am Netzteil laufen.

## Kann (spätere Stufen)

- Stufe 1b: Wassertank im Gerät integriert (ca. 1 l, 3 Wochen Vorrat), kein externer Kanister. Das Gerät wird dafür größer als die 0,5-l-Flasche.
- Mehrere Töpfe an einer Zentrale (Stufe 2).
- Hydroponik: Nährlösung statt Erde, pH- und EC-Regelung (Stufe 3).
- Kamera für Wachstumsdoku.
- Eigene Handy-App statt Browser-Dashboard.

## Nicht Teil von Stufe 1

- Außenbetrieb, Wetterschutz, Solar.
- Mehrkanal-Düngung (N, P, K getrennt).
- Cloud-Anbindung von außerhalb des Heimnetzes (geht später per VPN oder Home Assistant Cloud).

## Erfolgskriterien

| Kriterium | Messbar durch |
|---|---|
| Pflanze überlebt 4 Wochen ohne manuelles Gießen | Dauertest ab Iteration 5 |
| Bodenfeuchte bleibt im Zielband | Dashboard-Verlauf |
| Nachfüll-Meldung kommt mindestens 3 Tage vor leerem Tank | Log der Benachrichtigungen |
| Akkulaufzeit mindestens 4 Wochen (Schätzung, siehe `06-stromversorgung.md`) | Messung der Akkuspannung im Dashboard |
| Gerät passt in den Flaschen-Formfaktor | Gehäuse-Prototyp |
