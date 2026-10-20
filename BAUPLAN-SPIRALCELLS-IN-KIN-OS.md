# Bauplan: SPiRALCELLS als Teil von KiN OS

Gehört zu `PROMPT-SPIRALCELLS-IN-KIN-OS.md` (gleicher Ordner) und gilt nur zusammen mit dessen Stufe 0, festen Regeln und Abschluss. Stand 20.10.2026, 19:40. Alle Zeilenangaben beziehen sich auf diesen Stand; lies die Stelle vor jeder Änderung neu.

## Etappen

Zu jeder Etappe gehören: eine Vorherkopie nach `sicherung/vorher-<datum>/`, Tests, Standbilder über deine Testkette (nur dort ist `--werkstatt` an), ein Chronik-Eintrag und für Ralf ein Bild und ein Satz. Neue Serverwege gehen am Ende der Etappe mit einem Neustart von 8411 per PID live, nach grünen Tests und mit einem Satz an Ralf vorher.

Codex arbeitet parallel. Deine eigenen Dateien änderst du jederzeit. Geteilt ist nur `server/lichtwerk_server.py`: Lies sie direkt vor dem Schreiben und schreib nur, wenn ihre Prüfsumme noch deinem Lesestand entspricht; sonst liest du neu und fügst neu ein. Ändert sich eine Codex-Datei, ohne dass du geschrieben hast, notierst du das mit Änderungszeit und Codex-Sitzung und stellst nichts zurück.

### 1 · Boden: Betrieb gleich Test

- **Zielbild:** Auf 8411 läuft der Servercode, den die Tests prüfen, und keine fremde Seite, weder Skizze noch Werkraum, kann durch die Schleuse schreiben. Die Dateien aus `app/` liefert 8411 live von der Platte; „Betrieb gleich Test“ gilt für den Server.
- **Tun:**
  - **Eigene Testkette.** Kopier `/Volumes/ThunderBolt4_2TB/Development/AppData/mooncells/state.json` frisch nach `testdaten/kette-claude/state.json` und prüf, dass `peers` leer ist. Starte aus dem mooncells-Ordner den SPiRALCELLS-Test auf 8418 wie 8413 (`PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3 -m server.app --host 127.0.0.1 --port 8418 --data <Kopie> --instance spiralcells-testkopie`) und das Test-Lichtwerk auf 8419 wie 8412, aber nur mit `--spiralcells http://127.0.0.1:8418 --werkstatt`, ohne `--autorenprofile`. Prüf die Ports vorher mit `lsof`. `testdaten/state.json`, 8412 und 8413 gehören jetzt faktisch Codex: nie überschreiben, nicht neu starten.
  - **Tests.** Lass alle vier Testdateien laufen, über `extern-dev run … /usr/bin/python3 -m unittest …` und `/opt/homebrew/bin/node --test …`. `test_datenweg.py` belegt die Ports 8415 bis 8417.
  - **Leseeingang.** Seiten, die 8411 ausliefert, dürfen durch die Schleuse schreiben, denn `_schutz` vergleicht nur Host, Port und Origin. Gib dem Lichtwerk darum einen zweiten, nur lesenden Eingang, etwa 8420 (Bauplan B1). Skizzen und Werkraum laufen im Betrieb dort.
  - **Neustart.** Sag Ralf einen Satz, weil Lichtwerk und Sternwerft kurz weg sind. Halte 8411 per PID an und starte es wie in der Startdatei neu, ohne `--werkstatt` und ohne `--autorenprofile`, mit dem Leseeingang. Die Startdatei bekommt ihn dazu.
- **Prüfung:**
  - Alle Tests sind grün, auch `test_autorenprofile.py`.
  - Ein neuer Servertest belegt: Über den Leseeingang entsteht weder eine Ausprägung noch ein Eintrag „Ralf“, Sternwerft und Werkraum lesen dort, und 8411 schreibt danach weiter.
  - `/api/health` auf 8411 meldet `authorSelection` aus.
  - Im Protokoll steht kein Schreibaufruf an 8401, und Codex' Stellen im Server sind wortgleich.

