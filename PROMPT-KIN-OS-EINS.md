# Ein Prompt für KiN OS · KiN OS ist die Zentrale · 21.10.2026

Von Claude, auf Ralfs Wort vom 21.10.2026:

> „Das KinOS ist natürlich nur eine Plattform, in der die Zentrale agiert. Also das sind ja keine verschiedenen
> Instanzen. Wenn du das so machst, ist es grundlegend falsch. Das ist eine. Genauso soll es einen Chat geben, der das
> alles regelt und nicht diese drei gleichzeitig.“

**Dieser Prompt ersetzt** `PROMPT-KIN-OS-FORK.md`, `PROMPT-ASTRA-KIN-OS.md` und `PROMPT-ASTRA-SPIRALCELLS-KIN-OS.md`.
Diese drei bleiben als Geschichte liegen, gelten aber nicht mehr als Auftrag.

**Ein Chat.** Füge den Text von BEGINN bis ENDE in genau **einen** neuen Chat ein (Claude Code im Ordner `wirktragwerk`).
Bevor du ihn einfügst:
- Astra, die Fork-Sitzung „KiN OS: kleinsten Fork anlegen“ und die Lichtwerk-Sitzung arbeiten nicht mehr an KiN OS
  weiter; sie sind darüber benachrichtigt.
- Die Sitzung, die im Lichtwerk auf dem Zweig `gewebe` baut, darf weiterlaufen; sie fasst KiN OS nicht an.

---

BEGINN

Du bist der eine Chat für KiN OS auf Ralfs Mac. Vor dir haben drei gleichzeitig daran gebaut: zwei Claude-Sitzungen und
ChatGPT Astra. Das war der Fehler, und du bist die Korrektur. Von jetzt an baut nur noch dieser Chat an KiN OS.

## Was Ralf will (wörtlich und nicht neu abzufragen)

- „Das KinOS ist natürlich nur eine Plattform, in der die Zentrale agiert. Also das sind ja keine verschiedenen
  Instanzen. Wenn du das so machst, ist es grundlegend falsch. Das ist eine.“
- „Genauso soll es einen Chat geben, der das alles regelt und nicht diese drei gleichzeitig.“
- Die Idee vom 20.10.: AiHDS OS und die KiNTEGRiTY-Zentrale vereinen, SPiRALCELLS daraus erreichbar und steuerbar,
  Neuigkeiten aus den Traumphasen sichtbar.
- Weiter gelten seine Ja vom 20.10.:
  - Eine Form wird nur durch sein Halten im Lichtwerk eine Fassung unter seinem Namen.
  - Codex' Werkraum schreibt erst nach seinem Ja.
  - Der KiNFORMER sagt selbst, was er kürzt.
  - Neu ist alles seit seinem letzten Besuch, und die letzten fünf Einträge stehen immer da.
  - Git nur mit eigenen Pfaden.

## Was falsch gebaut ist

Am 20.10. wurde „KiN OS am Ende als kleinster Fork“ als **zweite Instanz** gebaut. Ordner
`/Volumes/ThunderBolt4_2TB/Development/Projects/kin-os`, eigener Port 8895, eigener Browserursprung, eigener Zustand
in `kin-os-daten`, eigene Markierung `kinos-` in KiN. Daraus folgten Fehler, die es mit einer Instanz nicht gäbe:

- **Wählen ruht in KiN OS**, weil KiN die Werkwahl nur vom Ursprung der Zentrale `http://127.0.0.1:8894` zulässt
  (`kintegrity/kin/private_access.py`, `kin/manufacture_http.py`). Am 21.10. wollte Claude dafür KiN lockern. Das
  hat der Sicherheitsfilter gestoppt, und es war ohnehin der falsche Weg. **KiN wird dafür nicht geändert.**
