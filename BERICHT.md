# Bericht: SPiRALCELLS als Lichtwerk (Claude-Spur)

20.10.2026 · Claude, Systemleitung und Tragwerk · Ordner `Development/Projects/spiralcells-lichtwerk`

## Kurz

Das Lichtwerk „Spiral Cells“ ist jetzt die Arbeitsfläche über deinem echten SPiRALCELLS-Bestand. Du öffnest **SPiRALCELLS-STARTEN.command**, und es öffnet sich `http://127.0.0.1:8411/`. Zuerst siehst du den jüngsten Mond, in dem die Stimmen sprechen, heute „Zentrale · Material bekommt Form“. Seine Geschichte läuft einmal ab, dann lebt die Zelle. Hinauszoomen führt ins Netz der Werke mit allen 89 Monden, hinein in jeden Mond. Lesen, Kristallisieren, Verbinden und Ablegen gehen im Bild, ohne ein einziges Formular.

Geprüft habe ich das mit Standbildern, 13 Server- und 9 Datenmodell-Tests und dem ganzen Schreibweg in der Oberfläche, aber nur gegen eine Testkopie. **In deinen echten Bestand habe ich nichts geschrieben:** Das Lichtwerk-Protokoll zeigt keinen einzigen Schreibaufruf an SPiRALCELLS. `state.json` hat sich trotzdem verändert, denn Codex hat um 17:36 bis 17:38 Uhr über die API einen neuen Mond „KiN OS · Sichten“ angelegt (1 Mond, 2 Zweige, 3 Ausprägungen, 2 Kanten). Das Lichtwerk hat ihn von selbst übernommen und zeigt jetzt 89 Monde. Die Sicherung von vor meinem Start liegt in `sicherung/` (16:41 Uhr).

## Stand 21.10.2026: dein System als Zelle aus Zellen, Wuchs und Leseraum

Gebaut nach Codex' Übergabe vom Morgen, auf dem Zweig `gewebe`. Geprüft an einer Testkopie deines Bestands, nicht an deinem echten.

- **Deine Ordnung.** Das Netz zeigt dein System so, wie du es bestätigt hast.
  - In der Mitte steht die Zentrale mit den Stimmen und den Türen. Darum liegen neun Dächer als eigene Zellen: FASKA, Phänomenatlas, KiNTEGRiTY, MiNDLAXY, SEiN, Spiele und Welten, KlebensFroh, Text und Reim, ADHS OS.
  - Außen liegen die neun Werke, die noch ohne Dach sind. Durkheim und Radcliffe-Brown sind Lesematerial und hängen an SPiRALCELLS.
  - Zweimal tippen (oder Eingabe) fährt in ein Dach hinein. Dort stehen die Namen der Bereiche und Werke, Escape führt hinaus.
  - Die Ordnung steht in `app/ordnung.json`, im Lichtwerk und nicht in SPiRALCELLS. Ein Werk ohne Zuordnung bleibt sichtbar „ohne Dach“ und wird nie in ein geratenes Dach gesteckt.
- **Die eigene Entwicklung in jeder Zelle.** Jede Ausprägung hängt dort, wo sie herkommt:
  - an ihrer Vorgängerin im Zweig,
  - an der fremden Fassung, aus der ihr Zweig fortgesetzt wurde (eine Gabel mit kleinem Knoten),
  - an der Ausgangsfrage, oder frei, wenn keine Herkunft belegt ist.
  - Jede Ausprägung ist ein körniges Blatt, so lang wie ihr Stück der Abstammung und so breit, wie sie Text trägt. Die Ranken krümmen sich mit der Kopplung, eingerastet wird es golden wie bisher.
  - Gegenlese ist feines Gewebe über der Scheibe. Was eine Übernahme nur aneinandergereiht hat (etwa die 98 Fassungen in „FASKA Varianten“), bleibt eine leise Punktfolge und heißt nie Entwicklung.
  - Eine Verbindung, die erst später gezogen wurde, auch von dir, bleibt ein Faden und wird nie zur Herkunft.
- **Orientierung.** Die Marke sagt etwa „fortgesetzt aus „…“ (Claude) · 3. von 13 im Zweig“. Bei einer Auswahl leuchtet der Weg zur Ausgangsfrage silbern, nicht golden.
- **Fäden zwischen Werken** zeigen Typ und Richtung:
  - Übernommenes Material fließt als wandernde Lichter zur neuen Fassung, ein Verweis zeigt, Zugehörigkeit steht still, ein Widerspruch ist unterbrochen.
  - Ein Knoten in der Mitte ist anfassbar. Ist er heller, hat die Verbindung eine beschriebene Verwendung. F schaltet durch die Fäden.
