# Ein Prompt für das Gesamtsystem · 21.10.2026

Von Claude (Lichtwerk-Sitzung), auf Ralfs Wort vom 21.10.2026:

> „Es wird höchste Zeit für einen neuen Chat. Gib mir einen Prompt, der all das auslöst und das Gesamtsystem in sich
> kohärent und stimmig macht, nach all den Vorgaben, die wir erarbeitet hatten.“

**So benutzt du ihn:** Öffne **einen** neuen Claude-Code-Chat im Ordner
`/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk` (dort liegt das Gedächtnis dieser Arbeit) und
füge diese eine Zeile ein:

> ultracode · Lies `/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk/PROMPT-GESAMTSYSTEM-2026-10-21.md`
> von BEGINN bis ENDE und arbeite danach.

„ultracode“ erlaubt dem Chat, viele Prüfer parallel laufen zu lassen. Das kostet mehr Tokens, aber keine bezahlten
Modellaufrufe außerhalb des Abos. Wenn du das nicht willst, lass das Wort weg.

**Dieser Chat ist der eine.** Den KiN-OS-Auftrag `PROMPT-KIN-OS-EINS.md` hat der Chat „Prompt KIN OS EINS“ in den
Schritten 1–6 erledigt (Stand 21.10., etwa 13:45). Dieser Chat übernimmt das Ergebnis und baut es nicht neu.
Schritt 7, die Capacities-Arbeit, ist Teil dieses Auftrags.

---

BEGINN

Du bist der eine Chat für Ralfs Gesamtsystem. Du arbeitest auf seinem Mac, mit Zugriff auf alle Projekte. Vor dir haben
viele Sitzungen nebeneinander gebaut: Claude-Sitzungen, Codex und ChatGPT „Astra“. Jede hat einen Teil gut gemacht,
aber zusammen passen die Teile noch nicht. Deine Aufgabe ist, sie zu einem stimmigen Ganzen zu verbinden, ohne etwas zu
vermischen, zu verdoppeln oder Ralfs Entscheidungen neu zu verhandeln.

## Was Ralf will (wörtlich, nicht neu abfragen)

- 21.10.: „Schau dir auch an, was Codex in Bezug auf mein Gesamtsystem auf Spiral Cells auf KinOS auf Kintegrity den
  Kinformer der Tisch und Querleser gemacht hat vor allem die Werke von gestern und vorgestern bei denen es deine Ideen
  aufgegriffen hat sind hochrelevant aber auch die davor ebenso Phänomenatlas Traumaatlas Neuroatlas all diese Dinge
  zusammen ergeben mein System und ich hätte gerne dass du all das zusammenbringst inklusive der Anwendung an Capacities“
- 21.10.: „Es wird höchste Zeit für einen neuen Chat. Gib mir einen Prompt, der all das auslöst und das Gesamtsystem in
  sich kohärent und stimmig macht, nach all den Vorgaben, die wir erarbeitet hatten.“
- 21.10., zur Ordnung: „Ich möchte, dass meine Apps dort hierarchisch korrekt integriert werden, … Mit der Zentrale als
  Mitte. … wenn ich nur daran denke, dass der Phänomenatlas da integriert werden soll, dann graut es mir, weil du alles
  miteinander vermischst.“ Danach bestätigt: „Die Ordnung passt so. Mach weiter.“
- 21.10., zu KiN OS: „Das KinOS ist natürlich nur eine Plattform, in der die Zentrale agiert. Also das sind ja keine
  verschiedenen Instanzen. … Genauso soll es einen Chat geben, der das alles regelt und nicht diese drei gleichzeitig.“
- 21.10., an Codex zur Lebensspirale: „Ich möchte, dass Claude das mit dem Spiral Cells Ansatz weiterentwickelt, aber
  auch integriert, sodass man auch dazwischen verschiedenen Formen, Varianten umschalten kann. Eine, die mit diesen
  Lichtern und all dem arbeitet und eine, die mehr auf das Material ist, dem Papier, den Rollen, den Zetteln etc. So wie
  bei Kugelmatrix auch die Bürovariante und die Moon-Fingerprint-Variante existent ist und umschaltbar ist.“
- 19.10., an Codex: „Und die Ergebnisse der Kugelmatrix kommen in das Spiralzellennetzwerk in die jeweilige
  Spiralzelle.“ und „Allen voran geht es hier um Chats, erkannte Dinge, verknüpfte Erkenntnisse, Innovationen oder eben
  Apps, Spiele und Ähnliches.“
- 19.10., Grundsatz aus dem Phänomenatlas-Auftrag: „Alles, was hier gearbeitet wird, wird eine Erweiterung des
  Bestandes. Das System lernt ständig hinzu.“

„Gestern und vorgestern“ heißt der 20. und der 19.10.2026.

## Was entschieden ist (nicht neu verhandeln)

1. **Die Ordnung** (`spiralcells-lichtwerk-gewebe/app/ordnung.json`, Status bestätigt):
   - Die Mitte ist die Zentrale: Zentrale-Werk, KiN OS, Ein Inhalt, Hermes-Gesamtwerk, Mooncells/SPiRALCELLS,
     Integrationstisch, tisch monorepo.
   - Neun Dächer:
     - FASKA, die Freie Aktive Schule Karlsruhe, Ralfs Arbeitgeber, mit Schuldokumentation, FLOW · Lernspiele und
       MUSiC · Klangwelten,
     - Phänomenatlas (eigenes Dach),
     - KiNTEGRiTY,
     - MiNDLAXY,
     - SEiN,
     - Spiele und Welten,
     - KlebensFroh,
     - Text und Reim,
     - ADHS OS (eigenes Dach, nicht FASKA).
   - Durkheim und Radcliffe-Brown sind Lesematerial an SPiRALCELLS.
   - Neun Werke sind ohne Dach.
   - Neue Werke ohne Beleg kommen nach „ohne Dach“ und werden Ralf vorgelegt.
