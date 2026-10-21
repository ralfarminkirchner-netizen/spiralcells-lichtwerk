# Weitermachen: SPiRALCELLS-Lichtwerk, Zweig `gewebe`

Stand 21.10.2026, vormittags. Ralf musste den Rechner herunterfahren.

## Wo die Arbeit liegt

- **Arbeitskopie:** `/Volumes/ThunderBolt4_2TB/Development/Projects/spiralcells-lichtwerk-gewebe`, Git-Zweig `gewebe`.
- **Ralfs `app/` in `spiralcells-lichtwerk` ist unverändert.** Nichts ist live.
- **Keine Server gestartet.** 8401, 8411, 8418, 8419 und 8420 laufen nicht.
- **Testkopie:** frische Kopie des echten Bestands in `spiralcells-lichtwerk/testdaten/kette-gewebe/state.json`, noch unbenutzt.

## Ralfs Kritik, die alles bestimmt

FASKA ist Ralfs Arbeitgeber und einer der größten Überordner. SPiRALCELLS kennt aber nur 89 flache, gleichrangige Werke. Darunter stehen 13 FASKA-Apps einzeln. Durkheim ist nur ein Leseauszug aus der Moonfingers-Quellenübernahme.

Ralf will sein System hierarchisch korrekt: **die Zentrale als Mitte**, darum Dächer, darin Bereiche und Werke. Lesematerial hängt an seinem Werk. Nichts darf vermischt werden; das gilt besonders für den Phänomenatlas.

Der Mac-Katalog `/Volumes/ThunderBolt4_2TB/00-START-HIER-MAC-ORDNUNG/KATALOG.tsv` (177 Projekte, Juli, von einem Agenten angelegt) vermischt selbst. Seine Familie „ADHS-OS-FASKA“ enthält den ADHS-OS-Vault und FASKA zusammen. Viele spätere FASKA-Ordner fehlen darin, einen Phänomenatlas-Bereich gibt es nicht.

## Was gebaut ist (nur in `gewebe`, ungeprüft im Browser)

- `app/js/wuchs.js`: Abstammung je Werk als Raum. Ketten, Gabeln (erweitert/remixt-aus), Fächer und Keim kommen aus dem Rundenbriefing. „Reihe“ ist die Reihenfolge einer Übernahme und keine Entwicklung. Gegenlese ist Gewebe.
- `app/js/zelle.js`: Ranken statt einer Bahn, Stiele, Gabelknoten, Gegenlese-Fäden, eine Hülle nach innerer Gestalt und Krümmung nach dem Kopplungswinkel.
- `app/js/ordnung.js`: Mitte, Dächer, Bereiche, Werke und Lesematerial, mit Lage im Raum. Die Daten kommen aus `ordnung.json`, die es **noch nicht gibt**. Ohne sie steht alles „ohne Dach“.
- `app/js/netz.js`: das Netz als Zelle aus Zellen. Die Zentrale ist die Mitte, die Dächer haben Hüllen und Namen, und man kann in ein Dach hineinfahren. Die Fäden sind gerichtet und typisiert, mit Knoten für Verwendungen.
- Dazu Änderungen an `regie.js`, `welt.js`, `haupt.js`, `bedienung.js`, `index.html` und `stil.css`. Der Server hat einen Leseweg `/lichtwerk/ordnung`.
- Test: `tests/wuchs.test.mjs` hat 7 Tests, alle bestanden. Die Node-Probe lief mit allen 89 Werken.

## Nächste Schritte

1. Ergebnis der Erhebung „ralfs-systemordnung“ holen. Lief sie beim Herunterfahren nicht zu Ende, neu starten. Skript unter `~/.claude/projects/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/workflows/scripts/`.
2. Aus belegten Quellen einen Vorschlag für `ordnung.json` machen. Ralf zeigen und bestätigen lassen. **Nicht aus Namen raten.**
3. Die Testkette 8419 → 8418 auf `kette-gewebe` starten und im Browser prüfen.
4. Danach kommen der Materialraum (Lesen, Vergleich, Passagen, Rückkehr) und die Kritikrunde.
