> **Ersetzt am 21.10.2026 durch `PROMPT-KIN-OS-EINS.md`.** Ralf: KiN OS ist die Zentrale, keine zweite Instanz, und es gibt einen Chat. Nicht mehr einfügen.

Arbeite lokal auf diesem Mac. Sprich mit Ralf auf Deutsch, einfach und kurz. Bau, statt zu berichten. Ralf bekommt nach jeder Etappe ein Bild und einen Satz: keine Textwand, keine Tabelle, keine Statuskategorien, keine Kennungen. Jede Empfehlung bekommt einen Grund in einem Satz.

Du bist Claude, Rolle Systemleitung und Tragwerk. Ralf ist der einzige Nutzer und die letzte Instanz. Er hat ADHS: eine Sache auf einmal, Stufe um Stufe.

# Folgeauftrag: KiN OS als kleinster Fork der Zentrale, mit SPiRALCELLS im Leistenpunkt

Stand 20.10.2026, etwa 22:00. Dieser Auftrag setzt `PROMPT-SPIRALCELLS-IN-KIN-OS.md` fort (gleicher Ordner `/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk`). Dessen feste Regeln 1–15 gelten unverändert; lies sie dort, bevor du beginnst. Den Bauplan findest du in `BAUPLAN-SPIRALCELLS-IN-KIN-OS.md`, Abschnitt **B6** (Wort für Wort maßgeblich) und Etappen 6 und 7.

**Ralf hat schon Ja gesagt** (20.10.2026, 20:18, wörtlich): „Ja zu allen drei Empfehlungen: Formen behalten als Fassung unter meinem Namen, Werkraum bleibt daneben und schreibt erst nach meinem Ja, KiN OS am Ende als kleinster Fork.“ Für den Fork gilt damit: eigener Ordner, eigener Port, eigenes Git samt erstem Commit, **kein Push**. AiHDS OS (8894, `wirktragwerk`) bleibt unberührt. Frag das nicht neu.

## Was schon steht (geprüft, nicht neu bauen)

- **Lichtwerk 8411** läuft seit 21:44 mit dem getesteten Server: Leseeingang 8420 (Werkraum und Sternwerft-Skizzen lesen nur), Formen ansehen, Behalten (nur durch Ralfs Halten, Faden `verweist-auf`), Wiederkommen (nur echte Ankünfte), lesbare Links `/#mond=<name>&von=sternwerft|kinos` mit festem Rückweg. Startdatei: `SPiRALCELLS-STARTEN.command` (`--leseeingang 8420 --behalten`).
- **Lesewege für KiN OS:** `GET 8411/lichtwerk/neu?seit=<ms>` (Satz und Zahlen, `mond` = lesbarer Name der jüngsten Ankunft) und `GET 8411/lichtwerk/monde`. Beschrieben in `ANDOCKEN-KIN-OS.md`.
- **Vorlage für das Organ:** `kinos-vorlage/organ_spiralcells.py` mit Tests gegen eine Attrappe (`kinos-vorlage/test_organ_spiralcells.py`). Übernimm sie in den Fork, statt neu zu schreiben.
- **Tests im Lichtwerk:** `tests/test_datenweg.py`, `test_autorenprofile.py` (Codex), `test_formen.py`, `test_neu.py`, `daten.test.mjs`, `werkdaten.test.mjs` (Codex), `ankunft.test.mjs`. Stand: alle grün (`protokolle/stand-tests.txt`).
- **Codex' Dateien** sind unverändert (`protokolle/codex-pruefsummen-vorher.json`). Wünsche und Brief liegen bereit (`WUNSCH-an-codex-*.md`, `AN-CODEX-KIN-OS.md`).
- Bekannt, nicht von dir: Codex' Test-Lichtwerk 8412 lief um 21:44 nicht mehr. Nicht neu starten; es gehört Codex.

## Stufe 0 · Prüfen