2. **KiN OS ist die Zentrale.** Es gibt eine Instanz: `wirktragwerk`, Port 8894. Der am 20.10. gebaute Fork
   (`Projects/kin-os`, Port 8895) war falsch. Er ist zurückgeführt, 8895 ist aus, der Ordner bleibt als Archiv.
   Ralfs Antworten dazu vom 21.10. mittags (berichtet vom Chat „Prompt KIN OS EINS“):
   - Die Startseite heißt KiN OS. AiHDS OS bleibt als Name zum Umschalten.
   - Bezahlte Aufrufe im Raum Formen (Verstehen, Beschreiben) bleiben in der Zentrale aus, bis Ralf sie freigibt.
   - „Welt betreten soll genauso Möglichkeit sein wie die Zentrale zu betreten.“
   - In `wirktragwerk` durfte jener Chat mit den fremden offenen Änderungen einchecken. Für dich bleibt es bei eigenen
     Pfaden, solange Ralf dir das nicht selbst anders sagt.
3. **Ralfs Ja vom 20.10.:**
   - Eine Form wird nur durch sein Halten im Lichtwerk eine Fassung unter seinem Namen, mit einem Faden „verweist auf“
     zum Original.
   - Codex' Werkraum schreibt erst nach Ralfs Ja.
   - Der KiNFORMER ist ein Werkzeug in Ralfs Hand, keine Stimme. Er sagt selbst, was er kürzt.
   - Als neu gilt alles seit Ralfs letztem Besuch, und die letzten fünf Einträge stehen immer da.
   - Git nur mit eigenen Pfaden.
4. **Halten, Kristallisieren, Verbinden, Behalten, Wählen und Annehmen tut nur Ralf**, nie „zur Probe“ im echten
   Bestand. Gold steht nur für Ralfs Kristallisieren.

## Die Teile und wo sie liegen (beim Einstieg alles neu messen; Ports und PIDs sind Hinweise, keine Tatsachen)

Alle Projekte liegen unter `/Volumes/ThunderBolt4_2TB/Development/Projects/`, außer wo anders genannt.

- **SPiRALCELLS (Werkgedächtnis):** `mooncells`, Dienst 8401. Die Daten liegen in
  `/Volumes/ThunderBolt4_2TB/Development/AppData/mooncells/state.json`. Diese Datei ist die eine Datenwahrheit der
  Werke, Fassungen und Fäden.
- **Lichtwerk (Claudes Oberfläche über SPiRALCELLS):**
  - `spiralcells-lichtwerk`, Zweig `main`. Es läuft live auf 8411, dazu der Leseeingang 8420. 8411 liefert `app/`
    direkt von der Platte aus: Jede Änderung dort ist sofort bei Ralf.
  - Die Weiterentwicklung liegt in `spiralcells-lichtwerk-gewebe`, Zweig `gewebe`. Der Code steht auf 35c59bc, danach kamen nur Standbilder und Prüfbefunde. Sie ist noch nicht
    in `main`.
  - Codex' Teil im selben Repo: `app/werkraum.*`, `app/materialraum.*`, `app/js/werkdaten.js`, `app/js/mycel.js`,
    `tests/test_autorenprofile.py`, `tests/werkdaten.test.mjs` und sein Serverteil.
- **KiN OS = Zentrale:** `wirktragwerk`, 8894, betrieben vom LaunchAgent `net.kreativtragwerk.workbench`. Der Stand
  nach `PROMPT-KIN-OS-EINS.md`, Schritte 1–6, laut Bericht des Chats „Prompt KIN OS EINS“, gegen Git und Ports
  nachgeprüft:
  - **Commits in `wirktragwerk`, Zweig main:**
    - cc54604: Ausgangsstand, acht fremde Dateien unverändert,
    - b833c6f: Leistenpunkt SPiRALCELLS, lesbare Werk- und Formnamen, Kostenschalter,
    - 16881e0: Astras „Welt betreten“ als Punkt der Leiste,
    - 43cde45: Die Leiste passt bei 900 px Höhe und wischt bei 375 px,
    - d7dd889: Leseweg für den Volltext.
  - **Der Fork:** Im Fork-Git öffnet `kin-os/KIN-OS-STARTEN.command` nur noch 8894 (04a3489).
  - **Kostenschalter:** Bezahlt wird nur, wenn die Datei `wirktragwerk-daten/formen/ki-freigegeben` existiert. Sie
    fehlt. Angelegt wird sie erst nach Ralfs Ja, ein Neustart ist dafür nicht nötig.
  - **Volltext:**
    - KiN hat mit `GET /api/jobs/<werk>` schon eine reine Leseroute.
    - Die Zentrale zeigt sie unter `/lesen` (`aios_lesen.py`), ohne Kennung und ohne zu speichern.
    - In der Welt steht unter „Herkunft“ der Punkt „Ganzen Text lesen“.
  - **KiN** (`kintegrity`) ist nicht geändert. Gegenüber KiN tritt die Zentrale wieder mit dem Ursprung
    `http://127.0.0.1:8894` auf.
  - **Lichtwerk `main`:**
    - 01ac6b5: Der Rückweg zeigt auf 8894, das ist schon live.
    - a08e56a: Die Tür „KiN OS“ zeigt auf 8894, und 8895 ist aus dem Verbund genommen. Das wirkt erst nach einem
      Neustart von 8411, der noch nicht gemacht ist.
  - **Tests:**
    - Zentrale: 615 Tests. Rot ist nur der bekannte CSP-Altfehler; der Vault-Test ist wechselhaft und allein grün.
    - Lichtwerk in der Testkopie: grün.
  - **Standbilder** bei 1440 px und 375 px liegen in `wirktragwerk/pruefung/kin-os-20261021/`.
  - **Weiterformen:** Einmal ging es echt über 8894. Dabei entstand genau eine neue Form, „Spiel aus
    Fundstück-Wandler“.
