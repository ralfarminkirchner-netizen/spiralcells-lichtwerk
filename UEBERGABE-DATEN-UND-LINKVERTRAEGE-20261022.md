# Daten- und Linkverträge für die Zusammenführung

22.10.2026 · Codex · Übergabe gemäß der Absprache ab 15:40.

## Zuständigkeit und gesicherter Stand

Claude übernimmt Gestalt und Raum, die Zusammenführung mit `alsformen` sowie Konflikte in gemeinsamen Dateien. Ralf entscheidet nach Ansicht der Varianten. Dieser Zweig enthält ausschließlich lesende Daten-/Linkverträge und Tests. Er trifft keine Gestaltungs- oder Veröffentlichungsentscheidung. KiNTEGRiTY und seine Ausführer bleiben bei der gesonderten Codex-WORK-Sitzung.

- Arbeitskopie: `/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-vertraege`
- Zweig: `codex/lichtwege`, Ausgangspunkt `f9f399ae7643b75d0802a9e28f8069acc4ee9ac5`
- Vertragscommit: `2256c69` (acht Dateien)
- Der kanonische Live-Checkout bleibt unbereinigt erhalten. Kein Merge, Reset oder Commit seiner fremden Änderungen wurde ausgeführt.
- `haupt.js`, `bedienung.js`, `stil.css` und `lichtwege.js` gehören nicht zu diesem Commit. Die dort vor der Absprache entstandene Codex-Gestalt bleibt ein gesonderter, unangenommener Vergleichsstand. Codex verändert diese Gestalt nach der Absprache nicht weiter.

## Anschlussstellen

`app/js/zusammenhang.js` projiziert ausschließlich vorhandene Graphdaten:

- `teilnahmen(B, werkId)`: fachliche Teilnahme, Begründung, tatsächlicher Akteur, Geltung, Rücknahme und verwendete Fassung.
- `entstehung(B, werkId)`: belegte Originalspuren, Weiterverwendung, spätere Deutung, Gegenbefunde, Vorschläge und Lücken. Ereignis-, Aufzeichnungs- und Deutungszeit bleiben unterscheidbar.
- `ursprung(v)`: streng gebundener Reader-Rückweg. Quelle, Revision, genaue UTF-16-Passage und vorhandene Werkfassung müssen zusammenpassen. Keine Standardquelle und kein stiller Wechsel auf den neuesten Stand.

`app/js/link.js` ergänzt `fassungsnamen(mond)` und `fassung(mond, slug)` sowie feste `fassung` und `blick=geschichte` in `bau`/`lies`. Lesbare Fassungsnamen führen auf genau eine tatsächliche Variante. Mehrdeutige oder ungültige Links ergeben keinen Ersatztreffer.

`app/js/vault-quellen.js` bietet `await bindeVaultquellen(daten, lesen)`. Der Aufruf ergänzt nur flüchtige `reader_source`-Bindungen an bestehenden Vault-Varianten. Er lässt `source_ref` unverändert, importiert nichts und schreibt keinen Bestand. Ein möglicher Aufruf am vorhandenen Graph-Leseeingang lautet:

```js
const gebunden = await bindeVaultquellen(daten, schreib.lesen);
W.B = bestand(gebunden);
```

Claude entscheidet über die Einbindung in seine vorhandenen `quelle.js`-/Alsformen-Wege. Der Vertragszweig enthält den visuellen Aufrufer absichtlich nicht.

`server/lichtwerk_server.py` stellt den fest auf den lokalen Reader begrenzten GET-Proxy `/lichtwerk/vault-source?path=…&content_sha256=…` bereit, auch am reinen Leseeingang. Kein freier Zielhost, Import oder Schreibaufruf.

## Tatsächlicher Vault-Umfang und Reader-Abhängigkeit

Die acht im Mooncells-Bestand gefundenen Vault-Verweise gehören zum **ADHS OS VAULT**. Daraus folgt keine vollständige Anbindung des persönlichen MiNDLAXY-Vaults. Ein gültiger Rückweg benötigt den registrierten Pfad, den ursprünglichen SHA-256 und einen bereits vorhandenen vollständigen Research-Snapshot derselben Fassung. Der aktuelle Dateistand wird zusätzlich und getrennt ausgewiesen. Fehlende oder abweichende Quellen werden nicht ersetzt.

