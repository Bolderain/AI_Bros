# Smart Plant Care: Spezifikation Stufe 1

Stand: 24.09.2026, Version 1.2 (Änderungen siehe Abschnitt 15)
Werte mit **(P)** sind Platzhalter oder Vorschläge und werden durch Kalibrierung oder Teamentscheidung ersetzt. Preise sind Schätzungen, nicht geprüft.

Diese Datei ist die maßgebliche Spezifikation für Stufe 1. Hintergrund, Begründungen und spätere Stufen stehen in den übrigen Dateien unter `docs/`.

**Stufen im Projekt:** 1 Tischprototyp mit komplettem Regelkreis (diese Datei) · 2 autarkes Gerät (Akku, Deep Sleep, Gehäuse, Formfaktor, ggf. integrierter Tank) · 3 mehrere Töpfe · 4 Hydroponik · 5 Pilz-Growbox.

---

## 0. Arbeitsanweisungen für Claude Code

1. Diese Datei ist die maßgebliche Spezifikation. Bei Widerspruch zwischen Code und Spezifikation nachfragen, nicht raten.
2. Keine Bauteildaten, Pinbelegungen oder Registerwerte erfinden. Pinbelegung erst nach Abgleich mit dem Board-Pinout festlegen, Strapping-Pins meiden.
3. Alle Schwellen, Mengen und Grenzen als Parameter (Abschnitt 5.2), nie hart im Code. Ausnahme: absolute Firmware-Grenzen (Abschnitt 5.3). (P)-Werte im Code als `TODO(P)` markieren.
4. Entscheidungslogik als reine Funktion ohne I/O kapseln (`firmware/components/plant_logic/`), damit sie auf dem Host unit-testbar ist. ESPHome ruft sie nur auf.
5. Secrets (WLAN, MQTT) nur in `secrets.yaml`, per `.gitignore` ausgeschlossen.
6. Meilensteine M1 bis M5 (Abschnitt 11) der Reihe nach umsetzen, nicht vorgreifen.
7. Offene Entscheidungen (Abschnitt 10) nicht selbst treffen. Annahme dokumentieren und markieren.
8. Jede empfangene Config gegen die absoluten Grenzen prüfen. Ungültige Werte verwerfen, letzte gültige Config behalten.

Kurzfassung dieser Regeln steht zusätzlich in `CLAUDE.md` im Repo-Root. Bei Änderungen beide Stellen anpassen.

---

## 1. Ziel und Erfolgskriterium

**Ziel:** Funktionsnachweis des kompletten Regelkreises am Tisch-Prototyp:
Messen → Entscheiden → Wasser/Dünger dosieren → Vorräte überwachen → protokollieren → benachrichtigen.

**Erfolgskriterium (P):** Referenzpflanze 6 bis 8 Wochen ohne Eingriff außer Nachfüllen, Feuchte im Zielband, kein Wasseraustritt, alle Muss-Tests aus Abschnitt 9 bestanden.

Hinweis: Der Dauertest M5 (Abschnitt 11) ist mit 4 Wochen angesetzt, das Erfolgskriterium nennt 6 bis 8 Wochen. Klärung in E11.

---

## 2. Anforderungen

