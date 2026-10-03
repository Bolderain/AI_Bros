/* =====================================================================
   Fließtext-Abschnitte für Aufbau-Seite und Repo-Markdown.
   Eine Quelle, zwei Ausgaben. `t` ist Text, `tab` eine Tabelle,
   `list` eine Aufzählung. Fett mit **…**, Code mit `…`.
   ===================================================================== */
'use strict';

const DOC = [
  {
    h: 'Zugerkennung: das Brett weiß nicht, welche Figur wo steht',
    b: [
      { t: 'Ein Hall-Sensor beantwortet genau eine Frage: liegt gerade Stahl über mir, ja oder nein. Er weiß nicht, ob das ein Bauer oder die Dame ist, und auch nicht, welche Farbe. Aus 64 Sensoren kommt also nur ein Belegungsbild, kein Stellungsbild.' },
      { t: 'Die Identität der Figuren kommt nie aus der Hardware, sondern aus der Software: der Rechner führt die Stellung ohnehin mit, weil die Engine sie braucht. Das Brett liefert nur den Auslöser. **Aus der Differenz zweier Belegungsbilder plus der bekannten Stellung lässt sich der Zug eindeutig rekonstruieren.**' },
      { t: 'Hebst du den Springer von b1 und setzt ihn auf c3, wird b1 frei und c3 besetzt. Die Software weiß, dass dort dein Springer stand, bildet `b1c3` und prüft gegen die Liste der legalen Züge. Spannend wird es bei den Sonderfällen:' },
      { tab: {
        head: ['Fall', 'Was die Sensoren sehen', 'Auflösung'],
        rows: [
          ['Schlagen', 'nur **ein** Feld ändert sich, das Zielfeld bleibt besetzt', 'auf dem Zielfeld stand laut Stellung eine gegnerische Figur'],
          ['Rochade', 'vier Felder auf einmal', 'eindeutig, kein anderer Zug fasst vier Felder an'],
          ['En passant', 'drei Felder, das verschwindende liegt **neben** dem Ziel', 'eindeutig an der Geometrie'],
          ['Umwandlung', 'wie ein normaler Bauernzug auf die Grundreihe', '**nicht auflösbar** — hier muss gefragt werden: Dame, Turm, Läufer oder Springer?'],
        ] } },
      { t: 'Beim Hochheben ist die Stellung kurzzeitig ungültig: Startfeld schon frei, Zielfeld noch leer. Deshalb wird nicht jede Änderung sofort ausgewertet, sondern erst, wenn die Belegung für etwa 300 bis 500 ms (P) ruhig ist. Ergibt die Differenz dann keinen legalen Zug, passiert nichts — lieber warten als raten.' },
      { t: 'Zwei harte Regeln aus dem Aufbau:' },
      { list: [
        '**Der Elektromagnet blendet die Sensorik.** Er ist viel stärker als die Stahlscheibe in einer Figur, also meldet jedes Feld, über das er fährt, „besetzt". Sensorwerte gelten nur, wenn der Schlitten außerhalb des Spielfelds in der Home-Ecke parkt. Während der Roboter fährt, zieht ohnehin niemand.',
        '**Jeder Roboterzug prüft sich selbst.** Danach muss die Belegung exakt so aussehen wie erwartet. Tut sie das nicht, ist eine Figur verloren gegangen oder das Portal hat Schritte verloren — dann anhalten, statt blind weiterzufahren.',
      ] },
    ],
  },
  {
    h: 'Welche Figur ist das? (optional)',
    b: [
      { t: 'Die Identität braucht man nur an drei Stellen: beim **Aufbau**, bei der **Umwandlung** und im **Fehlerfall**, wenn die Belegung nicht mehr zur Stellung passt. Alles seltene Momente ohne Zeitdruck. Damit braucht es kein System, das 64 Felder permanent identifiziert — ein langsamer Scan auf Abruf reicht.' },
      { t: 'Daraus folgt die entscheidende Vereinfachung: **der Leser fährt mit.** Das Portal kommt ohnehin überall hin, also sitzt ein einziger Leser auf dem Schlitten statt 64 in der Platine. Kein Multiplexer, keine 64-fach-Verkabelung, und die Sensorlage im Magnetspalt bleibt dünn. Ein Komplettscan dauert dann geschätzt 30 bis 60 Sekunden — beim Spielstart einmal, danach nur im Zweifel.' },
      { tab: {
        head: ['Verfahren', 'Wie', 'Bewertung'],
        rows: [
          ['**RFID / NFC**', 'Tag im Fuß, Leser auf dem Schlitten', '**Favorit.** Tags kosten Cent, eindeutige UID, Reichweite passt zum Magnetspalt. Achtung: die Stahlscheibe stört die Antenne — On-Metal-Tag oder exzentrisch setzen'],
          ['LC-Schwingkreis', 'passive Spule plus Kondensator, je Figurenart eine andere Resonanzfrequenz', 'So machen es die DGT-Turnierbretter. Völlig passiv und robust, aber Spulen wickeln und abgleichen ist Fummelarbeit'],
          ['Analoger Hall', 'abgestufte Magnetstärken je Figurenart', 'Billigste Variante, braucht keinen zweiten Sensortyp. Nur grob, und sie bringt die Polarität zurück, die wir mit der Stahlscheibe losgeworden sind'],
          ['Polarität', 'Nordpol oben = Weiß, Südpol oben = Schwarz', 'Kostet fast nichts und löst immerhin die halbe Frage. Gut kombinierbar'],
          ['Kontakte im Feld', 'Federkontakte, je Figur ein anderer Widerstand', '**Scheidet aus.** Die Figuren sollen über glattes Glas gleiten — Kontakte bedeuten Vertiefungen, Verschleiß und Dreck'],
          ['Gewicht', 'Wägezelle unter dem Brett', '**Unbrauchbar.** Unterschiede zu klein, und man misst immer die Summe'],
        ] } },
      { t: 'Offener Punkt vor dem Kauf: **wie stark stört die Stahlscheibe den Tag?** Beides sitzt im selben Fuß, rund zwei Zentimeter auseinander. Das ist ein Zehn-Euro-Test mit zwei Mustern, bevor 32 Figuren gedruckt werden.' },
    ],
  },
  {
    h: 'Engine, Spielstärke und Training',
    b: [
      { t: 'Stockfish läuft auf einem Raspberry Pi 5 problemlos — es ist C++ mit ARM64-Builds, `apt install stockfish` genügt. Selbst kompilieren lohnt trotzdem (`make ARCH=armv8-dotprod`), weil der Cortex-A76 Dot-Product-Befehle hat, die das NNUE-Netz beschleunigen. Geschätzt ein bis drei Millionen Knoten pro Sekunde über alle vier Kerne, also weit mehr als nötig. Den aktiven Kühler nicht weglassen.' },
      { t: 'Das eigentliche Problem ist das Gegenteil: **Stockfish ist viel zu stark.** `UCI_Elo` hört bei etwa 1320 auf, und schon darüber fühlt es sich falsch an. Gedrosselt spielt es nicht schwächer, sondern **unmenschlich** — zwanzig starke Züge, dann stellt es grundlos eine Figur ein. Ein Anfänger lernt daraus nichts.' },
      { t: 'Für echte Anfänger ist **Maia** die bessere Antwort: ein neuronales Netz, das nicht auf Gewinnen trainiert wurde, sondern darauf, den Zug vorherzusagen, **den ein Mensch dieser Spielstärke spielen würde**. Es gibt fertige Netze für 1100, 1200, 1300 bis 1900. Maia macht die Fehler, die Menschen machen, nicht die, die ein Würfel macht. Es läuft über lc0 mit einem einzigen Knoten, also eine Netzauswertung pro Zug — auf dem Pi 5 über die CPU-Backends unkritisch. Aufwand: lc0 für ARM selbst bauen.' },
      { t: 'Saubere Rollentrennung, beide Engines passen gleichzeitig auf den Pi:' },
      { tab: {
        head: ['Rolle', 'Engine', 'Aufgabe'],
        rows: [
          ['Gegner', 'Maia 1100 bis 1500, einstellbar', 'spielt menschlich auf dem gewünschten Niveau'],
          ['Trainer', 'Stockfish', 'bewertet deine Züge und sagt, was besser gewesen wäre'],
        ] } },
      { t: 'Falls lc0 zu viel Aufwand ist: Stockfish auf `Skill Level 0` **ohne Dame** ist für einen Anfänger ein realistischer und erklärbarer Gegner, und es ist eine Zeile Code.' },
      { t: 'Zum Training: Stockfish erklärt nichts, es liefert Zahlen. Die Bewertung **vor** und **nach** deinem Zug ergibt den Verlust in Bauernhundertsteln, und daraus wird die übliche Einstufung — unter 50 gut, 50 bis 100 Ungenauigkeit, 100 bis 300 Fehler, darüber Patzer. Mit `MultiPV` bekommt man die besten Alternativen dazu und damit schon einen brauchbaren Satz: „Dein Lf4 kostet 2,1 Bauern, besser war Sxe5."' },
      { t: 'Für das **Warum** braucht es eine Schicht darüber. Entweder selbst gestrickte Mustererkennung — python-chess kennt Angreifer, Fesselungen und Schachgebote, damit deckt man „Figur eingestellt", „Gabel übersehen" und „Matt verpasst" ab, also das meiste im Hobbybereich. Oder ein Sprachmodell, das Stellung, Zug, Bewertungsdifferenz und die besten Varianten bekommt und daraus einen Satz formt. Weniger Code, natürlichere Erklärung, braucht aber Netz — und das Modell darf die Zahlen nur erklären, nicht selbst bewerten.' },
      { t: 'Und der schönste Ausgabekanal kostet keine Hardware: **der Magnet kann den besseren Zug einfach vorspielen.** Figur nehmen, auf das richtige Feld fahren, zurückstellen. Das kann kein Bildschirm.' },
    ],
  },
  {
    h: 'Anzeige am Gerät',
    b: [
      { t: 'Statt einer App ein Display im Rahmen — und dafür **E-Paper** statt TFT: es sieht aus wie bedrucktes Papier statt wie ein leuchtender Bildschirm neben Holz und Glas, es behält den Text ohne Strom, und der Refresh von ein bis zwei Sekunden ist für „Das war ein Patzer, schau dir f7 an" völlig egal. 2,9 Zoll (296 × 128) reichen für zwei, drei Zeilen; 4,2 Zoll könnten zusätzlich ein kleines Stellungsdiagramm zeigen.' },
      { t: '**LEDs unter den Feldern** wären die naheliegende Alternative — sind es aber nicht. Sie müssten unters Glas, also in den Magnetspalt, und der ist mit 8 mm schon knapp. Das Display außen am Rahmen umgeht das Problem komplett.' },
    ],
  },
];

if (typeof module !== 'undefined') module.exports = { DOC };