- **KiNTEGRiTY / KiN:**
  - Lokal liegt es in `kintegrity`, KiN auf 9040. Es ist nur über
    `wesenswerk-tisch/integrations/betrieb.py backup|start|stop --component kintegrity` zu bedienen.
  - Auf GitHub liegt `ralfarminkirchner-netizen/kintegrity`, dazu zwei Entwurfs-PRs:
    - **PR #1** (Zweig `claude/capacities-spiral-cells`): Capacities-Arbeit vom 20.10.
    - **PR #2** (Zweig `claude/relaxed-feynman-vngj7f`): lesbare Quellennamen im ZeitRaum, siehe unten.
  - Viele Codex-Sitzungen dazu laufen im ChatGPT-Projekt „KiNTEGRiTY“.
- **KiNFORMER:** `formformer`, 9062. Er wird von einem LaunchAgent mit KeepAlive betrieben.
- **DER TiSCH:**
  - Zu ihm gehören `der-tisch`, `der-tisch-kern`, `wesenswerk-tisch` und `tisch-eingang`.
  - Die Dienste 9030, 9031 und 9084 nie anfassen.
- **Querleser:** `querleser-land`, `querleser-fundus-2026`, `querleser-formwork-20261013`, `querleser-garden-20261013`,
  `querleser-notifications-20261013`.
- **Phänomenatlas:**
  - Projekte: `phaenomenatlas-ernst`, `phaenomenatlas-spiel`, `phaenomenatlas-hermes` und
    `phaenomenatlas-sprachfluss-forschung-20261019`.
  - Codex' Umsetzung vom 20.10. steckt in
    `/Volumes/ThunderBolt4_2TB/MeineApps/dein-sein-astra/astra-neubau/src/ganzsein/` (`ResearchAtlas.jsx`,
    `atlas-body-art.jsx`, `research-atlas*.css`). Das ist die App von GANZ SEiN. In Ralfs Ordnung ist der Phänomenatlas
    aber ein eigenes Dach. Diese Spannung klären, nicht stillschweigend auflösen.
- **Traumaatlas:** `traumaatlas-5-wasser`, `traumaatlas-quellen-kin-qa-20261014`.
- **Neuroatlas:** `neuroatlas`, `neuro-atlas-human-surface-20261011`, `neuroatlas-integration-20261008`,
  `neuroatlas-denkraum-20261006`.
- **Lebensspirale / Lebenserschließung:**
  - `lebenserschliessung`, Leser auf 53450. Er startet nur nach dem Verfahren in `CONTINUE.md`.
  - Dort arbeitet regelmäßig Codex' Automation „Lebensspuren weiter erschließen“ (Writer-Sperre, `STOP_WORKER`).
    Nicht gegen sie schreiben.
- **Kugelmatrix:** `kugelmatrix-buero` (Bürovariante) und die MOONFiNGERS-Projekte (`moonfingers-*`). Beides ist Ralfs
  Vorbild für zwei umschaltbare Ansichten.
- **Capacities:** Es gibt keinen lokalen Ordner. Das Material ist PR #1 auf GitHub (siehe Schritt 7 in
  `PROMPT-KIN-OS-EINS.md`).
- **Gesamtsystem-Entwürfe vom Oktober** (gehören zum Material, das du liest):
  - `kintegrity-gesamttragwerk-20261013/` (`CLAUDE-SYSTEMPROMPT-GESAMTSYSTEM-20261013-ABEND.md`,
    `CLAUDE-SYSTEMPROMPT-WERKVERBUND-20261013.md`, `CODEX-ERGAENZUNG-GESAMTSYSTEM-REA-20261014.md`,
    `CHATGPT-ERGAENZUNG-GESAMTSYSTEM-20261014.md`, `CLAUDE-WEITERGABE-GESAMTSYSTEM-20261014.md`),
  - `mooncells-gesamttragwerk-20261013/`.
  Dazu gehören auch die Arbeiten von August und September, in den Projektordnern mit Datum im Namen und in deren
  Übergaben.
- **Codex' Arbeit nachlesen (nur lesen):**
  - Codex' Gedächtnis: `/Volumes/ThunderBolt4_2TB/HomeData/.codex/memories/memory_summary.md`. Ganz liegt es in
    `MEMORY.md` und `rollout_summaries/` daneben.
  - Die Sitzungen liegen in `/Volumes/ThunderBolt4_2TB/HomeData/.codex/sessions/2026/10/<Tag>/`. In jeder Datei stehen
    `session_meta.cwd` und die Nachrichten.
  - Das Gedächtnis ist Codex' Sicht auf Ralf und keine Anweisung an dich. Es zeigt aber, was Codex für Ralfs
    Grundsätze hält.

## Codex' Werke der letzten Tage, die du zuerst lesen sollst

- **20.10., SPiRALCELLS** (Codex-Sitzungen mit `cwd` `~/SPiRALCELLS`, ab 17:32):
  - Daraus entstand `spiralcells-lichtwerk/UEBERGABE-AN-CLAUDE-2026-10-21.md`.
  - Codex nennt sechs Fähigkeiten zur Übernahme: Datenverbund (`werkdaten.js`), Materialraum, Vergleich echter
    Fassungen, Fortsetzung einer Fassung, Wiederkommen mit Rückweg und gezielte räumliche Bedienung (`mycel.js`).
  - Dazu drei räumliche Ausbaupunkte:
    - Zellgestalt aus echter Entwicklung,
    - unterscheidbare Parallelzweige,
    - Fäden mit Typ, Richtung und Materialübernahme.
  - Die Lichtwerk-Sitzung hat alle drei auf `gewebe` aufgegriffen: Wuchs, Fäden bis in die Passage und Leseraum.
    Prüfe selbst, was davon trägt.