| ID | Prio | Anforderung | Abnahme |
|---|---|---|---|
| R01 | Muss | Referenzpflanze, Topf mit Abzugsloch und Untersetzer festgelegt | in `docs/` dokumentiert |
| R02 | Muss | Wasserzustand erfassen per kapazitiver Sonde, Topfgewicht optional parallel (R18) | Kalibrierung trocken/nass vorhanden |
| R03 | Muss | Morgens bei Unterschreiten der Schwelle definierte Menge gießen, in Portionen mit Pause | T01, T02 |
| R04 | Muss | Harte Grenzen lokal im Node: ml/Tag, ml/Woche, max. Pumpenlaufzeit | T11 |
| R05 | Muss | Düngen nach saisonalem Plan. Dosis aus Etikettkonzentration × Wassermenge, eingespült zwischen zwei Wasserportionen. Fällige Düngung ohne Gießbedarf wird beim nächsten Gießen nachgeholt | T03, T19 |
| R06 | Muss | Nährstoff-Trend = Dosierprotokoll (ml/Monat, letzte Dosierung). Keine erfundenen Nährstoffwerte | T14 |
| R07 | Muss | Wasservorrat per Wägezelle, Düngervorrat per Wägezelle (Soll) oder Dosenzähler, Warnung bei Restreichweite unter 3 Tagen (P) | T04, T05 |
| R08 | Muss | Störungen melden: Pumpe fördert nicht, Sonde ungültig, Feuchte steigt nicht, Lebenszeichen fehlt | T06, T07, T08, T10, T20 |
| R09 | Muss | Autark bei Ausfall von Raspi oder WLAN, mit letzter gültiger Konfiguration | T09 |
| R10 | Muss | Lokal: Mosquitto + Home Assistant auf vorhandenem Raspi, keine Cloud-Pflicht | ohne Internet lauffähig |
| R11 | Muss | Manuelle Eingriffe: jetzt gießen, Pause, Kalibrieren, Reset nach Umtopfen, Dünger nachgefüllt | T12 |
| R12 | Muss | Vollständiges Datenprotokoll (Rohwerte, Aktionen, manuelle Eingriffe) über die gesamte Projektdauer | T15 |
| R13 | Muss | Steckbar, kein Löten, 5-V-Netzteil. Elektronik getrennt von Wasserführung, Auffangwanne | Sichtprüfung |
| R14 | Muss | Messintervall parametrierbar: Stufe 1 alle 15 min (P), Ziel Stufe 2 einmal täglich mit Deep Sleep | Parameter wirkt |
| R15 | Muss | Zähler, Sperren, fällige Düngung und Kalibrierung überleben Neustart und Stromausfall | T13 |
| R16 | Soll | Hardware akkutauglich (Board mit Akkuanschluss, geringer Schlafstrom, abschaltbare Peripherie) | BOM |
| R17 | Kann | EC-Messung als Zusatzindikator für Versalzung: Mi Flora (BLE) oder EC-Modul am ESP (nur zur Messung bestromt, Wechselspannung). Trend nur bei gleicher Feuchte vergleichbar | optional |
| R18 | Kann | Topf auf Wägezelle zum Vergleich mit der Sonde (Datenbasis KI) | optional |
| R19 | Muss | Zeitquelle ohne Internet (lokaler NTP-Server). Ohne gültige Zeit Notbetrieb | T18 |
| R20 | Muss | Config-Validierung gegen absolute Firmware-Grenzen | T17 |
| R21 | Soll | Manuelles Gießen erkennen und protokollieren (Datenqualität KI) | T21 |
| R22 | Kann | Lufttemperatur und Luftfeuchte (SHT40) als Kontext für die KI-Datenbasis | optional |

---

## 3. Architektur

```
Topf ← Sonde, Pumpen ← ESP32-C6 (ESPHome) ⇄ WLAN/MQTT ⇄ Raspi (Mosquitto + Home Assistant + NTP) → Dashboard, Push
```

**Leitprinzip:** Der Node entscheidet lokal und hält die Sicherheitsgrenzen selbst ein. Der Raspi liefert Parameter (retained MQTT) und Zeit, speichert Verläufe, erkennt fehlende Lebenszeichen und alarmiert.

---

## 4. Hardware

| Pos | Bauteil | Menge | ca. € | Hinweis |
|---|---|---|---|---|
| H01 | DFRobot FireBeetle 2 ESP32-C6 | 1 | 10 | Akkuanschluss und Laderegler onboard. Deep Sleep laut Hersteller 16 µA; 36 µA für V1.2 nicht verifiziert. **Stiftleisten liegen lose bei** (Lieferumfang laut Händlern: 2 × 20-pol. Stiftleiste), Anlöten widerspricht R13, siehe E10 |
| H02 | Kapazitiver Feuchtesensor (Markenmodul oder v1.2 mit TLC555) | 2 | 20 | NE555-Klone laufen an 3,3 V unzuverlässig. Platinenkante versiegeln. Nur während der Messung bestromen |
| H03 | Schlauchpumpe 5 V | 2 | 30 | Wasser und Dünger. Keine Rückschlagventile nötig |
| H04 | Silikonschlauch passend zur Pumpe | 2 m | 5 | |
| H05 | DRV8833-Modul, vorgelötet | 1 | 5 | beide Pumpen, VM aus 5 V. Prüfen, ob nSLEEP auf dem Modul fest verdrahtet ist, für Stufe 2 per GPIO schaltbar vorsehen. "Vorgelötet" ist Kaufkriterium |
| H06 | Wägezelle 1 kg + HX711, vorgelötet | 1 | 10 | unter Wassertank, HX711 zwischen Messungen im Power-Down. Wägezelle per Schraubklemme oder fertig konfektioniert anschließen |
| H06b | Kleine Wägezelle + HX711 | 1 | 10 | Soll: unter Düngerbehälter, Förderkontrolle Dünger |
| H07 | Wägezelle + HX711 für Topf | 1 | 10 | optional (R18), Kapazität nach Topfgewicht wählen |
| H08 | Mi Flora HHCCJCY01 | 1 | 25 | optional (R17), Firmware ab 3.2.1 für HA nötig; neuere Geräte senden laut HA-Doku keinen Batteriestand mehr |
| H09 | Steckbrett, Jumper, Wago-Klemmen, Schraubklemmen-Adapter | 1 | 20 | |
| H10 | USB-C-Netzteil 5 V / 3 A + USB-Strommessgerät | 1 | 25 | Strommessung als Basis für Stufe 2 |
| H11 | Wassertank 0,5 l blickdicht, Düngerbehälter 0,1 l blickdicht, Auffangwanne | 1 | 10 | |
| H12 | SHT40-Modul mit STEMMA-QT/Qwiic-Stecker + Kabel auf Stiftleiste | 1 | 8 | optional (R22), Steckverbinder statt Löten |

