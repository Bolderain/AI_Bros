# Kalibrierung

Protokolle für Sonde, Pumpen und Wägezellen (M1, M2). Eine Datei pro Kalibrierung, Name mit Datum,
z. B. `2026-10-05-sonde-1.md`. Die Ergebnisse gehen als Parameter in die Config
(Spezifikation 5.2), nie hart in den Code.

## Vorlage Sonde

| Feld | Wert |
|---|---|
| Datum, Sonde (Nr.) | |
| Substrat, Topf | |
| `moisture_dry_raw` (Erde trocken) | |
| `moisture_wet_raw` (frisch gegossen) | |
| Streuung bei 10 Messungen | |
| Bemerkung | |

## Vorlage Pumpe

| Feld | Wert |
|---|---|
| Datum, Pumpe (Wasser/Dünger) | |
| Laufzeit s, gefördert g (Küchenwaage), drei Durchgänge | |
| Förderrate ml/s (Mittel) | |
| Bemerkung (Schlauch, Förderhöhe) | |

## Vorlage Wägezelle

| Feld | Wert |
|---|---|
| Datum, Wägezelle (Tank/Dünger/Topf) | |
| Rohwert leer, Rohwert mit Referenzgewicht, Referenzgewicht g | |
| Faktor, Nullpunkt | |
| Bemerkung (Schlauchführung, Beruhigungszeit) | |
