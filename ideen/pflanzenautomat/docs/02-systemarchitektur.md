# 02 Systemarchitektur

Maßgeblich für Stufe 1: `00-spezifikation-stufe1.md`, Abschnitte 3 und 5 bis 8. Hier der Überblick,
die Begründungen und die Erweiterungen für spätere Stufen.

## Überblick Stufe 1

```
+-------------------------------------+          +--------------------------------+
| Node (Tischaufbau, Auffangwanne)    |          | Zentrale: vorhandener Raspi    |
|                                     |   MQTT   |                                |
|  FireBeetle 2 ESP32-C6              | <------> |  Mosquitto (Broker)            |
|  ESPHome + plant_logic              |   WLAN   |  Home Assistant (Dashboard,    |
|  Sonde kapazitiv, per GPIO bestromt |          |   Automationen, Push)          |
|  DRV8833 -> 2 Schlauchpumpen        |   NTP    |  NTP-Server (z. B. chrony)     |
|  HX711 + Wägezellen unter Wasser-   | <------- |                                |
|   tank und Düngerbehälter           |          +---------------+----------------+
+----------+--------------------------+                          |
           |                                                     v
   fester Auslass, 3 bis 5 cm                              Handy: HA Companion App
   neben der Sonde (Wasser + Dünger)
```

## Grundentscheidungen

| Entscheidung | Wahl | Begründung |
|---|---|---|
| Wer entscheidet "gießen"? | Der Node lokal, inklusive Sicherheitsgrenzen | Pflanze und Wohnung bleiben sicher, auch wenn Raspi oder WLAN ausfallen (R09) |
| Board | FireBeetle 2 ESP32-C6 | Akkuanschluss und Laderegler onboard, niedriger Schlafstrom, ein Board für Stufe 1 und 2. Stiftleisten lose: E10 |
| Firmware | ESPHome plus eigene Komponente `plant_logic` ohne I/O | schneller Start, Logik auf dem Host testbar (`07`) |
| Zentrale | Mosquitto, Home Assistant, lokaler NTP auf dem Raspi | simpel, lokal, fertiges Dashboard und Push (`08`) |
| Protokoll | MQTT, Config retained, HA-Entitäten per Discovery | Standard, lose Kopplung |
| Pumpen | 2 Schlauchpumpen (Wasser, Dünger) | dosieren genau, kein Heberrisiko, kein Rückschlagventil (`04`) |
| Vorräte | Wägezellen statt Schwimmerschalter | liefern Restmenge und tatsächlich geförderte Menge (Förderkontrolle) |
| Zeit | lokaler NTP, ohne gültige Zeit Notbetrieb | das Gießfenster braucht die Uhrzeit, auch ohne Internet |

## Datenfluss Stufe 1

1. Der Node misst alle 15 min (P) und publiziert `state`. Das dient der Datenbasis, nicht der Pflanze.
2. Einmal am Tag im Gießfenster entscheidet `plant_logic`: gießen, düngen, sperren, alarmieren.
3. Der Raspi liefert die retained Config und die Zeit, speichert den Verlauf, berechnet die
   Restreichweite, erkennt fehlende Lebenszeichen (26 h (P)) und schickt Push-Nachrichten.
4. Befehle aus dem Dashboard (`cmd`) wirken beim nächsten Zyklus.

MQTT-Schema: Spezifikation Abschnitt 6 (`plant/<id>/state`, `event`, `config`, `cmd`, `status`).

## Erweiterungen

| Stufe | Was sich ändert |
|---|---|
| 2 autark | Deep Sleep bis Uhrzeit, einmal täglich aufwachen, retained Befehle mit ID und Quittung, `ota_hold`, Peripherie im Schlaf abschalten. Details `06`, `09`, `15` |
| 3 mehrere Töpfe | Jeder Topf bekommt eine eigene `<id>`, als eigener Node oder als weitere Kanäle an einem Node. Architektur und Zentrale bleiben |
| 4 Hydroponik | Sonde entfällt, dafür pH und EC in der Nährlösung, Umwälzpumpe, Dosierkanäle für Nährlösung und pH-Korrektur. Gleiches Board, andere Bestückung |
| 5 Pilzzucht | Zweiter Node am Netzteil mit CO2-Sensor, Vernebler und Lüfter (`14`). Das Muster "reine Entscheidungsfunktion plus ESPHome-Treiber" gilt dort genauso |