Summe Node 1 ca. 188 € (ohne H07/H08/H12 ca. 145 €). Zweites Set für paralleles Arbeiten ca. 90 €. 18650-Zelle + Halter für Akkutests ca. 15 €. **Gesamt ca. 293 € von 300 €**, Versand nicht enthalten, Reserve damit knapp (E5). Sparhebel in dieser Reihenfolge: H08, H12, H07, Umfang des zweiten Sets.

### 4.1 Mechanischer Aufbau

| Punkt | Vorgabe |
|---|---|
| Auslässe | Wasser und Dünger an derselben Stelle, fest fixiert, Abstand zur Sonde 3 bis 5 cm (P). Zu weit weg: Fehlalarm bei der Anstiegsprüfung. Direkt auf der Sonde: verfälschte Messung |
| Schläuche an Behältern | lose und zugentlastet führen, damit sie das Wägeergebnis nicht verfälschen |
| Elektronik | oberhalb des Wasserniveaus, räumlich getrennt, alles in Auffangwanne |
| Behälter | blickdicht gegen Algen |

### 4.2 Bewusst nicht verwenden

| Bauteil | Grund |
|---|---|
| IRF520-MOSFET-Module | kein Logic-Level, schaltet an 3,3 V nicht sauber durch |
| JSN-SR04T Ultraschall | Blindzone ca. 20 bis 25 cm, in kleinen Tanks unbrauchbar |
| Resistive Feuchtesensoren | Elektrolyse, Korrosion |
| Tauchpumpen | ungenau, Heberrisiko |
| NPK-Sonden | Hersteller kennzeichnen Werte selbst nur als Referenz |
| ESP32 DevKit V1 | für Stufe 2 ungeeignet (hoher Ruhestrom durch USB-UART und LDO) |

---

## 5. Firmware (ESPHome, `esp32: variant: esp32c6`)

### 5.1 Zyklus

1. Aufwachen (Stufe 1: `measure_interval_min`, Stufe 2: Deep Sleep bis Uhrzeit)
2. Sonde per GPIO einschalten, Einschwingzeit 500 ms (P), 10 Messungen mitteln, Streuung prüfen, Sonde aus
3. Wägezellen lesen, nie während eines Pumpenlaufs, nach `settle_s` Beruhigungszeit
4. WLAN, Zeit (lokaler NTP-Server bevorzugt), MQTT verbinden. Config lesen und validieren (5.3). Timeout 10 s (P), danach letzte gültige Config
5. Gültigkeitsprüfungen (Abschnitt 7)
6. Keine gültige Zeit: Notbetrieb (5.5)
7. Nur im Gießfenster und höchstens einmal pro Tag: Entscheidung per `plant_logic`
8. Gießen: Portion 1 Wasser → falls Düngung fällig: Dünger → Pause → Portion 2 Wasser (spült ein und verdünnt). Behälter vor und nach jedem Pumpenlauf wiegen
9. Düngung fällig, aber kein Gießbedarf: bleibt fällig bis zum nächsten Gießen
10. Feuchtesprung ohne eigenes Pumpenevent: Event `manual_detected`
11. `state` und `event` publizieren
12. Warten bzw. schlafen

### 5.2 Parameter (`plant/<id>/config`, retained JSON)

