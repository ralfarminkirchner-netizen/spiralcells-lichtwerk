"""Lichtgrund im Netz: der Spiralbaum und alle anderen Ansichten desselben Inhalts (Ralf, 09.11.2026: „auch auf
Railway“, „alles ohne Passwort“, „Ja, alle aufs Netz“).

Ein kleiner Server, der nur liest: Er liefert die Seite des Spiralbaums und eine Momentaufnahme aus dem Ordner
daten/ (Fundus-Graph, Bilder der Fassungen, Gespräche), die werkzeuge/spiralbaum-standbild.py auf dem Mac baut.
Kein Schreibweg, kein Weiterleiten an andere Dienste, nur GET und HEAD. Nur Standardbibliothek.

    PORT=8080 python3 server.py
"""
import hashlib
import json
import os
import re
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlsplit, parse_qs

HIER = os.path.dirname(os.path.abspath(__file__))
APP, DATEN = os.path.join(HIER, "app"), os.path.join(HIER, "daten")
TYPEN = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
         ".css": "text/css; charset=utf-8", ".json": "application/json", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
         ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".glb": "model/gltf-binary",
         ".gltf": "model/gltf+json", ".bin": "application/octet-stream", ".hdr": "application/octet-stream",
         ".ktx2": "image/ktx2", ".wasm": "application/wasm", ".txt": "text/plain; charset=utf-8"}


def _apps_herkuenfte():
    try:
        with open(os.path.join(APP, "stufen-apps.json"), encoding="utf-8") as f:
            d = json.load(f)
    except (OSError, ValueError):
        return ""
    herk = set()
    for a in d.get("werke", []) + d.get("bekannt", []):
        m = re.match(r"^https://([A-Za-z0-9.-]+)(?:/|$)", str(a.get("url", "")))
        if a.get("einbetten") and m:
            herk.add("https://" + m.group(1))
    return " ".join(sorted(herk))


# Die großen Modelle und Stoffe der Welten liegen unverändert im öffentlichen Repo; das Standbild nennt die Quelle
# (daten/neu-quelle.json) und lädt sie nicht mit hoch, damit das Hochladen nicht nach Zeit abbricht
try:
    with open(os.path.join(DATEN, "neu-quelle.json"), encoding="utf-8") as f:
        NEU_QUELLE = str(json.load(f).get("basis") or "")
except (OSError, ValueError):
    NEU_QUELLE = ""
if not re.match(r"^https://raw\.githubusercontent\.com/[A-Za-z0-9._/-]+/$", NEU_QUELLE):
    NEU_QUELLE = ""
FERN = " https://raw.githubusercontent.com" if NEU_QUELLE else ""
NEU_FERN = re.compile(r"^/neu/(modelle/[A-Za-z0-9_.-]+\.glb|stoffe/[A-Za-z0-9_]+/[a-z]+\.jpg|himmel\.hdr)$")

CSP = (f"default-src 'self'; img-src 'self' data: blob:{FERN}; connect-src 'self' blob:{FERN}; style-src 'self' 'unsafe-inline'; script-src 'self'; "
       "font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")
if _apps_herkuenfte():
    CSP += "; frame-src " + _apps_herkuenfte()

with open(os.path.join(DATEN, "gespraeche.json"), encoding="utf-8") as f:
    GESPRAECHE = json.load(f)
try:
    with open(os.path.join(DATEN, "stand.json"), encoding="utf-8") as f:
        STAND = str(json.load(f).get("stand") or "")
except (OSError, ValueError):
    STAND = ""
# Was auf dem Mac nur dort erreichbar ist (KiN OS, KiNFORMER …), gibt es im Netz nicht; die Seiten zeigen dann nichts dazu
STILL = {"/lichtwerk/umgebung": b"[]"}


class Spiralbaum(BaseHTTPRequestHandler):
    server_version = "Spiralbaum"
    sys_version = ""

    def log_message(self, *a):
        pass

    def _senden(self, status, daten, typ, cache="public, max-age=300", kopf=None):
        self.send_response(status)
        for k, v in (kopf or {}).items():
            self.send_header(k, v)
        self.send_header("Content-Type", typ)
        self.send_header("Content-Length", str(len(daten)))
        self.send_header("Cache-Control", cache)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        if typ.startswith("text/html"):
            self.send_header("Content-Security-Policy", CSP)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(daten)

    def _datei(self, pfad, cache="public, max-age=300", kopf=None):
        try:
            with open(pfad, "rb") as f:
                self._senden(200, f.read(), TYPEN.get(os.path.splitext(pfad)[1].lower(), "application/octet-stream"), cache, kopf)
        except OSError:
            self._nicht()

    def _nicht(self):
        self._senden(404, json.dumps({"satz": "Hier liegt nichts."}, ensure_ascii=False).encode(), "application/json")

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        t = urlsplit(self.path)
        p, q = t.path, parse_qs(t.query)
        if p in ("/", "/stufen.html"):
            return self._datei(os.path.join(APP, "stufen.html"), "no-cache")
        if p in ("/api/graph", "/lichtwerk/graph"):
            return self._datei(os.path.join(DATEN, "graph.json"), "public, max-age=300", {"X-Stand": STAND} if STAND else None)
        if p == "/lichtwerk/stand":
            return self._senden(200, json.dumps({"wach": True, "stand": STAND}).encode(), "application/json", "no-cache")
        if p == "/lichtwerk/ordnung":
            return self._datei(os.path.join(DATEN, "ordnung.json"))
        if p == "/lichtwerk/formen/richtungen":
            return self._datei(os.path.join(DATEN, "richtungen.json"))
        if p in STILL:
            return self._senden(200, STILL[p], "application/json")
        if p == "/lichtwerk/vault-source":   # die Vault liegt auf dem Mac; wie dort, wenn sie ruht
            return self._senden(503, json.dumps({"satz": "Die Vault ist im Netz nicht dabei."}, ensure_ascii=False).encode(), "application/json", "no-store")
        if p == "/lichtwerk/bilder":
            return self._datei(os.path.join(DATEN, "bilder.json"))
        if p == "/lichtwerk/gespraeche":
            return self._datei(os.path.join(DATEN, "gespraeche.json"))
        if p == "/lichtwerk/gespraech":
            n = (q.get("n") or [""])[0]
            if not n.isdigit():
                return self._nicht()
            return self._datei(os.path.join(DATEN, "gespraech", n + ".json"))
        if p == "/lichtwerk/bild":
            pfad, w = (q.get("pfad") or [""])[0], (q.get("w") or ["240"])[0]
            name = hashlib.sha256(("/" + pfad.lstrip("/")).encode("utf-8")).hexdigest()[:32] + "-" + ("960" if w == "960" else "240") + ".jpg"
            return self._datei(os.path.join(DATEN, "bilder", name), "public, max-age=86400")
        m = NEU_FERN.match(p)
        if m and NEU_QUELLE and not os.path.isfile(os.path.join(APP, p.lstrip("/"))):
            self.send_response(302)
            self.send_header("Location", NEU_QUELLE + "app/neu/" + m.group(1))
            self.send_header("Cache-Control", "public, max-age=86400")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        ziel = os.path.realpath(os.path.join(APP, p.lstrip("/")))
        if ziel.startswith(os.path.realpath(APP) + os.sep) and os.path.isfile(ziel):
            return self._datei(ziel)
        self._nicht()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    print(f"Spiralbaum auf Port {port}", flush=True)
    ThreadingHTTPServer(("0.0.0.0", port), Spiralbaum).serve_forever()
