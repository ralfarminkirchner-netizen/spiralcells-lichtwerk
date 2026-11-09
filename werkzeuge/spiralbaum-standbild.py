"""Baut den Ordner, der als Spiralbaum auf Railway läuft (Ralf, 09.11.2026).

    /usr/bin/python3 -I werkzeuge/spiralbaum-standbild.py <zielordner> [http://127.0.0.1:8471]

Liest alles über das laufende Lichtwerk auf dem Mac (nur GET): den Fundus-Graphen, die Bilder der Fassungen in zwei
Schärfen (240 und 960 Pixel, wie sie Lichtwerk schon verkleinert), die Gespräche aus der Vault samt Text. Dazu kommen
der ganze Ordner app/ (alle Ansichten) und railway/spiralbaum/server.py. Der Zielordner wird ganz neu geschrieben und ist
nicht für Git gedacht; hochgeladen wird er mit „railway up“.
"""
import hashlib
import json
import os
import shutil
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote

HIER = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIEL = os.path.abspath(sys.argv[1])
QUELLE = (sys.argv[2] if len(sys.argv) > 2 else "http://127.0.0.1:8471").rstrip("/")
# alle Ansichten: der ganze app-Ordner (Baum, Welten mit ihren Modellen, Zelle und Text); handy/welt.json ist nicht in Git



def hole(weg, timeout=120):
    with urllib.request.urlopen(QUELLE + weg, timeout=timeout) as r:
        return r.read()


def main():
    if os.path.exists(ZIEL):
        shutil.rmtree(ZIEL)
    # Modelle und Stoffe der Welten (rund 70 MB) bleiben weg, wenn sie unverändert im öffentlichen Repo liegen: der Server
    # leitet dann dorthin weiter (fester Stand, kein Zweigname). Sonst kommen sie mit.
    import subprocess
    git = lambda *a: subprocess.run(["git", "-C", HIER, *a], capture_output=True, text=True)
    stand = git("rev-parse", "@{upstream}").stdout.strip()
    url = git("remote", "get-url", "origin").stdout.strip()
    m = __import__("re").search(r"github\.com[/:]([^/]+)/([^/]+?)(?:\.git)?$", url)
    gleich = bool(stand and m) and git("diff", "--quiet", stand, "--", "app/neu/modelle", "app/neu/stoffe", "app/neu/himmel.hdr").returncode == 0 \
        and not git("status", "--porcelain", "--", "app/neu").stdout.strip()
    weg = shutil.ignore_patterns(".DS_Store", "welt.json", *(("modelle", "stoffe", "himmel.hdr") if gleich else ()))
    shutil.copytree(os.path.join(HIER, "app"), os.path.join(ZIEL, "app"), ignore=weg)
    for d in ("daten/bilder", "daten/gespraech"):
        os.makedirs(os.path.join(ZIEL, d))
    if gleich:
        json.dump({"basis": f"https://raw.githubusercontent.com/{m.group(1)}/{m.group(2)}/{stand}/"}, open(os.path.join(ZIEL, "daten", "neu-quelle.json"), "w"))
    for f in ("server.py", "railway.json", "requirements.txt"):
        shutil.copy(os.path.join(HIER, "railway", "spiralbaum", f), os.path.join(ZIEL, f))
    # die Seite lädt ihre Module und Stile unter diesen Wegen
    for weg, name in (("/lichtwerk/ordnung", "ordnung.json"), ("/lichtwerk/formen/richtungen", "richtungen.json"), ("/lichtwerk/stand", "stand.json")):
        open(os.path.join(ZIEL, "daten", name), "wb").write(hole(weg))
    graph = hole("/api/graph")
    open(os.path.join(ZIEL, "daten", "graph.json"), "wb").write(graph)
    bilder = json.loads(hole("/lichtwerk/bilder"))
    json.dump(bilder, open(os.path.join(ZIEL, "daten", "bilder.json"), "w", encoding="utf-8"), ensure_ascii=False)
    gespraeche = json.loads(hole("/lichtwerk/gespraeche"))
    json.dump(gespraeche, open(os.path.join(ZIEL, "daten", "gespraeche.json"), "w", encoding="utf-8"), ensure_ascii=False)
    for g in gespraeche:
        open(os.path.join(ZIEL, "daten", "gespraech", f"{g['n']}.json"), "wb").write(hole(f"/lichtwerk/gespraech?n={g['n']}"))
    pfade = sorted({b["pfad"] for l in bilder.values() for b in l})
    fehlt = []

    def eins(aufgabe):
        pfad, w = aufgabe
        name = hashlib.sha256(("/" + pfad.lstrip("/")).encode("utf-8")).hexdigest()[:32] + f"-{w}.jpg"
        try:
            open(os.path.join(ZIEL, "daten", "bilder", name), "wb").write(hole(f"/lichtwerk/bild?w={w}&pfad={quote(pfad)}", 60))
        except Exception:
            fehlt.append(pfad)
    with ThreadPoolExecutor(6) as ex:
        list(ex.map(eins, [(p, w) for p in pfade for w in (240, 960)]))
    # Railway nimmt höchstens etwa 250 MB auf einmal, und bei 193 MB brach das Hochladen nach Zeit ab (Ralf, 09.11.):
    # die scharfen Bilder werden auf 480 Pixel verkleinert und stärker gepresst
    import subprocess
    scharf = [os.path.join(ZIEL, "daten", "bilder", f) for f in os.listdir(os.path.join(ZIEL, "daten", "bilder")) if f.endswith("-960.jpg")]
    with ThreadPoolExecutor(8) as ex:
        list(ex.map(lambda f: subprocess.run(["/usr/bin/sips", "-Z", "480", "-s", "formatOptions", "50", f, "--out", f], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL), scharf))
    groesse = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(ZIEL) for f in fs)
    print(f"{len(pfade)} Bilder, {len(gespraeche)} Gespräche, {len(set(fehlt))} Bilder fehlen, zusammen {groesse / 1e6:.0f} MB in {ZIEL}")


if __name__ == "__main__":
    main()
