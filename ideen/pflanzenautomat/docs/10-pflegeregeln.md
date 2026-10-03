# 10 Pflegeregeln

Ziel: Die Pflanze gedeiht über Jahre. Maßgeblich für Parameter und Logik:
`00-spezifikation-stufe1.md`, Abschnitte 5.1, 5.2 und 7. Hier die gärtnerische Begründung.

## Gießen

- **Einmal täglich, morgens** im Gießfenster (`water_window`, 06:00 bis 09:00 (P)). Die Pflanze
  verbraucht das Wasser über den Tag, die Wurzeln stehen nachts nicht nass und kalt.
- **Nur unter der Schwelle** `moisture_threshold_pct` (35 % (P)). Viele Zimmerpflanzen wollen
  oberflächlich abtrocknen, bevor sie wieder Wasser bekommen.
- **In Portionen:** `water_dose_ml` (50 ml (P)) in `water_split` (2) Portionen mit
  `split_pause_s` (300 s) Pause. Das Wasser zieht ein, statt durch trockene Kanäle abzulaufen.
- **Grenzen:** Tages- und Wochenlimit plus absolute Firmware-Grenzen.
- **Kontrolle:** Nach `rise_check_delay_min` muss die Feuchte um `moisture_rise_min_pct` steigen,
  sonst Sperre und Alarm.

Idee für später, nicht Stufe 1: Menge und Schwelle aus der Trocknungskurve lernen. Das ist ein
Kandidat für die KI (E7).

## Düngen

Formel (Spezifikation 5.2): `dose_ml = fert_ml_per_l × Wassermenge_ml / 1000 × fert_predilution`

| Rechenbeispiel (Etikett 5 ml/l als Annahme, Etikett maßgeblich) | Wert |
|---|---|
| Gießwasser dieses Gießvorgangs | 50 ml |
| Konzentrat dafür | 5 × 50 / 1000 = 0,25 ml |
| Vorverdünnung 1:10 im Düngerbehälter | Pumpe fördert 2,5 ml Lösung |

0,25 ml unverdünnt trifft eine Schlauchpumpe nicht reproduzierbar, 2,5 ml schon.

- **Rhythmus:** alle `fert_interval_days` (14 (P)) in den Monaten `fert_months` (März bis
  September (P)). Im Winter keine Düngung. Die Saison kommt aus dem Kalender, nicht aus einem
  Lichtsensor.
- **Reihenfolge:** Wasser, Dünger, Wasser. So trifft das Konzentrat nicht unverdünnt auf eine
  Stelle.
- **Düngetag ohne Gießbedarf:** Die Düngung bleibt fällig und wird beim nächsten Gießen nachgeholt.
- **Vorrat:** 100 ml Lösung (P) reichen bei 2,5 ml alle 14 Tage rechnerisch länger als eine Saison.
  Verdünnte Lösung kann verkeimen, vor allem bei organischem Dünger. Deshalb blickdicht lagern und
  zur Saison neu ansetzen (Vorschlag).
- **Trend:** Dosierprotokoll mit ml pro Monat und letzter Dosierung (R06). Optional EC als
  Versalzungsindikator (R17), nur bei gleicher Feuchte vergleichbar.

## Vorräte

- Wasser und Dünger per Wägezelle. Restreichweite = Restmenge / mittlerer Tagesverbrauch der
  letzten 14 Tage (P). Warnung unter 3 Tagen (P).
- Rechenbeispiel Tischprototyp: 0,5-l-Tank, 50 ml pro Gießvorgang, Gießen alle 2 Tage (Annahme),
  ergibt ca. 20 Tage.

## Nachführen über Jahre

| Was | Wie oft | Auslöser im System |
|---|---|---|
| Dosierprotokoll und EC-Trend prüfen, Düngung anpassen | monatlich | Dashboard |
| Sonde nachkalibrieren | halbjährlich und nach dem Umtopfen | `calibrate_dry`, `calibrate_wet`, `reset_after_repot` |
| Pumpenschläuche tauschen, Förderrate neu kalibrieren | etwa jährlich (Schätzung) | Protokoll in `../calibration/` |
| Umtopfen, Substrat erneuern | alle 1 bis 3 Jahre | `reset_after_repot` |
| Tank und Düngerbehälter reinigen | beim Nachfüllen | `fert_refilled` |

## Pflanzenprofile (Startwerte, nicht verifiziert)

| Pflanze | `moisture_threshold_pct` | Licht | Düngung | Bemerkung |
|---|---|---|---|---|
| Efeutute, Philodendron | 35 | mittel | normal | robust, Vorschlag für E1 |
| Basilikum | 45 | hoch | normal | trocknet schnell aus |
| Sansevieria, Sukkulenten | 15 | hoch | wenig | lieber zu trocken, `emergency_threshold_pct` dann deutlich darunter |
| Farn | 50 | wenig | wenig | braucht hohe Luftfeuchte |
| Tomate, Chili (später) | 45 | sehr hoch | hoch | Fruchtpflanzen brauchen mehr Kalium |