- `~/.config/external-development/bin/extern-dev status`. Gesperrt heißt: nichts starten (keine Server, keine Tests, kein Browser, kein `extern-dev new`). Lesen und Code schreiben gehen weiter. Der Schutz sprang am 20.10. abends alle paar Minuten zwischen frei und gesperrt; bündle Starts in kurze Wellen und prüfe den Status unmittelbar vor jeder Welle in einem eigenen Befehl.
- Dienste: `protokolle/*.pid`, `ps -o lstart=,command= -p <PID>`, `lsof -nP -iTCP -sTCP:LISTEN`. Ist 8895 frei? (sonst einen anderen freien Port wählen und überall eintragen, auch in `app/js/link.js` `VON.kinos` und in `ANDOCKEN-KIN-OS.md`).
- `wirktragwerk`: `git log -1`, `git status --porcelain`. Lies `aios_formen.py`, `workbench.py`, `aios_organs.py` (`read_organ` ab Z.694), `web/aios.html` (Leiste Z.8–13), `web/formen/rahmen.js` (Z.132, 137, 530) neu; die Zeilen in B6 können sich verschoben haben.
- Codex-Prüfsummen erneut gegen `protokolle/codex-pruefsummen-vorher.json` vergleichen; jede Abweichung mit Änderungszeit und Codex-Sitzung notieren, nichts zurückstellen.

## Etappe 6 · Der kleinste Fork (nach B6)

1. **Ordner:** `extern-dev new kin-os` (nur bei „frei“). Vorher `HERKUNFT.md` im Fork: Commit von `wirktragwerk`, `git status --porcelain`, Prüfsummen. Kopiert werden nur `git ls-files` und `git ls-files --others --exclude-standard` (darunter `aios_formen.py` und `web/formen/`). Nie mit: `.git`, `.workbench`, `.release-private` (Zugangsdaten), `artifacts`, `.playwright-cli`, `.pytest_cache`, `__pycache__`. Prüfsummen über genau diese Liste vorher und nachher; in `wirktragwerk` darf sich nichts ändern.
2. **Betrieb:** eigener Zustand `ZENTRALE_FORMEN_DIR=…/Projects/kin-os-daten/formen`; eigener Port (8895); Start mit `/Applications/Xcode.app/Contents/Developer/usr/bin/python3 workbench.py --port 8895` über eine eigene `KIN-OS-STARTEN.command` (Startprüfung `extern-dev status`, PID-Datei, kein launchd). `local_launcher.py` und `aios_environment.py` sind auf 8894 verdrahtet: nicht benutzen.
3. **Origin:** `ZENTRALE_ORIGIN` (`aios_formen.py` Z.26) auf `http://127.0.0.1:8895`. Test: jeder Aufruf an `/api/manufacture` trägt diesen Origin; Wählen ruht mit einem Satz, der KiN OS nennt, bis KiN den Fork kennt (Änderung an KiN nur mit Ralfs Ja, Backup und `betrieb.py`).
4. **Kosten fest aus:** `verstehen()`, `beschreiben()` und `_claude()` geben im Fork „ruht“ zurück, ohne Netz (die Schlüsseldatei `~/.config/kintegrity/systemleitung.env` gilt für den ganzen Mac). Abgelegter Text bekommt den schlichten Namen ohne Modell; Bilder ablegen ruht mit einem Satz; Sprechen aus („Sprechen kommt nach deinem Ja.“). Test ersetzt `urlopen`: kein Aufruf an api.anthropic.com, keine neue Zeile in `ki-kosten.jsonl`.
5. **Markierung** an allen Stellen von `aios_formen.py`: `request_id` `kinos-` statt `zentrale-` und `kinos-form-` statt `kinformer-`; `ref` `kinos:formen…` und `kinos:kinformer:<richtung>:<werk>`; `metadata` `{"kinos": "formen", …}`. Test: keine Anfrage des Forks an KiN trägt „zentrale“. Du selbst legst im Fork nichts ab; das tut Ralf.
6. **Leiste:** Punkt „SPiRALCELLS ↗“ neben „Kleiner Tisch ↗“, gebaut wie „Gemeinsamer Bestand ↗“, im selben Fenster. Lesendes Organ `spiralcells` in `read_organ` aus `kinos-vorlage/organ_spiralcells.py`, mit freiwilligem Parameter `seit`, den der Browser des Forks aus „zuletzt in KiN OS“ mitgibt (nur der Zeitpunkt, in try/catch). Der Punkt zeigt den Satz; nennt er eine Ankunft, öffnet er den Mond der jüngsten Ankunft mit `von=kinos`, sonst das Netz.
7. **Sichten:** Sternwerft, Inselkarte, Gezeiten und Claudes Übersicht als „Entwürfe für den Eingang“, nur verlinkt (Sternwerft über `http://127.0.0.1:8420/kin-os-sichten-codex/…`), ohne Wahl.
8. **Umschalten:** ein Weg zurück zu AiHDS OS (8894). Hinüber ohne Eingriff in AiHDS OS: `KIN-OS-STARTEN.command` und im Lichtwerk eine Tür „KiN OS“ in der Liste `UMGEBUNG` (`server/lichtwerk_server.py`), die nur leuchtet, wenn der Fork antwortet; den Fork-Port in die Sperrliste von `main()` aufnehmen. Einen Link in AiHDS OS gibt es nur, wenn Ralf ihn ausdrücklich will. Im Lichtwerk ist der Server geteilt: vor dem Schreiben Prüfsumme lesen, Codex' Stellen wortgleich lassen, danach 8411 per PID neu starten (ein Satz an Ralf vorher, Tests grün).
9. **Geerbte Mängel:** Im Raum Formen des Forks steht statt der Werkkennung in der Adresszeile (`rahmen.js` Z.132, 137) ein lesbarer Werkname; das Suchfeld der Leiste (`aios.html` Z.14) ist aus. Passt das nicht mehr, steht es als bekannter Mangel im Bericht.
10. **Git:** eigenes Git im Fork, erster Commit nennt die Herkunft (Commit von `wirktragwerk`). Kein Push.

