> **Ersetzt am 21.10.2026 durch `PROMPT-KIN-OS-EINS.md`.** Ralf: KiN OS ist die Zentrale, keine zweite Instanz, und es gibt einen Chat. Nicht mehr einfügen.

# Prompt an Astra · KiN OS und SPiRALCELLS · 20.10.2026, 23:30 · von Claude (Opus 5.5), Auftrag Ralf

Kopiere ab **BEGINN** bis **ENDE** in den Astra-Chat (ChatGPT-Desktop-App auf dem Mac, mit Computer Use und lokalem Dateizugriff). Die Datei bleibt lokal.

---

BEGINN

Du bist Astra mit Computer Use auf Ralfs Mac. Ralf übergibt dir **KiN OS** samt **SPiRALCELLS**. Sein Auftrag, wörtlich: *„Gib das Projekt an Astra weiter. Schreibe einen Prompt, der alles aufgreift. Aber weiterdenken und verbessern.“*

Sprich mit Ralf Deutsch, einfach und kurz. Er hat ADHS: eine Sache auf einmal. Nach jedem Schritt bekommt er **ein Bild und einen Satz**, keine Textwand, keine Tabelle, keine Kennungen. Jede Empfehlung bekommt einen Grund in einem Satz. Bau, statt zu berichten. Ein Konzept ohne bedienbaren Stand ist keine Lieferung.

## 1 · Wozu das Ganze

KiN OS soll Ralfs eines Betriebssystem werden: der Rahmen der Zentrale (AiHDS OS), darin SPiRALCELLS als lebendes Netz seiner Werke, der KiNFORMER als Werkstatt in seiner Hand, KiN (KiNTEGRiTY) als Gedächtnis im Hintergrund. Ralf öffnet es, sieht in einem Satz, was seit seinem letzten Besuch dazugekommen ist, taucht mit einem Tipp in die richtige Zelle, formt dort einen Text in eine andere Gestalt, behält sie durch Halten, und findet mit einem Tipp zurück. Das Kristallisieren (etwas für gültig erklären) bleibt allein bei ihm.

## 2 · Was heute steht (gemessen am 20.10.2026, 23:25)

**KiN OS (Fork der Zentrale)** — `/Volumes/ThunderBolt4_2TB/Development/Projects/kin-os`, läuft auf `http://127.0.0.1:8895/` (PID in `kin-os/protokolle/kin-os-8895.pid`), Start `KIN-OS-STARTEN.command`, Halt `KIN-OS-ANHALTEN.command`. Eigenes Git, **kein Push**: Commit `1c1a7e2` = unveränderte Kopie der Zentrale (wirktragwerk `2c96a11` + Plattenstand, Prüfsummen in `HERKUNFT-PRUEFSUMMEN.txt`), Commit `598afbe` = alles, was KiN OS anders macht; Commit `1b7cf21` = die Kennung einer Form (`kinos-form-…`) folgt auch ihrer Seite, damit der ehrliche KiNFORMER (formformer 86800cc) kein 409 auslöst. Lies zuerst `kin-os/HERKUNFT.md`.
- Port 8895, eigener Zustand `Development/Projects/kin-os-daten/formen`. Gegenüber KiN tritt KiN OS als `http://127.0.0.1:8895` auf, nie als Zentrale; jede Ablage trägt `kinos` in `request_id`, `ref`, `metadata`. Wählen ruht, weil KiN diesen Ursprung noch nicht kennt.
- Kosten fest aus: `verstehen()`, `beschreiben()`, `_claude()` geben im Code „ruht“ zurück; Bilder ablegen und Sprechen ruhen.
- Leiste: Punkt „SPiRALCELLS ↗“ neben „Kleiner Tisch ↗“; oben (am Handy als Streifen über der Leiste) ein Satz zu den Ankünften. Organ `organ_spiralcells.py` liest `8411/lichtwerk/neu?seit=…` vom Server aus; der Browser merkt sich nur den Zeitpunkt (Schlüssel `kinos-zuletzt`), gesetzt beim Tipp hinüber. Ohne Merker steht der jüngste Eintrag da („nie leer“, Ralfs Wunsch).
- `/eingang`: „Entwürfe für den Eingang“ (Sternwerft, Inselkarte, Gezeiten von Codex über 8420; Übersicht von Claude auf 8461), nur verlinkt, ohne Wahl. Unten links „Zurück zu AiHDS OS“.
- Raum Formen: lesbare Werk- und Formnamen in der Adresszeile (`/formen/ansehen?werk=…&form=…`), Suchfeld der Leiste aus.
- Tests: 589 Python-Tests, nur der geerbte Altfehler `tests/test_aios_http.py` (ab Z.236, CSP-Bildquellen) ist rot, genau wie in der Zentrale; 9 Node-Tests grün. Eigene Tests: `tests/test_kinos_fork.py`, `tests/test_organ_spiralcells.py`.

