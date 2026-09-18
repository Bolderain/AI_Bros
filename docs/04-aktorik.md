# 04 Aktorik

## Wasserpumpe

| Option | Beschreibung | Vorteil | Nachteil |
|---|---|---|---|
| **Mini-Tauchpumpe 3 bis 6 V DC** (empfohlen Stufe 1) | Sitzt im Wassertank, fördert ca. 1 bis 2 l/min bei 5 V, Stromaufnahme ca. 150 bis 300 mA (Schätzung) | Billig (3 bis 5 Euro), direkt aus 5-V-Boost, kein Ansaugen nötig | Nicht selbstansaugend außerhalb des Wassers, Menge nur über Laufzeit steuerbar |
| Peristaltikpumpe 12 V, 60 bis 150 ml/min | Selbstansaugend, dosiert exakt | Genaue Menge, kein Rücklauf | 12 V nötig (zweiter Boost), langsam, teurer (10 bis 20 Euro) |
| Membranpumpe 12 V | Hoher Druck, selbstansaugend | Viele Töpfe möglich (Stufe 2) | Laut, 12 V, Stromhunger |

Mengensteuerung bei der Tauchpumpe: einmal messen, wie viel ml die Pumpe in 10 s fördert,
in der Firmware als Konstante hinterlegen. Rückschlagventil in die Leitung, sonst läuft
Wasser aus dem Schlauch zurück und der nächste Gießvorgang fördert erst Luft.

Wasserverteilung im Topf: Tropfring aus Schlauch mit 4 bis 6 Löchern, oder zwei Tropfer.
Punktgießen an einer Stelle führt zu ungleichmäßiger Feuchte und falschen Messwerten.

## Dosierpumpe für Dünger

Peristaltikpumpe ist hier die richtige Wahl: fördert exakt, Dünger kommt nicht mit dem Motor
in Kontakt, selbstansaugend, kein Rücklauf.

| Modell | Spannung | Förderrate | Preis (Schätzung) |
|---|---|---|---|
| Adafruit Peristaltik 5 bis 6 V | 5 V | ca. 50 ml/min | ca. 15 Euro |
| Generisch "Kamoer NKP" 12 V | 12 V | 11 bis 100 ml/min je nach Typ | 10 bis 15 Euro |
| Generisch 6 V Dosierpumpe (AliExpress) | 6 V | 20 bis 60 ml/min | 5 bis 8 Euro |

Empfehlung: 5-/6-V-Typ, damit die gleiche 5-V-Schiene wie die Wasserpumpe reicht.
Dosiermengen liegen im Bereich 1 bis 5 ml pro Gießvorgang (siehe `10-pflegeregeln.md`),
also Laufzeiten von wenigen Sekunden. Kalibrieren: 60 s laufen lassen, Menge wiegen.

Silikonschlauch der Pumpe altert. Nach ca. einem Jahr ersetzen, in der Doku als
Wartungspunkt vermerken.

## Ansteuerung

- Beide Pumpen über Logic-Level-N-MOSFET (z. B. IRLZ44N oder fertiges Modul mit AO3400)
  gegen Masse schalten, Freilaufdiode über den Motor.
- Boost-Wandler 3,7 V auf 5 V (MT3608-Modul oder besser TPS61023-Modul) speist beide
  Pumpen. Enable-Pin des Wandlers an den ESP, damit er im Schlaf komplett aus ist.
- Software-Sicherung: maximale Laufzeit pro Pumpvorgang hart begrenzen (z. B. 60 s),
  unabhängig vom Feuchtewert. Ein hängender Sensor darf nie den Topf fluten.
- Hardware-Sicherung (optional): Überlaufsensor im Untersetzer, der die Pumpe hart trennt.

## Ventile

In Stufe 1 keine. Ab Stufe 2 (mehrere Töpfe an einer Pumpe): 12-V-Magnetventile oder
je Topf eine eigene Tauchpumpe. Letzteres ist bei 2 bis 3 Töpfen billiger und einfacher.