- Zwei Zustände der Formen, zwei Startdateien, zwei Rückwege, zwei Dienste, die man starten muss.
- In KiN stehen Formen mit `kinos-`-Kennung neben denen der Zentrale (`kinformer-`). Mindestens eine ist echt:
  „Karten aus Fundstück-Wandler“, am 21.10. um 10:33 als Probe über 8895 abgelegt.

## Was richtig ist

**KiN OS ist die Zentrale.** Eine Instanz: `wirktragwerk`, Port 8894, Ursprung `http://127.0.0.1:8894`, ein Zustand.
„KiN OS“ ist ihr Name und ihre Oberfläche. Ob die Oberfläche „AiHDS OS“ umschaltbar daneben behält, entscheidet Ralf;
die Daten sind dieselben. Dann gilt KiNs bestehende Regel für die Werkwahl von selbst, mit Nachfrage am Mac, ohne
Änderung an KiN.

## Dein Auftrag

### 1 · Lesen und messen (nichts ändern)

- `extern-dev status` (`~/.config/external-development/bin/extern-dev status`): Bei „gesperrt“ startest du nichts.
- Dieser Prompt, dann `kin-os/HERKUNFT.md` und `kin-os/KIN-WELT.md` (Astras Teil).
- In `spiralcells-lichtwerk/`: `ANDOCKEN-KIN-OS.md` und `KINFORMER-EHRLICH-ZENTRALE.md`.
- Die Tageschroniken vom 20. und 21.10. (`/Volumes/ThunderBolt4_2TB/MiNDLAXY/Tageschronik/`).
- Git:
  - `git -C kin-os log --oneline 1c1a7e2..HEAD`: alles, was der Fork anders macht.
  - `git -C wirktragwerk status --short`: 71 offene Änderungen, großenteils fremde Arbeit seit September.
- Prozesse: `lsof -nP -iTCP -sTCP:LISTEN` für 8401, 8411, 8420, 8894, 8895, 9040 und 9062.

### 2 · Ein Plan in einer Nachricht an Ralf

Ein kurzer Plan mit Bild oder Liste, ohne Kennungen: was aus dem Fork in die Zentrale kommt, was wegfällt, was er
entscheiden muss. Ralf hat ADHS: eine Nachricht, kurze Punkte, höchstens drei Fragen. Vermutlich gehören dazu:
- **Name und Eingang:** Heißt die Startseite von 8894 künftig „KiN OS“, mit AiHDS OS als umschaltbarer Ansicht?
- **Kosten:** Im Fork waren Verstehen und Beschreiben fest aus, damit nichts bezahlt wird. In der Zentrale sind sie an
  (`POST /api/formen/material` ruft ein Modell bezahlt auf). Soll das so bleiben?
- **Die `kinos-`-Formen in KiN:** stehen lassen als Geschichte (Empfehlung, nichts löschen).

Warte auf seine Antwort, bevor du Schritt 3 beginnst. Lesen und Vorbereiten darfst du weiter.

### 3 · Zusammenführen in die Zentrale

Übernimm aus `kin-os` in `wirktragwerk`, was trägt (`git diff 1c1a7e2 HEAD` im Fork):
- **Leistenpunkt SPiRALCELLS:** `organ_spiralcells.py`, `web/kinos-spiralcells.js` und die Stellen in
  `workbench.py` und `aios_organs.py`. Dazu kommen der Satz „was neu ist“ aus `GET 127.0.0.1:8411/lichtwerk/neu` und der Link
  `http://127.0.0.1:8411/#mond=<name>&von=kinos`.
- **Formen:** Die Kennung aus der Seite ist in der Zentrale schon drin (cd2e564). `/formen/ansehen` und `rahmen.js`
  aus dem Fork prüfst du und übernimmst sie, wenn sie besser sind.
- **Astras „Welt betreten“:**
  - Dateien: `web/kin-welt/`, `kin_welt_daten.py`, `werkzeug/baue_kin_welt.py`, die Prüfwerkzeuge und ihre Tests.
  - Die Post-it-Kommentare von Astra bleiben, als ihre stehen sie da.
  - Der Einbau in `web/aios.html` muss mit den fremden offenen Änderungen dort zusammengehen.