| Parameter | Einheit | Default | Bedeutung |
|---|---|---|---|
| `moisture_dry_raw` | ADC | Kalibrierung | Rohwert trocken |
| `moisture_wet_raw` | ADC | Kalibrierung | Rohwert frisch gegossen |
| `moisture_threshold_pct` | % | 35 (P) | Gießen unterhalb |
| `emergency_threshold_pct` | % | 15 (P) | Gießen im Notbetrieb unterhalb |
| `water_dose_ml` | ml | 50 (P) | Menge pro Gießvorgang |
| `water_split` | Anzahl | 2 (P) | Portionen |
| `split_pause_s` | s | 300 (P) | Pause zwischen Portionen |
| `water_window` | Uhrzeit | 06:00 bis 09:00 (P) | Gießfenster |
| `max_water_day_ml` | ml | 150 (P) | Tageslimit |
| `max_water_week_ml` | ml | 500 (P) | Wochenlimit |
| `pump_water_ml_per_s` | ml/s | Kalibrierung | Förderrate Wasser |
| `pump_fert_ml_per_s` | ml/s | Kalibrierung | Förderrate Dünger |
| `max_pump_runtime_s` | s | 60 (P) | Limit pro Lauf |
| `fert_ml_per_l` | ml/l | laut Etikett (P) | Düngerkonzentration bezogen auf das Gießwasser |
| `fert_predilution` | Faktor | 10 (P) | Vorverdünnung im Düngerbehälter, damit Dosen im ml-Bereich liegen |
| `fert_interval_days` | d | 14 (P) | Abstand |
| `fert_months` | Liste | 3 bis 9 (P) | Düngesaison |
| `fert_tank_ml` | ml | 100 (P) | Füllmenge beim Nachfüllen |
| `reserve_warn_days` | d | 3 (P) | Warnschwelle Restreichweite |
| `flow_check_min_ratio` | Faktor | 0,5 (P) | gemessen/erwartet, darunter Alarm |
| `moisture_rise_min_pct` | %-Punkte | 5 (P) | Mindestanstieg nach dem Gießen |
| `rise_check_delay_min` | min | 60 (P) | Wartezeit Plausibilitätsprüfung (Stufe 2: nächster Zyklus) |
| `manual_detect_jump_pct` | %-Punkte | 10 (P) | Feuchtesprung ohne Pumpenevent gilt als manuelles Gießen |
| `sensor_margin_pct` | % | 5 (P) | Toleranz außerhalb Kalibrierbereich |
| `settle_s` | s | 5 (P) | Beruhigungszeit vor Wägung |
| `measure_interval_min` | min | 15 (P) | Messintervall Stufe 1 |
| `pause` | bool | false | Automatik aus |
| `ota_hold` | bool | false | wach bleiben für OTA (Stufe 2) |

**Düngerdosis (Pumpe Düngerbehälter):**
`dose_ml = fert_ml_per_l × Wassermenge_ml / 1000 × fert_predilution`
Grund: Flüssigdünger wird meist in wenigen ml pro Liter dosiert (Schätzung, Etikett maßgeblich). Unverdünnt ergäben sich Dosen unter 1 ml, die eine Schlauchpumpe nicht reproduzierbar trifft.
Beispiel (Etikett 5 ml/l als Annahme): 50 ml Gießwasser brauchen 0,25 ml Konzentrat, bei Vorverdünnung 10 fördert die Pumpe 2,5 ml Lösung.

### 5.3 Absolute Firmware-Grenzen

Im Code fest, nicht per Config änderbar. Config-Werte außerhalb werden verworfen, letzte gültige Config bleibt aktiv, Event `config_rejected`.

| Konstante | Wert |
|---|---|
| `ABS_MAX_WATER_DAY_ML` | 300 (P) |
| `ABS_MAX_WATER_WEEK_ML` | 1000 (P) |
| `ABS_MAX_PUMP_RUNTIME_S` | 120 (P) |
| `ABS_MAX_FERT_DAY_ML` | 10 (P) |

### 5.4 Persistenz

Tages- und Wochenzähler, Düngerzähler, letzte Düngung, Flag "Düngung fällig", aktive Sperren und letzte gültige Config im Flash (ESPHome `globals` mit `restore_value`). Flash-Schreibhäufigkeit begrenzen.

### 5.5 Notbetrieb ohne gültige Zeit

Gießfenster unbekannt. Gießen nur bei Feuchte unter `emergency_threshold_pct`, höchstens einmal pro 24 h Laufzeit, kein Dünger. Event `emergency`.

### 5.6 Hardware-Sicherheit

Pumpeneingänge bei Reset definiert LOW (DRV8833-Eingänge mit internem Pulldown, im Datenblatt prüfen). Pumpen nur über eine zentrale Funktion mit festem Timeout ansteuern. Watchdog aktiv, damit ein hängender Firmwarezustand zum Reset und damit zum Pumpenstopp führt.

