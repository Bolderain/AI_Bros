# 11 Meilensteine, Rollen und Ablauf

Maßgeblich: `00-spezifikation-stufe1.md`, Abschnitt 11. Die Zeiträume sind ein Vorschlag (P),
Entscheidung E6. Kickoff-Vorgabe: Stufe 1 fertig bis spätestens März 2027. Kein Issue-Tracking,
Fortschritt hier in der Status-Spalte pflegen.

## Meilensteine Stufe 1

| M | Zeitraum (P) | Inhalt | Rolle | Abnahme | Status |
|---|---|---|---|---|---|
| M0 Kickoff | Sep 2026 | Repo, Spezifikation, Referenzpflanze (E1), Board-Frage (E10), Bestellung M1-Teile | alle | Bestellung raus | in Arbeit |
| M1 Messkette | Okt 2026 | Sonde im echten Topf kalibrieren, 15-min-Logging in HA, NTP auf dem Raspi | A + C | Trocknungskurve über 7 Tage | offen |
| M2 Aktorik | Nov 2026 | Pumpen mit Küchenwaage kalibrieren, Vorverdünnung festlegen, Wägezellen | A | T01-Genauigkeit, Düngerdosis reproduzierbar | offen |
| M3 Logik | Nov 2026 bis Jan 2027 | `plant_logic`, Zyklus, Düngeplan, Sicherheitslogik, absolute Grenzen, Notbetrieb, Persistenz | B | T02, T03, T06 bis T09, T11, T13, T16 bis T21 | offen |
| M4 Zentrale | Dez 2026 bis Jan 2027 | Dashboard, Push, Lebenszeichen, Datenhaltung | C | T04, T05, T10, T12, T14 | offen |
| M5 Dauertest | Feb bis Mär 2027 | Dauertest am Netzteil mit Strommessung | alle | T15, Datenbasis für Stufe 2 | offen |

M3 und M4 laufen parallel, weil sie verschiedene Rollen betreffen. Rolle B kann die Unit-Tests
von `plant_logic` schon während M1 und M2 schreiben. Startet M5 Anfang Februar, passen 8 Wochen
bis Ende März, und das Erfolgskriterium von 6 bis 8 Wochen lässt sich im Dauertest nachweisen
(die Spezifikation nennt für M5 4 Wochen, Klärung E11).

## Rollen

| Rolle | Verantwortung |
|---|---|
| A Hardware | Verdrahtung, Flüssigkeitsführung, Mechanik, Kalibrierung von Sonde, Pumpen und Wägezellen |
| B Firmware | ESPHome, `plant_logic`, Sicherheitslogik, Persistenz, Unit-Tests |
| C Zentrale/Daten | Mosquitto, NTP, Home Assistant, Dashboard, Push, Datenexport, spätere KI-Auswertung |

Welche Person welche Rolle übernimmt, entscheidet das Team.

## Ablauf je Meilenstein

1. **Planen** (30 min zu dritt): Abnahme bestätigen, Aufgaben nach Rollen verteilen.
2. **Bauen:** jede Rolle an ihrem Teil, Zwischenstände ins Repo.
3. **Integrieren** (ein Abend gegen Ende): zusammenstecken, an der Referenzpflanze testen.
4. **Abnahme und Retro** (30 min): Tests aus der Abnahme-Spalte durchgehen, drei Zeilen in
   `13-retros.md`, Status oben aktualisieren, neue offene Punkte in Spezifikation Abschnitt 10.

Was nicht fertig wird, rutscht in den nächsten Meilenstein. Meilensteine der Reihe nach, nicht
vorgreifen.

## Danach (Vorschlag)

| Stufe | Zeitraum (P) | Inhalt |
|---|---|---|
| 2 | ab Apr 2027 | Akku, Deep Sleep mit einmal täglich messen, Peripherie abschaltbar, Gehäuse vom A1 Mini, Formfaktor aus dem Autonomieziel (E8), ggf. integrierter Tank |
| 3 bis 5 | später | mehrere Töpfe, Hydroponik, Pilz-Growbox |

## Was den Termin gefährdet

- Lieferzeiten: M1-Teile sofort bestellen, AliExpress braucht 2 bis 4 Wochen.
- M3 ist der größte Block: Unit-Tests früh beginnen.
- Der Dauertest braucht Kalenderzeit: M5 nicht nach hinten schieben.
- Themen aus Stufe 2 (Akku, Gehäuse, Tank) nicht vorziehen, sonst debuggt man zwei Dinge
  gleichzeitig.