**SPiRALCELLS-Lichtwerk** — `/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk`, `http://127.0.0.1:8411/` (Leseeingang 8420 nur lesend), Proxy auf SPiRALCELLS 8401 (Ralfs echter Bestand, ~89 Monde). Eigenes Git seit 22:35 (`7ca33a9`), danach offene Änderungen zweier Claude-Sitzungen. Läuft seit 23:22 mit dem getesteten Server: Tür „KiN OS“ im Netz (leuchtet, wenn 8895 antwortet), 8895 in der Sperrliste, Formen ansehen und Behalten (nur durch Ralfs Halten, Faden `verweist-auf`), Wiederkommen, lesbare Links `/#mond=<name>&von=kinos|sternwerft` mit Rückweg. Tests: 53 Python, 29 Node, alle grün. Die Lichtwerk-Sitzung hat einen eigenen Astra-Prompt geschrieben (`PROMPT-ASTRA-SPIRALCELLS-KIN-OS.md`); lies ihn mit, er deckt die Lichtwerk-Seite ab, dieser hier den Fork. Lies `BERICHT.md`, `ABBILDUNG.md`, `ANDOCKEN-KIN-OS.md`, `BAUPLAN-SPIRALCELLS-IN-KIN-OS.md`, `KINFORMER-EINBINDUNG.md`, `KINFORMER-EHRLICH-ZENTRALE.md`.

**Standbilder** des Forks: `spiralcells-lichtwerk/standbilder/kinos-fork/` (Leiste, Zelle, Rückweg, Eingang, Formen; 1440 und 375 px, auch reduzierte Bewegung), Werkzeug `werkzeuge/kinos-standbilder.py`. Kritik Runde 2: nur der Code-Prüfer lief (`protokolle/kritik-kinos-fork/code.md`, eingearbeitet); Aufträge für Erstblick, Bildkraft, Bedienung liegen daneben.

## 3 · Ehrlich offen (nicht schönreden)

1. **375 px:** Die Startseite rollt in einer von fünf Stationen noch waagerecht; die Zentrale selbst rollt dort schon um 15 px (`motion-control`, Zeitstrahl-Knöpfe). Der Satz-Streifen kürzt auf zwei Zeilen, ein Rest der dritten scheint durch.
2. **Der Satz ist zu lang:** „Seit deinem letzten Besuch eingetragen: acht Ausprägungen von Claude, fünf von Codex, drei von Antigravity, zwei von Hermes und eine von Kimi, in drei Monden. Dazu drei neue Fäden.“ Das ist ehrlich, aber kein Satz für einen Blick.
3. **„Ausprobieren“** an einem Werk aus KiN öffnet KiNs Werkadresse mit Kennung (`werk-….localhost:9040/…/version_…`).
4. **„Wählen“** steht an Varianten, obwohl es ruht; erst nach dem Tipp kommt der Satz.
5. „Neues Material · Sprich“ heißt noch so, obwohl Sprechen ruht.
6. Am Handy fehlen „Entwürfe für den Eingang“ und „Zurück zu AiHDS OS“ (die Randleiste ist dort ausgeblendet, wie in der Zentrale).
7. Kritik Runde 2 ist unvollständig (Erstblick, Bildkraft, Bedienung fehlen).
8. Der Speicherschutz sperrte den ganzen Abend im Minutentakt (Arbeitsspeicher). Viele Läufe mussten auf ein freies Fenster warten.

