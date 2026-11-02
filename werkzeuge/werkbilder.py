"""Werkbilder: von jedem Werk mit statischem Einstieg ein echtes Bild seines jetzigen Stands, nur lesend.

    /usr/bin/python3 werkzeuge/werkbilder.py <graph.json> <zielordner> [--nur TEXT] [--warten SEK]

Liest die Werke aus dem Graphen (GET /lichtwerk/graph), sucht je Werk den Einstieg
(index.html im Quellordner, sonst dist/, build/, public/, docs/), öffnet ihn kopflos mit file://,
wartet, nimmt ein Bild und prüft, ob es leer ist. Schreibt <zielordner>/bilder/<nr>.jpg
und <zielordner>/werkbilder.json. Jedes Werk steht darin genau einmal, mit Stand:
  ok            Bild vorhanden
  leer          geöffnet, aber nur Hintergrund (nicht als Bild verwenden)
  fehler        Seite meldet Fehler, Bild nur wenn nicht leer
  kein-einstieg kein statischer Einstieg (braucht Bau oder Server): benannte Lücke
  kein-ordner   Quelle ist keine Datei oder Ordner auf diesem Rechner
Startet keinen Dienst, baut nichts, ändert keine Quelle. Das Bild ist ein Beleg des Stands zur Aufnahmezeit,
keine Auswahl des Repräsentativen: das wählt Ralf.
"""
import json
import mimetypes
import os
import sys
import time
from datetime import datetime

from playwright.sync_api import sync_playwright

# gebauter Stand zuerst: eine index.html im Hauptordner eines Vite-Projekts ist nur Quelltext
KANDIDATEN = ["dist/index.html", "build/index.html", "index.html", "public/index.html", "docs/index.html", "app/index.html", "web/index.html"]
GROESSE = (1280, 800)


def einstieg(loc):
    p = loc.split("#")[0]
    if not p or p.startswith("http"):
        return None, "kein-ordner"
    if os.path.isfile(p) and p.lower().endswith((".html", ".htm")):
        return p, None
    base = p if os.path.isdir(p) else None
    if not base:
        return None, "kein-ordner"
    for k in KANDIDATEN:
        f = os.path.join(base, k)
        if os.path.isfile(f):
            return f, None
    return None, "kein-einstieg"


TYPEN = {".js": "text/javascript", ".mjs": "text/javascript", ".jsx": "text/javascript", ".json": "application/json", ".wasm": "application/wasm",
         ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".glb": "model/gltf-binary", ".html": "text/html"}


def ausliefern(seite, wurzel):
    """Dateien des Werks unter http://werk.test/ aus dem Ordner liefern: ohne Server, ohne Port, nur lesend."""
    def hole(route):
        pfad = os.path.normpath(os.path.join(wurzel, route.request.url.split("http://werk.test/", 1)[1].split("?")[0].split("#")[0].lstrip("/")))
        if pfad.startswith(os.path.normpath(wurzel)) and os.path.isfile(pfad):
            route.fulfill(path=pfad, content_type=TYPEN.get(os.path.splitext(pfad)[1].lower()) or mimetypes.guess_type(pfad)[0] or "application/octet-stream")
        else:
            route.fulfill(status=404, body="")
    seite.route("http://werk.test/**", hole)


def main(argv):
    graph, ziel = argv[0], argv[1]
    nur = argv[argv.index("--nur") + 1].lower() if "--nur" in argv else None
    warten = float(argv[argv.index("--warten") + 1]) if "--warten" in argv else 3.5
    werke = json.load(open(graph))["works"]
    os.makedirs(os.path.join(ziel, "bilder"), exist_ok=True)
    manifest = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True, args=["--allow-file-access-from-files", "--autoplay-policy=no-user-gesture-required"])
        for nr, w in enumerate(werke):
            titel = w.get("title") or "Unbenanntes Werk"
            if nur and nur not in titel.lower():
                continue
            loc = ((w.get("source_ref") or {}).get("locator") or "")
            datei, grund = einstieg(loc)
            eintrag = {"nr": nr, "werk": w["id"], "titel": titel, "quelle": loc, "einstieg": datei, "stand": grund or "?", "bild": None, "meldungen": []}
            if datei:
                seite = browser.new_page(viewport={"width": GROESSE[0], "height": GROESSE[1]})
                seite.on("console", lambda m, e=eintrag: e["meldungen"].append(m.text[:160]) if m.type == "error" else None)
                seite.on("pageerror", lambda x, e=eintrag: e["meldungen"].append("Seitenfehler: %s" % str(x)[:160]))
                try:
                    wurzel = os.path.dirname(datei)   # absolute Pfade wie /assets/… zeigen auf den Ordner des Einstiegs
                    ausliefern(seite, wurzel)
                    seite.goto("http://werk.test/" + os.path.relpath(datei, wurzel), wait_until="load", timeout=20000)
                    time.sleep(warten)
                    pfad = os.path.join(ziel, "bilder", "%03d.jpg" % nr)
                    seite.screenshot(path=pfad, type="jpeg", quality=80)
                    gross = os.path.getsize(pfad)
                    # eine leere oder einfarbige Seite wird sehr klein: so ein Bild zeigen wir nicht
                    if gross < 14000:
                        eintrag["stand"] = "leer"
                        os.remove(pfad)
                    else:
                        eintrag["stand"] = "fehler" if eintrag["meldungen"] else "ok"
                        eintrag["bild"] = "bilder/%03d.jpg" % nr
                        eintrag["aufgenommen"] = datetime.now().isoformat(timespec="seconds")
                        eintrag["quelle_geaendert"] = datetime.fromtimestamp(os.path.getmtime(datei)).isoformat(timespec="seconds")
                except Exception as x:
                    eintrag["stand"] = "fehler"
                    eintrag["meldungen"].append("Öffnen gescheitert: %s" % str(x)[:160])
                seite.close()
            manifest.append(eintrag)
            print("%3d  %-14s %s" % (nr, eintrag["stand"], titel[:60]), flush=True)
        browser.close()
    json.dump({"erstellt": datetime.now().isoformat(timespec="seconds"), "werke": manifest}, open(os.path.join(ziel, "werkbilder.json"), "w"), ensure_ascii=False, indent=1)
    zaehl = {}
    for e in manifest:
        zaehl[e["stand"]] = zaehl.get(e["stand"], 0) + 1
    print(zaehl)


if __name__ == "__main__":
    main(sys.argv[1:])