### 2 · Formen ansehen (schreibt nichts)

- **Zielbild:** Station 5 bis vor „Behalten“. Ralf sieht hier zum ersten Mal etwas Neues.
- **Tun:**
  - Der Server bekommt zwei Wege, die nur lesen und rechnen. `GET /lichtwerk/formen/richtungen` spiegelt, was 9062 meldet, kurz zwischengespeichert. `POST /lichtwerk/formen/vorschau` bekommt nur Ausprägung und Richtung, holt den Text selbst aus dem Graphen, bereinigt ihn wie die Lesefläche und ruft `/api/formen/ausformen` vom Server aus, ohne `Origin`. Den falschen Herkunftssatz der Seite ersetzt er durch einen ehrlichen (Bauplan B2).
  - Formen gibt es nur an Ausprägungen eines Text-Monds, deren Inhalt kein JSON ist. An einem App-Zustand steht ein ruhiger Satz: „Das ist ein gespeicherter App-Zustand. Formen gibt es für Texte.“
  - Die Adresse des KiNFORMER wird ein Schalter (`--kinformer`), damit Tests einen Stellvertreter nutzen.
  - In der Lesefläche (`bedienung.js`) kommt ein stiller Handgriff „Formen“ dazu. Die Gestaltung steht unter „KiNFORMER einbinden“.
- **Prüfung:**
  - Die Vorschau schreibt nichts: Die Prüfsumme der Testdaten bleibt gleich, und es geht kein POST an SPiRALCELLS.
  - Es erscheinen nur gemeldete Richtungen. Ist 9062 aus, der Text leer, länger als 100.000 Zeichen oder ein App-Zustand, steht je ein ruhiger Satz da.
  - Keine gelieferte Seite enthält eine UUID, eine Prüfsumme oder einen Pfad. Die CSP bleibt `connect-src 'self'`.
  - Standbilder von Fächer, Lichttisch, Handy und reduzierter Bewegung, danach die erste unabhängige Kritikrunde (Erstblick, Bedienung, Code).

### 3 · Behalten: die Form wird ein Korn

- **Zielbild:** Ralf hält „Behalten“. Ein Licht fliegt zurück, ein neues silbernes Korn sitzt in der Zelle, ein zarter Faden führt zum Original. Lassen schreibt nichts.
- **Tun:**
  - **Eigene Route** `POST /lichtwerk/formen/behalten`. Sie bekommt nur Ausprägung und Richtung, formt erneut (das Ergebnis ist immer gleich) und schreibt nach Bauplan B3: zuerst die Form in Ralfs Zweig, dann den Faden „verweist auf“ zum Original. „remixt-aus“ nimmst du nicht, denn SPiRALCELLS zählt diesen Faden als Wiederverwendung. Die allgemeine Einwurf-Route weist `lichtwerk-form-` ab.
  - **In `daten.js`** erkennt `istForm` ein Form-Korn. Es ist papierhell mit silbernem Rand, denn Ralf hat es geholt, die Worte aber sind die des Originals. Sein Licht folgt dem sichtbaren Wortlaut, nicht den Bytes der Seite. Weder Korn noch Faden heben eine Kopplung, werden Keim, ändern die Reife oder machen aus einem Traumfeld einen bewohnten Mond.
  - **Lesefläche:** Ein Form-Korn öffnet sich als Seite im selben Lichttisch, nie als Quelltext, dazu „Zum Original“ und keine Statusknöpfe. „Formen“ formt dort immer das Original.
  - **Live erst nach Prüfung.** Behalten kommt auf 8411, wenn eine Kritikrunde (Code, Bedienung) den Schreibweg an der Testkette geprüft hat. Unmittelbar vor diesem Neustart sicherst du `state.json` nach `sicherung/`.
