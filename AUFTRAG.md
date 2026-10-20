# Auftrag: SPiRALCELLS als lebendiges, bedienbares System, gebaut aus dem Lichtwerk

Du bist Claude in Ralfs Verbund, Rolle „Systemleitung und Tragwerk“. Ralf ist die letzte Instanz. Antworte auf Deutsch, in einfacher, klarer Sprache.

## Worum es geht

Am 20.10.2026 entstand in einer Claude-Sitzung das Lichtwerk „Spiral Cells“. Ralf hat es gesehen und gesagt:

> „So, in diesem Stil wünsche ich mir das reale SPiRALCELLS-Netzwerk!“

Deine Aufgabe: Mach aus dieser Grafikdemo ein lauffähiges, bedienbares System, das perfekt auf Ralfs Gesamtsystem zugeschnitten ist und es verkörpert. Es läuft auf echten Daten und nicht auf einer Vorführung. Man kann damit arbeiten. Die Bildsprache bleibt so stark wie in der Demo.

Das Lichtwerk:
- Quelle: `quelle/SPIRAL-CELLS-LICHTWERK.html` in diesem Ordner (eigenständig, WebGL2, ohne Netz). Standbilder liegen unter `quelle/standbilder/`. Online, privat: https://claude.ai/artifact/2rV43r6TAgPgGm3QKcpxJx
- Mit `?werkstatt` am Adressende entsteht `window.__spiral`. Damit rendert `shot(sekunde)` Standbilder, auch wenn das Browserfenster verdeckt ist. So wurde die Demo geprüft.
- Was sie zeigt, in 96 Sekunden als eine Kamerafahrt:
  - Fünf farbige Stimmen mit eigener Bewegungsschrift umkreisen einen Keim.
  - Getrennt legt jede auf ihre eigene Speiche (144°, fünf Silos).
  - Mit steigender Kopplung (Kuramoto-Oszillatoren) verdrehen sich die Speichen. Nach einer Stille von 1,3 Sekunden rastet der Winkel bei 137,508° ein: Goldwelle, zwei Spiralscharen, jede Lücke gefüllt.
  - Die Hülle ist eine Mondphase und wird im Einklang Vollmond.
  - Von der Seite ein Kelch mit Stiel: Die Höhe ist die Entstehungszeit, ein goldener Jahresring markiert das Einrasten.
  - Die Zelle ist Same einer größeren Zelle derselben Ordnung. Die Schleife ist nahtlos.
- Spiel: Ein Einwurf stört, Halten bindet, eine Stimme allein zeigt ihre Spur durch alle Schichten. Klang ist zuschaltbar.
- Technik: HDR-Punkte, Dual-Kawase-Glühen und ACES, Punkte auf der CPU gebaut. Bis zum ersten Einrasten drehen alle Samen mit, danach sind sie eingefroren, und nur ein lebendes Band bleibt beweglich.

## Parallel: Codex baut eine zweite Spur

Codex bekommt den gleichen Stil mit dem Auftrag, ihn direkt in das bestehende mooncells einzubauen und mit seinen eigenen Konzepten zu verbinden (siehe `/Volumes/ThunderBolt4_2TB/Development/Artifacts/spiral-cells-varianten-20261020/AN-CODEX.md`). Ralf vergleicht am Ende beide Spuren. Daraus folgt:
- Du änderst nichts im Repo `/Volumes/ThunderBolt4_2TB/Development/Projects/mooncells`. Dort liegt viel nicht eingecheckte Codex-Arbeit (Zellnetz, Materialraum, neue Tests). Lesen darfst du sie.
- Brauchst du dort eine Änderung, zum Beispiel CORS oder eine neue Route, schreib einen Wunsch als `WUNSCH-an-codex-<thema>.md` in diesen Ordner.
- Lies Codex' neue Ergebnisse (unter `…/stimmen/codex/runde2/`) erst, wenn dein eigener Wurf steht.

## Lies zuerst, gezielt und knapp (der Mac hat 16 GB, Speicherschutz beachten)