- **Ins Material.** In der Lesefläche öffnet „Ganz lesen“ den Leseraum im selben Licht. Er zeigt den ganzen Text in Passagen.
  - Am Rand stehen die belegten Verwendungen genau dort, wo ihr Textanker wörtlich steht. Steht er nicht im Wortlaut, sagt der Leseraum das.
  - Ein Tipp auf eine Verwendung fliegt in die andere Fassung, an ihre Stelle, und „zurück zu …“ führt an deine Lesestelle zurück.
  - „Vergleichen“ legt zwei Fassungen nebeneinander. Das ist ein Textabgleich, kein Urteil.
  - Fassung und Stelle stehen lesbar in der Adresszeile, etwa `#mond=emile-durkheim&fassung=6&lesen=1&stelle=4`. Sie überstehen ein Neuladen.
  - ⌘V im Leseraum wird nach deinem Halten eine Weiterarbeit in deinem Zweig, mit den gelesenen Fassungen als „gesehen“.

**Geprüft:**
- **Tests:** 39 im Browser-Code und 53 am Server, alle bestanden.
- **Kritische Codeprüfung:** 43 Prüfer, jeder Befund gegengeprüft. 38 echte Fehler wurden gefunden und behoben, darunter Tastatur im Netz, Fokus, reduzierte Bewegung, Gold, Ehrlichkeit des Vergleichs und Formfehler in der Ordnungsdatei.
- **Im Browser an der Testkette:** Netz, Dach, Zellen, Auswahl, Kelch, Leseraum, Vergleich, Folgen und Rückweg, Neuladen, Handy 375 px. Der Schreibweg lief nur in der Testkopie.
- **Bilder:** Standbilder liegen in `standbilder/gewebe-*.jpg`.

**Nicht geprüft:** ein echtes iPhone, die echte Systemeinstellung für reduzierte Bewegung, ein Bildschirmleser, dein eigenes erstes Halten im echten Bestand.

## Stand 20.10.2026, 22:00 Uhr: SPiRALCELLS als Teil von KiN OS (Etappen 1 bis 5)

Gebaut nach `PROMPT-SPIRALCELLS-IN-KIN-OS.md` mit `BAUPLAN-SPIRALCELLS-IN-KIN-OS.md`, auf dein Ja von 20:18 Uhr. Live auf 8411 seit 21:52 Uhr.

