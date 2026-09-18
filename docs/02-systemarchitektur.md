# 02 Systemarchitektur

## Überblick

Zwei Hardware-Einheiten plus Handy:

```
+----------------------------------+        +---------------------------+
| Gerät am Topf ("Flasche")        |        | Zentrale (Raspberry Pi)   |
|                                  |        |                           |
|  ESP32-C6 (WLAN, Deep Sleep)     |  MQTT  |  Mosquitto (Broker)       |
|  Akku 18650 + Laden über USB-C   | <----> |  Datenbank (Zeitreihen)   |
|  Sensoren: Bodenfeuchte,         |  WLAN  |  Dashboard (Browser)      |
|   Bodentemp., Luft T/rF, Licht,  |        |  Regeln + Telegram-Bot    |
|   Tankstand, Düngerstand,        |        +-------------+-------------+
|   Akkuspannung                   |                      |
|  Aktoren: Wasserpumpe (im Tank), |                      | Push / Chat
|   Dosierpumpe (Dünger)           |                      v
+----------------------------------+              +---------------+
         |            |                            |    Handy      |
   Schlauch zum  Schlauch vom                      | Telegram-App  |
   Tropfring     Wassertank (5 l Kanister)         | Browser       |
                                                   +---------------+
```

## Grundentscheidungen

| Entscheidung | Wahl | Begründung | Alternative |
|---|---|---|---|
| Mikrocontroller am Topf | ESP32-C6 (Seeed XIAO ESP32-C6) | WLAN, sehr klein (21 x 18 mm), Akku-Ladeschaltung auf dem Board, Deep Sleep im µA-Bereich, ESP-IDF und Arduino | ESP32-S3 (mehr Leistung, größer), ESP32-WROOM DevKit (billiger, größer, mehr Ruhestrom) |
| Zentrale | Raspberry Pi (vorhandener Pi 3/4 oder Zero 2 W) | Läuft 24/7, Linux, alle Dienste als Docker oder nativ | Alter Laptop, NAS mit Docker, Mini-PC |
| Protokoll | MQTT | Leichtgewichtig, Publish/Subscribe, Standard in Home Assistant und Node-RED | HTTP-REST (einfacher zu debuggen, schlechter für Akku) |
| Wer entscheidet "gießen"? | Das Gerät selbst (Regeln in der Firmware), die Zentrale kann Parameter setzen | Pflanze überlebt auch, wenn WLAN oder Pi ausfällt | Zentrale entscheidet, Gerät führt nur aus |
| Wassertank | Stufe 1 (Prototyp A): getrennter Kanister neben dem Topf, Pumpe im Tank. Stufe 1b (Prototyp B): Tank im Gerät, ca. 1 l, siehe `09-mechanik-gehaeuse.md` | 0,5 l Gerätevolumen reicht nicht für Elektronik plus Wasservorrat über Wochen, das Gerät wird für den integrierten Tank größer | Tank dauerhaft extern |
| Dünger | Kleiner Konzentratbehälter (100 bis 250 ml) am Gerät, Peristaltikpumpe dosiert in die Gießleitung | Ein Kanal reicht für Stufe 1, Konzentrat hält Monate | Mehrkanal später |

## Datenfluss

1. Gerät wacht alle 30 min auf (konfigurierbar), misst alle Sensoren, sendet ein JSON-Telegramm per MQTT, holt neue Parameter ab, prüft Gießregel, schläft wieder.
2. Zentrale speichert Messwerte, zeigt Verläufe, prüft Alarmregeln (Tank leer, Akku schwach, Gerät meldet sich nicht) und schickt Telegram-Nachrichten.
3. Nutzer kann über Dashboard oder Telegram-Befehl manuell gießen lassen oder Schwellwerte ändern. Der Befehl wird beim nächsten Aufwachen abgeholt (Retained Message im Broker).

## MQTT-Topics (Vorschlag)

```
pflanze/<geraete-id>/status        JSON: alle Messwerte, Akku, Firmware-Version, Uptime
pflanze/<geraete-id>/ereignis      JSON: "gegossen 80 ml", "gedüngt 2 ml", "Tank leer"
pflanze/<geraete-id>/befehl        retained: {"giessen_ml": 80} oder {"duengen_ml": 2}
pflanze/<geraete-id>/konfig        retained: Schwellwerte, Intervall, Gießmenge
```

## Betriebsmodi

| Modus | Verhalten |
|---|---|
| Netzteil | WLAN dauerhaft an, Messung jede Minute, sofortige Befehle |
| Akku | Deep Sleep, Aufwachen alle 30 min, Befehle mit Verzögerung |
| Offline | Kein WLAN erreichbar: lokale Regeln laufen weiter, Messwerte werden gepuffert (RTC-RAM oder Flash) |

## Erweiterung auf mehrere Töpfe (Stufe 2)

Jedes Gerät hat eine eigene `<geraete-id>`. Die Zentrale unterscheidet nach Topic. Nichts an der Architektur ändert sich, nur mehr Geräte im Broker.

## Erweiterung auf Hydroponik (Stufe 3)

Bodenfeuchte entfällt, dafür pH- und EC-Sonde in der Nährlösung, Umwälzpumpe, zwei Dosierkanäle (Nährlösung A/B) plus pH-Korrektur. Das Gerät bleibt der gleiche ESP32, nur die Sensor- und Aktorbestückung ändert sich.

## Erweiterung auf Pilzzucht (Stufe 4)

Gleiche Zentrale, gleicher Broker, gleiches Firmware-Gerüst. Ein zweiter ESP32 am Netzteil
in einer Zuchtbox mit CO2-Sensor, Vernebler und Lüfter. Details in `14-pilzzucht.md`.
Konsequenz für jetzt: Sensoren und Aktoren in der Firmware als Module mit eigenem Regelblock
anlegen, nicht fest verdrahten. Dann ist die Box nur eine andere Konfiguration.