---

## 6. MQTT-Schema

| Topic | Richtung | retained | Inhalt |
|---|---|---|---|
| `plant/<id>/state` | Node → Zentrale | nein | JSON: `ts`, `time_valid`, `moisture_raw`, `moisture_pct`, `sensor_valid`, `tank_water_ml`, `fert_left_ml`, `fert_due`, `pot_weight_g` (opt.), `air_temp_c` und `air_rh_pct` (opt., R22), `water_today_ml`, `water_week_ml`, `lock`, `rssi`, `fw` |
| `plant/<id>/event` | Node → Zentrale | nein | JSON: `ts`, `type` (water/fert/alarm/manual/manual_detected/calib/config_rejected/emergency), `requested_ml`, `measured_ml`, `reason` |
| `plant/<id>/config` | Zentrale → Node | ja | Parameter aus 5.2 |
| `plant/<id>/cmd` | Zentrale → Node | nein (Stufe 2: ja, mit ID und Quittung) | `water_now`, `calibrate_dry`, `calibrate_wet`, `reset_after_repot`, `fert_refilled`, `unlock` |
| `plant/<id>/status` | Node | ja | online/offline, Deep Sleep in Stufe 2 nicht als Fehler werten |

Home-Assistant-Entitäten per MQTT Discovery. Hinweis Stufe 2: Im Tiefschlaf verpasst der Node nicht-retained Befehle.

---

## 7. Sicherheitslogik

| Fall | Erkennung | Reaktion |
|---|---|---|
| Sonde ungültig | Rohwert außerhalb Kalibrierbereich ± `sensor_margin_pct` oder Streuung zu hoch | nicht gießen, Alarm |
| Wasserpumpe fördert nicht | Tankabnahme < `flow_check_min_ratio` × Soll | Pumpe aus, Sperre, Alarm |
| Düngerpumpe fördert nicht | Abnahme Düngerbehälter < `flow_check_min_ratio` × Soll (mit H06b) | Düngung sperren, Alarm |
| Wasser geht daneben | Feuchte steigt nicht um `moisture_rise_min_pct` | Sperre, Alarm |
| Limit erreicht | Tages- oder Wochenzähler | nicht gießen, Info |
| Pumpe hängt | Laufzeit > `max_pump_runtime_s` bzw. `ABS_MAX_PUMP_RUNTIME_S` | Abschaltung, Alarm |
| Tank leer | Restmenge < Dosis | nicht gießen, Alarm |
| Config ungültig | Wert außerhalb absoluter Grenzen | verwerfen, letzte gültige behalten, Event |
| Keine gültige Zeit | NTP nicht erreichbar | Notbetrieb (5.5) |
| Keine Zentrale | Config-Timeout | mit letzter Config weiter (Entscheidung E3) |
| Node ausgefallen | Zentrale: kein `state` seit 26 h (P) | Push |

Sperren werden nur manuell im Dashboard aufgehoben (`unlock`), vorbehaltlich Entscheidung E9.

---

## 8. Zentrale (Raspi)

| Baustein | Umsetzung |
|---|---|
| Broker | Mosquitto, Zugang mit Benutzer/Passwort |
| Zeit | lokaler NTP-Server (z. B. chrony) als Zeitquelle für den Node. Bei Home Assistant OS nur über ein Add-on möglich (Verfügbarkeit prüfen, E12) |
| Home Assistant | Installationsart abhängig vom Raspi-Modell (offen, E12) |
| Dashboard | Feuchteverlauf, Wasser ml + Restreichweite in Tagen, Dünger ml, fällige Düngung, letzte Aktionen, Dosierprotokoll pro Monat, Alarme, Parametereingabe, Buttons für R11 |
| Restreichweite | Restmenge / mittlerer Tagesverbrauch (gleitend 14 Tage (P)) |
| Lebenszeichen | Automation: kein `state` seit 26 h (P) → Push |
| Benachrichtigung | HA Companion App. Local Push läuft per WebSocket ohne Apple/Google, unter iOS nur im Heimnetz mit hinterlegter SSID. Weg für unterwegs: Entscheidung E2 |
| Datenhaltung | HA löscht den Verlauf standardmäßig nach 10 Tagen: `purge_keep_days` erhöhen oder zusätzlich InfluxDB bzw. CSV-Export nach `data/`. Schreiblast auf SD-Karte beachten |
| Mi Flora (optional) | HA-Integration Xiaomi BLE, Raspi in BLE-Reichweite |