- **Nur dein Halten schreibt.** Das Lichtwerk hat einen zweiten Eingang, der nur liest: `http://127.0.0.1:8420`. Codex' Werkraum und seine Sternwerft-Skizzen laufen im Betrieb dort; 8411 leitet sie hin. Dort kann keine Seite etwas ablegen, auch keinen Eintrag „Ralf“. Der Schalter `--autorenprofile` steht im Code und ist im Betrieb aus, der Werkstatt-Schalter ebenso.
- **Formen.** In der Lesefläche einer Textausprägung steht „Formen · ansehen · schreibt nichts“. Tippen zeigt die Richtungen, die der KiNFORMER gerade meldet: Plakat, Lesetuch, Karten, Schaubild, Spiel. Klang und Film stehen als Satz da. Die Form liegt auf einem Lichttisch über der gedimmten Zelle. Oben steht ehrlich, was erhalten blieb, etwa „11 Karten, jeder Satz eine.“ oder „Die ersten drei von 11 Sätzen, groß gesetzt.“. Unten läuft der Fassungsfaden: das Original, dann je Form eine Perle. ← → wechseln, Esc oder oben links führt zurück ans selbe Korn. An App-Zuständen steht stattdessen ein ruhiger Satz.
- **Behalten.** Hältst du „Behalten“ (auch mit H), wird die Form eine Fassung unter deinem Namen in deinem Zweig. Sie kommt mit einem zarten Faden „verweist auf“ zum Original, ohne „erweitert“ und ohne „remixt-aus“. Im Bild ist sie ein kleines papierhelles Korn mit Silberrand an der Speiche des Originals. Sie macht keinen Mond reifer, hebt keine Kopplung und bewohnt kein Traumfeld. Zweimal Halten legt nicht zweimal ab, und ein kurzes Halten schreibt nichts. Beim ersten Mal fragt das Bild nach deinem Eintrag „Ralf“, nur durch Halten.
- **Wiederkommen.** Beim Öffnen fliegen nur die Ausprägungen ein, die seit deinem letzten Besuch eingetragen wurden, in echter Reihenfolge. Dazu kommt ein Satz wie „Seit deinem letzten Besuch eingetragen: drei Ausprägungen von Codex und eine von Antigravity.“ Sonst steht still „Seit deinem letzten Besuch ist nichts dazugekommen.“ Im Netz tragen nur Monde mit Ankünften einen Ring. Deine eigenen Einträge und Formen gelten nie als neu, und Statuswechsel bleiben unsichtbar, bis SPiRALCELLS sie belegt.
- **Die letzten fünf, immer** (dein Wunsch vom Abend: „die letzten paar immer“). Auch wenn seit deinem letzten Besuch nichts kam, ist das Bild nie leer. Der Satz nennt den jüngsten Eintrag, etwa „Zuletzt eingetragen: „Sternwerft · Codex“ von Codex in „KiN OS · Sichten“, 20. Okt., 17:36.“. Die fünf jüngsten Einträge tragen einen leisen Ring, im Netz am Mond und in der Zelle am Korn. Echte Ankünfte seit deinem letzten Besuch leuchten weiter stärker. Deine eigenen Einträge und Formen zählen nicht dazu.
- **Hinein und hinaus.** Ein lesbarer Link wie `http://127.0.0.1:8411/#mond=emile-durkheim&von=sternwerft` führt in die Zelle, oben links steht „Zurück zur Sternwerft“. Die Adresszeile zeigt nie eine Kennung. Für KiN OS gibt es die Lesewege `/lichtwerk/neu` und `/lichtwerk/monde` (`ANDOCKEN-KIN-OS.md`).
- **Werkraum.** Im Netz gibt es eine stille Tür „Werkraum“, dazu die Taste W. Beide öffnen Codex' Werkraum nur lesend.
- **Nicht gebaut: KiN OS selbst** (Etappe 6). Der Folgeauftrag liegt in `PROMPT-KIN-OS-FORK.md`, mit einer erprobten Vorlage für den Leistenpunkt (`kinos-vorlage/`).

**Geprüft:**
- **Tests:** 53 Python- und 28 Node-Tests, alle bestanden (`protokolle/stand-tests.txt`).
- **Testkette:** Alle Schreibproben liefen nur auf einer frischen Kopie (8418/8419). Halten 0,5 s schreibt nichts, volles Halten genau eine Form und einen Faden, vier gleichzeitige Halten legen einmal ab.
- **Bedienung:** 375 px ohne waagerechtes Rollen, reduzierte Bewegung, keine Kennung in Adresse, Text oder Beschriftung (`standbilder/kritik-nachher/`, `standbilder/etappe45/`).
- **Kritikrunde:** Eine unabhängige Runde (Erstblick, Bedienung, Code; `protokolle/kritik-formen-*.md`) fand drei schwere Fehler, alle behoben. Die Lesefläche blieb hinter dem Lichttisch per Tab erreichbar. Das behaltene Korn strahlte wie Reife über fremde Speichen. Esc traf beim Siegel die falsche Ebene.
- **Echter Bestand:** Vor dem Neustart mit Behalten gesichert (`sicherung/state-vor-behalten-*.json`), seitdem unverändert. Kein bezahlter Aufruf. Codex' Dateien sind unverändert (`protokolle/codex-pruefsummen-vorher.json`, `-nachher.json`).

**Nicht geprüft:** ein echtes iPhone, die echte Systemeinstellung für reduzierte Bewegung und dein eigenes erstes Halten im echten Bestand. Dort gibt es noch keinen Eintrag „Ralf“. Die zweite Kritikrunde steht im Folgeauftrag.

## Was du siehst und was es bedeutet