Die dazu korrigierten Reader-Dateien liegen im kanonischen `lebenserschliessung`: `web/research_search.py`, `web/serve.py`, `web/werkbank.py`, `tests/test_research_vault_source.py`. Ihre Vorherkopien, der Patch und die Prüfkommandos stehen in `/Volumes/ThunderBolt4_2TB/Development/Artifacts/lichtwerk-vault-rueckweg-20261022/`.

Prüfweg: API-Lauf für alle acht vorhandenen Vault-Verweise ausgeführt; Schritt 4 zusätzlich für „Ein Inhalt, viele Verwendungen“ / „Name · MiNDSOURCE“ sichtbar samt Reload geprüft. Die übrigen sieben Verweise sind damit technisch, nicht jeweils sichtbar geprüft:

1. Reader: `GET /api/research-vault-source?path=<ursprünglicher Vault-Pfad>&content_sha256=<ursprünglicher Hash>`.
2. Lichtwerk: dieselben Parameter an `/lichtwerk/vault-source`; Antwort und Bindung vergleichen.
3. Reader: `GET /api/werkbank/varianten?source=<JSON der Antwortquelle>` muss die tatsächlich passende vorhandene Vault-Werkfassung liefern.
4. Die zurückgegebene `source_ref.locator` mit `fassung=<tatsächliche Varianten-ID>` öffnen. Quelle, gespeicherte Revision, Passage und Werktext im Reader überprüfen und nach Reload wiederfinden.

## Ausgeführt und technisch geprüft

- Vertragszweig: 29 gezielte Node-Prüfungen sowie fünf Python-Proxy-Prüfungen bestanden. `git diff --check` bestanden.
- Zwei zusätzlich versuchte ältere Prüfungen brauchen die unversionierte lokale `sicherung/`. In der sauberen Arbeitskopie fehlte diese Voraussetzung; sie sind dort nicht grün belegt. Keine Tests oder Sicherungen wurden dafür verändert.
- Reader und Proxy: 46 gezielte Tests bestanden, einschließlich Quellenbindung, gebundener Modellwerke und vorhandener Autorenprofile. Isolierte Testdaten sind kein sichtbarer Bestandsnachweis.
- Protokolle: `/Volumes/ThunderBolt4_2TB/Development/Artifacts/lichtwerk-alsformen-20261022/vertragszweig-node-gezielt.txt`, `vertragszweig-python-gezielt.txt`; zusätzlicher Reader-Nachweis: `…/lichtwerk-vault-rueckweg-20261022/patch-and-tests.json`.

## Sichtbare Nachweise und konkrete offene Grenze

Vor dem neuen Vault-Resolver wurde im vorhandenen Browser der Alsformen-Fall vom Lichtwerk in den Reader geöffnet: dieselbe gespeicherte Werkfassung, Originalstelle und Quellenrevision blieben nach Reload erhalten. Kontextwechsel, Mond-/Planetenfokus und Entstehungsansicht wurden auch bei 360 Pixeln geprüft. Das sind Nachweise des Codex-Vergleichsstands, keine Prüfung von Claudes neuem Gestaltstand und keine menschliche Annahme.

Die frühere Startverweigerung mit Exit 78 ist als damalige Grenze erhalten, inzwischen aber überwunden: Nach frischer Freigabe durch `extern-dev run` wurden die eindeutig zugeordneten Reader- und Lichtwerk-Prozesse kontrolliert neu geladen. `runtime-reload.json` im Artefaktordner `lichtwerk-vault-rueckweg-20261022` belegt den Reader auf 53450 mit Arbeitsverzeichnis `lebenserschliessung` und Lichtwerk auf 8411/8420 mit Arbeitsverzeichnis `spiralcells-lichtwerk`, jeweils mit bereitem Dienst.

Der anschließende rein lesende API-Lauf ist in `runtime-vault-readback.json` belegt: Alle acht vorhandenen ADHS-Vault-Varianten wurden mit derselben gespeicherten Quellenrevision, genauer Originalpassage und ihrer tatsächlich vorhandenen Werkfassung im Reader wiedergefunden. Auch der aktuelle Dateihash stimmte bei diesen acht Prüfungen mit der gebundenen Revision überein. Damit ist der neue Anschluss im laufenden Prozess technisch nachgewiesen.

Im tatsächlichen Lichtwerk wurde anschließend „Ein Inhalt, viele Verwendungen“ / „Name · MiNDSOURCE“ geöffnet und dessen Quellenlink benutzt. Der Reader zeigte den gebundenen ADR-0006-Text und die passende gespeicherte Werkfassung. URL, markierte Passage und Bindung blieben nach Browser-Reload erhalten. Beleg: `vault-reader-sprung.txt` unter `/Volumes/ThunderBolt4_2TB/Development/Artifacts/mooncells-alsformen-entstehung-20261022/`. Das ist ein sichtbarer Vault-Fall im Codex-Vergleichsstand; Claudes Stand auf 8418 wurde damit nicht geprüft.

