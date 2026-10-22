# Alsformen im Licht

22.10.2026 · Claude · Zweig `alsformen` (aufgebaut auf `gewebe` mit den neun bestätigten Dächern) · Arbeitskopie `spiralcells-lichtwerk-alsformen`

## Was du siehst

Ralfs Gedanke vom 22.10. wird im Lichtwerk wörtlich genommen: Werke sind Planeten, die Dächer ihre Sonnensysteme, und Monde sind, was um ein Thema kreist. Derselbe Mond kann an vielen Planeten sein, einmal gespeichert. Planeten entstehen aus Monden.

- **Ein Gegenstand, viele Orte.** Nimmt ein Werk an einem anderen teil (Codex' „Teilnahme“), kreist es dort als kleiner Mond. Der Mond trägt das Lichtmuster seines Werks im Kleinen, nicht nur dessen Farbe.
  - Alle Erscheinungen desselben Gegenstands stehen in **derselben Phase** und atmen im selben Takt. Es ist ein Gegenstand, nur an mehreren Orten.
  - Die Bahn neigt sich nach der Rolle (Quelle, Gegenbeispiel, Instrument …). Die Rolle wechselt, die Identität nicht.
  - Aktiv leuchtet voll. Ein Vorschlag ist nur ein Umriss. Eine Rücknahme bleibt als Asche auf gebrochener Bahn sichtbar, sobald man den Gegenstand oder den Zusammenhang ansieht. Gelöscht wird nichts.
- **Der Verschränkungsfaden** verbindet den Gegenstand mit seinen Erscheinungen. Er ist eine stehende Welle; Lichtpaare entstehen in seiner Mitte und kommen an beiden Enden zugleich an. Er ist kein Materialfluss und keine Herkunft (die warmen Materialfäden bleiben, was sie waren).
- **A: als Mond.** Der Blick fasst den Gegenstand und alle Zusammenhänge, in denen er teilnimmt. Die Schilder nennen die Rolle („als Quelle“, „als Gegenbeispiel · vorgeschlagen“).
- **P: als Planet.** Derselbe Gegenstand wird Mitte. Um ihn kreist, was in ihm teilnimmt. Über ihm steigt seine **Entstehung als Kelch** auf: unten am Kern die zuerst aufgezeichnete Spur, oben die jüngste. Materie sinkt langsam hinein.
  - Jede Spurart hat ihre Gestalt: Originalspur warm mit Faden in den Kern, Werkstück hell und voll, Begegnung zwei Lichter, Erprobung flackernd, spätere Deutung mit Silberring, Gegenbefund als Asche mit gebrochenem Faden zur widersprochenen Spur, offene Lücke als leerer Ring, Vorschlag als Umriss, weitere Verwendung mit Lichtern nach außen.
  - **Drei Zeiten bleiben getrennt.** Eine bekannte Ereigniszeit verankert die Spur mit einem Stiel im Boden; eine offene schwebt. Geordnet wird nach der Aufzeichnung, der einzigen Zeit, die immer bekannt ist; die Bildzeile sagt das.
- **Lesen.** Zweimal tippen öffnet die Lesefläche im Lichtwerk-Stil. Bei einer Teilnahme stehen dort Gegenstand, Zusammenhang, gebundene Fassung, die Begründung und bei einer Rücknahme deren Grund *und* die ursprüngliche Begründung. Bei einer Spur stehen dort ihr Text, drei Zeiten, Bedingungen, gebundene Fassungen und Widersprüche.
  - Bei jedem Eintrag steht ausdrücklich, dass es ein Modellbeitrag ohne menschliche Bestätigung ist.
  - **„Gebundene Originalstelle öffnen ↗“** führt in die Lebensspirale an Quelle, Revision, genaue Passage und Fassung. Geprüft wird wie in SPiRALCELLS (`quelle.js` = `source-links.js`). Ohne geprüften Weg steht nur der ehrliche Satz.
  - Technische Details sind geschlossen und öffnen nie von selbst.
- **Wege.** Jede gebundene Fassung führt in ihre Zelle, und der Rückweg oben links führt zurück in denselben Blick.
- **Links.** `#mond=…&als=mond` und `#mond=…&als=planet` sind lesbare Links ohne Kennung.
- **Tastatur.** A, P, Pfeile durch Gegenstand, Erscheinungen und Spuren, Escape hinaus. Am Handy führen zwei leise Wege an der Marke („Zusammenhänge zeigen →“, „Als Planet: Entstehung →“).

## Nur lesen

Das Lichtwerk schreibt hier nichts. Teilnahmen anlegen oder zurücknehmen geht weiter über SPiRALCELLS, die Formulare von Codex auf 8401. Ein Halten-Weg im Licht wäre der nächste Schritt; er braucht einen eigenen Schreibweg im Lichtwerk-Server (`/api/participations`, `/withdraw`) nur in Ralfs Namen. Er ist nicht gebaut.

## Geprüft (22.10., Testkette)

- **Testkette:** SPiRALCELLS auf 8419 mit einer frischen Kopie des echten Bestands (`testdaten/kette-alsformen/state.json`, `peers: []`) und das Lichtwerk dieses Zweigs auf 8418 mit `--werkstatt`. Gestartet über `extern-dev run`; die PIDs stehen in `protokolle/kette-84xx.pid`.
- **Echter Bestand unverändert:** Prüfsumme `dafee2be…` vorher und nachher.
- **Tests:** 57 von 57 Browser-Code-Tests bestanden (`node --test tests/*.test.mjs`). Neu sind 9 in `tests/alsformen.test.mjs`: Ketten und Rücknahmen, Rollenwörter, drei Zeiten, Reihenfolge und Widersprüche, Sätze ohne Kennung, Originalstelle nur auf geprüftem Weg, gleiche Phase aller Erscheinungen, Blick fasst alle Beteiligten.
  - Der Link-Test kennt jetzt `als`.
  - Der Python-Test `test_02` erwartet jetzt auch `participations` und `emergence_events`.
  - Python-Testreihe: **53 von 53 bestanden** (`extern-dev run … python3 -B -m unittest discover -s tests`, eigene Testserver auf Kopien). Der echte Bestand blieb dabei unverändert (`dafee2be…`).
- **Standbilder:** `standbilder/alsformen-01-mond-torus.jpg`, `-02-planet-originalgedanke.jpg`, `-03-mond-originalgedanke-ruecknahme.jpg`, `-04-ohne-dach-auswahl.jpg`.
- **Im Browser:** Mond-Blick, Planet-Blick, Rücknahme, Lesefläche einer Teilnahme und einer Spur mit geprüftem Link, 360 px ohne waagerechten Überlauf, keine Konsolenfehler.

## Nicht geprüft

- Echtes iPhone, Bildschirmleser, Systemeinstellung „Bewegung reduzieren“. Der Pfad ist gebaut: Bahnen stehen still, keine Lichtpaare.
- Flüssigkeit bei 60 Bildern pro Sekunde: Die Browserfläche lief verdeckt und damit gedrosselt.
- Ralfs gestalterische Abnahme.

## Offen

- Die drei Werke des Falls stehen „ohne Dach“, weil die bestätigte Ordnung sie nicht kennt. Wohin sie gehören (etwa zur Zentrale neben „Mooncells“), entscheidet Ralf.
- `gewebe` und `alsformen` sind nicht live. Live auf 8411 läuft `main`, und dort arbeitet Codex seit 15:20 ungesichert an eigenen Dateien (`lichtwege.js`, `zusammenhang.js`). Zusammenführen erst nach Absprache.