- **Entwürfe für den Eingang** (`kinos_eingang.py`): nur, wenn Ralf es will.
- **Nicht übernehmen:** eigenen Port, eigenen Ursprung, eigenen Zustand, die Markierung `kinos-` und die Sätze
  „Wählen ruht“.

**Git in `wirktragwerk`** (geteilte Arbeitskopie, viel fremde Arbeit):
- Eine Datei, die du änderst und die noch nicht eingecheckt ist, checkst du zuerst unverändert allein ein, mit Prüfsumme
  gegen eine Kopie. Dann folgt deine Änderung als eigener Commit, `git commit -m … -- <pfade>`.
- Hat eine Datei schon fremde offene Änderungen (etwa `web/aios.html`, `workbench.py`): Ralf fragen, bevor du sie mit
  deiner Änderung zusammen einchreibst, oder die Datei nicht anfassen.
- Kein Push, kein Zweigwechsel, kein Stash, kein Reset.

Prüfen: die Tests der Zentrale. Zurzeit ist ein CSP-Test in `tests/test_aios_http.py` schon vorher rot, und ein Vault-Test
ist wechselhaft; beide sind fremd. Dazu die Tests des Forks, die du mitnimmst.

### 4 · Umschalten

Erst wenn 3 grün ist:
- Erst `state.json` sichern (`/Volumes/ThunderBolt4_2TB/Development/AppData/mooncells/state.json`).
- Dann 8894 neu starten. Das ist der LaunchAgent `net.kreativtragwerk.workbench` mit KeepAlive: den Prozess per PID
  beenden, launchd startet ihn neu. Vorher mit `find -newer` prüfen, welche fremden Python-Dateien seit dem letzten Start
  geändert wurden; ein Neustart bringt sie live, also sag Ralf, welche es sind.
- 8895 per PID anhalten und nicht mehr starten. `kin-os/KIN-OS-STARTEN.command` sagt dann in einem Satz, dass KiN OS
  jetzt die Zentrale auf 8894 ist.
- Den Ordner `kin-os` nicht löschen: er bleibt als Archiv mit seinem Git.
- Lichtwerk, eine Zeile je Stelle, mit `git commit -- <pfad>` im Lichtwerk-Git:
  - `app/js/link.js`: Der Rückweg `kinos` zeigt auf `http://127.0.0.1:8894/`.
  - `server/lichtwerk_server.py`: Die Tür „KiN OS“ zeigt auf 8894, und 8895 fällt aus `verbund`.
  - `app/` geht ohne Neustart live: Erst in einer Kopie ändern und prüfen (Node-Tests in `tests/`, Ladeprobe ohne
    Seitenfehler), dann kopieren. Vor jedem neuen `export` mit `grep` prüfen, ob der Name schon vergeben ist.
  - Der Zweig `gewebe` gehört einer anderen Sitzung: Arbeite auf dem Zweig, der gerade ausgecheckt ist, und fass
    `gewebe` nicht an. Ist `gewebe` ausgecheckt, frag Ralf.

### 5 · Zeigen und Ralf wählen lassen

- **Standbilder** am Mac (1440) und bei 375 px: KiN OS öffnen, SPiRALCELLS antippen, in der Zelle sein, zurück,
  Formen, Welt betreten.
- **Ein echtes Weiterformen** über 8894 an einem vorhandenen Werk. Es entsteht genau eine Form, ohne 409.
- **Wählen** tut nur Ralf: Er tippt, KiN fragt am Mac, er bestätigt innerhalb von 90 Sekunden. Du führst ihn hin und
  prüfst danach, dass genau eine Wahl in KiN steht.

### 6 · Volltexte aus KiN lesen

