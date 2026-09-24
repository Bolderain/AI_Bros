# 04 Aktorik

Maßgeblich für Stufe 1: `00-spezifikation-stufe1.md`, Abschnitte 4, 5.6 und 7.

## Pumpen: zwei Schlauchpumpen

| Punkt | Festlegung | Begründung |
|---|---|---|
| Typ | Schlauchpumpe (peristaltisch) 5 V, je eine für Wasser und Dünger (H03) | fördert reproduzierbar, Menge = Laufzeit × kalibrierte Förderrate |
| Kein Rückschlagventil | die Pumpe klemmt den Schlauch im Stillstand ab | kein Rücklauf, kein Leerlaufen |
| Keine Tauchpumpe | Heberrisiko: Liegt der Tank höher als der Auslass, kann er sich über den Schlauch selbst entleeren. Zudem ungenau | Wasserschaden vermeiden. Die früher geplante Tauchpumpe entfällt |
| Kalibrierung | Förderrate in ml/s je Pumpe mit der Küchenwaage (M2), Protokoll in `../calibration/` | Parameter `pump_water_ml_per_s`, `pump_fert_ml_per_s` |
| Wartung | Pumpenschlauch altert, etwa jährlich tauschen (Schätzung) und neu kalibrieren | |

## Treiber: DRV8833

- Ein vorgelötetes DRV8833-Modul (H05) treibt beide Pumpen, VM aus 5 V.
- nSLEEP: prüfen, ob auf dem Modul fest verdrahtet. Für Stufe 2 per GPIO schaltbar vorsehen, sonst
  bleibt Ruhestrom.
- Eingänge beim Reset definiert LOW (interne Pulldowns, im Datenblatt prüfen, Spezifikation 5.6).
- Nicht verwenden: IRF520-Module, kein Logic-Level.
- Stufe 2: Der DRV8833 arbeitet laut Datenblatt ab 2,7 V, VM direkt aus der Li-Ion-Zelle ist also
  möglich. 5-V-Pumpen fördern dann langsamer, neu kalibrieren und die Saugleistung testen.
  Reicht sie nicht, Boost-Wandler mit Enable.

## Auslass

- Wasser und Dünger an derselben Stelle, fest fixiert, 3 bis 5 cm (P) neben der Sonde. Zu weit weg
  gibt Fehlalarme bei der Anstiegsprüfung, direkt auf der Sonde verfälscht es die Messung.
- Der früher geplante Tropfring entfällt. Er verteilt besser, schwächt aber die Anstiegsprüfung
  (R08). Bei größeren Töpfen später ein zweiter Auslass, dann `moisture_rise_min_pct` neu bestimmen.
- Gießen in Portionen mit Pause, Dünger zwischen den Wasserportionen: So wird er eingespült und
  verdünnt.

## Sicherheit

- Pumpen nur über eine zentrale Funktion mit festem Timeout (`max_pump_runtime_s`,
  `ABS_MAX_PUMP_RUNTIME_S`), Watchdog aktiv.
- Tages- und Wochenlimits, Förderkontrolle per Wägezelle, Anstiegsprüfung der Feuchte.
- Elektronik oberhalb des Wasserniveaus, alles in einer Auffangwanne.

## Stufe 3 (mehrere Töpfe)

Je Topf eine eigene Schlauchpumpe ist bei 2 bis 3 Töpfen einfacher als Magnetventile. Ein DRV8833
hat zwei Kanäle, für jedes weitere Pumpenpaar ein weiteres Modul.
