# 01 Anforderungen und Rahmen

Stand: 24.09.2026. Die verbindlichen Anforderungen für Stufe 1 (R01 bis R22, mit Abnahme) stehen
in `00-spezifikation-stufe1.md`, Abschnitt 2. Diese Datei hält Vision, Rahmen und Stufen fest.

## Vision

Eine Zimmerpflanze über Jahre selbstständig gesund halten: Bodenfeuchte messen, morgens bei
Bedarf gießen, nach Plan düngen, Vorräte überwachen, aufs Handy melden. Später autark mit Akku
im kompakten Gehäuse, dann mehrere Töpfe, Hydroponik und Pilzzucht.

## Rahmen

| Punkt | Festlegung |
|---|---|
| Team | 3 Personen, 2 davon Embedded-Entwickler. Rollen A Hardware, B Firmware, C Zentrale/Daten, Zuordnung macht das Team |
| Vorhanden | Raspberry Pi (Zentrale), Bambu Lab A1 Mini (3D-Druck, Bauraum 180 x 180 x 180 mm) |
| Budget | 300 Euro (Kickoff). Ob nur Stufe 1 oder Gesamtprojekt: offen (E5) |
| Zeit | Hobby nebenbei, Stufe 1 fertig bis spätestens März 2027 (Kickoff) |
| Aufbau Stufe 1 | steckbar, kein Löten, 5-V-Netzteil (R13). Ausnahme Board-Stiftleisten: E10 |
| Sprache | Deutsch |
| Aufgabenverteilung | Kein Issue-Tracking, Meilensteinplan in `11-meilensteine.md` |

## Stufen

| Stufe | Inhalt | Wo beschrieben |
|---|---|---|
| 1 | Tischprototyp: kompletter Regelkreis Messen, Entscheiden, Dosieren, Überwachen, Protokollieren, Melden. Am Netzteil | Spezifikation (maßgeblich) |
| 2 | Autarkes Gerät: Akku, Deep Sleep mit einmal täglich messen, Gehäuse vom A1 Mini, Formfaktor aus dem Autonomieziel, ggf. integrierter Tank | Spezifikation 13, `06`, `09`, `15` |
| 3 | Mehrere Töpfe an einer Zentrale | `02` |
| 4 | Hydroponik mit pH- und EC-Regelung | `02`, `03` |
| 5 | Pilz-Growbox mit gleicher Elektronik | `14` |
| laufend | Datensammlung für eine spätere KI-Auswertung, Aufgabe der KI offen (E7) | Spezifikation R12, R18, R21, R22 |

## Erfolgskriterium Stufe 1

Referenzpflanze 6 bis 8 Wochen (P) ohne Eingriff außer Nachfüllen, Feuchte im Zielband, kein
Wasseraustritt, alle Muss-Tests bestanden (Spezifikation Abschnitte 1 und 9, Dauer des
Dauertests: E11).

## Kickoff-Vorgaben und wo sie gelandet sind

| Vorgabe aus dem Kickoff | Stand |
|---|---|
| Gießen, wenn nötig | R03: morgens im Gießfenster, unter Schwelle, in Portionen |
| Wichtige Werte messen und handeln | R02 Bodenfeuchte als einzige zeitkritische Größe, Vorräte per Wägezelle (R07). Licht gestrichen (`15`) |
| Nährstoffe automatisch geben | R05: saisonaler Plan, Dosis aus Etikettkonzentration |
| Nährstoffe messen | R06 Trend über das Dosierprotokoll, EC optional (R17), NPK nicht (Spezifikation 4.2) |
| Verbindung zu Server und Handy | R10: Mosquitto und Home Assistant auf dem Raspi, Push über die Companion-App |
| Mit Hardware spielen | Rollen A und B, Wägezellen, Pumpen, später Akku und Gehäuse |
| Gerät so groß wie eine 0,5-l-Flasche | Stufe 2. Fest oder verhandelbar: E8 |
| Wassertank später im Gerät, kleiner als 5 l | Stufe 2, Varianten in `09` |
| Akku eingebaut | Stufe 2. Stufe 1 am Netzteil, Hardware aber akkutauglich (R16) |
| Möglichst lange ohne Nachladen | Stufe 2: einmal täglich messen. Engpass sind Wasser und Selbstentladung (`15`) |
