"""Übernimmt die Aufnahmen aus werkbilder.py in die Seite: verkleinert die brauchbaren Bilder und schreibt eine knappe
app/neu/werkbilder/index.json (Werk → Bild, Stand der Aufnahme). Nichts davon verändert ein Werk.

    /usr/bin/python3 werkzeuge/werkbilder-uebernehmen.py <aufnahmeordner>
"""
import json
import os
import subprocess
import sys

quelle = sys.argv[1]
ziel = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app", "neu", "werkbilder")
os.makedirs(ziel, exist_ok=True)
m = json.load(open(os.path.join(quelle, "werkbilder.json")))["werke"]
index = {}
for e in m:
    if e["stand"] != "ok" or not e["bild"]:
        continue   # "fehler" und "leer" zeigen wir nicht: ein Bild mit Fehlerseite wäre eine falsche Auskunft über das Werk
    name = "%03d.jpg" % e["nr"]
    subprocess.run(["/opt/homebrew/bin/ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(quelle, e["bild"]), "-vf", "scale=640:-2", "-q:v", "4", os.path.join(ziel, name)], check=True)
    index[e["werk"]] = {"bild": name, "aufgenommen": e["aufgenommen"], "quelle_geaendert": e["quelle_geaendert"]}
json.dump(index, open(os.path.join(ziel, "index.json"), "w"), ensure_ascii=False, indent=1)
print(len(index), "Bilder übernommen")
