# Weitermachen: SPiRALCELLS-Lichtwerk, Zweig `gewebe`

Stand 21.10.2026, später Vormittag.

## Wo die Arbeit liegt

- **Arbeitskopie:** `/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe`, Git-Zweig `gewebe`.
- **Ralfs `app/` in `spiralcells-lichtwerk` ist unverändert.** Nichts ist live.
- **Testkette:** SPiRALCELLS 8419 auf `spiralcells-lichtwerk/testdaten/kette-gewebe/state.json`, das Lichtwerk aus der Arbeitskopie auf 8418 mit `--werkstatt`. PIDs stehen in `protokolle/kette-84xx.pid`. Anhalten nur per PID.
- **Echter Bestand:** unverändert (Stand 20.10., 21:39). Ein Schreibtest lief nur in der Testkopie.

## Was gebaut ist

- **Zellgestalt aus der Abstammung** (`wuchs.js`, `zelle.js`): Jede Ausprägung ist ein körniges Blatt an ihrer Ranke.
  - Herkunftsarten: Kette, Gabel, Keim, Form, frei, Reihe (die Reihenfolge einer Übernahme, keine Entwicklung).
  - Eine Gabel gilt nur, wenn SPiRALCELLS die Kante beim Abzweigen zugleich angelegt hat (gleicher Urheber, gleicher Augenblick).
  - Gegenlese ist Gewebe. Die Hülle folgt dem Wuchs.
- **Leseraum** (`stoff.js`): Passagen und Verwendungen am Rand, aber nur bei wörtlichem Fund; „ungefähr hier“, wenn der Fund nicht eindeutig ist.
  - Vergleich Wort für Wort, Zeile für Zeile oder ehrlich gar nicht.
  - Perlenfaden des Zweigs, Rückweg über Fäden, Kameraflug.
  - Lesbare Stelle im Link: `#mond=…&fassung=N&lesen=1&stelle=K`, für die Ausgangsfrage `&frage=1`.
  - ⌘V wird Weiterarbeit mit den gelesenen Fassungen, erst nach Halten.
- **Ordnung** (`ordnung.js`, `ordnung.json`, `netz.js`): die Zentrale als Mitte, Dächer als eigene Zellen, „ohne Dach“ außen.
  - Mitte, Dächer und „ohne Dach“ sind betretbar (Tippen zweimal oder Eingabe); F schaltet durch die Fäden.
  - `ordnung.json` ist ein **unbestätigter Vorschlag** und wartet auf Ralfs Antwort zu fünf Fragen (Musik, FLOW, Phänomenatlas, KiNTEGRiTY/MiNDLAXY, neun Werke ohne Dach).
- **Kritische Prüfung** (43 Prüfer, jeder Befund gegengeprüft): 38 bestätigte Befunde, alle eingearbeitet. Bericht: `protokolle/pruefung-gewebe-2026-10-21.json`.
- **Tests:** 39 im Browser-Code und 53 Server-Tests, alle bestanden.

## Was die FASKA-Erhebung belegt hat

FASKA ist die Freie Aktive Schule Karlsruhe, Ralfs Arbeitgeber. Darunter liegen Schuldokumentation (lebende App `faska-app-bau`, Varianten, GOLD, Lernpfade, Lernlandschaft, Invaria), FASKA Plan, FASKA FLOW (Lernspiele, 20 Godot-Module), FASKA MUSiC (mit Let the Music Play und Klangspielen) und FASKA STUDiO. ADHS OS ist ein eigenes Dach. Die Juli-Familie „ADHS-OS-FASKA“ ist falsch gemischt.

## Nächste Schritte

1. Ralfs Antwort zur Ordnung einarbeiten, `bestaetigt` erst nach seinem Ja auf `true` setzen.
2. Im Dach die Werknamen leise zeigen (Orientierung beim Hineinfahren).
3. Danach: Kritikrunde am Bild (Erstblick, Bildkraft), dann mit Ralf entscheiden, ob `gewebe` nach `main` geht. `app/` geht dann sofort live.
