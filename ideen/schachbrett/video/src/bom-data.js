/* =====================================================================
   Stückliste und Kennzahlen für das magnetische Schachbrett.
   Eine Quelle für die Skizze, die HTML-Tabelle und das Markdown im Repo.
   Preise sind Schätzungen, nicht geprüft. (P) = Platzhalter / Vorschlag.
   ===================================================================== */
'use strict';

const KEY = [
  ['Feldgröße', '50 mm (P)', 'Spielfeld 400 × 400 mm'],
  ['Figurenbreite', '≤ 24 mm', 'auf jeder Höhe — halbe Feldgröße minus Reserve'],
  ['Magnetspalt', '≈ 8 mm', 'Spulen-Polfläche bis Stahlscheibe im Fuß'],
  ['Verfahrweg', '500 × 450 mm', 'Spielfeld plus zwei Parkspuren'],
  ['Bauhöhe', '≈ 55 mm', 'Brettoberkante bis Fußunterkante'],
  ['Zugdauer', '2–3 s', 'rund 150–250 mm Fahrt bei 80 mm/s'],
];

const STACK = [
  ['Figur', '—', 'Stahlscheibe Ø12 × 2 mm im Fuß, PTFE-Gleiter unten'],
  ['Brettplatte', '4,0 mm', 'Floatglas, Motiv rückseitig gedruckt'],
  ['Sensorlage', '1,0 mm', 'SMD-Hall auf dünner Platine — liegt im Magnetspalt'],
  ['Luftspalt', '1,5 mm', 'Reserve für Durchbiegung und Toleranz'],
  ['Elektromagnet', '—', 'Topfmagnet auf dem Schlitten, Polfläche nach oben'],
  ['H-Bot-Portal', '—', '8-mm-Wellen, LM8UU, ein GT2-Riemen'],
  ['Antrieb', '—', '2 × NEMA 17 Pancake, TMC2209, Spulentreiber'],
  ['Bodenplatte', '5,0 mm', 'plus Filzfüße'],
];

const BOM = [
  { grp: 'Brett und Figuren', rows: [
    ['B01', 'Floatglas 4 mm, 440 × 440 mm, Kanten geschliffen', '1', 25, 'Zuschnitt; bleibt ohne Mittelstütze eben'],
    ['B02', 'Druck/Folie Schachbrettmotiv, rückseitig', '1', 15, 'Oberseite bleibt blankes Glas'],
    ['B03', 'PTFE-Gleiter selbstklebend Ø 12 mm', '32', 8, 'μ ≈ 0,05–0,1; Filz ruckelt und sammelt Staub'],
    ['B04', 'Stahlscheibe Ø 12 × 2 mm, verzinkt', '32', 6, 'im Fuß; Stahl statt Magnet → keine Polarität'],
    ['B05', 'Filament für 32 Figuren (A1 Mini)', '1 Satz', 10, 'max. 24 mm Breite auf jeder Höhe'],
    ['B06', 'Rahmen, 6 gedruckte Segmente + Schrauben', '1', 12, 'A1 Mini schafft nur 180 mm am Stück'],
    ['B07', 'Bodenplatte 5 mm, 520 × 470 mm + Filzfüße', '1', 12, 'Sperrholz oder Acryl'],
  ]},
  { grp: 'Magnet und Elektronik', rows: [
    ['E01', 'Topf-Elektromagnet 12 V, Ø 20–25 mm, ca. 5 W', '1', 8, 'Kern nach oben; Einschaltdauer ≈ 5 %, Wärme unkritisch'],
    ['E02', 'Logic-Level-MOSFET + Freilaufdiode', '1', 5, 'Freilaufdiode zwingend, sonst stirbt der FET'],
    ['E03', 'Netzteil 12 V / 3 A', '1', 12, 'Motoren und Spule gemeinsam'],
    ['E04', 'Schrittmotor NEMA 17 Pancake', '2', 24, 'flach, damit die Bauhöhe stimmt'],
    ['E05', 'Treiber TMC2209', '2', 12, 'StealthChop — ein lautes Brett zerstört den Effekt'],
    ['E06', 'Steuerung ESP32', '1', 8, 'FluidNC kann H-Bot-Kinematik und Homing fertig'],
    ['E07', 'SMD-Hall-Sensoren + 8 Platinenstreifen', '64', 35, 'dünn bauen; eine große Platine wäre unbezahlbar'],
    ['E08', 'Endschalter', '2', 3, 'Referenzfahrt beim Einschalten'],
    ['E09', 'Schleppkette / flexible Leitung zum Schlitten', '1', 8, 'führt den Spulenstrom mit'],
  ]},
  { grp: 'Mechanik', rows: [
    ['M01', 'Rundwelle 8 mm, 450 mm (Y)', '2', 12, 'gehärtet und geschliffen'],
    ['M02', 'Rundwelle 8 mm, 520 mm (X)', '1', 7, 'trägt den Schlitten'],
    ['M03', 'Linearlager LM8UU', '6', 9, 'je 2 pro Y-Seite gegen Verwinden'],
    ['M04', 'GT2-Riemen 6 mm, 2,5 m', '1', 7, 'H-Bot: genau ein Riemen, eine Ebene'],
    ['M05', 'GT2-Pulley 20 Z (2) + Umlenkrollen F623 (6)', '8', 10, ''],
  ]},
];

/* Noch nicht entschieden, deshalb getrennt gerechnet. */
const BOM_OPT = { grp: 'Optional: Identifikation und Anzeige', rows: [
  ['O01', 'NFC-Lesemodul PN532, auf dem Schlitten', '1', 8, 'einer statt 64 — er fährt ja ohnehin überall hin'],
  ['O02', 'NFC-Tags on-metal, Ø 15 mm', '32', 10, 'Störung durch die Stahlscheibe im Fuß vorher messen'],
  ['O03', 'E-Paper 2,9" SPI, in der Rahmenleiste', '1', 25, 'behält den Text ohne Strom und blendet nicht'],
]};

const SAVINGS = [
  ['Kamera statt 64 Sensoren', '−20 €', 'spart E07/E08 teilweise, verlagert alles in Software, und die Sensorlage verschwindet aus dem Magnetspalt'],
  ['Feldgröße 45 mm statt 50 mm', '−12 €', 'kleineres Glas, kürzere Wellen — aber Figuren nur noch 21 mm breit'],
  ['Raspi direkt statt ESP32', '−8 €', 'Raspi ist laut Repo vorhanden; dann fehlt aber die fertige H-Bot-Kinematik'],
];

const BUDGET = 300;

if (typeof module !== 'undefined') module.exports = { KEY, STACK, BOM, BOM_OPT, SAVINGS, BUDGET };