- **Prüfung:**
  - Geprüft wird nur gegen die Testkette.
  - Zweimal Behalten ergibt eine Ausprägung und einen Faden, auch wenn sich Ralfs Zweig dazwischen bewegt hat. Ein Abbruch nach 0,5 s schreibt nichts.
  - `daten.test.mjs` wird erweitert: Kopplung, Winkel, Keim, Reife und Traumfeld bleiben gleich, auch wenn ein Form-Korn anderswo den Status grundformation bekommt.

### 4 · Wiederkommen

- **Zielbild:** Station 6, im Netz und in der Zelle.
- **Tun:**
  - Der Browser merkt sich nur den Zeitpunkt „zuletzt hier“, keinen Inhalt (in try/catch), und setzt ihn erst, wenn die Ankunft zu Ende gezeigt ist. Ohne Merker ist nichts neu.
  - Neu ist, was danach eingetragen wurde, berechnet aus dem Graphen. Beim Öffnen fliegen nur die neuen Körner ein, in echter Reihenfolge, jede Stimme in ihrer Farbe. Ralfs eigene Einträge und Formen gelten nie als neu. Neue Fäden und Befunde bekommen einen eigenen Satz. Kommen mehr als zwölf Ausprägungen einer technischen Übernahme auf einmal, steht ein Satz statt eines Einflugs.
  - Die Sätze sagen „eingetragen“, nicht „entstanden“, denn das Datum einer Ausprägung ist ihr Eingang. Statuswechsel bleiben unsichtbar, bis es den Statusbeleg gibt.
  - Für KiN OS gibt es einen Leseweg `GET /lichtwerk/neu?seit=…`: ein Satz und die Zahl je Stimme, auf dem Server aus dem Graphen berechnet, die Zeit als UTC verglichen. `/api/changes?since=` von SPiRALCELLS liefert nur Neueinfügungen und vergleicht die Zeit als Text.
  - Gleiche Bild und Sätze mit „Die Schleife“ der Sichten-Sitzung ab, statt eine zweite Sprache für Neues zu erfinden. Unterschiede legst du Ralf als eine Frage vor.
  - Das Ruhebild nutzt du weiter. Traumphase und Interferometer stößt du nicht an.
- **Prüfung:** Testkette mit und ohne neue Ausprägung, bei 375 px und mit reduzierter Bewegung. `/lichtwerk/neu` fragst du vom Server aus ab.

### 5 · Hinein und hinaus

- **Zielbild:** Station 2 nach 3. Ein lesbarer Link führt in die richtige Zelle, und oben links steht „Zurück zur Sternwerft“ oder „Zurück zu KiN OS“.
- **Tun:**
  - Ein lesbarer Link ohne Kennung, denn die Adresszeile ist sichtbar, etwa `/#mond=zentrale-material-bekommt-form&von=sternwerft`. Der kurze Name gehört immer dem ältesten Mond dieses Titels. Ein späterer bekommt den Eingangstag (`…-19-okt`), bei gleichem Tag dazu die Uhrzeit, so bleiben alte Links heil. Ein unbekannter Name führt still ins Netz.
  - `von` kennt nur feste Werte (`sternwerft`, `kinos`), jeder mit fester Rückadresse. Eine Adresse aus dem Link wird nie übernommen.
  - Die Fahrt beginnt erst nach Ralfs Tipp auf den Link, dauert höchstens 1,5 Sekunden und bricht bei Berührung oder Esc ab. Bei reduzierter Bewegung ist sie ein Schnitt.
  - `ANDOCKEN-KIN-OS.md` beschreibt Linkform, Rückweg und den Leseweg `/lichtwerk/neu`. Dass die Sternwerft diesen Link nutzt, ist ein Wunsch an Codex; ein Test belegt das Muster mit einer Attrappe.
- **Prüfung:** Hin und zurück bei 375 und 1440 px und mit reduzierter Bewegung. Weder Adresse noch Text noch Beschriftung zeigen eine Kennung.