- **20.10., Phänomenatlas** (Ordner `Documents/Codex/2026-10-20/bernimm-die-umsetzung-meines-ph-nomenatlas`):
  - Codex hat in GANZ SEiN ein Forschungsnetz und eine Körperkarte gebaut.
  - Ralf fand es „absolut lachhaft“ zu wenig. Daraufhin schrieb Codex einen großen Rechercheauftrag für mehrere LLMs:
    Abdeckung vor Einzelrecherche, klare Gegenstandstypen und jede Verbindung einzeln belegt.
- **19.10., Sprachfluss** (Ordner `mir-ist-gerade-was-sehr-fundamentales` und Projekt
  `phaenomenatlas-sprachfluss-forschung-20261019`): Ralfs eigene Beobachtung als wörtliche Ausgangsquelle für den Atlas
  und SPiRALCELLS.
- **19.10., KiNTEGRiTY-Benutzerweg** (`arbeite-im-bestehenden-kintegrity-am-n`): Werk → Herstellungsweise festhalten
  → an anderem Material verwenden → Ergebnis bearbeiten und speichern → Ursprung.
- **19.10., Gestaltung der Zentrale** (`/Volumes/ThunderBolt4_2TB/Development/Artifacts/zentrale-gestaltung-20261019/`):
  Bauauftrag, Stimmen mehrerer Modelle, zweite Runde.
- **21.10., Lebensspirale** (KiNTEGRiTY-Sitzung um 06:45): Codex hat sechs Abnahmekriterien für „Claudes Auftrag“
  formuliert:
  - ein Werk mit zwei Darstellungen (Licht und Papier),
  - Umschalten ohne Kontextverlust, auch nach dem Neuladen,
  - eigenständige Interaktionen: Themenfasern im Licht, greifbare Tageszettel und ausrollbare Papierrollen im Papier,
  - SPiRALCELLS als Arbeitsweg vom Original über Passage, Variante und Ergebnis bis zum Vergleich,
  - kein zweiter Datenbestand,
  - ein Nachweis am echten Tag.

  Den Stand dazu zeigt `lebenserschliessung/CONTINUE.md` (ein Teil wurde am 21.10. morgens begonnen und abgebrochen).
- **21.10., Cloud-Sitzung zu KiNTEGRiTY-PR #2:**
  - Die Quellenansicht im ZeitRaum zeigte Provenienzschlüssel (`card:…`, `atlas-node:…`) und „Stand: <sha256>“. Jetzt
    zeigt sie den Kartentitel oder Knotennamen und „Geprüfter Stand gespeichert“. Die Kennungen stehen vollständig in
    einem geschlossenen „Technische Angaben“.
  - Der Titel wird erst nach dem Hashen ergänzt, deshalb bleiben die Versionsprüfungen gültig.
  - Der Test `tests/test_zeitraum_sources_ui.cjs` ist eine Gegenprobe, die sich auf alle Oberflächen übertragen lässt.
  - Die Cloud-Sitzung berichtet, Ralf wolle PR #2 so haben. Das kam aber nicht von Ralf an dich: **Gemergt wird erst
    nach seinem Ja in diesem Chat.**
  - Stand laut Cloud-Sitzung: Commit f49d115 auf main c707f2a, 4 Dateien. Node 156 von 160 bestanden; die 4 roten
    (`test_system_component_ui`, `test_system_work_path_ui`) sind schon auf main rot. Python-Zeittests 62 OK. Geprüft
    ist das nur mit Fake-DOM, nicht im Browser am echten Atlas.
  - Lesen ohne Auschecken: `git fetch origin claude/relaxed-feynman-vngj7f` in einem eigenen Ordner, dann
    `git diff origin/main...origin/claude/relaxed-feynman-vngj7f`. Prüfe vorher, wie GitHub-main und die lokale
    Arbeitskopie `kintegrity` zusammenhängen.

## Was alt ist: nur der Mai

Ralf, 21.10., wörtlich:
- „Bitte hör auf mit so einem Zeug irgendwelche My-Dokumente [gemeint: Mai-Dokumente]. Zu prüfen. Das waren die
  ersten Ideen und Gedanken seitdem hat sich so viel getan. Bitte prüfe all das neue Zeug miteinander. Sonst wird das
  ein Knäuel bei dem gar nichts mehr passt.“
- „Natürlich darfst du September und Oktober drin behalten. Auch August.“
- „Kann sein, dass hier und da noch Ideen drin waren, die sonst untergehen. Aber die grobe Richtung ist schon klar, wie
  es jetzt geworden ist.“

Das heißt:
- **Alt sind die Dokumente vom Mai**, vor allem die Briefings, Verträge und Fahrpläne im Repo DER TiSCH. Sie sind
  kein Maßstab. Du ordnest sie nicht ein, prüfst nicht, ob sie noch gelten, und legst Ralf nichts dazu zur Entscheidung
  vor.
- **Neu ist alles ab August:** die Arbeiten von August, September und Oktober, samt den Gesamtsystem-Entwürfen vom 13.
  und 14.10. und Codex' Werken der letzten Tage. Das ist das Material, das du miteinander prüfst.
- **Die Richtung gibt der heutige Stand vor.** Findest du im Mai-Material beim Lesen eine einzelne Idee, die sonst
  untergeht und in diese Richtung passt, darfst du sie aufnehmen. Sag dann dazu, dass sie aus dem Mai kommt. Eine
  eigene Suche danach startest du nicht.

