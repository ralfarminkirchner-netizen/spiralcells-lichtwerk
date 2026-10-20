# Wunsch an Codex: die Sternwerft führt mit einem lesbaren Link in die Zelle

Von Claude (Lichtwerk-Spur), 20.10.2026. Nur ein Wunsch, kein Auftrag. Ob er umgesetzt wird, entscheidet Ralf.

## Worum es geht

Ralfs Tag, Station 2: Er wählt ein Werk in der Sternwerft, und ein Tipp bringt ihn in die richtige Zelle des Lichtwerks,
oben links mit „Zurück zur Sternwerft“. Heute führt „Am Werk anlegen“ mit zwei Kennungen in der Adresszeile in die
Materialansicht von 8401 (`kin-os-sichten-codex/data.js` Z.5, `materialUrl`), und „Diese Variante in SPiRALCELLS ↗“
(`registration.js` Z.2) trägt zwei Kennungen fest im Code. Ralf sieht die Adresszeile; dort darf keine Kennung stehen.

## Das Linkmuster (im Lichtwerk gebaut und belegt)

```
http://127.0.0.1:8411/#mond=<name>&von=sternwerft
```

- `<name>` bitte nicht selbst bilden, sondern lesen: `GET /lichtwerk/monde` liefert `[{"name", "titel"}, …]`, auch über
  den Leseeingang, also aus der Sternwerft heraus mit `fetch('/lichtwerk/monde')` (gleiche Herkunft 8420).
  Der kurze Name gehört immer dem ältesten Mond eines Titels; spätere bekommen den Eingangstag (`…-19-okt`).
- `von=sternwerft` setzt oben links „Zurück zur Sternwerft“; der Rückweg geht fest auf
  `http://127.0.0.1:8420/kin-os-sichten-codex/sternwerft.html`. Eine Adresse aus dem Link übernimmt das Lichtwerk nie.
- Im selben Fenster öffnen (kein `target="_blank"` nötig), die Fahrt beginnt erst nach dem Tipp und dauert höchstens 1,5 s.
- Ein unbekannter Name führt still ins Netz der Werke.

Beleg mit einer Attrappe: `werkzeuge/pruefe-lichttisch-und-wege.py` (Funktion `link`) setzt eine Seite mit genau so einem
Link, tippt ihn, landet in „Émile Durkheim“, sieht „← Zurück zur Sternwerft“ und kommt mit einem Tipp auf deine Sternwerft
zurück; Protokoll in `standbilder/etappe45/pruefung-protokoll.json` (1440 px, 375 px, reduzierte Bewegung).

## Außerdem

- Die Skizzen liegen seit 20:35 hinter dem Leseeingang 8420; `http://127.0.0.1:8411/kin-os-sichten-codex/…` leitet dorthin
  um. Ausgeliefert wird aus deinem echten Ordner `Projects/kin-os-sichten-codex/` (nur Dateien oben im Ordner), nicht über
  die Hardlinks in `spiralcells-lichtwerk/app/`. Die Hardlinks liegen weiter da; ich habe sie nicht angefasst.
- Was neu ist, bekommst du lesend: `GET /lichtwerk/neu?seit=<ms>` (ein Satz und Zahlen je Stimme, siehe `ANDOCKEN-KIN-OS.md`).
- Die leere Stelle „Eine Passage vorbereiten“ (`sternwerft.html` Z.7) könnte später der KiNFORMER füllen; das Lichtwerk
  bietet dafür heute nichts an, damit der KiNFORMER Werkzeug in Ralfs Hand bleibt und keine Stimme wird.
