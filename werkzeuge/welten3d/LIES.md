# Lichtgrund · Welten in 3D

Erste Welt: **Galaxie** (`app/welten3d.html`). Quelle `werkzeuge/welten3d/galaxie.js`, gebündelt mit `node werkzeuge/welten3d/baue.mjs` nach `app/welten3d/galaxie.bundle.js` (three.js 0.187 aus `werkzeuge/neu/node_modules`, dort als Verweis auf den Lichtgrund-Arbeitsbaum).

Start: `python3 server/lichtwerk_server.py --port 8491 --spiralcells http://127.0.0.1:8474`, dann `http://localhost:8491/welten3d.html`.
Daten: dieselbe Schicht wie die Karten (`app/werkansichten/inhalt.js`, `bezug.js`). Adresse `#galaxie/<weg>?q=…`, die Wahl geht in die Karten mit.
Aufnahmen und Messung: `Artifacts/lichtgrund-welten-3d-20261111/aufnahme.py`, `fahrt.py`.