### 6 · KiN OS, der kleinste Fork (nur nach Ja zu Frage 3)

- **Zielbild:** Station 1. Ralf öffnet KiN OS und sieht den Rahmen der Zentrale. Darin steht der Leistenpunkt „SPiRALCELLS“ mit Bild und Neuigkeiten-Satz, und ein Tipp führt in die Zelle und zurück. Die Werkstatt, der Raum Formen, ist da. AiHDS OS läuft unverändert auf 8894.
- **Tun:** nach Bauplan B6: Ordner mit Herkunft, eigener Betrieb, eigener Origin, Kosten fest aus, eigene Markierung in KiN, Leistenpunkt mit lesendem Organ, Skizzen als „Entwürfe für den Eingang“, Umschalten in beide Richtungen ohne Eingriff in AiHDS OS.
- **Ohne Ja, oder wenn die Zeit ausgeht:** Schreib `PROMPT-KIN-OS-FORK.md` im Stil dieses Auftrags, mit genau den Punkten aus B6, und leg Tests gegen Attrappen für den Leseweg bei.
- **Prüfung:**
  - 8894 antwortet wie vorher, und die Prüfsummen der kopierten Dateien in `wirktragwerk` sind gleich.
  - Die Tests im Fork sind grün, außer dem bekannten Altfehler in `tests/test_aios_http.py` Z.236.
  - Kein Aufruf an api.anthropic.com, keine Anfrage an KiN mit „zentrale“, in KiN wurde nichts gewählt.
  - Der Fork funktioniert bei 375 px.

### 7 · Umschalten und übergeben

- **Zielbild:** Ralf geht seinen Tag einmal durch. Lichtwerk und Werkraum sind umschaltbar.
- **Tun:**
  - Eine stille Tür „Werkraum“ im Netz und eine freie Taste, etwa W (belegt sind 0–5, S, N, H, ?, Leertaste, Pfeile, Esc, Eingabe und ⌘V). Sie führt in den lesenden Werkraum und gibt nur den Mond mit (`#mond=…`), nie Inhalt. Dass der Werkraum ihn öffnet, ist ein Wunsch an Codex; bis dahin öffnet er im Netz, mit einem Satz.
  - Die Wünsche an Codex schreiben (siehe unten), dazu den Brief `AN-CODEX-KIN-OS.md`.
  - `ABBILDUNG.md`, `BERICHT.md` und das Gedächtnis nachführen. Im BERICHT sind mindestens fünf Stellen überholt: die 89 Monde (Z.7), die Serveränderung um 18:08 (Z.43), die Sternwerft, die über Hardlinks mit 200 antwortet (Z.79), der Werkstatt-Schalter, der ab Etappe 1 aus ist (Z.80), und der Werkraum, der ganz fehlt.
- **Prüfung:**
  - Der ganze Tag als Standbilder, je Station eines, bei 375 und 1440 px.
  - Eine zweite unabhängige Kritikrunde (Erstblick, Bildkraft, Code, Bedienung).
  - Du hast keine Codex-Datei verändert; jede Abweichung von Stufe 0 ist über Änderungszeit und Codex-Sitzung ihm zugeordnet.

## KiNFORMER im Einzelnen

