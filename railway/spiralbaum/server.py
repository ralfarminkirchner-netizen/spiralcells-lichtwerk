"""Der Spiralbaum im Netz (Ralf, 09.11.2026: „auch auf Railway“, „alles ohne Passwort“).

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
TYPEN = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
         ".json": "application/json", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon"}


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


CSP = ("default-src 'self'; img-src 'self' data:; connect-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; "
       "font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")
if _apps_herkuenfte():
    CSP += "; frame-src " + _apps_herkuenfte()

with open(os.path.join(DATEN, "gespraeche.json"), encoding="utf-8") as f:
    GESPRAECHE = json.load(f)


class Spiralbaum(BaseHTTPRequestHandler):
    server_version = "Spiralbaum"
    sys_version = ""

    def log_message(self, *a):
        pass

    def _senden(self, status, daten, typ, cache="public, max-age=300"):
        self.send_response(status)
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

    def _datei(self, pfad, cache="public, max-age=300"):
        try:
            with open(pfad, "rb") as f:
                self._senden(200, f.read(), TYPEN.get(os.path.splitext(pfad)[1].lower(), "application/octet-stream"), cache)
        except OSError:
            self._nicht()

    def _nicht(self):
        self._senden(404, json.dumps({"satz": "Hier liegt nichts."}, ensure_ascii=False).encode(), "application/json")

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        t = urlsplit(self.path)
        p, q = t.path, parse_qs(t.query)
        if p in ("/", "/index.html", "/stufen.html"):
            return self._datei(os.path.join(APP, "stufen.html"), "no-cache")
        if p == "/api/graph":
            return self._datei(os.path.join(DATEN, "graph.json"))
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
        ziel = os.path.realpath(os.path.join(APP, p.lstrip("/")))
        if ziel.startswith(os.path.realpath(APP) + os.sep) and os.path.isfile(ziel):
            return self._datei(ziel)
        self._nicht()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    print(f"Spiralbaum auf Port {port}", flush=True)
    ThreadingHTTPServer(("0.0.0.0", port), Spiralbaum).serve_forever()