1. `/Volumes/ThunderBolt4_2TB/Development/GRUNDMANIFEST-MENSCHLICHE-OBERFLAECHEN.md`: keine Kennungen in der Oberfläche.
2. mooncells: `README.md`, `docs/konzept.md`, `docs/schema.md`, `docs/mindcel-kontinuitaet.md`, `server/models.py`, die Routen in `server/app.py`, außerdem `server/static/spiral-room.js` und `workspace.js` (Codex' heutige Oberfläche).
3. MiNDCEL-Linie: `/Volumes/ThunderBolt4_2TB/MiNDLAXY/TRAGWERK/SYSTEM-BAU/module/M-003-MiNDCEL.md`, `M-009-SPIRALWELLE.md`, `/Volumes/ThunderBolt4_2TB/MiNDLAXY/MiNDSOURCE/meta/ADR-0006-ORGAN-ROLES-DRAFT-2026-07-17.md`, `/Volumes/ThunderBolt4_2TB/MiNDLAXY/MiNDCEL/purpose.md`, `/Volumes/ThunderBolt4_2TB/MiNDLAXY/Apple Notes/EiGENE APPS/BRAiNSTORM SPiRAL.md`.
4. Verbund und Umgebung: `/Volumes/ThunderBolt4_2TB/Development/Artifacts/zentrale-gestaltung-20261019/BAUAUFTRAG-ZENTRALE-GESTALTUNG.md` und `…/stimmen/AUFTRAG-AN-ALLE-STIMMEN.md`, `/Volumes/ThunderBolt4_2TB/Development/Artifacts/kin-tisch-integration-20261018/ZUSTAENDIGKEIT-CLAUDE-CODEX-20261018.md`, die Claude-Gedächtnisnotizen unter `/Users/ralfkirchner/.claude/projects/-Volumes-ThunderBolt4-2TB-MeineApps-ki-ntegrity-v19-better/memory/` (MEMORY.md, mooncells-gemeinsamer-variantenraum, kintegrity-systemleitung, kintegrity-werkverbund-betrieb, claude-als-orchestrator-delegieren, Kostenregeln).
5. Frühere Varianten, als Anregung: `/Volumes/ThunderBolt4_2TB/Development/Artifacts/spiral-cells-varianten-20261020/stimmen/` (Antigravity zwei, Codex zwei; Ralf fand die Codex-Fassungen visuell schwach).

## Ralfs Gesamtsystem, wie es heute steht (belegt am 20.10.)

- **SPiRALCELLS** (Repo, API und Port heißen weiter mooncells) ist der gemeinsame Variantenraum. Der Aufbau ist ein Mond (Werk) → Worktrees (Zweige je Stimme) → Varianten bzw. Ausprägungen (append-only, `derived_from`). Dazu kommen typisierte Kanten mit Verwendung (`usage`: Zweck, Teile, Richtung, Verträglichkeit, Bedingungen, Grenzen, Textanker, Wiederaufnahme) und Befunde (tragfähig, teilweise, nicht tragfähig; Beleg: Behauptung, Erwartung oder ausgeführte Probe).
  - Einzig veränderlich ist der Status: entwurf, geprüft, grundformation (Kristallisieren, ein sozialer Akt, nur durch Ralf) und verworfen.
  - Ein Beitrag entsteht als `contribution.mode` independent-first, review, joint-trial oder continuation. Schreibweg ist `POST /api/variant-branches` mit `request_id`.
  - Daten: `/Volumes/ThunderBolt4_2TB/Development/AppData/mooncells/state.json` (88 Werke, 142 Worktrees, 566 Varianten, 118 Kanten, 19 Befunde, 8 Agenten). Vor jedem Schreiben kopieren.
  - Der Dienst lief bis heute früh so: im Ordner mooncells `python -m server.app --host 127.0.0.1 --port 8401 --data /Volumes/ThunderBolt4_2TB/Development/AppData/mooncells/state.json`. Gerade läuft er nicht. Kein CORS, Schutz über Host, Origin und Sec-Fetch.
- **MiNDCEL → Mooncells → SPiRALCELLS:** Laut ADR-0006 (von Ralf besiegelt) ist MiNDCEL eine Gedächtnislinse und kein Träger. Ob die SPiRALCELLS-Kontinuität das aufhebt, entscheidet Ralf. Baue so, dass die Oberfläche eine Linse ist: Sie bildet keinen eigenen Wahrheitsbestand und schreibt nur über die vorgesehenen Wege. Ralfs Kernsatz: „MiNDCEL speichert keine Gedanken. MiNDCEL macht Bedeutungswerdung sichtbar.“
- **Umgebung**, alles auf 127.0.0.1:
  - Zentrale AiHDS OS · KREATiVTRAGWERK auf 8894, der Rahmen, mit Galaxie, sieben Regionen, 574 Werken und einem Zeitstrahl aus der Tageschronik
  - KiNFORMER auf 9062, die Formwerkstatt, das Herz
  - KiNTEGRiTY/KiN auf 9040, das Gedächtnis für Material, Fassungen, Herkunft und Wahl
  - DER TiSCH auf 9030, gerade aus, kostet Geld, nicht starten
  - MiNDLAXY-Vault unter `/Volumes/ThunderBolt4_2TB/MiNDLAXY`: Neues nur über MiNDSOURCE/inbox mit einem einzigen Schreiber; MiNDTREE und MiNDCEL lesen nur
  - Tageschronik
  - Die Backends bleiben getrennt. Verbunden wird nur, was man sieht und erlebt.
- **Die fünf Stimmen** (Agenten in SPiRALCELLS):
  - Claude, Systemleitung und Tragwerk
  - Codex (ChatGPT), Architektur und Prüfung
  - Hermes (Grok)
  - Anti-Gravity (Gemini), Präsentation
  - Kimi, Recherche und Umsetzung
  - Ralf steht darüber. Für einen Menschen gibt es noch keinen Agenten; anlegen nur nach Ralfs Ja.

## Vorschlag zur Abbildung (prüfe ihn an den Daten, verbessere ihn, entscheide begründet)

| Im Lichtwerk | Im System |
|---|---|
| Keim | Ralfs Frage oder Auftrag, also die Wurzel eines Monds |
| Zelle mit Hülle | Mond (Werk) |
| Fünf Köpfe mit Bewegungsschrift | Die fünf Stimmen: bindend = Claude, getaktet = Codex, Bote = Hermes, Auftrieb = Antigravity, Weite = Kimi |
| Speiche | Zweig einer Stimme, unabhängiger Erstbeitrag (Runde 1, Silos) |
| Same | Ausprägung bzw. Variante |
| Verdrehen, Takt | Gegenlese und Verbinden (Runde 2). Die Kopplung kommt aus echten Daten, etwa Anteil der stimmenübergreifenden Kanten und tragfähigen Befunde, nicht aus einem Drehbuch |
| Einrasten, Goldwelle | Kristallisieren (grundformation), nur durch Ralf, mit Rückfrage im Bild |
| Mondphase der Hülle | Reife des Monds (frisch, gesichtet, gereift, kanonisch) |
| Kelch von der Seite | Geschichte: Ausprägungen nach Entstehungszeit, Tageschronik als Zeitachse |
| Größere Zelle | Netz der Werke, darüber die Galaxie der Zentrale. Hinein- und hinauszoomen mit Rückweg zur Ausgangsstelle |
| Faden | Kante mit Verwendung; ihre Lichtqualität zeigt den Befund (ausgeführte Probe fest, Behauptung zart) |
| Einwurf | Material ablegen oder sprechen; wird Ausprägung über `variant-branches` |
| Halten | zwei Samen verbinden, also eine Kante anlegen (Mix ≠ Merge) |
| Eine Stimme allein | ihr Zweig durch alle Schichten |

Ungelabelte Traumfelder und NO_DELTA (keine Veränderung) sind gültige Ergebnisse und brauchen ein ruhiges Bild, keinen Fehler.

## Regeln

- Arbeite nur in diesem Ordner `/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk`. Prüfe vorher Volume und `~/.config/external-development/bin/extern-dev status`. Ist es gesperrt (Speicherdruck), sag es Ralf und warte, ohne still auszuweichen.
- Eigener kleiner Server auf einem freien Port (zum Beispiel 8411, vorher mit lsof prüfen). Er liefert die Oberfläche und leitet API-Aufrufe serverseitig an SPiRALCELLS weiter. Nie 8894, 9062, 9040, 9030, 8401 oder 8400 belegen. Prozesse nur per PID beenden, nie `pkill -f`.
- SPiRALCELLS auf 8401 darfst du mit dem Befehl oben starten. Erst `state.json` kopieren, dann schreiben, und nur über die vorgesehenen Routen. Nichts löschen, nichts migrieren.
- Erste Ebene: nur Bild und höchstens ein Satz. Jede Berührung entfaltet eine Stufe. Keine Formulare und keine Textboxen; Eingabe heißt sprechen oder ablegen. Kennungen nur in einer geschlossenen Ansicht „Technische Details“.
- Kristallisieren und jede andere folgenreiche Handlung nur mit Bestätigung im Bild. Nie automatisch.
- Keine bezahlten Modellaufrufe. Ein Dienst, der aus ist, erscheint als ruhender Bereich mit einem menschlichen Satz.
- Leistung: flüssig auf diesem Mac mini (16 GB) und auf dem Handy (390 × 844); `prefers-reduced-motion` ernst nehmen.
- Ehrlich berichten: Was geprüft ist, zeigst du mit Standbildern und Testausgaben. Was nicht geprüft ist, sagst du.

## Vorgehen

1. **Lesen und abbilden.** Bestandsaufnahme über die API. Daraus `ABBILDUNG.md`: welches Bildelement welche Daten trägt, mit echten Zahlen. Offene Entscheidungen sammelst du für Ralf, etwa ADR-0006, einen Agenten für Ralf, Verschachtelung über `gehört-zu`. Wo es geht, baust du mit einer sinnvollen Annahme weiter.
2. **Bauen.** Die Lichtwerk-Engine übernehmen und in Module teilen (Licht, Simulation, Daten, Navigation, Bedienung, Klang). Zuerst der Mond „Spiral Cells · Bildvision“ oder „Zentrale · Material bekommt Form“ als echte Zelle, dann das Netz der Werke.
3. **Prüfen.** Standbilder je Zustand und zwei unabhängige Kritikrunden an den Standbildern (Erstblick, Bildkraft, Code, Bedienung). Das hat sich am 20.10. bewährt und echte Fehler gefunden. Dazu Tests für den Datenweg, besonders: Schreiben nur über die vorgesehenen Routen, gleiche `request_id` bei Wiederholung, keine Kennungen im Bild.
4. **Übergeben.** Eine Startdatei (`SPiRALCELLS-STARTEN.command`), der Link, Standbilder, die Liste offener Entscheidungen und ein Eintrag in die Tageschronik: `python3 tools/chronik/chronik.py eintrag …` im Repo `/Users/ralfkirchner/Documents/Claude/Projects/ADHS OS/modules/llm-wiki`.
