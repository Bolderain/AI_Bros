# Idee: WG-Energie-Dashboard

Stand: 22.10.2026, **Vorschlag von Claude** (nicht aus dem Team). Noch nicht entschieden, eine von mehreren Ideen.

**Neu (22.10.2026):** Unser Zähler hängt im Keller eines Mehrparteienhauses. Was das bedeutet und welche
Wege es gibt, steht unter [Zähler im Keller](#zähler-im-keller). Zum Ausprobieren gibt es eine
[interaktive Simulation](sim/index.html) der WG (Abdeckung, Kosten, Flur-Anzeige, Funk aus dem Keller).

## Idee

Eine Anzeige im Flur zeigt, wie viel Strom die WG heute verbraucht hat, was das ungefähr kostet,
wie der Tag im Vergleich zur Vorwoche dasteht und welches große Gerät gerade läuft
("Wer hat den Trockner laufen?"). Die Daten kommen aus zwei Quellen:

1. **Der digitale Stromzähler** im Zählerschrank. Moderne Zähler haben eine optische
   Infrarot-Schnittstelle, über die sie Zählerstände im SML-Protokoll aussenden. Ein IR-Lesekopf
   wird magnetisch davorgesetzt und an einen ESP32 angeschlossen.
2. **Zwischenstecker mit Leistungsmessung** an den Großverbrauchern (Trockner, Waschmaschine,
   eventuell Gefrierschrank oder Gaming-PC). Sie zeigen, welches Gerät welchen Anteil hat.

Home Assistant läuft auf dem vorhandenen Raspberry Pi, sammelt alles, rechnet Tageswerte und Kosten
und liefert sie an ein E-Paper-Display im Flur sowie an App und Browser.

Rahmen: 3 Leute, Hobbyprojekt, Mietwohnung, Budget Team 300 €.

**Mieter-tauglich:** Es wird nichts an der 230-V-Installation verändert. Der Lesekopf haftet nur
mit einem Magneten am Zähler, die Zwischenstecker kommen in vorhandene Steckdosen. Kein Eingriff in
Zählerschrank, Verteilung oder Unterputzdosen. Alles ist ohne Spuren wieder abbaubar.

## Aufbau

![Blockdiagramm](aufbau.svg)

Das Blockdiagramm zeigt den Vollausbau (Variante A). Für den Start mit Variante B entfällt der Zweig
Zähler und Lesekopf, siehe [Zähler im Keller](#zähler-im-keller).

So könnte die Anzeige im Flur aussehen (Mockup, Zahlen erfunden):

![Dashboard-Mockup](dashboard-mockup.svg)

## Der Zähler: was man ehrlich erwarten kann

Hier liegt die größte Unbekannte der Idee. Vor jedem Kauf muss jemand in den Zählerschrank schauen.

- **Zählertyp klären.** In Deutschland hängen in Mietwohnungen meist entweder alte
  Ferraris-Zähler (Drehscheibe), "moderne Messeinrichtungen" (mME, digitaler Zähler ohne
  Kommunikationsmodul) oder "intelligente Messsysteme" (iMSys, mit Smart-Meter-Gateway).
  Nur bei digitalen Zählern mit optischer Schnittstelle funktioniert der Lesekopf.
- **PIN für volle Daten.** Viele mME senden ohne Freischaltung nur den Zählerstand in
  ganzen kWh oder gar keine Momentanleistung. Für feinere Werte (Nachkommastellen,
  aktuelle Leistung in W) muss man oft eine **PIN beim Netzbetreiber anfordern** und am Zähler
  eingeben (bei vielen Modellen per Taschenlampe an der optischen Taste). Das ist in der Regel
  kostenlos und ohne Vermieter möglich, wer den Vertrag hat, fragt an. **Welche Daten unser
  Zähler wirklich liefert, ist offen (P)**, Hersteller und Modell stehen auf dem Typenschild.
- **Ohne PIN** reicht der Zählerstand immerhin für Tagesverbrauch und Kosten, nur "jetzt gerade
  2,1 kW" fehlt. Die Zwischenstecker liefern Momentanwerte trotzdem für die gemessenen Geräte.
- **Alter Ferraris-Zähler:** Lesekopf geht nicht. Ausweg wäre ein Sensor, der die rote Markierung
  der Drehscheibe zählt (Variante D), deutlich ungenauer.
- **iMSys mit Gateway:** Daten kommen eventuell auch über das Gateway (HAN-Schnittstelle).
  Das ist von Betreiber zu Betreiber unterschiedlich und wird hier nicht weiter vorausgesetzt.
- **Zugang zum Zählerschrank.** Bei uns hängt der Zähler im Keller, siehe nächster Abschnitt.

Konkrete Zählermodelle, OBIS-Kennzahlen und Lesekopf-Pinbelegungen werden erst eingetragen,
wenn wir unseren Zähler und den gekauften Lesekopf kennen. Hier wird nichts davon vorweggenommen.

## Zähler im Keller

**Nutzer-Info vom 22.10.2026:** Der Zähler hängt im Keller eines Mehrparteienhauses. Das macht Variante A
schwierig: Der Lesekopf bräuchte dort Strom und eine Funkverbindung bis in die Wohnung, und der Zählerraum
ist ein gemeinsamer Raum, für den die Hausverwaltung zuständig ist.

**Grundregel: Zähler anderer Parteien werden nie berührt**, auch nicht "nur kurz zum Testen". Unseren eigenen
Zähler erkennt man an der Zählernummer, die auch auf der Stromrechnung steht. Ob am eigenen Zähler im
Keller überhaupt etwas hängen darf, klärt die Hausverwaltung (siehe unten).

| Weg | Wie | Gesamtverbrauch | Was es braucht | Risiko, offen | Kosten (Schätzung) |
|---|---|---|---|---|---|
| **1. Nur Zwischenstecker** (Variante B) | Kein Gerät im Keller. Messstecker an den Großverbrauchern in der Wohnung, alles in Home Assistant | nein, nur die gemessenen Geräte; Grundlast, Herd, Licht bleiben unsichtbar | nichts außer Steckdosen in der Wohnung | Wie groß der unsichtbare Rest ist, weiß man nicht (die Simulation zeigt, wie das aussehen kann) | ca. 65 bis 180 € mit Flur-Anzeige |
| **2. Lesekopf mit Akku und Langstrecken-Funk** | Lesekopf am Zähler, dazu ein Board mit Akku, das per LoRa (868 MHz), ESP-NOW (eventuell im Long-Range-Modus) oder anderem Funk durch die Decken zu einem Empfänger in der Wohnung sendet | ja | Erlaubnis der Hausverwaltung, Akku oder eigene Stromquelle im Keller, Empfänger in der Wohnung | **Reichweite ehrlich unbekannt.** Stahlbetondecken, Metallschrank und Abstand lassen sich nicht vorhersagen, nur **messen**: zwei Boards, eines im Keller, eines in der Wohnung, ein paar Tage Empfang mitschreiben. Akku-Laufzeit offen (P), hängt am Sendeintervall und am Lesekopf. Im 868-MHz-Band gelten Regeln zur Sendezeit, vor dem Bau prüfen | ca. 40 bis 90 € zusätzlich zu Weg 1 (P) |
| **3. WLAN-Repeater** | Repeater oder Mesh-Knoten so platzieren, dass das WG-WLAN den Keller erreicht, Lesekopf mit WLAN wie in Variante A | ja | Steckdose für den Repeater, die wir nutzen dürfen (in der Wohnung, im Keller meist Allgemeinstrom), Strom auch für den Lesekopf | Kommt nur weiter, wenn die Wohnung nah am Keller liegt (EG, Hochparterre). Steckdosen im Keller hängen oft am Allgemeinzähler des Hauses: dort Strom abzuzapfen geht nur mit Erlaubnis | ca. 20 bis 50 € zusätzlich (P) |
| **4. Schaltschrank in der Wohnung prüfen** | Nachsehen, was im Verteiler in der Wohnung sitzt | nur falls dort doch ein eigener Zähler hängt | einen Blick hinein, ohne Abdeckungen zu öffnen | Meist sitzen dort nur Sicherungen. Hutschienen-Zähler oder Stromzangen im Verteiler wären ein Eingriff in die Installation: nur Elektrofachkraft, nur mit Zustimmung des Vermieters, nicht mieter-tauglich im Sinne dieser Idee | 0 € fürs Nachsehen |
| **5. Daten vom Messstellen- bzw. Netzbetreiber** | Falls ein intelligentes Messsystem (Smart Meter mit Gateway) verbaut ist oder kommt: Verbrauchswerte im Kundenportal bzw. über eine Schnittstelle des Betreibers abrufen | ja, oft aber verzögert (z.B. erst am Folgetag), Auflösung je Betreiber | Zugang über den Stromvertrag, eventuell Antrag beim Messstellenbetreiber | Ob unser Zähler ein Smart Meter ist, ob es ein Portal oder eine Schnittstelle gibt und mit welchem Verzug: **offen (P)**. Bei einer modernen Messeinrichtung ohne Gateway gibt es keine Fernwerte | meist 0 €, Smart-Meter-Einbau auf Wunsch eventuell kostenpflichtig (offen) |
| **6. Hausverwaltung fragen** | Kurz anfragen, bevor im Keller irgendetwas passiert | (Voraussetzung für 2 und 3) | eine Mail | Fragen: Darf ein kleines Gerät an unserem Zähler hängen? Gibt es im Keller eine Steckdose, die wir nutzen dürfen? Ist ein Smart-Meter-Einbau im Haus geplant? Gibt es WLAN oder LAN im Keller? | 0 € |
| **Ergänzung: von Hand ablesen** | Ab und zu (z.B. wöchentlich) den Zählerstand ablesen und in HA eintragen | grob, als Wochenwert | Zugang zum Kellerraum | Kein Live-Wert, aber zeigt, wie groß der Anteil ist, den die Stecker nicht sehen | 0 € |

Die Wege schließen sich nicht aus. Weg 1 läuft sofort, die Wege 4 bis 6 kosten nichts und klären, ob sich
2, 3 oder 5 überhaupt lohnen.

**Empfehlung (Annahme, Team entscheidet): Start mit Variante B, nur Zwischenstecker.** Sie funktioniert ohne
Keller, ohne Hausverwaltung und ohne PIN, und "Wäsche ist fertig" ist am ersten Abend nutzbar. Parallel und
ohne Kosten: Schaltschrank in der Wohnung ansehen, Hausverwaltung fragen, beim Netzbetreiber nach
Smart Meter und Portal fragen, beim nächsten Kellergang Zählertyp und Typenschild notieren. Einen
Funk-Lesekopf (Weg 2) erst bauen, wenn die Hausverwaltung zugestimmt hat und eine Reichweitenmessung
mit zwei Boards vor Ort funktioniert hat. **(Offen)**

### Simulation zum Ausprobieren

[`sim/index.html`](sim/index.html) ist eine eigenständige Seite (im Browser öffnen, auch am Handy):
eine virtuelle WG im Zeitraffer, Geräte mit änderbaren Leistungsprofilen (Schätzwerte), Haken für
"hat Zwischenstecker", Abdeckungsgrad gemessener gegen wahren Verbrauch, Kosten mit änderbarem Tarif (P),
Live-Vorschau der E-Paper-Anzeige und eine qualitative Funk-Abschätzung vom Keller in die Wohnung
(Stockwerke, Decken- und Wanddämpfung als Parameter (P)). Alle Zahlen darin sind Annahmen, keine Messung.
Die Funk-Abschätzung ersetzt die Messung vor Ort nicht.

![Screenshot der Simulation](sim/screenshot.png)

## Lösungsvarianten

| | A: IR-Lesekopf + Zwischenstecker + HA | B: Nur Zwischenstecker | C: Fertiges Komplettsystem | D: Ferraris-Scheibe zählen |
|---|---|---|---|---|
| Prinzip | Lesekopf am Zähler mit ESP32 (Tasmota oder ESPHome), dazu Messstecker an Großverbrauchern, alles in Home Assistant | Nur Messstecker, kein Gesamtverbrauch | Lesekopf mit Hersteller-App oder Cloud-Dienst | Optischer Sensor zählt Umdrehungen der Drehscheibe |
| Gesamtverbrauch | ja | nein, nur gemessene Geräte | ja | ja, grob |
| "Wer hat den Trockner" | ja | ja | meist nein | nur mit Steckern |
| Kosten (Schätzung) | 90 bis 250 € | 65 bis 180 € mit Flur-Anzeige, 30 bis 95 € ohne | 80 bis 200 € | 70 bis 150 € |
| Aufwand | mittel | gering | gering | mittel bis hoch (Justage) |
| Bastelanteil | Firmware, HA-Konfiguration, Display, Gehäuse (3D-Druck) | HA-Konfiguration, Display | fast keiner | Sensor, Justage, Firmware |
| Risiko | Zähler liefert ohne PIN wenig; bei uns Zähler im Keller, Strom und Funk dort offen | Grundlast bleibt unsichtbar | Cloud, Daten beim Anbieter, wenig Lernwert | ungenau, Fehlzählungen |
| Voraussetzung | digitaler Zähler mit IR-Schnittstelle | keine | je nach Anbieter | Ferraris-Zähler |

**Annahme als Ausgangspunkt: Variante B (nur Stecker)**, seit klar ist, dass der Zähler im Keller eines
Mehrparteienhauses hängt (siehe [Zähler im Keller](#zähler-im-keller)). B läuft sofort und lokal. Variante A
bleibt der Ausbau, falls einer der Keller-Wege trägt (Hausverwaltung einverstanden, Funk gemessen) oder
Daten vom Netzbetreiber kommen. **(Offen, Entscheidung Team.)**

## Bausteine (Variante A)

| Baustein | Umsetzung (Vorschlag) |
|---|---|
| Zähler auslesen | Fertiger IR-Lesekopf für SML (es gibt Varianten mit bereits verbautem ESP-Modul und Tasmota) oder Lesekopf mit TTL-Ausgang an eigenem ESP32 |
| Firmware | Tasmota (SML über Scripting-Build) oder ESPHome (hat eine SML-Komponente). **Welche, ist offen** |
| Gerätemessung | WLAN-Zwischenstecker mit Leistungsmessung, die lokal ohne Cloud nutzbar sind (z.B. mit Tasmota, ESPHome oder lokaler API). Alternativ Zigbee-Stecker, falls der Fenster-Checker ohnehin einen Zigbee-Stick bringt |
| Zentrale | Home Assistant auf dem vorhandenen Raspberry Pi, eingebautes Energie-Dashboard für Tages-, Wochen- und Monatswerte |
| Kosten in € | Arbeitspreis aus dem Stromvertrag als Parameter in HA (ct/kWh (P)), Grundgebühr optional getrennt |
| Anzeige Flur | E-Paper-Display (stromsparend, gut lesbar, kein Leuchten im Flur), angesteuert von einem zweiten ESP32 mit ESPHome, holt Werte von HA. Aktualisierung z.B. alle paar Minuten (P) |
| "Wer hat den Trockner" | Schwelle auf der Leistung des Steckers: über x W (P) gilt "läuft", unter y W (P) für z min (P) gilt "fertig". Daraus auch Push "Wäsche ist fertig" |
| Balkonkraftwerk (optional) | Falls vorhanden oder geplant: Ertrag über einen Messstecker am Einspeisepunkt oder, je nach Wechselrichter, über dessen lokale Schnittstelle. Liefert der Zähler eine Einspeise-Kennzahl, auch daraus |

## Was die Anzeige zeigt

| Feld | Quelle | Hinweis |
|---|---|---|
| Verbrauch heute in kWh | Zählerstand, Differenz seit Mitternacht | geht auch ohne PIN, dann grob |
| Kosten heute in € | kWh x Arbeitspreis (P) | Schätzung, kein Ersatz für die Abrechnung |
| Vergleich Vorwoche | gleicher Wochentag letzte Woche, oder Mittel der letzten 7 Tage (offen) | |
| 7-Tage-Balken | HA-Statistik | |
| Aktuelle Leistung, Grundlast | Momentanleistung vom Zähler | nur mit PIN bzw. wenn der Zähler sie sendet |
| Laufende Großgeräte | Zwischenstecker | Gerät, Laufzeit, Verbrauch des Laufs |
| Balkonkraftwerk-Ertrag | optional | |

## Stückliste (Preise Schätzung)

| Posten | Menge | ca. € |
|---|---|---|
| Raspberry Pi (vorhanden) mit Netzteil, SD-Karte | 1 | 0 bis 15 |
| IR-Lesekopf für SML (mit oder ohne integriertes ESP-Modul) | 1 | 20 bis 45 |
| ESP32-Board für den Lesekopf, falls nicht integriert | 1 | 0 bis 10 |
| USB-Netzteil und Kabel am Zählerort | 1 | 5 bis 15 |
| WLAN-Zwischenstecker mit Leistungsmessung, lokal nutzbar | 2 bis 4 | 30 bis 80 |
| E-Paper-Display (ca. 4 bis 7,5 Zoll) mit Treiberplatine | 1 | 25 bis 60 |
| ESP32 für das Display | 1 | 5 bis 10 |
| Gehäuse/Rahmen (3D-Druck), Kleinteile, Netzteil Display | 1 | 5 bis 15 |
| **Summe Variante A** | | **ca. 90 bis 250** |

Variante B (Startpunkt) besteht aus Pi, 2 bis 4 Zwischensteckern, Display, Display-ESP32 und Gehäuse:
**ca. 65 bis 180 €**, ohne Flur-Anzeige ca. 30 bis 95 €. Für Weg 2 (Funk-Lesekopf) kämen Lesekopf, Board mit
Funkmodul, Akku und Empfänger dazu, grob 40 bis 90 € (P), erst nach der Reichweitenmessung.

Untere Spanne: Lesekopf mit integriertem ESP, zwei Stecker, kleineres Display.
Obere Spanne: separater ESP32, vier Stecker, großes Display. Passt ins Budget von 300 €,
zusammen mit dem Fenster-Checker (Variante A, ca. 60 bis 120 €) wird es knapp. **Alle Preise Schätzung.**

**Wichtig bei den Zwischensteckern:** Trockner und Waschmaschine ziehen über längere Zeit hohe
Leistung. Nur Stecker nehmen, deren zulässige Dauerlast laut Datenblatt für das Gerät reicht.
Hier werden keine Nennwerte angenommen, das wird beim Kauf je Modell geprüft. Kein Stecker an
Geräten, die fest angeschlossen sind (z.B. Herd, Durchlauferhitzer), das wäre ein Eingriff in die Installation.

## Meilensteine

Der Reihe nach, jeder liefert für sich schon etwas Nutzbares.

| | Ziel | Fertig, wenn |
|---|---|---|
| M0 | Zähler klären | Zählertyp und Typenschild im Keller notiert (nur ansehen), Schaltschrank in der Wohnung angesehen, Hausverwaltung und Netzbetreiber (Smart Meter, Portal, PIN) angefragt |
| M1 | Home Assistant auf dem Pi | HA läuft, im WG-WLAN erreichbar (gemeinsam mit Fenster-Checker, falls der zuerst kommt) |
| M2 | Großverbraucher messen | 2 Zwischenstecker in HA, "Trockner läuft / fertig" als Sensor, Push bei "fertig" |
| M3 | Zähler auslesen (nur falls ein Keller-Weg trägt) | Reichweite vor Ort gemessen und Erlaubnis da, dann: Lesekopf liefert Zählerstand in HA, Energie-Dashboard zeigt Tageswerte; mit PIN auch Leistung. Alternativ Werte vom Netzbetreiber in HA |
| M4 | Kosten und Vergleich | Arbeitspreis als Parameter, Kosten heute, Vergleich Vorwoche, 7-Tage-Verlauf |
| M5 | Anzeige im Flur | E-Paper zeigt die Felder aus dem Mockup, Gehäuse gedruckt, läuft eine Woche stabil |
| M6 (optional) | Balkonkraftwerk | Ertrag und Eigenverbrauch sichtbar |

M2 vor M3, weil die Stecker sofort funktionieren, während der Zähler auf Hausverwaltung, Funktest und PIN
warten kann. M4 und M5 gehen auch ohne M3, dann eben mit "nur Geräte mit Stecker" auf der Anzeige.

## Synergien mit dem Fenster-Checker

Siehe [`../fenster-checker/`](../fenster-checker/). Keine Wertung, nur was zusammenpasst:

- **Gleicher Pi, gleiches Home Assistant.** Wird eine der beiden Ideen gebaut, ist die
  Grundlage für die andere schon da (M1 entfällt fast).
- **Heizen und Lüften.** HA kennt dann Fensterzustand und Verbrauch. Bei elektrischer Heizung
  oder Heizlüfter könnte die Anzeige zeigen "Fenster offen und Heizlüfter an". Bei Gas- oder
  Fernwärme sieht der Stromzähler die Heizung nicht, dann bleibt es beim Fenster-Hinweis.
  **(Wie bei uns geheizt wird: offen)**
- **Zigbee-Stick.** Bringt der Fenster-Checker einen Zigbee-Koordinator mit, können die
  Zwischenstecker auch Zigbee-Stecker sein (keine WLAN-Last, oft günstiger). **(Offen)**
- **Eine Flur-Anzeige für beides.** Das E-Paper könnte zusätzlich "2 Fenster offen" zeigen.

## Datenschutz in der WG

Stromdaten verraten Gewohnheiten: wer wann aufsteht, kocht, wäscht, zockt oder nicht da ist.
In einer WG mit drei Leuten ist das heikel, auch wenn alle befreundet sind. Vorschlag (als Annahme,
Team entscheidet):

- **Alles lokal.** Keine Cloud, Daten bleiben auf dem Pi. Zugriff von außen nur, wenn alle zustimmen.
- **Gesamt statt Person.** Die Anzeige zeigt Geräte, nicht Personen. "Trockner läuft", nicht "Max' Trockner".
- **Keine Stecker in Privatzimmern** ohne Zustimmung der Person, der das Zimmer gehört.
  Gemeinschaftsgeräte (Waschmaschine, Trockner, Kühlschrank) sind der Normalfall.
- **Auflösung begrenzen.** Feine Werte im Sekundentakt nur kurz behalten, langfristig nur
  Stunden- bzw. Tageswerte (Aufbewahrungsdauer (P)). HA hat dafür Einstellungen für die Datenaufbewahrung.
- **Flur-Anzeige ist öffentlich** für Gäste. Nichts anzeigen, was man Besuch nicht zeigen will.
- **Kein Abrechnungstool.** Die Werte sind Schätzungen und sollen nicht zum Streit über
  Stromkostenaufteilung führen, es sei denn, alle wollen genau das.
- **Abschaltbar.** Jede Person kann verlangen, dass ein Stecker oder die Anzeige abgeschaltet wird.

## Risiken und harte Stellen

- **Zählertyp und PIN** (siehe oben): bestimmt, ob die Kernfunktion überhaupt geht.
- **Zähler im Keller (bei uns der Fall):** Strom, Funk und Erlaubnis dort offen. Funkreichweite durch
  mehrere Decken lässt sich nicht vorhersagen, nur messen. Zähler anderer Parteien nie berühren.
- **Lesekopf justieren:** Muss genau vor der Schnittstelle sitzen, Fremdlicht stört.
- **Zwischenstecker-Last:** siehe Stückliste, Dauerlast je Modell prüfen.
- **Stromtarif ändert sich:** Arbeitspreis muss als Parameter pflegbar sein, nicht im Code.

## Bewertung

| | Einschätzung |
|---|---|
| Schwerpunkt | Daten sammeln, Home Assistant, kleine Firmware, Display-Layout |
| Feedback | schnell: Stecker am ersten Abend, Zähler nach PIN |
| Risiko | gering, keine Netzspannung, kein Wasser, keine Mechanik |
| Nutzen im Alltag | täglich sichtbar, "Wäsche fertig" ist sofort nützlich |
| Lernwert | mittel, viel Konfiguration, wenig Elektronik |

## Offene Entscheidungen

- Welcher Zähler hängt bei uns im Keller (Typ, Modell, Smart Meter oder nicht)? (Klärt M0)
- Start mit Variante B, wie hier angenommen?
- PIN beim Netzbetreiber anfragen: wer, über wessen Vertrag?
- Darf ein Gerät an unserem Zähler im Keller hängen, und gibt es dort eine Steckdose, die wir nutzen dürfen? (Hausverwaltung)
- Lohnt ein Funktest Keller nach Wohnung, und mit welcher Funktechnik (LoRa, ESP-NOW, WLAN mit Repeater)?
- Bietet der Netz- bzw. Messstellenbetreiber ein Portal oder eine Schnittstelle für unsere Werte?
- Tasmota oder ESPHome für den Lesekopf?
- WLAN- oder Zigbee-Zwischenstecker (hängt am Fenster-Checker)?
- Welche Geräte bekommen einen Stecker, und wer stimmt zu?
- Display-Größe und Platz im Flur, Stromversorgung dort (Steckdose oder Akku)?
- Vergleich Vorwoche: gleicher Wochentag oder Mittel der letzten 7 Tage?
- Arbeitspreis und Grundgebühr: wer trägt den aktuellen Tarif ein?
- Gibt es ein Balkonkraftwerk oder ist eines geplant?
- Datenschutzregeln oben: übernehmen, ändern, ergänzen?
- Wie wird geheizt (relevant für die Synergie mit dem Fenster-Checker)?
