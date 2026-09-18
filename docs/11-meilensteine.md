# 11 Meilensteine

Zieltermin: fertig bis März 2027. Hobby nebenbei, also ca. ein Arbeitsabend pro Woche pro Person
angenommen. Kein Issue-Tracking, Fortschritt hier in der Tabelle pflegen.

| Nr | Zeitraum | Meilenstein | Ergebnis | Status |
|---|---|---|---|---|
| M0 | Sep 2026 | Kickoff, Doku, Bestellung | Dieses Repo, Bestellliste Runde 1 abgeschickt | in Arbeit |
| M1 | Okt 2026 | Breadboard misst | ESP32 liest alle Sensoren, sendet MQTT, Zentrale zeigt Werte in Grafana | offen |
| M2 | Nov 2026 | Gießen funktioniert | Tauchpumpe, Tropfring, Gießregel, erste Pflanze am Netzteil, Feuchte kalibriert | offen |
| M3 | Dez 2026 | Zentrale komplett | Alarme, Telegram-Bot, Befehle, Konfig per MQTT | offen |
| M4 | Jan 2027 | Akku und Gehäuse | Deep Sleep unter 1 mA, 18650 eingebaut, Gehäuse-Prototyp im Flaschenformat | offen |
| M5 | Feb 2027 | Düngung und Dauertest | Dosierpumpe kalibriert, Düngeregel aktiv, Nachfüllmeldungen, 4 Wochen ohne Eingriff | offen |
| M6 | Mär 2027 | Abschluss Stufe 1 | Doku nachgezogen, Lessons Learned, Entscheidung über Stufe 2/3 | offen |

## Aufteilbare Arbeitspakete (ohne Zuordnung)

Firmware: Sensoren, MQTT, Deep Sleep, Pumpen, Regeln, OTA.
Zentrale: Pi aufsetzen, Docker Compose, Grafana-Dashboard, Node-RED-Flows, Telegram-Bot.
Mechanik und Aufbau: Gehäuse, Sensorspieß vergießen, Schlauchführung, Tank, Lochrasterplatine, Akkuhalter.

Drei Pakete, drei Personen, die Zuordnung macht das Team selbst.

## Was den Termin gefährdet

- Lieferzeiten aus China (2 bis 4 Wochen): Runde 1 sofort bestellen.
- Ruhestrom-Debugging kann sich ziehen: früh messen (M1), nicht erst in M4.
- Dauertest braucht Kalenderzeit: M5 nicht nach hinten schieben.