## 4 · Weiterdenken und verbessern (deine eigentliche Aufgabe)

Nicht nur Mängel flicken. Mach KiN OS zu einem Ort, den Ralf jeden Tag gern öffnet. Mein Vorschlag, in dieser Reihenfolge; prüfe ihn, verbessere ihn, begründe jede Abweichung in einem Satz:

1. **Ein Blick, ein Satz.** Kürze die Ankunft auf einen Satz für einen Blick („19 neue Ausprägungen in drei Monden, die meisten von Claude.“); das Ganze liegt eine Ebene tiefer beim Tipp. Bau es im Lichtwerk (`/lichtwerk/neu` bekommt ein kurzes Feld), nicht im Fork, damit Sternwerft und KiN OS dieselbe Sprache sprechen.
2. **Der Himmel als Eingang.** Heute ist die erste Ebene die Galaxie der Zentrale mit vielen Bedienteilen. Station 1 in Ralfs Tag heißt: „Ein dunkler Himmel, ein Satz, in der Leiste ein Punkt SPiRALCELLS.“ Prüfe, ob eine ruhige Startansicht (der leuchtende Mond der jüngsten Ankunft, ein Satz, ein Tipp hinein) besser trägt als die Galaxie. Umschaltbar statt ersetzen: die Galaxie bleibt eine Ansicht.
3. **Handy wirklich.** 375 px ohne waagerechtes Rollen auf allen Stationen, Rückweg zu AiHDS OS und die Entwürfe auch dort (etwa im Satz-Streifen oder als Ziel im Hilfe-Knopf), Daumenbreite.
4. **Ehrliche Knöpfe.** Was ruht, steht nicht als Knopf da, sondern als ein stiller Satz (Wählen, Sprich, Ausprobieren eines KiN-Werks mit Kennung).
5. **Der KiNFORMER als Bühne in KiN OS** (Schicht 2 und 3 aus `KINFORMER-EINBINDUNG.md`): Eine Ausprägung aus SPiRALCELLS kostenlos in den Raum Formen holen („aus SPiRALCELLS“, ohne `verstehen()`), als `kinformer_form` mit `kinos`-Markierung in KiN ablegen, das Korn im Lichtwerk zeigt per `source_ref` darauf. Nur gegen eine Testkette, bis Ralf es lebend sieht und Ja sagt.
6. **Kritik Runde 2 vollständig** (Erstblick, Bildkraft, Bedienung) als unabhängige Prüfer, einarbeiten, dann Ralfs Tag einmal ganz als Standbilder bei 375 und 1440 px.

## 5 · Feste Grenzen (gelten unverändert)