**Wie es sich anfühlt:**
- *Handgriff:* In der Lesefläche steht ein stiller Handgriff „Formen“. Tippen fächert am Korn nur die Richtungen auf, die 9062 gerade meldet, heute Plakat, Lesetuch, Karten, Schaubild und Spiel. Klang und Film stehen als leiser Satz „kommt“ da, ohne Knopf. Am Handy liegen sie als Reihe in Daumenbreite.
- *Übergang:* Das Korn hebt sich aus der Speiche und wird Papier. Die Form entfaltet sich auf einem Lichttisch über der gedimmten Zelle, so bleibt der Ort sichtbar. Bei reduzierter Bewegung blendet das Bild ruhig über.
- *Raum:* Papier auf graublauem Grund, Bernstein für das Original, Lime für das Gewählte, also die Farbwelt des Raums Formen. Oben steht ein Satz, was erhalten blieb, etwa „30 Karten, jeder Satz eine.“ oder beim Spiel „24 Karten zum Umdrehen und Ordnen. Die ersten 24 von 30 Sätzen.“ Unten läuft der Fassungsfaden: das Original, dann je Form eine Perle. Perlen und ← → wechseln die Form desselben Stoffs. Gewischt wird nur auf dem Rand um die Fläche, denn Gesten in der Fläche erreichen die Seite nicht. H hält „Behalten“, Esc oder oben links führt an dasselbe Korn zurück; diese Tasten gelten nur dort. Die Form steht in einer abgeschlossenen Fläche ohne Skripte (`srcdoc`, `sandbox` ohne `allow-scripts`).
- *Behalten:* Halten wie beim Kristallisieren. Erst dann wird geschrieben.

**Grenzen.**
- Gerufen wird nur vom Server aus, ohne `Origin`. Die CSP des Lichtwerks und die Herkunftsliste des KiNFORMER bleiben, wie sie sind.
- Es geht bis 100.000 Zeichen. Darüber steht ein ehrlicher Satz, nichts wird still gekürzt.
- Plakat nimmt drei Sätze, Spiel höchstens 24, das Schaubild höchstens zwölf Zweige, sechs Blätter und vier Zeilen je Knoten. Lesetuch und Karten tragen jeden Satz, verlieren aber Aufzählungszeichen und Nummern am Zeilenanfang. Trotzdem steht auf jeder Seite „Der Wortlaut ist unverändert übernommen“ (`formen_http.py` Z.240–241); das Lichtwerk ersetzt diesen Satz (B2). Den KiNFORMER selbst änderst du nicht: Die Zentrale legt ihre Formen unter einer Kennung aus dem Eingangstext ab, im Körper aber die Seite (`aios_formen.py` Z.603–607). Nach einer Änderung antwortete KiN beim erneuten Formen mit 409. Das entscheidet Ralf später.
- Die Spiel-Form hat Kästchen zum Umdrehen und Zahlen zum Ordnen. Das ist Spielbedienung ohne Senden, kein Formular. Geht sie bei 375 px nicht mit dem Daumen (die Ziffern sind 26 px groß), bleibt sie am Handy Vorschau mit einem Satz.
- Nicht jetzt: Klang und Film an die lokalen Musik- und Blender-Aufträge hängen (sie verlangen eine Werkstückbindung), die etwa zwölf Richtungen der KiNFORMER-Oberfläche und Formen als Brücke zwischen Monden.

## Wünsche an Codex im Einzelnen