---

## 9. Tests (Definition of Done)

| ID | Prio | Test | Erwartung |
|---|---|---|---|
| T01 | Muss | Topf zu trocken | definierte Menge wird gegeben, Abweichung ≤ ±5 % (P) |
| T02 | Muss | Topf feucht genug | kein Gießen |
| T03 | Muss | Düngetag mit Gießbedarf | Reihenfolge Wasser, Dünger, Wasser, Dosis gemäß Formel 5.2 |
| T04 | Muss | Wasser-Restreichweite unter Schwelle | Push |
| T05 | Muss | Dünger fast leer | Push |
| T06 | Muss | Ansaugschlauch aus dem Wassertank gezogen | Alarm, Sperre |
| T07 | Muss | Sonde aus der Erde gezogen | ungültig, kein Gießen, Alarm |
| T08 | Muss | Auslass vom Topf gelöst | Feuchte steigt nicht, Sperre, Alarm |
| T09 | Muss | Raspi aus | Node gießt innerhalb der Limits weiter |
| T10 | Muss | Node stromlos | Lebenszeichen-Alarm |
| T11 | Muss | Tages- und Wochenlimit | greifen |
| T12 | Muss | Parameteränderung und Buttons im Dashboard | wirken beim nächsten Zyklus |
| T13 | Muss | Stromausfall während aktiver Sperre und fälliger Düngung | Sperre, Zähler und Flag bleiben erhalten |
| T14 | Muss | Dashboard | zeigt Feuchte, Vorräte, letzte Dosierung, Dosierprotokoll, Historie |
| T15 | Muss | Nach 4 Wochen | Rohdaten, Aktionen und Eingriffe lückenlos exportierbar |
| T16 | Muss | Unit-Tests `plant_logic` | laufen auf dem Host |
| T17 | Muss | Config mit Tageslimit über `ABS_MAX_WATER_DAY_ML` | verworfen, Event `config_rejected` |
| T18 | Muss | Neustart ohne Netz und Zeitquelle | Notbetrieb, nur unter Not-Schwelle, kein Dünger |
| T19 | Muss | Düngung fällig, Topf feucht | keine Düngung, Flag bleibt, Nachholen beim nächsten Gießen |
| T20 | Soll | Ansaugschlauch aus dem Düngerbehälter gezogen | Alarm, Düngung gesperrt |
| T21 | Soll | Von Hand gießen | Event `manual_detected` |

---

## 10. Offene Entscheidungen

| ID | Frage | Stand, Hinweis |
|---|---|---|
| E1 | Welche Referenzpflanze, welcher Topf, welches Substrat? | Vorschlag: Efeutute, verzeiht Fehler. Profile in `10-pflegeregeln.md` |
| E2 | Push unterwegs: nur Heimnetz, VPN (WireGuard) auf dem Raspi oder Relay nur für Alarme? | Relay z. B. über die Telegram-Integration von HA |
| E3 | Kein Kontakt zur Zentrale: unbegrenzt autonom mit Limits oder Stopp nach X Tagen? | |
| E4 | Dünger per zweiter Pumpe oder schwach im Wassertank vorgemischt? | BOM geht von zweiter Pumpe aus (H03 × 2) |
| E5 | Gilt das Budget nur für Stufe 1 oder für das Gesamtprojekt? | Kickoff: 300 €. Abschnitt 4 kommt auf ca. 293 € ohne Versand |
| E6 | Zeitrahmen und Termine der Meilensteine | Kickoff: Stufe 1 fertig bis spätestens März 2027. Terminvorschlag in Abschnitt 11 (P) |
| E7 | Was soll die KI später entscheiden, das eine Schwellwertregel nicht kann? | |
| E8 | Ist der 0,5-l-Formfaktor fest oder zugunsten der Autonomie verhandelbar? | Kickoff nannte Flaschengröße und später einen Tank im Gerät. Beides zusammen passt nicht (`09-mechanik-gehaeuse.md`) |
| E9 | Sperre während Abwesenheit: komplett stoppen (Schutz vor Wasserschaden) oder eingeschränkter Notbetrieb (Schutz der Pflanze)? | |
| E10 | Board und Löten: FireBeetle 2 einmal mit Stiftleisten bestücken (ein Board für Stufe 1 und 2) oder für Stufe 1 ein fertig bestiftetes Board (z. B. ESP32-C6-DevKitC-1) und Wechsel in Stufe 2? | R13 (Muss) gegen R16 (Soll) |
| E11 | Dauertest: M5 mit 4 Wochen oder 6 bis 8 Wochen gemäß Erfolgskriterium? | Vorschlag: M5 Anfang Februar 2027 starten, dann passen 8 Wochen bis Ende März |
| E12 | Welches Raspi-Modell, welche Installationsart für Home Assistant (HA OS oder Container)? | bestimmt, wie der NTP-Server läuft (R19) |