- **Speicher:** Alles Neue auf `/Volumes/ThunderBolt4_2TB/Development/…`, kein interner Ersatzpfad. Vor jedem Start (Server, Tests, Browser) `~/.config/external-development/bin/extern-dev status` in einem eigenen Befehl; bei „gesperrt“ nichts starten, nur lesen und Code schreiben. Tests über `extern-dev run <ordner> …`.
- **AiHDS OS** (8894, `wirktragwerk`) bleibt unverändert und umschaltbar. Einen Link von AiHDS OS nach KiN OS gibt es nur, wenn Ralf ihn ausdrücklich will.
- **Kosten:** kein bezahlter Aufruf, nichts an api.anthropic.com, keine Zeile in `ki-kosten.jsonl`. `POST 8894/api/formen/material` ist bezahlt. DER TiSCH (9030) wird nie angefragt.
- **Oberfläche** nach `/Volumes/ThunderBolt4_2TB/Development/GRUNDMANIFEST-MENSCHLICHE-OBERFLAECHEN.md`: keine Kennungen, auch nicht in Adresszeile, Tooltips, Beschriftungen; keine Formulare, Textfelder, Suchfelder, Auswahllisten; Eingabe ist Halten, Ablegen, Tippen; Sprechen erst nach Ralfs Ja; erste Ebene Bild und ein Satz; reduzierte Bewegung; ein ruhender Dienst ist ein ruhiges Bild mit einem Satz; keine Taste doppelt.
- **Schreiben:** In SPiRALCELLS schreibt für Ralfs Wege nur die Lichtwerk-Schleuse, in seinem Namen und nur, wenn er im Bild hält; prüfen nur gegen eine Testkette (`testdaten/kette-…`, eigene Ports), nie gegen den echten Bestand. Kristallisieren darf nur Ralf. KiN OS liest SPiRALCELLS nur über das Lichtwerk. Der KiNFORMER schreibt nirgends hin.
- **Eigentum:** mooncells, `kin/form_work*`, Codex' Dateien im Lichtwerk (`app/werkraum.*`, `materialraum`, `werkdaten`, `mycel`, `test_autorenprofile.py`, seine Stellen im Server, `kin-os-sichten-codex`) gehören Codex: nur lesen, Wünsche als `WUNSCH-an-codex-*.md`. `kin-os-sichten` gehört einer Claude-Sitzung. Der Lichtwerk-Server ist geteilt: direkt vor dem Schreiben Prüfsumme lesen, nur bei gleichem Stand schreiben.
- **Dienste:** 9030, 9031, 9084 nie anfassen; 9062 und 8894 nur nach Rückfrage neu starten; 8401 nur nach Kopie von `state.json`. Prozesse nur per PID beenden, nie `pkill`. Kein launchd ohne Ralfs Ja. KiN (9040) nie von Hand abfragen, nie `GET /api/anschluss`; Änderungen an KiN nur mit Ralfs Ja, Backup und `betrieb.py`.
- **Git:** kein Push, kein Zweigwechsel. Commits in KiN OS sind erlaubt (Ralfs Ja vom 20.10.); im Lichtwerk nur deine eigenen Änderungen.
- **Chronik** nach jedem Schritt: `cd "/Users/ralfkirchner/Documents/Claude/Projects/ADHS OS/modules/llm-wiki" && /usr/bin/python3 tools/chronik/chronik.py eintrag --modell astra --was "…" --dateien … --bild <standbild.jpg> --themenfeld "KiN OS"`.

## 6 · Was Ralf entscheidet (nicht du)

1. Soll KiN KiN OS kennen (Ursprung 8895 freigeben), damit Wählen geht? Das ist eine Änderung an KiN.
2. Darf der Werkraum von Codex schreiben, sobald seine Wünsche umgesetzt sind?
3. Wird „gehört-zu“ kanonisch, und zählen Werkzeug-Formen bei der Adoption?
4. Welcher Entwurf wird der Eingang (Sternwerft, Inselkarte, Gezeiten, Übersicht oder deine ruhige Startansicht)?

## 7 · Fertig ist es, wenn

Ralf KiN OS am Mac und am Handy öffnet, in einem Blick einen kurzen Satz liest, mit einem Tipp in der richtigen Zelle ist und mit einem Tipp zurück; kein Knopf mehr verspricht, was ruht; nirgends eine Kennung steht; alle Tests grün sind (außer dem dokumentierten Altfehler); AiHDS OS unverändert läuft; die Kritik vollständig eingearbeitet ist; und Ralf drei Sätze bekommt: was er jetzt tun kann, was noch nicht gut ist, was er entscheiden muss.

ENDE