Je Thema eine Datei `WUNSCH-an-codex-<thema>.md` hier. An Codex' Dateien änderst du nichts.
- **werkraum:** keine Formulare, Textfelder, Suchfelder und Auswahllisten; Ralfs Eintrag nur nach Halten; Weiterarbeit in Ralfs Zweig statt eines neuen Zweigs bei jedem Speichern; keine Inhalte im Browser-Speicher (seine eigene Regel in `mooncells/server/static/workspace.js` Z.1–2; sag offen dazu, dass das Lichtwerk einen offenen Einwurf bis zum Ablegen im sessionStorage hält, damit seine Wiederholungskennung ein Neuladen übersteht); ein eigenes Präfix `werkraum-`; dieselbe Urheberregel wie `daten.js`; `#mond=…` lesen wie das Lichtwerk; den lesenden Eingang an `/api/health` erkennen und dort nicht speichern wollen; Form-Körner als Seite zeigen, nicht als Rohtext; ein Rückweg ins Lichtwerk; Prüfung bei 375 px; der fehlende Chronik-Eintrag. Bis das gelöst ist und Ralf Ja sagt, schreibt der Werkraum im Betrieb nicht.
- **sternwerft:** „Am Werk anlegen“ führt per lesbarem Link in die Zelle statt mit Kennung in die Materialansicht. Auch „Diese Variante in SPiRALCELLS ↗“ (`registration.js`) zeigt zwei Kennungen in der Adresszeile. Die Skizzen liegen jetzt hinter dem Leseeingang.
- **statusbeleg** (liegt schon): ergänzen, dass `/api/changes` Statusereignisse mitliefern soll, sobald es sie gibt.
- **adoption:** `remixt-aus` zählt als Adoption (`konzept.md` Z.146–150) und wird schon gerechnet (`queries.py` Z.130–148). Sollen Werkzeug-Formen dort ausgenommen werden? Bis dahin zieht das Lichtwerk für Formen „verweist auf“.
- **kanten:** `edge_type` ist freier Text. Die 16 „gehört-zu“-Kanten stammen von „KiNTEGRiTY Kapitelverbindungen“, `EDGE_TYPES` kennt den Typ nicht, und `konzept.md` §10 schließt Werk-zu-Werk-Kanten aus. Wird er kanonisch?
- **mooncells-sichern:** den Zweig einchecken (1.073 Zeilen offen), `runde2` nachliefern und Form-Körner in der Materialansicht von 8401 als Seite zeigen.

Dazu kommt `AN-CODEX-KIN-OS.md`: je Wunsch ein Satz und der Pfad, fertig zum Einfügen in Codex' Unterhaltung. Ralf ist nicht dein Bote, um Codex anzuhalten oder zu befragen; den Brief einfügen kann nur er.

## B · Baupläne

### B1 · Leseeingang (Etappe 1)
- Eine eigene Unterklasse des Handlers mit eigenem Port, im selben Prozess, über einen Schalter `--leseeingang`. Ein geteilter Handler geht nicht: `_eigene_adresse` vergleicht mit dem Klassenattribut `port` (Z.76, 86, 361), er wiese also alles ab oder bräche das Schreiben auf 8411.
- Er kennt nur GET und HEAD; alles andere bekommt 403. Er liefert die Skizzen aus dem echten Ordner `kin-os-sichten-codex/` und die Dateien aus `app/` und reicht nur `GET /api/graph`, `/lichtwerk/graph`, `/lichtwerk/stand`, `/api/agents` und `/api/health` durch; `/api/health` meldet dort „nur lesen“. `/` leitet auf 8411.
- Auf 8411 leiten `/kin-os-sichten-codex/…` und `/werkraum.html` dorthin um, so bleiben Codex' Links heil. Nimm keine CSP-Sandbox: Dann holte `data.js` den Graphen aus fremder Herkunft und bekäme 403. Die Hardlinks bleiben liegen. Schreibend läuft der Werkraum nur auf den Testketten.

### B2 · Ehrlicher Herkunftssatz (Etappe 2)
- Der Server ersetzt in jeder gelieferten Seite genau den Absatz `<p class="herkunft">…</p>` durch „Geformt von KiNFORMER als <Form> aus „<Titel>“.“ und einen Satz, was blieb:
  - Lesetuch: „Alle N Sätze, neu gesetzt. Aufzählungszeichen und Nummern am Zeilenanfang fallen weg.“
  - Karten: „N Karten, jeder Satz eine.“ mit demselben Zusatz,
  - Plakat: „Die ersten drei von N Sätzen, groß gesetzt.“
  - Spiel: der `satz` des KiNFORMER, er nennt die Kürzung selbst,
  - Schaubild: „Die Gliederung als Bild. Längeres ist gekürzt und mit „…“ markiert.“
  N liefert der KiNFORMER selbst über das Lesetuch („N Sätze zum Vorlesen.“).