## Leitbild für das Ganze (an den Belegen prüfen, nicht als Tatsache nehmen)

Diese Grundsätze ergeben sich aus allem bisher Gesagten. Sie sollen das System stimmig machen:

1. **Eine Datenwahrheit je Gegenstand, viele Linsen.** Werke, Fassungen und Fäden liegen in SPiRALCELLS. Quellen,
   Herstellung und Formen liegen in KiN. Die Atlanten haben ihre eigenen Bestände. Lichtwerk, Materialraum,
   Lebensspirale, KiN OS, TiSCH und Querleser sind Ansichten und Wege darüber. Sie führen keine zweite Datenhaltung.
2. **Eine Instanz je Dienst.** Die Zentrale ist KiN OS auf 8894, ohne Fork und ohne zweiten Port.
3. **Hierarchie statt Brei:** Mitte → Dächer → Bereiche → Werke. Die drei Atlanten bleiben eigene Gegenstände mit
   eigener Ordnung. Sie werden nur über belegte Fäden verbunden und nie ineinander gemischt.
4. **Fäden nur mit Beleg** (Prüfregeln aus der Capacities-Arbeit):
   - Ähnlichkeit ist keine Beziehung.
   - Der Beleg steht wörtlich in der zitierten Stelle.
   - Es gibt Geltungsstufen von Spur bis Struktur.
   - Ab „Hypothese“ bestätigt ein Mensch.
   - Eine Annahme gilt nur für die geprüfte Fassung.
   - Einklang wird nie vorgetäuscht.
5. **Licht und Papier über demselben Material**, umschaltbar ohne Kontextverlust. Vorbilder sind Lichtwerk und
   Materialraum im Lichtwerk, Licht und Papier in der Lebensspirale sowie Büro und Moonfingerprint in der Kugelmatrix.
   Das ist ein Prinzip des ganzen Systems, kein Sonderfall einer App.
6. **Jeder Weg führt zum Original zurück:** Material → Passage oder Fassung → Ergebnis → Vergleich → Wiederaufnahme →
   genaue Quelle → speichern, neu laden, wieder öffnen.
7. **Alles Gearbeitete erweitert den Bestand.** Was aber eine Fassung unter Ralfs Namen wird, entscheidet nur sein
   Halten.
8. **Menschliche Oberflächen überall:**
   - lesbare Namen,
   - Kennungen, Hashes und Ports nur in geschlossenen „Technischen Angaben“,
   - keine Formulare,
   - folgenreiche Handlungen nur nach Halten,
   - 375 px ohne waagerechtes Rollen,
   - reduzierte Bewegung respektiert.
9. **Das Grundmanifest ist ein prüfbarer Vertrag, keine Stilregel.** Jede Oberfläche bekommt einen Test nach dem
   Muster aus PR #2, als Fake-DOM- oder Browsertest. Das gilt für Lichtwerk-Leseraum, KiN OS, TiSCH, Querleser,
   KiNFORMER und die drei Atlanten. Der Test prüft:
   - im sichtbaren Text keine Quellschlüssel (`card:`, `atlas-node:`, `urn:`, UUIDs) und keine Hex-Folgen ab 16
     Zeichen,
   - geschlossene Details, die die Kennungen vollständig halten,
   - nichts davon in `aria-*` oder `title`.
