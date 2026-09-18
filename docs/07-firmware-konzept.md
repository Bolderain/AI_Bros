# 07 Firmware-Konzept (ESP32-C6)

## Zwei Wege

| Weg | Was | Wann |
|---|---|---|
| **ESPHome** | YAML-Konfiguration, fertige Sensortreiber, MQTT oder Home-Assistant-API, OTA, Deep Sleep eingebaut | Für M1, um in einem Abend Messwerte im Dashboard zu sehen |
| **Eigene Firmware** (ESP-IDF oder Arduino-Core, PlatformIO) | Volle Kontrolle, Gießlogik im Gerät, eigene Zustandsmaschine, Puffern ohne WLAN | Ab M2, das ist der Teil, an dem die Embedded-Leute Spaß haben |

Empfehlung: ESPHome als Referenz behalten (zum Vergleich der Messwerte), eigentliche
Entwicklung in ESP-IDF mit C, oder Arduino-Core in C++ wenn es schneller gehen soll.
PlatformIO als Build-System, damit alle drei die gleiche Toolchain haben.

## Zustandsmaschine

```
   +---------+    Timer/USB     +---------+     +----------+     +----------+
   | SLEEP   | --------------> | MESSEN  | --> | SENDEN   | --> | REGELN   |
   +---------+                 +---------+     +----------+     +----------+
        ^                                            |                |
        |                                            | Befehl?        | Gießen/Düngen nötig?
        |                                            v                v
        |                                      +-----------+    +-----------+
        +------------------------------------- | KONFIG    | <- | PUMPEN    |
                                               +-----------+    +-----------+
```

1. **MESSEN**: Sensorversorgung einschalten, 100 ms warten, alle Werte lesen (Feuchte 8-fach
   mitteln), Sensorversorgung aus.
2. **SENDEN**: WLAN verbinden (statische IP spart ca. 1 s), MQTT-Status publishen, retained
   Befehl und Konfig abholen, trennen. Timeout 10 s, sonst Werte im RTC-RAM puffern.
3. **REGELN**: Gießregel und Düngeregel auswerten (siehe `10-pflegeregeln.md`).
4. **PUMPEN**: Boost an, Pumpe für berechnete Zeit, Boost aus, Ereignis publishen.
5. **SLEEP**: Deep Sleep für Intervall (Akku: 30 min, USB: 60 s).

## Sicherheitsregeln in der Firmware

- Maximale Pumplaufzeit hart begrenzt (Wasser 60 s, Dünger 10 s), unabhängig von Regeln.
- Sperrzeit nach Gießen (z. B. 6 h), damit nicht bei träger Feuchteanzeige nachgepumpt wird.
- Plausibilität: Feuchte-Rohwert außerhalb Kalibrierbereich -> Sensorfehler, nicht gießen, Alarm.
- Tank-leer-Schalter aktiv -> nicht pumpen, Alarm.
- Watchdog aktiv. Brown-out-Detektor aktiv (Akku leer -> kein Pumpen).

## Datenformat Status (JSON)

```json
{
  "id": "topf1",
  "fw": "0.1.0",
  "boden_feuchte_pct": 41.2,
  "boden_feuchte_raw": 1830,
  "boden_temp_c": 19.5,
  "luft_temp_c": 21.3,
  "luft_rf_pct": 38,
  "licht_lux": 850,
  "tank_halb": true,
  "tank_leer": false,
  "duenger_leer": false,
  "duenger_rest_ml": 96.5,
  "akku_v": 3.91,
  "usb": false,
  "letztes_giessen_s": 43200,
  "gegossen_gesamt_ml": 1240
}
```

## Konfig (retained im Broker)

```json
{
  "intervall_s": 1800,
  "feuchte_min_pct": 35,
  "feuchte_ziel_pct": 60,
  "giessmenge_ml": 80,
  "sperrzeit_s": 21600,
  "duenger_ml_pro_giessen": 2.0,
  "duenger_aktiv": true
}
```

## OTA

ESP-IDF und ESPHome bringen OTA mit. Im Akkubetrieb OTA nur bei USB-Anschluss zulassen,
sonst kann ein Update mitten im Schreiben den Akku leer ziehen.

## Entwicklungsreihenfolge

1. Blink + serielle Ausgabe, PlatformIO-Projekt im Ordner `firmware/`.
2. Sensoren einzeln auslesen, Rohwerte loggen.
3. WLAN + MQTT publish.
4. Deep Sleep, Ruhestrom messen (Ziel unter 1 mA am Akku).
5. Pumpen ansteuern, Kalibrierung ml pro Sekunde.
6. Regeln, Sperrzeiten, Sicherungen.
7. Konfig per MQTT, OTA.