- Findet der Server den Absatz nicht genau einmal, bleibt die Form Vorschau mit einem Satz, und Behalten ruht.
- Titel und Text gehen bereinigt an den KiNFORMER: Die Regeln von `menschlich()` (`daten.js` Z.30–38) kommen nach Python, und ein Test vergleicht beide an denselben Beispielen. Wo ersetzt wurde, sagt die Notiz einer behaltenen Form „Kennungen wie in der Lesefläche ersetzt“.

### B3 · Behalten (Etappe 3)
- **Erst nachsehen:** Liegt in diesem Mond schon eine Ausprägung von Ralf mit genau diesem Inhalt, zeigt das Bild „liegt schon“, und ein fehlender Faden wird nachgezogen. Das hält auch, wenn sich Ralfs Zweig seitdem bewegt hat.
- **Feste `request_id`:** `lichtwerk-form-` und eine Prüfsumme aus Original, Richtung und Inhalt. SPiRALCELLS vergleicht den ganzen Auftrag (`store.py` Z.393–408).
- **Körper** nach `einwurfKoerper` in `schreiben.js`: Ralfs Zweig in diesem Mond, `derived_from` auf seine letzte Fassung dort, `contribution` gleich `continuation` mit dem Original in `seen_variant_ids`. Hat er dort noch keinen Zweig, dann `new_worktree` mit `contribution.mode` gleich `review` und dem Original in `seen_variant_ids`, denn ohne Quelle verlangt SPiRALCELLS das (Z.435–440). Kein `source_variant_id` und keine `source_variant_ids`: Das erste zöge „erweitert“ nach sich, das zweite „remixt-aus“ (Z.469–488). `derived_from` auf das Original scheitert, weil eine Ableitung im selben Zweig bleiben muss (Z.457).
- **Faden:** im selben Halten direkt danach `verweist-auf` von der Form zum Original, in Ralfs Namen, mit dem Dopplungsschutz aus `_kante`. Fehlt er nach einem Abbruch, ergänzt ihn das nächste Halten.
- **Inhalt** ist die bereinigte Seite mit ehrlichem Herkunftssatz, der Titel der des KiNFORMER („Karten aus …“). Die Notiz beginnt fest mit „Form ohne Modell · KiNFORMER · <Richtung>“ und sagt in Worten, was erhalten blieb.
- **`istForm`** prüft Notiz, Urheber Ralf, Faden zum Original und den Seitenanfang `<!doctype html>` zusammen. Ein Form-Korn zählt weder als Faden noch als Gegenlese für die Reife (`daten.js` Z.151–154) und nicht für das Traumfeld (Z.167). Einen Status, den es anderswo bekommt, übergeht `daten.js`.