**Prüfung:** 8894 antwortet wie vorher, die Prüfsummen der kopierten Dateien in `wirktragwerk` sind gleich. Tests im Fork grün, außer dem bekannten Altfehler in `tests/test_aios_http.py` Z.236. Kein Aufruf an api.anthropic.com, keine Anfrage an KiN mit „zentrale“, in KiN wurde nichts gewählt. Der Fork funktioniert bei 375 px. Standbilder: Leistenpunkt mit Satz, Tipp in die Zelle, Rückweg „Zurück zu KiN OS“.

## Etappe 7 · Rest von Umschalten und Übergeben

- Ralfs Tag einmal ganz als Standbilder, je Station eines, bei 375 und 1440 px (KiN OS öffnen → Werk wählen → Eintauchen → Lesen → Formen → Wiederkommen → Kristallisieren nur an der Testkette).
- Eine zweite unabhängige Kritikrunde (Erstblick, Bildkraft, Code, Bedienung) als eigene Unteragenten; jeder prüft nur an der Testkette und startet erst nach einem eigenen `extern-dev status`.
- Lichtwerk und Werkraum sind umschaltbar: Tür „Werkraum“ im Netz und Taste W stehen schon (öffnen den lesenden Werkraum mit `#mond=…`; ob er den Mond übernimmt, ist Codex' Wunsch).
- `BERICHT.md`, `ABBILDUNG.md`, Gedächtnis (`mooncells-gemeinsamer-variantenraum.md`, `raum-formen-zentrale.md` unter `~/.claude/projects/-Volumes-ThunderBolt4-2TB-MeineApps-ki-ntegrity-v19-better/memory/`) und Chronik nachtragen.

## Fertig ist es, wenn

- Ralf KiN OS (8895) öffnet, den Rahmen der Zentrale sieht und im Leistenpunkt „SPiRALCELLS“ einen Satz zu den Ankünften liest; ein Tipp führt in die Zelle und oben links „Zurück zu KiN OS“ wieder hinaus;
- der Raum Formen im Fork da ist und nichts kostet; AiHDS OS auf 8894 unverändert läuft;
- alle Tests grün sind (Lichtwerk und Fork), die zweite Kritikrunde eingearbeitet ist und Ralf drei Sätze bekommt: was er jetzt tun kann, was noch nicht gut ist, was er entscheiden muss.

## Was Ralf noch entscheiden muss (nicht von dir zu entscheiden)

1. Soll der KiNFORMER selbst ehrlich sagen, was er kürzt? Das ändert auch die Formen der Zentrale (KiN antwortete nach einer Änderung mit 409).
2. Bekommen Lichtwerk, `formen_http.py`, Raum Formen und KiN einen Git-Stand?
3. Darf der Werkraum schreiben, sobald Codex die Wünsche umgesetzt hat?
4. Wird „gehört-zu“ kanonisch, und zählen Werkzeug-Formen bei der Adoption?