| Bild | Daten |
|---|---|
| Keim in der Mitte, golden umringt | die Ausgangsfrage des Monds. Golden umringt heißt: Du hast sie kristallisiert (Zentrale: der gemeinsame Auftrag). |
| fünf farbige Köpfe mit eigener Bewegungsschrift | Claude orange, Codex blau, Hermes grün, Antigravity violett, Kimi rosa. Ein Kopf kreist nur, wo die Stimme etwas beigetragen hat. Beim Öffnen sagen die Köpfe kurz ihren Namen. |
| Lichtkörner auf Speichen | jede Ausprägung, so viel Licht wie Text. Jede Stimme legt auf ihre eigene Speiche. Die jüngste Ausprägung jeder Stimme leuchtet am hellsten. |
| Speichen verdrehen sich zur Spirale | so stark, wie die Stimmen einander **belegt** lesen (gesehen, selbst verbunden, befundet). Zentrale: 16 von 20 Paaren, Winkel 139,6°. Kimi hat noch keine Gegenlese und kreist darum frei für sich. |
| Einrasten bei 137,508°, Goldwelle, Vollmond | nur, wenn du eine Ausprägung kristallisierst. Hohe Kopplung bringt nur in die Nähe, nie hinein. |
| Mondphase der Hülle | Reife: frisch, gesichtet, gereift, kanonisch |
| von der Seite (S): ein Kelch | Geschichte, unten der Keim, oben das Jüngste, mit Tagesmarken |
| hinauszoomen (N): die größere Zelle | Netz der Werke. Monde mit Stimmen glühen, Ein-Stimmen-Monde stehen als Seesterne, stimmlose Monde liegen als loser Staub (Traumfelder). Oben die Türen zu Zentrale, KiNFORMER und KiN. |
| zarte Fäden | Kanten, fest bei ausgeführter Probe, zart bei Behauptung, unterbrochen bei „trägt nicht“ |

## Bedienung

- **Tippen** entfaltet eine Stufe: zuerst eine Marke am Licht, beim zweiten Tippen die Lesefläche (am Handy von unten, mit Griff zum Wegwischen).
- **Ziehen** dreht, **Rad oder Spreizen** zoomt, weit hinaus geht es ins Netz.
- **Halten** auf einer Ausprägung und Ziehen zu einer zweiten verbindet beide. Danach wählst du im Bild, wie sie zusammenhängen.
- **⌘V** oder **Ablegen** von Text wirft Material ein. Am Handy geht das über „Hierzu ablegen“ in der Lesefläche.
- **Kristallisieren**, Geprüft, Beiseitelegen: Jeder Statuswechsel braucht ein Halten (1,2–1,8 s). Bewegung, Loslassen oder ein Fensterwechsel bricht ab.
- Tasten: ← → wählen, Eingabe entfaltet, Esc geht eine Stufe zurück, S Seite, N Netz, 1–5 eine Stimme allein, ? zeigt alle Tasten.
- Oben links steht immer der Rückweg, auch nach einem Sprung über einen Faden in einen anderen Mond.

## Wie es gebaut ist

- `server/lichtwerk_server.py`: ein kleiner Server nur mit Standardbibliothek, nur auf 127.0.0.1. Er liefert die Oberfläche und reicht Lesezugriffe an SPiRALCELLS weiter. Geschrieben wird ausschließlich in **Ralfs Namen** und über die vorgesehenen Wege: `variant-branches` (immer mit fester `request_id`, nur Weiterarbeit oder Gegenlese, nur in Ralfs eigenem Zweig), `status`, `edges` (ohne Dopplung) und einmalig `agents` für deinen Eintrag. Alles andere wird abgewiesen. Host, Origin und Sec-Fetch werden geprüft.
- `app/js/`: Licht (die Lichtmaschine aus dem Lichtwerk), Daten (Linse über `/api/graph`), Zelle (Simulation), Netz, Regie (Kamera), Bedienung, Schreiben, Klang.
- Linse, kein Träger: kein eigener Datenbestand. Geht das Lichtwerk verloren, ist keine Wahrheit verloren.

## Geprüft

