# 08 Zentrale und Handy-Anbindung

Vorgabe: simpel, lokal im Heimnetz, keine Cloud-Pflicht.

## Zwei Varianten

| | Variante A: Home Assistant | Variante B: Eigener Stack |
|---|---|---|
| Was | Home Assistant OS auf dem Pi, Mosquitto-Add-on, MQTT-Integration, Companion-App | Mosquitto + Node-RED + InfluxDB + Grafana (Docker Compose), Telegram-Bot |
| Aufwand bis erstes Dashboard | 1 Abend | 1 bis 2 Abende |
| Handy | Companion-App mit Push, Dashboard, Automationen | Telegram-Nachrichten, Grafana im Browser |
| Bastelfaktor | gering, viel fertig | hoch, alles selbst |
| Erweiterbar auf Stufe 2/3 | ja, Geräte kommen als Entitäten dazu | ja, per Topic |
| Empfehlung | Wenn das Team schnell ein Ergebnis will | Wenn das Team am Backend auch basteln will |

Empfehlung: **Variante B**, weil "mit HW rumspielen" auch die Zentrale einschließt und
Node-RED die Regeln sichtbar macht. Home Assistant lässt sich später ergänzen, es liest den
gleichen MQTT-Broker.

## Dienste auf dem Pi (Variante B)

| Dienst | Aufgabe | Port |
|---|---|---|
| Mosquitto | MQTT-Broker, Nutzer/Passwort, retained Topics | 1883 |
| InfluxDB 2 | Zeitreihen der Messwerte | 8086 |
| Grafana | Dashboard: Feuchteverlauf, Licht, Temperatur, Akku, Gießereignisse als Marker | 3000 |
| Node-RED | Regeln: MQTT -> InfluxDB, Alarme -> Telegram, Befehle aus Telegram -> MQTT | 1880 |
| Telegram-Bot | Benachrichtigungen und Befehle wie /status, /giessen 80 | |

Alles als `docker-compose.yml` im Ordner `backend/`, Pi mit Raspberry Pi OS Lite 64 Bit.
Hinweis Pi Zero 2 W: 512 MB RAM, InfluxDB 2 und Grafana laufen, aber knapp. Ein Pi 3/4
ist bequemer. Alternativ InfluxDB durch SQLite plus kleines Python-Skript ersetzen.

## Alarme (Node-RED)

| Alarm | Bedingung | Nachricht |
|---|---|---|
| Tank halb | `tank_halb` false | "Wassertank unter 50 %, in ca. N Tagen leer" (N aus Verbrauch der letzten 14 Tage) |
| Tank leer | `tank_leer` true | "Tank leer, Pflanze wird nicht mehr gegossen" |
| Dünger leer | `duenger_leer` true oder `duenger_rest_ml` < 10 | "Dünger nachfüllen" |
| Akku schwach | `akku_v` < 3,5 | "Akku laden" |
| Gerät stumm | kein Status seit 3 Intervallen | "Topf1 meldet sich nicht" |
| Gießen wirkungslos | Feuchte 2 h nach Gießen nicht gestiegen | "Pumpe oder Schlauch prüfen" |
| Zu nass | Feuchte über 85 % seit 48 h | "Staunässe, Untersetzer prüfen" |
| Zu kalt | `luft_temp_c` < 12 | "Standort zu kalt" |

## Telegram-Befehle

```
/status           aktuelle Werte
/giessen 80       einmalig 80 ml beim nächsten Aufwachen
/duengen 2        einmalig 2 ml
/konfig           aktuelle Schwellwerte anzeigen
/set feuchte_min 30
```

## Zugriff von außerhalb

Nicht in Stufe 1. Später: WireGuard auf dem Pi oder Tailscale. Keine Portfreigabe.

## Sicherheit

- Mosquitto mit Nutzer/Passwort, kein anonymer Zugriff.
- Telegram-Bot nur auf die drei Chat-IDs des Teams reagieren lassen.
- Zugangsdaten nie ins Repo, `.env`-Datei ist in `.gitignore`.