Ralf am 21.10.: „Danach den Leseweg für Volltexte bauen.“ Das kommt erst, wenn Wählen über 8894 geht.
- Nur lesen. Die Zentrale holt den Volltext eines Werks über eine Leseroute, die KiN **schon hat**, und zeigt ihn in
  KiN OS als Lesefläche ohne Kennungen. Erst im Code von `kintegrity` nachsehen, welche Route das ist, nicht durch Probieren auf 9040.
- Fehlt in KiN eine passende Leseroute, wird KiN trotzdem nicht geändert. Schreib den Wunsch in
  `WUNSCH-an-codex-volltext.md` und sag es Ralf in einem Satz.
- Nichts aus dem Volltext wird gespeichert, weitergeschickt oder an ein Modell gegeben.

### 7 · Material aus der Capacities-Arbeit (später, als Vorschlag)

Eine Cloud-Sitzung hat am 20.10. für Ralf in KiNTEGRiTY gebaut. Das ist **Material**, kein zweiter Auftrag und keine
zweite Instanz. Es liegt auf GitHub `ralfarminkirchner-netizen/kintegrity`, Zweig `claude/capacities-spiral-cells`,
als Entwurfs-PR #1. Dieser Zweig ist **nicht** in der lokalen Arbeitskopie `kintegrity`: Nicht auschecken, nicht mergen,
nur lesen (`git fetch` in einen eigenen Ordner oder auf GitHub ansehen). Zum Einstieg:
- `docs/CAPACITIES-SPIRALCELLS-2026-10-20.md`: Bauprotokoll mit Architekturentscheidung,
- `docs/ASTRA-UEBERGABE-CAPACITIES-SPIRALCELLS-20261020.md`: Folgeauftrag, gilt jetzt für dich,
- `docs/belege/capacities-spiralcells-2026-10-20/GEGENPRUEFUNG.md`: unabhängige Gegenprüfung, Skripte g01–g14.

Was für KiN OS taugen könnte (selbst prüfen, übernehmen statt kopieren):
1. **Prüfregeln für Beziehungen** (`kin/spiral_cells.py`):
   - Ähnlichkeit wird nie als Beziehung gespeichert.
   - Belege stehen wörtlich in der zitierten Zelle.
   - Es gibt Geltungsstufen von Spur bis Struktur.
   - Ab „Hypothese“, beim Annehmen und beim Verwerfen bestätigt ein Mensch.
   - Eine Annahme gilt nur für die geprüfte Fassung.
   - Herkunft und Gültigkeit werden getrennt geführt.
   
   Das passt zu Ralfs Regel, dass Einklang nie vorgetäuscht wird.
2. **Fünf Linsen** über denselben Daten: Inhalt, Beziehung, Erkenntnis, Entwicklung, Möglichkeit
   (`web/spiral-cells.js`). Vergleiche sie mit Astras vier Weltsichten und dem Lichtwerk, statt eine vierte Oberfläche zu bauen.
3. **ZEiTBLiND-Startbestand** (`examples/zeitblind/seed.json`). Die Gegenprüfung (M3) sagt: Die Zelltexte sind meist
   zusammengesetzt, nicht wörtlich. Nicht als Beleg verwenden.
4. **Capacities-Adapter** (`kin/capacities.py`):
   - Er ist nie live geprüft.
   - Offen sind H1 (Datenfreigabe ist nur Selbstauskunft), H3 (Programmaufrufe gelten als „Mensch“) und H4 (der Export
     meldet Erfolg trotz Abbruch).
   - Nichts davon starten, bevor Ralf einen eigenen Test-Space und ein Token angelegt hat. Das Token hinterlegt Ralf selbst
     lokal (`KIN_CAPACITIES_TOKEN`, `KIN_CAPACITIES_WRITE_SPACE`); du siehst und tippst es nie.
   - Dann zuerst nur lesend `scripts/capacities_probe.py`.
5. **Obsidian-Rundweg mit Verlustbericht** (`kin/vault_map.py`):
   - Die Vault wird nur gelesen.
   - Offen ist M4: Verluste im Frontmatter werden nicht gemeldet.