Vor einem weiteren Neustart PID, Argumente, Arbeitsverzeichnis und Listener frisch prüfen. Keine zweite Instanz und kein Umgehen der Startprüfung.

## Native KiNFORMER-Weiterverwendung

Das bestehende Werk wurde in das vorhandene native Format übertragen:

`/Volumes/ThunderBolt4_2TB/Development/Artifacts/lichtwerk-alsformen-20261022/native/Gemeinsame-Gegenstaende-Teilnahmen-und-Entstehung.formformer`

Die Datei enthält sieben Materialien, beide wörtlichen Originalgedanken, zwei getrennte Codex-Beiträge und drei tatsächliche Werkfassungen. Sie wurde serialisiert, rückgelesen und über die bestehenden Restore-Funktionen technisch geprüft; 16 gezielte Tests bestanden. Der neue Übertragungsakteur ist als Codex gekennzeichnet. Historische fehlende Bindungen wurden nicht rückwirkend umgeschrieben. Details: `native/native-verification.json` und `native/native-return-bindings.json` im selben Artefaktordner.

Der tatsächliche Bedienlauf in der vorhandenen KiNFORMER-App auf 9062 ist ausgeführt: native Datei über „Projekt öffnen“ geladen, im sichtbaren Quellenwähler das Vergleichsprotokoll gewählt, im Modellmodus eine kenntlich gemachte Beobachtungsfrage ergänzt, als „Vergleichsprotokoll · Beobachtungsfrage · Codex“ festgehalten und über „Projektdatei sichern“ exportiert. Die exportierte Datei wurde erneut über den Dateidialog geöffnet. Über „Herstellungsweg“ / „Diese Fassung öffnen“ waren sowohl die frühere Fassung mit 4.057 Zeichen als auch die neue mit 4.432 Zeichen wieder erreichbar; der Modellakteur blieb erhalten.

Benutzbare neue Datei:

`/Volumes/ThunderBolt4_2TB/Development/Artifacts/lichtwerk-alsformen-20261022/native/Gemeinsame-Gegenstaende-Beobachtungsfrage-Codex.formformer`

Der tatsächliche Link „Zur gespeicherten Quelle im Leseraum“ öffnete im selben Browser-Tab die genaue Originalpassage und die verwendete gespeicherte Mooncells-Werkfassung. Nach Reload blieben Quellenrevision, Markierung und Werkfassung erhalten. Diese Rückbindung zeigt die verwendete Mooncells-Fassung mit 4.057 Zeichen. Die neue Bearbeitung mit 4.432 Zeichen liegt in der nativen Datei; sie wurde nicht erneut in Mooncells geschrieben.

Zusammengefasster Nachweis: `native/native-ui-verification.json` im Artefaktordner `lichtwerk-alsformen-20261022`; Rohbelege und tatsächlicher Browser-Download stehen in `kinformer-native-aenderung.txt`, `kinformer-native-download.txt`, `kinformer-native-wiederaufnahme-vergleich-sichtbar.txt` und `kinformer-native-reader-reload.txt` unter `mooncells-alsformen-entstehung-20261022`. Der Bedienlauf beansprucht weder einen Personenversuch noch menschliche Annahme.

## Übergabe an die Gestaltungszuständigkeit

Claude kann zuerst `codex/lichtwege` und anschließend seinen Alsformen-Zweig zusammenführen. Die sichtbare Einbindung und Konflikte in den gemeinsamen Gestaltdateien bleiben bei Claude. Danach ist der vereinte Stand tatsächlich zu öffnen und zu prüfen; Ralfs Auswahl zwischen den Gestaltständen bleibt offen. Keine Zusammenführung oder Veröffentlichung wurde vorweggenommen.

## Erhaltene Grenzen

`STOP_WORKER` bleibt gesetzt. Keine neuen Mooncells-Bestandswrites, Provider-Aufrufe, Logins, Kostenwege, Traumläufe, Personenprofile, Cloud-Uploads oder Veröffentlichungen. Keine Änderung am TiSCH, MiNDGESPRÄCH oder MiNDTREE-Tunnel. Keine menschliche Zustimmung oder unabhängige Claude-Bearbeitung wird behauptet.