---

## 11. Meilensteine und Rollen

| Meilenstein | Zeitraum (P) | Inhalt | Rolle | Abnahme |
|---|---|---|---|---|
| M1 Messkette | Okt 2026 | Sonde im echten Topf kalibrieren, 15-min-Logging in HA, NTP auf Raspi | Hardware + Zentrale | Trocknungskurve über 7 Tage |
| M2 Aktorik | Nov 2026 | Pumpen mit Küchenwaage kalibrieren, Düngervorverdünnung festlegen, Wägezellen | Hardware | T01-Genauigkeit, Düngerdosis reproduzierbar |
| M3 Logik | Nov 2026 bis Jan 2027 | `plant_logic`, Zyklus, Düngeplan, Sicherheitslogik, absolute Grenzen, Notbetrieb, Persistenz | Firmware | T02, T03, T06 bis T09, T11, T13, T16 bis T21 |
| M4 Zentrale | Dez 2026 bis Jan 2027 | Dashboard, Push, Lebenszeichen, Datenhaltung | Zentrale | T04, T05, T10, T12, T14 |
| M5 Dauertest | Feb bis Mär 2027 | 4 Wochen am Netzteil mit Strommessung (Dauer: E11) | alle | T15, Datenbasis für Stufe 2 |

M3 und M4 laufen parallel, weil sie verschiedene Rollen betreffen. Die Unit-Tests von `plant_logic` kann Rolle B schon während M1 und M2 auf dem Host beginnen. Ablauf je Meilenstein und Stand: `11-meilensteine.md`.

| Rolle | Verantwortung |
|---|---|
| A Hardware | Verdrahtung, Flüssigkeitsführung, Mechanik, Kalibrierung Sonde/Pumpen/Wägezellen |
| B Firmware | ESPHome, `plant_logic`, Sicherheitslogik, Persistenz, Unit-Tests |
| C Zentrale/Daten | Mosquitto, NTP, HA, Dashboard, Push, Datenexport, spätere KI-Auswertung |

---

## 12. Repo-Struktur

```
AI_Bros/
├── CLAUDE.md                 Kurzfassung von Abschnitt 0
├── firmware/                 ESPHome-YAML, secrets.yaml (ignoriert)
│   ├── components/plant_logic/   Entscheidungslogik ohne I/O
│   └── test/                 Host-Unit-Tests
├── homeassistant/            Dashboards, Automationen, Mosquitto-Config
├── hardware/                 Verdrahtung, Fotos (BOM steht in Abschnitt 4)
├── calibration/              Protokolle Sonde, Pumpen, Wägezellen
├── data/                     Exporte für spätere Auswertung
├── mockup/                   Skizzen für Stufe 2
└── docs/                     diese Spezifikation (00), Hintergrund und spätere Stufen (01 bis 15)
```

---

## 13. Ausblick Stufe 2 (nicht umsetzen)

| Thema | Stand |
|---|---|
| Deep Sleep | ESPHome kann auf dem ESP32 bis zu einer Uhrzeit schlafen (`deep_sleep.enter` mit `until` und SNTP). Im Tiefschlaf kein OTA, daher `ota_hold` |
| Energie (Schätzung) | Board-Schlaf 0,9 + Wachphase 0,3 + Pumpe 4,0 = ca. 5,2 mAh/Tag. Zu optimistisch: Ruhestrom der Peripherie (DRV8833, HX711, Sonde) und die wache Pause zwischen den Portionen sind nicht enthalten. Ebenso fehlt die Selbstentladung des Li-Ion-Akkus (ca. 2 bis 3 % pro Monat, bei 3500 mAh ca. 2,5 bis 3,5 mAh/Tag), die in derselben Größenordnung liegt. Peripherie im Schlaf abschalten, Pause im Light Sleep verbringen, Werte in M5 messen statt annehmen |
| Engpass | Wasser, nicht Akku: 0,3 l Tank (Beispiel Flaschenformat) bei 100 ml alle 3 Tage ergibt ca. 9 Tage (Schätzung) |
| Pumpen am Akku | DRV8833 arbeitet laut Datenblatt ab 2,7 V, VM direkt aus der Zelle ist möglich. 5-V-Pumpen fördern dann langsamer, neu kalibrieren, Saugleistung testen. Sonst Boost-Wandler mit Enable |
| Messstrategie | einmal täglich aufwachen, messen, entscheiden, senden (`15-messintervalle.md`) |
| Formfaktor | aus dem Autonomieziel ableiten, nicht umgekehrt |

