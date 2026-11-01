"""Lichtgrund Welten für unterwegs: liefert nur Dateien aus, schreibt nichts, alles hinter einem Passwort (Umgebung PASSWORT)."""
import base64, hmac, os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PASSWORT = os.environ["PASSWORT"]
WURZEL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "oeffentlich")
CSP = ("default-src 'self'; img-src 'self' data: blob:; connect-src 'self' blob:; style-src 'self' 'unsafe-inline'; "
       "script-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")


class Lesen(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript", ".hdr": "application/octet-stream", ".glb": "model/gltf-binary"}

    def __init__(self, *a, **k):
        super().__init__(*a, directory=WURZEL, **k)

    def end_headers(self):
        self.send_header("Content-Security-Policy", CSP)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Robots-Tag", "noindex")
        super().end_headers()

    def _erlaubt(self):
        k = self.headers.get("Authorization", "")
        try:
            return k.startswith("Basic ") and hmac.compare_digest(base64.b64decode(k[6:]).decode().split(":", 1)[1], PASSWORT)
        except Exception:
            return False

    def do_GET(self):
        if not self._erlaubt():
            self.send_response(401); self.send_header("WWW-Authenticate", 'Basic realm="Lichtgrund"'); self.send_header("Content-Length", "0"); self.end_headers(); return
        if self.path in ("/", ""):
            self.path = "/welten.html"
        super().do_GET()

    def do_HEAD(self):
        self.do_GET()

    def log_message(self, *a):
        pass


ThreadingHTTPServer(("0.0.0.0", int(os.environ.get("PORT", "8080"))), Lesen).serve_forever()