### B6 · Der Fork (Etappe 6)
- **Ordner:** `extern-dev new kin-os`. Vorher hält `HERKUNFT.md` fest: den Commit von `wirktragwerk`, `git status --porcelain` und die Prüfsummen. Kopiert werden nur `git ls-files` und die unversionierten, nicht ignorierten Dateien (`git ls-files --others --exclude-standard`, darunter `aios_formen.py` und `web/formen/`). Nie mit: `.git`, `.workbench`, `.release-private` (Zugangsdaten), `artifacts`, `.playwright-cli`, `.pytest_cache`, `__pycache__`. Prüfsummen über genau diese Liste, vorher und nachher. Eigenes Git; der erste Commit nennt die Herkunft.
- **Betrieb:** eigener Zustand über `ZENTRALE_FORMEN_DIR`, etwa `Projects/kin-os-daten/formen`; eigener freier Port, etwa 8895 (vorher `lsof`). Start mit `/Applications/Xcode.app/Contents/Developer/usr/bin/python3 workbench.py --port …` über eine eigene `KIN-OS-STARTEN.command`. `local_launcher.py` und `aios_environment.py` sind auf 8894 verdrahtet: nicht benutzen. Kein launchd.
- **Origin:** `ZENTRALE_ORIGIN` (`aios_formen.py` Z.26) auf den eigenen Port, sonst gibt sich der Fork bei KiN als Zentrale aus. Ein Test belegt, dass jeder Aufruf an `/api/manufacture` diesen Origin trägt; ohne Origin hätte der Fork mit KiNs Schlüssel volle Herstellungsrechte (`kin/private_access.py` Z.167–170, `kin/manufacture_http.py` Z.89–91). Wählen ruht dann mit einem Satz, der KiN OS nennt, bis KiN den Fork kennt. Das wäre eine Änderung an KiN, nur mit Ralfs Ja, Backup und `betrieb.py`.
- **Kosten:** Im Fork geben `verstehen()`, `beschreiben()` und `_claude()` im Code fest „ruht“ zurück, ohne Netz, denn die Schlüsseldatei `~/.config/kintegrity/systemleitung.env` gilt für den ganzen Mac (Z.251). Abgelegter Text bekommt den schlichten Namen, den der Code ohne Modell schon kennt. Bilder ablegen ruht mit einem Satz. Sprechen ist aus (`web/formen/rahmen.js` Z.530): „Sprechen kommt nach deinem Ja.“ Ein Test ersetzt `urlopen` und belegt: kein Aufruf an api.anthropic.com, keine neue Zeile in `ki-kosten.jsonl`.
- **Markierung** an allen Stellen von `aios_formen.py`: `request_id` mit `kinos-` statt `zentrale-` (Z.537, 546) und `kinos-form-` statt `kinformer-` (Z.604); `ref` `kinos:formen…` statt `zentrale:formen…` (Z.539, 548) und `kinos:kinformer:<richtung>:<werk>` (Z.606); `metadata` `{"kinos": "formen", …}` statt `{"zentrale": "formen", …}` (Z.540, 549, 607). Sonst gäbe KiN bei gleichem Stoff 409. Ein Test belegt, dass keine Anfrage des Forks an KiN „zentrale“ trägt. Du selbst legst im Fork nichts ab; das tut Ralf.
- **Leiste:** ein Punkt „SPiRALCELLS ↗“ neben „Kleiner Tisch ↗“ (`web/aios.html` Z.12), gebaut wie „Gemeinsamer Bestand ↗“ (Z.13) als Link auf 8411, aber im selben Fenster; die CSP sperrt Rahmen. Ein lesendes Organ `spiralcells` in `read_organ` (`aios_organs.py` Z.694) holt `8411/lichtwerk/neu` vom Server aus. Dafür bekommt `read_organ` einen freiwilligen Parameter `seit`, den der Browser des Forks aus „zuletzt in KiN OS“ mitgibt (nur der Zeitpunkt, in try/catch). Ohne Merker steht nur „SPiRALCELLS“ da. Der Punkt öffnet das Netz; nennt sein Satz eine Ankunft, öffnet er den Mond der jüngsten Ankunft mit `von=kinos`.
- **Sichten:** Sternwerft, Inselkarte, Gezeiten und Claudes Übersicht stehen als „Entwürfe für den Eingang“ darin, nur verlinkt und ohne Wahl.
- **Umschalten:** Ein Weg führt zurück zu AiHDS OS. Hinüber geht es ohne Eingriff in AiHDS OS: über `KIN-OS-STARTEN.command` und eine Tür „KiN OS“ im Netz des Lichtwerks (Liste `UMGEBUNG`), die nur leuchtet, wenn der Fork läuft. Der Fork-Port kommt in die Sperrliste des Lichtwerks (Z.359). Einen Link in AiHDS OS gibt es nur, wenn Ralf ihn ausdrücklich will.
- **Geerbte Mängel:** Der Raum Formen schreibt die Werkkennung in die Adresszeile (`rahmen.js` Z.132 und 137), die Leiste hat ein Suchfeld (`aios.html` Z.14). Im Fork steht dort ein lesbarer Werkname, und das Suchfeld ist aus. Passt das nicht mehr in die Sitzung, steht es als bekannter Mangel in `PROMPT-KIN-OS-FORK.md`.