---

## 14. Nicht im Scope von Stufe 1

NPK-Sensor, Kamera, mehrere Pflanzen, eigene App, Cloud, Akkuoptimierung, integrierter Tank, Gehäusedesign, ML-Modell (nur Datensammlung).

---

## 15. Änderungen

### v1.0 → v1.1

| Nr | Änderung | Grund |
|---|---|---|
| 1 | Düngerdosis als Konzentration × Wassermenge statt fester ml-Wert, plus Vorverdünnung | fester Wert konnte je nach Produkt ein Vielfaches der Etikettdosis ergeben, kleine Dosen sind mit Schlauchpumpen nicht reproduzierbar |
| 2 | Reihenfolge Wasser, Dünger, Wasser | Konzentrat trifft sonst unverdünnt auf eine Stelle im Substrat |
| 3 | Fällige Düngung wird bis zum nächsten Gießen aufgeschoben | Fall "Düngetag ohne Gießbedarf" war undefiniert |
| 4 | Absolute Firmware-Grenzen und Config-Validierung | Tippfehler in der Config konnte sonst Überflutung auslösen |
| 5 | Lokaler NTP und Notbetrieb ohne gültige Zeit | Gießfenster war nach Stromausfall ohne Netz undefiniert |
| 6 | "Hardware-Timer" ersetzt durch zentrale Pumpenfunktion + Watchdog + Pulldown | v1.0 war an dieser Stelle unscharf |
| 7 | Förderkontrolle Dünger über zweite Wägezelle (Soll) | Düngerpumpenausfall war unerkannt |
| 8 | Mechanikvorgaben: Auslassposition, Schlauchführung, Beruhigungszeit | Fehlalarme und Wägefehler vermeiden |
| 9 | Erkennung manuelles Gießen | saubere Datenbasis für die KI |
| 10 | Energie-Schätzung als zu optimistisch gekennzeichnet | Peripherie-Ruhestrom und Pausenzeit fehlten |
| 11 | Entscheidung E9 ergänzt | Zielkonflikt Sperre vs. Pflanze war nicht benannt |

### v1.1 → v1.2 (Abgleich mit dem Repo)

| Nr | Änderung | Grund |
|---|---|---|
| 1 | H01: lose Stiftleisten vermerkt, Entscheidung E10 ergänzt | Lieferumfang laut Händlern 2 × 20-pol. Stiftleiste, widerspricht R13 |
| 2 | H01: Schlafstrom 36 µA (V1.2) als nicht verifiziert markiert | nur 16 µA in Herstellerangaben gefunden |
| 3 | Stufen-Nummerierung im Repo an diese Datei angepasst | im Repo war Stufe 2 bisher "mehrere Töpfe" |
| 4 | R17 um EC-Modul am ESP ergänzt | Teamwunsch aus der Nährstoff-Diskussion: Sensor direkt am ESP |
| 5 | R22 und H12 (SHT40, Kann) ergänzt, Felder in `state` | Luftklima treibt die Austrocknung, günstiger Kontext für die KI |
| 6 | Energie-Schätzung um Li-Ion-Selbstentladung ergänzt, Zeile "Pumpen am Akku" | Ergebnis der Laufzeit-Analyse im Repo |
| 7 | Hinweis M5 (4 Wochen) gegen Erfolgskriterium (6 bis 8 Wochen), E11 | Widerspruch innerhalb der Spezifikation |
| 8 | E12 (Raspi-Modell, HA-Installationsart) ergänzt | NTP-Server hängt davon ab |
| 9 | E1, E2, E4 bis E6, E8 um Kickoff-Stand und Vorschläge ergänzt | Informationen aus dem Kickoff lagen im Repo |
| 10 | Summe auf 293 € aktualisiert, Versand und Sparhebel benannt | H12 kam dazu, Reserve ist knapp |
| 11 | Zeitraum (P) je Meilenstein ergänzt | Kickoff-Termin März 2027 |
| 12 | Mi Flora: Hinweis fehlender Batteriestand bei neuerer Firmware | laut HA-Doku |
| 13 | Beispielrechnung Düngerdosis, Repo-Struktur an das tatsächliche Repo angepasst | Nachvollziehbarkeit |