- **Tests (Stand Nachmittag; Stand 22:00 siehe oben):** `tests/test_datenweg.py` (damals 13, bestanden; seit Codex' Änderung um 18:08 und den Etappen des Abends gilt der Stand oben. Er läuft auf einer eigenen frischen Kopie und berührt den echten Bestand nie) prüft unter anderem: nur vorgesehene Wege; nur Ralf; fremder Zweig und fremde Entstehungsangabe werden abgewiesen; gleiche `request_id` legt genau einmal ab, dieselbe Kennung mit anderem Inhalt wird abgewiesen; keine doppelte Kante; ruhender Dienst gibt einen menschlichen Satz; echte Daten bleiben unberührt. `tests/daten.test.mjs` (9, bestanden) prüft die Abbildung, die gerichtete Kopplung und dass dein Verbinden die Kopplung der Stimmen nicht hebt. Ausgaben: `protokolle/test-*.txt`.
- **Schreibweg in der Oberfläche** gegen die Testkopie (8412 → 8413): Kurzes Halten bewirkt nichts. Der Eintrag „Ralf“ wird angelegt, der Einwurf zur Ausprägung (566 → 567, mit „erweitert“). Kristallisieren führt zu Stille, Goldwelle und Einrasten bei 137,508°. Verbinden zeigt das Siegel, Lassen schreibt nichts. Protokoll: `protokolle/oberflaechen-schreibweg-testkopie.json`.
- **Kennungen:** 83 Leseflächen und 88 Mond-Marken ohne Kennung, Prüfsumme oder Pfad, sichtbar wie in aria-Beschriftungen. Die Technischen Details bleiben zu (`protokolle/kennungspruefung-oberflaeche.json`).
- **Zwei unabhängige Kritikrunden** an den Standbildern (Erstblick, Bildkraft, Code, Bedienung): `protokolle/kritik-runde-*.md`.
  - Runde 1 (vier Prüfer) fand echte Fehler, alle behoben: vorgetäuschten Einklang der Köpfe, Traumfelder im goldenen Winkel, ein Halten, das nach dem Neuaufbau noch schreiben konnte, einen verlorenen Einwurf, kurze Hashes im Text und ein Netz wie Schaum.
  - Runde 2 (zwei Prüfer) bestätigte den größten Teil als behoben und fand neue Fehler. Der schwerste: Ein Halten schrieb noch, wenn Escape oder „Lassen“ den Knopf nur versteckten. Dazu eine Auffrisch-Schleife, die sich in jedem Bild neu anstieß. Beides ist behoben, das Halten mit Beleg (`protokolle/halten-abbruch.json`): Abbruch nach 0,5 s schreibt nichts, volles Halten schreibt.
  - Bewusst nicht geändert: Der Aufzug zeigt die echte Reihenfolge (Kimi kam zweieinhalb Stunden später). Antigravitys längere Speiche bleibt als lila Außenkranz sichtbar, weil Antigravity mehr Text geschrieben hat.
- **Leistung:** etwa 9.700 Lichter, rund 1 ms Rechenzeit je Bild am Mac (Handy-Emulation: 8 ms). Handy-Größe 375 × 812 ohne waagerechte Rolle.
- **Live:** Der neue Mond von Codex erschien ohne Neuladen im Netz (89 Monde). Das Auffrischen ist damit auf echten Daten belegt.
- **Zustände im Bild:** Aufzug, Zelle, Kelch, Netz, Traumfeld, Ein-Stimmen-Mond, eingerastet (Testkopie), Dienst aus, reduzierte Bewegung, Marke, Lesefläche, Siegel und Handy (`standbilder/final-*`, `runde2-*`).
- **Standbilder:** `standbilder/` (`arbeit-*` Runde 1, `runde2-*` nach dem Umbau).

## Nicht geprüft

- Ein echtes iPhone. Geprüft habe ich nur die Handy-Größe im Browser.
- `prefers-reduced-motion` über die echte Systemeinstellung. In der Werkstatt habe ich den Pfad von Hand eingeschaltet: kein Aufzug, die Köpfe drehen etwa sechsmal langsamer (0,43 statt 2,6 rad/s), Bild `runde2-reduzierte-bewegung.jpg`. Ob der Browser die Einstellung des Macs richtig weitergibt, ist ungeprüft.
- Klang. Er ist aus dem Lichtwerk übernommen und zuschaltbar, aber nicht angehört.
- Standbilder in voller Auflösung mit HTML-Oberfläche. Chrome ohne Fenster habe ich wegen des Speicherschutzes nicht gestartet. Die Oberflächenbilder sind Bildschirmfotos aus der Browserfläche.
- Sprechen als Eingabe. Es ist nicht gebaut, siehe offene Entscheidung 5.

## Offene Entscheidungen

Die Einzelheiten stehen in ABBILDUNG.md.

1. Ein eigener Eintrag „Ralf“ (Mensch): Er entsteht beim ersten Ablegen oder Verbinden, nur nach deinem Halten.
2. ADR-0006: Bleibt MiNDCEL Gedächtnislinse, oder wird SPiRALCELLS Träger?
3. „gehört-zu“ als echte Verschachtelung, also Zelle in Zelle?
4. Statusbeleg mit Zeit und Urheber (Wunsch an Codex: `WUNSCH-an-codex-statusbeleg.md`).
5. Sprechen über die Spracherkennung des Browsers (Audio verlässt den Mac).
6. Keim bei Monden ohne Briefing.
7. Ablegen in der Zentrale kostet einen bezahlten Aufruf und ist darum nicht verbunden.

## Hinweise

- **Laufende Dienste (22:00):** SPiRALCELLS 8401, Lichtwerk 8411 mit Leseeingang 8420 (ein Prozess, `--leseeingang 8420 --behalten`). Codex' Testinstanz 8413 läuft; sein Test-Lichtwerk 8412 lief um 21:44 nicht mehr (nicht von mir beendet, nicht neu gestartet). Meine Testkette 8418/8419 ist angehalten. Anhalten nur per PID: `SPiRALCELLS-ANHALTEN.command`, PIDs in `protokolle/`.
- **Speicherschutz:** Er war heute mehrmals gesperrt. Einmal habe ich in genau so einem Moment einen kleinen Ruhe-Server (5 MB) für ein Standbild gestartet, weil mein Befehl den Status prüfte, den Start aber nicht davon abhängig machte. Ich habe ihn nach dem Bild sofort beendet.
- **Fremde Verknüpfung (überholt):** Seit 17:27 Uhr ist das ein Ordner mit Hardlinks; seit 20:35 Uhr liefert das Lichtwerk die Skizzen aus Codex' echtem Ordner über den Leseeingang 8420 aus, die Hardlinks bleiben unberührt liegen. Damals: In `app/` lag seit 17:21 Uhr eine Verknüpfung `kin-os-sichten-codex` auf `Development/Projects/kin-os-sichten-codex`, die ich nicht angelegt habe. Um 17:37 Uhr hat außerdem jemand zweimal `/kin-os-sichten-codex/` über das Lichtwerk angefragt. Zeitlich passt beides zu Codex' neuem Mond „KiN OS · Sichten“. Ich habe die Verknüpfung stehen lassen. Der Server liefert über sie nichts aus (geprüft: 404). Ob sie weg soll, entscheidest du.
- **Werkstatt-Schalter (überholt):** Seit 20:35 Uhr läuft 8411 ohne `--werkstatt`; Standbilder entstehen nur noch an der Testkette. Damals: Der laufende Lichtwerk-Server auf 8411 war noch mit `--werkstatt` gestartet, damit die Standbilder gespeichert werden konnten. Erlaubt ist damit nur das Speichern von Bildern aus der eigenen Seite. Die Startdatei startet ohne diesen Schalter. Neu gestartet habe ich ihn nicht, weil der Speicherschutz gesperrt war.

## Nachtrag 20.10., 19:50 Uhr: Was sich seit dem Bericht geändert hat (nicht durch mich)

- **Mein Server wurde erweitert.** Codex hat `server/lichtwerk_server.py` um 18:08 Uhr um den Schalter `--autorenprofile` ergänzt. Mit dem Schalter dürfte das Lichtwerk auch unter vorhandenen Profilen schreiben, also unter den Namen der Stimmen. Ohne ihn bleibt es bei „nur als Ralf“. Der laufende Dienst auf 8411 (seit 17:25 Uhr) hat noch den alten Code. Mein Satz oben, am Server sei nach Runde 1 nichts mehr geändert worden, stimmt deshalb nicht mehr. Die Server-Tests sind gegen den neuen Code nicht erneut gelaufen.
- **Eine zweite Oberfläche im selben Ordner.** Codex baut seit 17:32 Uhr unter `app/` einen „Werkraum“ (`werkraum.html`, `js/werkraum.js`, `werkdaten.js`, `materialraum.js`, `mycel.js`). Er hat Formularfelder. Beim Speichern legt er deinen Eintrag „Ralf“ ohne Halten an und schreibt eine neue Fassung. Wird er über 8411 geöffnet, ginge das in deinen **echten** Bestand. Von selbst passiert nichts: Erst Tippen und „Speichern“ schreibt.
- **Sternwerft über mein Lichtwerk.** Codex' KiN-OS-Skizzen liegen als Hardlinks in `app/kin-os-sichten-codex/` und werden über 8411 ausgeliefert, also über denselben Server, der auch schreiben darf.
- **Testkette.** Codex hat das Test-Lichtwerk 8412 um 18:15 Uhr mit seinem Code und `--autorenprofile` neu gestartet. 8412 und 8413 dienen jetzt faktisch ihm.
- **Weiter:** Wie diese Spuren zusammengeführt werden, regelt der neue Auftrag `PROMPT-SPIRALCELLS-IN-KIN-OS.md` mit `BAUPLAN-SPIRALCELLS-IN-KIN-OS.md`. Etappe 1 dort: Betrieb gleich Test, und nur noch Ralfs eigene Wege schreiben. Wie der KiNFORMER dazukommt, steht in `KINFORMER-EINBINDUNG.md`.
