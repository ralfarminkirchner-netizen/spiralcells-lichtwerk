# Andocken an das Lichtwerk: wie KiN OS und die Sternwerft SPiRALCELLS erreichen

Stand 20.10.2026, abends. Von Claude (Lichtwerk-Spur). Gilt für den KiN-OS-Fork der Zentrale, für Codex' Sternwerft
und für jede andere Oberfläche, die in eine Zelle führen will.

## Grundsatz

- KiN OS liest SPiRALCELLS **nur über das Lichtwerk** und schreibt dort nichts. Für Ralfs Wege schreibt in
  SPiRALCELLS allein die Lichtwerk-Schleuse, in seinem Namen und nur, wenn er im Bild hält.
- Keine Kennung in der Adresszeile, im Text oder in Beschriftungen. Links tragen lesbare Namen.
- Der Browser einer fremden Oberfläche ruft das Lichtwerk nicht per `fetch` (die CSP des Lichtwerks erlaubt nur
  `'self'`). Fremde Oberflächen verlinken; lesende Daten holt ihr eigener Server.

## 1 · Der Link in eine Zelle

```
http://127.0.0.1:8411/#mond=<name>&von=<herkunft>
```

- `<name>` ist der lesbare Name eines Monds: der Titel klein, Umlaute als ae/oe/ue/ss, Akzente weg, alles andere
  ein Strich, höchstens 60 Zeichen. Beispiel: „Zentrale · Material bekommt Form“ → `zentrale-material-bekommt-form`.
- **Der kurze Name gehört immer dem ältesten Mond dieses Titels.** Ein späterer Mond mit gleichem Titel bekommt seinen
  Eingangstag in Berliner Zeit (`…-19-okt`), am selben Tag dazu die Uhrzeit (`…-19-okt-1405`). So bleiben alte Links heil.
- Die gültigen Namen liefert das Lichtwerk lesend: `GET http://127.0.0.1:8411/lichtwerk/monde` →
  `[{"name": "zentrale-material-bekommt-form", "titel": "Zentrale · Material bekommt Form"}, …]`
  (auch über den Leseeingang 8420). Bitte die Namen von dort nehmen und nicht selbst nachbauen.
- Ein unbekannter Name führt still ins Netz der Werke.
- `<herkunft>` kennt nur feste Werte, jeder mit fester Rückadresse; eine Adresse aus dem Link wird nie übernommen:

| `von` | oben links | Rückweg |
|---|---|---|
| `sternwerft` | „Zurück zur Sternwerft“ | `http://127.0.0.1:8420/kin-os-sichten-codex/sternwerft.html` |
| `kinos` | „Zurück zu KiN OS“ | `http://127.0.0.1:8895/` (der Fork, sobald er läuft) |

- Die Fahrt in die Zelle beginnt erst nach Ralfs Tipp auf den Link, dauert höchstens 1,5 Sekunden und bricht bei
  Berührung oder Esc ab. Bei reduzierter Bewegung ist sie ein Schnitt.
- Ein Link öffnet im selben Fenster (die CSP der Zentrale sperrt Rahmen; das Lichtwerk will nicht gerahmt werden).

## 2 · Was neu ist: der Leseweg für den Leistenpunkt

```
GET http://127.0.0.1:8411/lichtwerk/neu?seit=<Zeitpunkt>
```

- `seit` in Millisekunden seit 1970 (UTC) oder als ISO-Zeit. Ohne `seit` ist nichts neu.
- Antwort, auf dem Server aus dem Graphen berechnet, Zeiten als UTC verglichen:
  `{"satz": "Seit deinem letzten Besuch eingetragen: zwei Ausprägungen von Codex.", "zahl": 2,
    "stimmen": [["Codex", 2]], "uebernahmen": 0, "faeden": 0, "befunde": 0, "monde": 1, "mond": "<name>"}`
  `mond` ist der lesbare Name des Monds mit der jüngsten Ankunft (oder `null`).
- Neu ist nur, was nach `seit` **eingetragen** wurde. Ralfs eigene Einträge und seine behaltenen Formen gelten nie als
  neu. Statuswechsel bleiben unsichtbar, bis SPiRALCELLS sie mit Zeit und Urheber belegt
  (`WUNSCH-an-codex-statusbeleg.md`). Kommen mehr als zwölf Ausprägungen einer technischen Übernahme auf einmal,
  steht ein Satz statt einzelner Ankünfte.
- Ist nichts dazugekommen: `"satz": "Seit deinem letzten Besuch ist nichts dazugekommen."` Das Bild bleibt still.
- `/api/changes?since=` von SPiRALCELLS bitte nicht dafür nehmen: Es liefert nur Neueinfügungen und vergleicht die
  Zeit als Text.
- Den Zeitpunkt „zuletzt in KiN OS“ merkt sich der Browser des Forks selbst (nur den Zeitpunkt, in try/catch) und
  gibt ihn seinem Server mit. Nennt der Satz eine Ankunft, öffnet der Leistenpunkt den Mond der jüngsten Ankunft
  mit `von=kinos`; sonst das Netz.

## 3 · Der KiNFORMER im Fork

- Er ist eine Werkstatt, keine Stimme und kein Ort. Gerufen wird er nur vom Server aus, ohne `Origin`
  (`formformer/server.py` Z.82–88 lässt das zu, Browser nicht).
- Formen in KiN (Art `kinformer_form`) schreibt heute nur die Zentrale. Der Fork markiert seine eigenen
  (`request_id` mit `kinos-`, `ref` mit `kinos:`, `metadata` mit `"kinos"`), sonst antwortet KiN bei gleichem Stoff
  mit 409 und die Herkunft wäre nicht mehr unterscheidbar.
- Kosten fest aus: `verstehen()`, `beschreiben()` und `_claude()` geben im Fork „ruht“ zurück, ohne Netz.
- Der Herkunftssatz des KiNFORMER („Der Wortlaut ist unverändert übernommen“) stimmt bei Plakat, Spiel und
  Schaubild nicht. Das Lichtwerk ersetzt ihn durch einen ehrlichen (`was_blieb` in `server/lichtwerk_server.py`).
  Der Fork sollte dasselbe tun, bis Ralf entscheidet, ob der KiNFORMER es selbst sagt.

## 4 · Was das Lichtwerk dafür bietet

| Weg | Art | Auf |
|---|---|---|
| `GET /lichtwerk/monde` | lesbare Namen und Titel aller Monde | 8411 und 8420 |
| `GET /lichtwerk/neu?seit=…` | Satz und Zahlen zu den Ankünften | 8411 und 8420 |
| `GET /api/graph`, `/lichtwerk/graph`, `/lichtwerk/stand`, `/api/agents`, `/api/health` | lesend durchgereicht | 8411 und 8420 |
| `/#mond=<name>&von=<herkunft>` | Link in die Zelle mit Rückweg | 8411 |
| alles, was schreibt | nur aus dem Lichtwerk selbst, mit Ralfs Halten | nur 8411 |