Ralfs Grundsätze dazu:
- Keine Zugangsdaten in Code oder Chat.
- Capacities nur in einem eigenen Test-Space.
- Keine Migration, die Obsidian-Vaults bleiben unverändert.
- `mindlaxy-vault` (Gesundheitsdaten Dritter) und Chat-Exporte sind ausgeschlossen.

Das kommt erst nach den Schritten 1–6. Bring es Ralf als kurzen Vorschlag: was es ihm bringt und was er dafür tun muss.

## Feste Regeln

1. **Ein Chat.** Merkst du, dass ein anderer Agent in `wirktragwerk`, `kin-os` oder am KiN-OS-Teil des Lichtwerks
   arbeitet (Dateien jünger als 30 Minuten, die nicht deine sind), hältst du an und sagst es Ralf in einem Satz.
2. **Halten, Kristallisieren, Verbinden, Behalten und Wählen tut nur Ralf**, im echten Bestand nie „zur Probe“.
3. **Speicherschutz:** Bei „gesperrt“ keine Server, Tests oder Browser. Alles Neue liegt auf der Thunderbolt.
4. **Dienste:**
   - 9030, 9031 und 9084 (DER TiSCH) nie anfassen.
   - KiN 9040 nur über `wesenswerk-tisch/integrations/betrieb.py backup|start|stop --component kintegrity`.
   - Auf 9040 nie `GET /api/anschluss` und nie von Hand abfragen.
   - Prozesse nur per PID beenden, nie mit `pkill`.
   - 8401 nur nach einer Kopie von `state.json`.
5. **KiN (`kintegrity`) wird nicht geändert.** Es hat keinen ersten Commit, und ein Teil davon gehört Codex. Die Wahl
   über 8894 ist dort schon erlaubt.
6. **Kosten:** keine bezahlten Aufrufe ohne Ralfs Ja, auch nicht zum Testen.
7. **Oberfläche nach dem Grundmanifest** (`/Volumes/ThunderBolt4_2TB/Development/GRUNDMANIFEST-MENSCHLICHE-OBERFLAECHEN.md`):
   keine Kennungen, Ports oder Hashes sichtbar, keine Formulare, 375 px ohne waagerechtes Rollen, reduzierte Bewegung.
8. **Fremde Dateien:**
   - Codex' Dateien im Lichtwerk (`protokolle/codex-pruefsummen-*.json`) und in kintegrity nicht ändern.
   - Wünsche an Codex gehen in `WUNSCH-an-codex-<thema>.md`.
9. **Vor jeder Änderung** außerhalb von Git eine Kopie nach `sicherung/vorher-<datum>/`.
10. **Chronik** nach jedem Abschnitt, Geprüftes und Ungeprüftes getrennt:
    `cd "/Users/ralfkirchner/Documents/Claude/Projects/ADHS OS/modules/llm-wiki" && /usr/bin/python3 tools/chronik/chronik.py eintrag --modell <dein-modell> --was "…" --themenfeld "KiN OS"`

## Fertig ist es, wenn

- es **einen** Dienst für KiN OS gibt (8894) und 8895 aus ist,
- Ralf KiN OS mit einem Doppelklick öffnet, mit einem Tipp in der richtigen SPiRALCELLS-Zelle ist und mit einem Tipp zurück,
- Formen, Weiterformen und „Welt betreten“ dort gehen und Ralf selbst einmal gewählt hat,
- Ralf den Volltext eines Werks in KiN OS lesen kann oder der Wunsch an Codex dafür geschrieben ist,
- die Tests der Zentrale grün sind, bis auf die benannten fremden Altfehler,
- keine fremde Datei ungefragt verändert und kein bezahlter Aufruf gelaufen ist,
- Ralf drei Sätze bekommt: was er jetzt tun kann, was noch nicht gut ist und was er entscheiden muss.

ENDE
