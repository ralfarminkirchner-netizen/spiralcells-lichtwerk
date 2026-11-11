# Lichtgrund · Welten in 3D

Welten: **Galaxie** und **Garten** (`app/welten3d.html`, Wahl über `#galaxie/…` oder `#garten/…`, Lader `app/welten3d/start.js`). Quellen `werkzeuge/welten3d/galaxie.js`, `garten.js`, gemeinsamer Rahmen `rahmen.js`; gebündelt mit `node werkzeuge/welten3d/baue.mjs` nach `app/welten3d/` (three.js 0.187 als gemeinsamer Teil, aus `werkzeuge/neu/node_modules`, dort Verweis auf den Lichtgrund-Arbeitsbaum).

Start: `python3 server/lichtwerk_server.py --port 8491 --spiralcells http://127.0.0.1:8474`, dann `http://localhost:8491/welten3d.html`.
Daten: dieselbe Schicht wie die Karten (`app/werkansichten/inhalt.js`, `bezug.js`). Adresse `#galaxie/<weg>?q=…`, die Wahl geht in die Karten mit.
Aufnahmen und Messung: `Artifacts/lichtgrund-welten-3d-20261111/aufnahme.py`, `fahrt.py`.