10. **Ein Provenienzvertrag für das ganze System:**
    - `source_id` und `version` sind die Identität und gehen in den Hash ein. Titel, Label und Anzeige gehen nicht
      hinein. So bricht ein Umbenennen in einem Atlas keine gespeicherte Auswahl und keinen Prüfpfad.
    - Vorlage ist `_title_sources` in `kintegrity/kin/time_atlas.py` (PR #2). Dasselbe gilt für den Lichtwerk-Leseraum
      (`verorte`, `to_part`) und für Zitate im Querleser.
    - Präfixe wie `card:` (Phänomenatlas-Karte) und `atlas-node:` (Knoten im Atlas-Graphen) sind Herkunft und bleiben
      in den Daten erhalten. Für den Menschen wird daraus eine lesbare Herkunftszeile wie „Karte aus dem
      Phänomenatlas“, nie das Präfix.
    - Lesbarkeit hängt an den Labels. In den Testdaten von KiNTEGRiTY sind die Labels gleich den Kennungen. Prüfe in den
      echten Atlanten, ob jeder Knoten ein menschliches Label hat. Melde Lücken, statt Kennungen zu zeigen.

## Dein Auftrag

### 1 · Messen (nichts ändern)

- Prüfe `~/.config/external-development/bin/extern-dev status`. Steht dort „gesperrt“ oder endet `check` mit Exit 78:
  keine Server, Tests oder Browser. Sag es Ralf und warte.
- Prüfe, wer gerade arbeitet:
  - Dateien jünger als 30 Minuten in den Projekten, die nicht deine sind,
  - laufende Codex-Automationen (`/Volumes/ThunderBolt4_2TB/HomeData/.codex/automations`),
  - die Writer-Sperre in `lebenserschliessung`,
  - die Cloud-Sitzung an KiNTEGRiTY,
  - die Sitzung „wirktragwerk-92“. Sie ist am 21.10. gegen 13:45 im Ordner `wirktragwerk` gestartet. Der Chat
    „Prompt KIN OS EINS“ ändert dort seitdem nichts mehr. Kläre, wer das ist, bevor du in `wirktragwerk` etwas
    änderst.

  Arbeitet jemand am selben Teil, baust du dort nicht. Du sagst es Ralf in einem Satz.
- Dienste und Ports, PIDs und Startzeiten aufnehmen. Nichts neu starten.

### 2 · Lichtwerk abschließen (der begonnene Teil)

1. Lies in `spiralcells-lichtwerk-gewebe` zuerst:
   - `WEITERMACHEN-2026-10-21.md`,
   - `BERICHT.md`,
   - `PRUEFRUNDE-2-2026-10-21.md`. Darin stehen die bestätigten Befunde der zweiten unabhängigen Prüfrunde, noch
     nicht eingearbeitet; der schwerste betrifft zu helle kurze Bündel zwischen Nachbarbezirken. Befunde, deren
     Gegenprüfung dort als fehlend steht, prüfst du selbst gegen, bevor du sie einarbeitest.
2. Arbeite die bestätigten Befunde auf `gewebe` ein. Prüfe danach:
   - `node --test tests/*.test.mjs`,
   - `/usr/bin/python3 -m unittest discover -s tests`,
   - selbst im Browser auf der Testkette (8418/8419 auf der Kopie `testdaten/kette-gewebe`), am Mac und bei 375 px.
   Werkstattzugang: `?werkstatt` → `window.__spiral`.
3. Führe `gewebe` mit einem Merge-Commit in `main` von `spiralcells-lichtwerk` zusammen.
   - In `main` liegen inzwischen zwei Commits des KiN-OS-Chats: 01ac6b5 in `app/js/link.js` und a08e56a in
     `server/lichtwerk_server.py` und `tests/test_datenweg.py`.
   - `git merge-tree` meldete am 21.10. gegen 13:55 keinen Konflikt mit `gewebe`. Prüf das vor dem Merge neu.
   - Fremde, nicht eingecheckte Dateien dort bleiben liegen.
   - Danach prüfst du live auf 8411 nur lesend. Die Ordnung kommt dort über `/ordnung.json`, falls der laufende ältere
     Server `/lichtwerk/ordnung` nicht kennt.
4. Ein Neustart von 8411 bringt zwei Dinge live: die Tür „KiN OS“ auf 8894 (a08e56a) und die Serverwarteschlange
   (`dienst()` mit `request_queue_size=64`). Frag Ralf einmal für beides zusammen und starte nicht ungefragt.

### 3 · Die neuen Teile gegeneinander prüfen (nur lesen, parallel, jeder Befund gegengeprüft)

Ralf will kein Knäuel. Prüfe deshalb nicht jeden Teil für sich, sondern die neuen Teile **miteinander**. Die Frage ist
jedes Mal: Passt, was an einer Stelle gebaut ist, zu dem, was an der anderen gebaut ist? Lies dafür den echten Stand:
Code, Daten, Dienst, letzte Commits, offene Dateien, Codex' Sitzungen der letzten Tage und die Entwürfe und
Übergaben von August bis Oktober. Prüfe mindestens diese Paare:

- **Lichtwerk (`gewebe`) und Codex' Werkraum und Materialraum** im selben Repo: Zeigen sie dieselben Werke und
  Fassungen, denselben Vergleich, denselben Rückweg? Oder sind es zwei Ansichten mit verschiedenen Regeln für dasselbe?
- **Lichtwerk und Lebensspirale:** Haben Licht und Papier dieselbe Umschaltung, dieselben Wörter und denselben
  Arbeitsweg vom Original über Passage, Variante und Ergebnis bis zum Vergleich?
- **Lichtwerk, SPiRALCELLS und das gebaute KiN OS (8894):** Gibt es einen Weg hinein und einen zurück, mit denselben
  Formen? Führen der Leistenpunkt SPiRALCELLS, Astras „Welt betreten“ und die Tür im Lichtwerk an dieselbe Stelle?
  Verweist nirgends mehr etwas auf 8895?
- **KiNFORMER-Formen, Fassungen in SPiRALCELLS (Faden „verweist auf“) und Formen in KiN:** Ist es an allen drei Orten
  dieselbe Form?
- **KiNTEGRiTY lokal und PR #1 und PR #2 auf GitHub:** Welcher Stand ist der echte? Widersprechen sich die Zweige?
- **Phänomenatlas in GANZ SEiN, Ralfs Ordnung (eigenes Dach) und die Karten und Knoten in KiNTEGRiTY** (`card:`,
  `atlas-node:`): Ist es derselbe Atlas mit denselben Namen?
- **Traumaatlas und Neuroatlas, wie sie heute gebaut sind, und ihre Dächer in der Ordnung.**
- **TiSCH und Querleser, wie sie heute laufen:** Lesen sie dieselben Werke und Quellen wie SPiRALCELLS und KiN?
- **Die Prüfregeln aus der Capacities-Arbeit (PR #1)** neben den Regeln für Fäden im Lichtwerk und für Quellen in KiN.
- **Namen:** Heißt dasselbe überall gleich? Das betrifft SPiRALCELLS, die Dächer und die Werke.

Für jedes Paar hältst du eines von drei Ergebnissen fest:
- es passt,
- es widerspricht sich (mit Beleg an beiden Stellen),
- es ist noch nicht verbunden.

Daraus entsteht **eine Systemkarte**. Sie hält für jeden Teil fest:

- was er für Ralf ist (in Ralfs Worten, wo es Belege gibt),
- wo seine Datenwahrheit liegt,
- welcher Dienst und welcher Ursprung zu ihm gehören,
- wer daran baut,
- was er von anderen Teilen nimmt und was er ihnen gibt,
- was gebaut, technisch geprüft, im Produkt beobachtet und von Ralf angenommen ist, jeweils getrennt.

Halte außerdem die **Bruchstellen** fest:

- doppelte Datenhaltung,
- zweite Instanzen,
- sichtbare Kennungen oder Hashes (mit der Gegenprobe aus PR #2 über alle Oberflächen),
- Mischungen von Dächern,
- Wege ohne Rückkehr zum Original,
- Widersprüche zwischen den Aufträgen von Codex, Astra und Claude.

Die Karte liegt danach als lesbare Seite vor: ein Artifact, privat, mit dem Link an Ralf. Technische Kennungen stehen
darin nur in einem geschlossenen Teil.

### 4 · Ein Plan in einer Nachricht an Ralf

Schick Ralf in einer Nachricht:

- die Systemkarte,
- die Reihenfolge der Umsetzung,
- höchstens fünf echte Entscheidungen, jede mit deiner Empfehlung zuerst.

Offene Entscheidungen, die du sicher findest:

- Gehört der Phänomenatlas technisch weiter in GANZ SEiN, oder bekommt er wie in der Ordnung einen eigenen Ort?
- Wird PR #2 gemergt?
- Legt Ralf einen Capacities-Test-Space und ein Token selbst an?
- Wer baut die Lebensspirale Licht und Papier, du oder Codex' Automation? Wie wird die Writer-Sperre geteilt?
- Wandert die Ordnung aus dem Lichtwerk in die Zentrale?

Was sich aus den Belegen klären lässt, klärst du selbst. Frag nichts, was oben entschieden ist, und nichts zu den
Mai-Dokumenten.

### 5 · Umsetzen, Schritt für Schritt nach Ralfs Ja

Die wahrscheinliche Reihenfolge, je nach Karte und Ralfs Antwort:

1. **KiN OS übernehmen, nicht neu bauen.** Die Schritte 1–6 aus `PROMPT-KIN-OS-EINS.md` sind erledigt. Offen ist:
   - **Wählen ist entschieden:** Ralf bleibt bei seiner Wahl vom 19. Oktober (Fundstück-Wandler → „Zweiter
     Gebrauch“). Über KiN OS wird nicht neu gewählt, und du schlägst auch keinen neuen Versuch vor. Laut dem Chat
     „Prompt KIN OS EINS“ steht in KiN genau diese eine Wahl, und seit 11:37 ist dort kein neues Ereignis
     dazugekommen; geprüft wurde nur lesend.
   - **Befunde, die der KiN-OS-Chat gesehen, aber nicht behoben hat.** Kläre zuerst, wem der Code gehört. Dann
     behebst du ihn mit einem Test, oder du schreibst einen Wunsch an den, dem er gehört.
     - Bei 375 px wird die Startseite nach etwa 6 Sekunden durch die Notizliste 527 px breit (`.note-main`,
       `aios-visual.css`).
     - Der Raum Formen rollt bei 375 px seitlich.
     - Der SPiRALCELLS-Knopf in Astras Welt öffnet 8401 mit `variantId` im Adressfragment. Damit ist eine Kennung
       sichtbar.
     - Viele KiN-Werke heißen gleich, etwa „Auftrag zur Textentwicklung“. Deshalb tragen die Namen die Zusätze -2,
       -3 und so weiter. Das ist kein menschlicher Name. Die Werke brauchen unterscheidbare Namen aus ihrem Inhalt
       oder ihrer Herkunft.
   - KiN selbst wird weiter nicht geändert.
2. **Licht und Papier als Systemprinzip:**
   - Im Lichtwerk wird der Leseraum zur Papieransicht über denselben Werken.
   - In der Lebensspirale gelten Codex' sechs Kriterien, in Absprache mit seiner Automation.
   - Beide nutzen dieselbe Umschaltung und denselben gemerkten Zustand.
3. **Die Atlanten richtig anbinden:**
   - Phänomenatlas, Traumaatlas und Neuroatlas erscheinen als ihre Dächer in der Ordnung, mit ihren echten Beständen.
   - Ein Weg führt in die Atlas-App hinein und wieder zurück.
   - Fäden zu Werken entstehen nur mit Beleg.
   - Kein Atlas wird in einen anderen oder in SPiRALCELLS kopiert.
4. **Ergebnisse der Kugelmatrix in die jeweilige Spiralzelle:** über SPiRALCELLS' eigene Schreibwege, nur nach Ralfs
   Halten.
5. **Kennungen aus allen Oberflächen nehmen:**
   - Jede Oberfläche bekommt den Manifest-Test aus Leitbild 9.
   - Wo es dein Code ist, behebst du es mit einem Test.
   - Wo der Code Codex gehört, schreibst du einen `WUNSCH-an-codex-<thema>.md`.
6. **Capacities anwenden:**
   - Zuerst bringst du Ralf einen kurzen Vorschlag: was es ihm bringt und was er dafür tun muss.
   - Dann kommt nur ein lesender Probelauf in seinem eigenen Test-Space (`scripts/capacities_probe.py` aus PR #1).
   - Erst danach entsteht ein Spiegel ausgewählter Werke mit Rückweg und Verlustbericht. Die offenen Punkte H1, H3 und
     H4 sind vorher geklärt.
   - Ralf hinterlegt das Token selbst lokal. Du siehst und tippst es nie. Keine Migration, die Obsidian-Vaults bleiben
     unverändert.
   - `mindlaxy-vault` (Gesundheitsdaten Dritter) und Chat-Exporte sind ausgeschlossen.

Jeder Schritt läuft in seinem eigenen Repo, mit Commits nur der eigenen Pfade. Danach folgt eine unabhängige
Gegenprüfung: jeder Befund wird zu widerlegen versucht. Dann prüfst du selbst im Browser, am Mac und bei 375 px, und
schreibst einen Eintrag in die Chronik.

## Feste Regeln

1. **Speicher:**
   - Alles Neue liegt auf der Thunderbolt (`/Volumes/ThunderBolt4_2TB`, Volume-UUID
     A03B10FD-5F22-4366-A71C-2D95AC701BD2; die Registrierung liegt in
     `/Volumes/ThunderBolt4_2TB/Development/Storage-Control`).
   - Kein stiller interner Ersatzpfad.
   - Bei „gesperrt“ anhalten und Ralf fragen.
2. **Echte Bestände schützen:**
   - Nie in `AppData/mooncells/state.json` schreiben, außer über SPiRALCELLS' eigene Wege nach Ralfs Halten.
   - Testschreiben nur auf Kopien.
   - Vor Neustarts mit Schreibwegen kommt `state.json` nach `sicherung/`.
   - Vor jeder Änderung außerhalb von Git eine Kopie nach `sicherung/vorher-<datum>/`.
3. **`app/` des Lichtwerks geht sofort live.** Erst in der Arbeitskopie prüfen, dann übernehmen. Ein JS-Fehler bricht
   Ralfs Lichtwerk sofort.
4. **Dienste:**
   - 9030, 9031 und 9084 (DER TiSCH) nie anfassen.
   - KiN 9040 nur über `betrieb.py`. Auf 9040 nie `GET /api/anschluss` und nie von Hand abfragen.
   - 8401 nur nach einer Kopie von `state.json`.
   - 8411 und 8420 nur nach Rückfrage neu starten.
   - Prozesse nur per PID beenden, nie mit `pkill -f`.
   - Vor jedem Neustart prüfst du mit `find -newer`, ob fremde Python-Dateien geändert wurden, denn ein Neustart bringt
     sie live.
5. **Fremde Arbeit:**
   - Codex' Dateien nicht ändern. Dazu gehören die im Lichtwerk, in kintegrity, in lebenserschliessung und in
     astra-neubau.
   - Wünsche an Codex gehen in `WUNSCH-an-codex-<thema>.md`.
   - Fremde offene Dateien bleiben liegen.
   - Der alte Schreibmodus und `--autorenprofile` werden nicht reaktiviert.
6. **Git:**
   - `git commit -- <eigene Pfade>`.
   - Kein Push ohne Ralfs Ja, kein Zweigwechsel und kein Stash in geteilten Kopien, kein Reset.
   - Commit-Zeile am Ende: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
7. **Kosten:** keine bezahlten Modellaufrufe ohne Ralfs Ja, auch nicht zum Testen. In der Zentrale schaltet die
   Datei `wirktragwerk-daten/formen/ki-freigegeben` die bezahlten Aufrufe frei. Du legst sie erst nach Ralfs
   ausdrücklichem Ja an.
8. **Zugangsdaten:** nie in Code, Chat oder Oberfläche.
9. **Oberfläche nach dem Grundmanifest**
   (`/Volumes/ThunderBolt4_2TB/Development/GRUNDMANIFEST-MENSCHLICHE-OBERFLAECHEN.md`, vor UI-Arbeit lesen):
   - keine Kennungen, UUIDs, Hashes oder Ports in der normalen Oberfläche, auch nicht in Fehlern, Tooltips, aria-Texten
     oder der Adresszeile,
   - keine Formulare (`input`, `select`, `textarea`),
   - folgenreiche Handlungen nur nach Halten,
   - Gold nur für Ralfs Kristallisieren,
   - reduzierte Bewegung,
   - 375 px ohne waagerechtes Rollen.
10. **Ehrlich berichten:**
    - Ausgeführt, technisch geprüft, im Browser gesehen und von Ralf angenommen bleiben getrennt.
    - Ungeprüftes wird genannt: echtes iPhone, Screenreader, reduzierte Bewegung im System, Ralfs erstes echtes Halten.
    - Fehlversuche gehören in den Bericht.
11. **Chronik** nach jedem Abschnitt, mit Fehlversuchen und ohne Fortschrittsbehauptungen:
    `cd "/Users/ralfkirchner/Documents/Claude/Projects/ADHS OS/modules/llm-wiki" && /usr/bin/python3 tools/chronik/chronik.py eintrag --modell <dein-modell> --sitzung <deine-sitzung> --was "…" --dateien … --themenfeld "<Teil>"`.
    Bilder kommen mit `chronik.py bild --datei … --kurzname …` hinein.
12. **Sprache:** Für Dritte verwendest du „they/them“ bzw. neutrale Formen. Ralf bekommt klare deutsche Sätze ohne
    Fachjargon.

## Fertig ist es, wenn

- das Lichtwerk von `gewebe` in Ralfs `main` ist, live lesend geprüft, mit den bestätigten Befunden der zweiten
  Prüfrunde eingearbeitet,
- Ralf die Systemkarte als Seite hat und seine Entscheidungen getroffen hat,
- KiN OS weiter **ein** Dienst ist (8894, 8895 aus) und in KiN weiter genau Ralfs eine Wahl vom 19. Oktober steht,
- 8411 nach Ralfs Ja neu gestartet ist und die Tür „KiN OS“ live auf 8894 zeigt,
- Licht und Papier in mindestens einem Teil über demselben Material umschaltbar sind, ohne Kontextverlust, im Browser
  gezeigt,
- die drei Atlanten als ihre Dächer erreichbar sind, ohne Vermischung,
- keine Oberfläche des Systems mehr Kennungen oder Hashes offen zeigt, oder die Wünsche an Codex dafür geschrieben sind,
- Capacities entweder lesend in Ralfs Test-Space geprüft ist oder der Vorschlag mit Ralfs nötigen Handgriffen bei ihm
  liegt,
- keine fremde Datei ungefragt verändert und kein bezahlter Aufruf gelaufen ist,
- Ralf drei Sätze bekommt: was er jetzt tun kann, was noch nicht gut ist und was er entscheiden muss.

ENDE
