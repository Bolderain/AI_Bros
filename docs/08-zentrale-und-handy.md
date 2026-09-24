# 08 Zentrale und Handy

Maßgeblich: `00-spezifikation-stufe1.md`, Abschnitt 8. Vorgabe aus dem Kickoff: simpel, lokal,
keine Cloud-Pflicht.

## Entscheidung: Home Assistant auf dem vorhandenen Raspi

Früher standen zwei Varianten zur Wahl: Home Assistant oder ein eigener Stack aus Node-RED,
InfluxDB, Grafana und Telegram-Bot. Die Spezifikation legt Home Assistant fest. Es bringt
Dashboard, Automationen, Parametereingabe, Buttons und Push über die Companion-App mit. Das passt
zu "erstmal simpel". Einzelne Bausteine des eigenen Stacks bleiben als Ergänzung möglich.

## Dienste auf dem Raspi

| Dienst | Aufgabe |
|---|---|
| Mosquitto | Broker mit Benutzer und Passwort, retained Config |
| Home Assistant | Entitäten per MQTT Discovery, Dashboard, Automationen für Lebenszeichen, Restreichweite und Alarme |
| NTP-Server (z. B. chrony) | lokale Zeitquelle für den Node (R19) |
| optional InfluxDB, Grafana | Langzeitdaten für die KI-Auswertung |
| optional Xiaomi-BLE-Integration | Mi Flora (R17) |

Die Installationsart hängt vom Raspi-Modell ab (E12). Mit Home Assistant OS laufen Mosquitto und
ein NTP-Server nur als Add-on (Verfügbarkeit prüfen). Mit Raspberry Pi OS und Home Assistant als
Container lässt sich chrony direkt installieren.

## Datenhaltung

Home Assistant löscht den Verlauf standardmäßig nach 10 Tagen. Für R12 (lückenloses Protokoll über
das ganze Projekt) `purge_keep_days` erhöhen oder zusätzlich InfluxDB bzw. CSV-Export nach
`../data/`. Die SD-Karte leidet unter Schreiblast, Backup einplanen.

## Benachrichtigung

| Weg | Stand |
|---|---|
| HA Companion App, Local Push | per WebSocket ohne Apple- oder Google-Dienste, unter iOS nur im Heimnetz mit hinterlegter SSID |
| Unterwegs | offen (E2): nur Heimnetz, VPN wie WireGuard auf dem Raspi, oder ein Relay nur für Alarme, z. B. die Telegram-Integration von HA |

## Anzeigen und Alarme

Spezifikation 7 und 8: Feuchteverlauf, Vorräte mit Restreichweite (gleitend 14 Tage), fällige
Düngung, Dosierprotokoll pro Monat, letzte Aktionen. Alarme für fehlendes Lebenszeichen (26 h (P)),
Förderfehler, ungültige Sonde, ausbleibenden Feuchteanstieg, erreichte Limits, verworfene Config
und Notbetrieb.

## Sicherheit

- Mosquitto nur mit Benutzer und Passwort.
- Zugangsdaten nie ins Repo (`secrets.yaml` und `.env` stehen in `.gitignore`).
- Keine Portfreigabe ins Internet.
