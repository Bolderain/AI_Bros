# AI_Bros — Ideensammlung

Hier sammeln wir unsere Projektideen, arbeiten sie so weit aus, dass man sie
vergleichen kann, und **entscheiden uns später für eine**. Hobbyprojekt zu dritt,
Budget 300 Euro, Raspberry Pi ist vorhanden. Doku auf Deutsch.

**Es ist noch nichts entschieden.** Jede Idee liegt in einem eigenen Ordner unter
[`ideen/`](ideen/) und darf unterschiedlich weit gediehen sein.

## Die Ideen

| Idee | Worum es geht | Stand | Budget (Schätzung) |
|---|---|---|---|
| [Pflanzenautomat](ideen/pflanzenautomat/) | Ein Gerät, das eine Zimmerpflanze über Jahre selbstständig gesund hält: Feuchte messen, morgens gießen, nach Plan düngen, Vorräte überwachen, aufs Handy melden | Am weitesten: Spezifikation Stufe 1 v1.2, Meilensteine M0 bis M5 geplant | ca. 293 € |
| [Magnetisches Schachbrett](ideen/schachbrett/) | Ein Brett, das die Züge einer Schach-Engine selbst ausführt — ein Elektromagnet unter dem Brett zieht die Figuren | Mechanik durchgerechnet, Stückliste und Erklärvideo da, nichts gebaut | ca. 248 € |

## Pflanzenautomat

Der Regelkreis Messen → Entscheiden → Dosieren → Überwachen → Melden, in fünf Stufen
vom Tischprototyp bis zur Pilz-Growbox.

- Maßgeblich: [`ideen/pflanzenautomat/docs/00-spezifikation-stufe1.md`](ideen/pflanzenautomat/docs/00-spezifikation-stufe1.md)
- Hintergrund und spätere Stufen: [`ideen/pflanzenautomat/docs/`](ideen/pflanzenautomat/docs/)
- Fortschritt: [`docs/11-meilensteine.md`](ideen/pflanzenautomat/docs/11-meilensteine.md) · Retros: [`docs/13-retros.md`](ideen/pflanzenautomat/docs/13-retros.md)

![Mockup Flaschenformat](ideen/pflanzenautomat/mockup/geraet-mockup.png)

## Magnetisches Schachbrett

Stockfish rechnet, ein Elektromagnet auf einem H-Bot-Portal führt den Zug aus.
Die bestimmende Regel: gefahren wird nur auf den Linien zwischen den Feldern, dort
ist überall genau ein halbes Feld Platz — also muss jede Figur schlanker sein als
ein halbes Feld.

- Idee: [`ideen/schachbrett/README.md`](ideen/schachbrett/README.md)
- Aufbau, Magnetspalt und Stückliste: [`ideen/schachbrett/aufbau.md`](ideen/schachbrett/aufbau.md)
- Erklärvideo, 59 s: [`ideen/schachbrett/video/`](ideen/schachbrett/video/)

![Aufbau-Skizze](ideen/schachbrett/aufbau.png)

## Wie wir arbeiten

- Eine Idee bekommt einen Ordner unter `ideen/`, darin eine `README.md` mit der Idee
  selbst und so viel Ausarbeitung, wie sie verdient.
- Preise und nicht gemessene Werte als **Schätzung** kennzeichnen, Platzhalter als **(P)**.
- Offene Entscheidungen stehen bei der jeweiligen Idee und werden nicht stillschweigend getroffen.
- Arbeitsregeln für Claude Code: [`CLAUDE.md`](CLAUDE.md).

Sobald wir uns entschieden haben, wandert die gewählte Idee aus `ideen/` in die
Wurzel und bekommt den Platz, den ein echtes Projekt braucht.
