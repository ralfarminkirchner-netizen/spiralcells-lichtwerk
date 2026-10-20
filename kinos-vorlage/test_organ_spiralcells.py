"""Das Organ „SPiRALCELLS“ gegen eine Attrappe des Lichtwerks: liest nur, ohne Origin, keine Kennung im Link.

    python3 -m unittest kinos-vorlage/test_organ_spiralcells.py -v      (aus dem Lichtwerk-Ordner)
"""
import importlib.util
import json
import os
import socket
import sys
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit

sys.dont_write_bytecode = True
HIER = os.path.dirname(os.path.abspath(__file__))


def freier_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


class Attrappe(BaseHTTPRequestHandler):
    antwort = {}
    aufrufe = []

    def log_message(self, *a):
        pass

    def do_GET(self):
        Attrappe.aufrufe.append(("GET", self.path, self.headers.get("Origin")))
        teile = urlsplit(self.path)
        if teile.path != "/lichtwerk/neu":
            self.send_response(404); self.end_headers(); return
        roh = json.dumps({**Attrappe.antwort, "seit": parse_qs(teile.query).get("seit", [None])[0]}).encode()
        self.send_response(200); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(roh))); self.end_headers(); self.wfile.write(roh)

    def do_POST(self):
        Attrappe.aufrufe.append(("POST", self.path, self.headers.get("Origin")))
        self.send_response(403); self.end_headers()


class Organ(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.port = freier_port()
        cls.srv = ThreadingHTTPServer(("127.0.0.1", cls.port), Attrappe)
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        os.environ["KINOS_LICHTWERK"] = "http://127.0.0.1:%d" % cls.port
        spec = importlib.util.spec_from_file_location("organ_spiralcells", os.path.join(HIER, "organ_spiralcells.py"))
        cls.organ = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.organ)

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()

    def setUp(self):
        Attrappe.aufrufe.clear()

    def test_ohne_merker_der_juengste_eintrag(self):
        Attrappe.antwort = {"satz": "Seit deinem letzten Besuch ist nichts dazugekommen.", "zahl": 0, "mond": None,
                            "zuletzt_satz": "Zuletzt eingetragen: „Sternwerft · Codex“ von Codex in „KiN OS · Sichten“, 20. Okt., 17:36."}
        d = self.organ.read_spiralcells(None)
        self.assertEqual((d["satz"], d["link"]), (Attrappe.antwort["zuletzt_satz"], "http://127.0.0.1:%d/#von=kinos" % self.port))
        self.assertEqual(Attrappe.aufrufe, [("GET", "/lichtwerk/neu", None)], "nur lesen, ohne Origin")
        Attrappe.antwort = {"satz": "x", "zahl": 0}
        self.assertEqual(self.organ.read_spiralcells(None)["satz"], "SPiRALCELLS", "ohne jüngsten Eintrag nur der Name")

    def test_ankunft_fuehrt_in_den_mond(self):
        Attrappe.antwort = {"satz": "Seit deinem letzten Besuch eingetragen: zwei Ausprägungen von Codex.", "zahl": 2, "mond": "zentrale-material-bekommt-form"}
        d = self.organ.read_spiralcells(1792044000000)
        self.assertEqual(d["satz"], "Seit deinem letzten Besuch eingetragen: zwei Ausprägungen von Codex.")
        self.assertEqual(d["link"], "http://127.0.0.1:%d/#mond=zentrale-material-bekommt-form&von=kinos" % self.port)
        self.assertEqual(Attrappe.aufrufe, [("GET", "/lichtwerk/neu?seit=1792044000000", None)], "nur lesen, vom Server aus, ohne Origin")

    def test_still_und_fremder_name(self):
        Attrappe.antwort = {"satz": "Seit deinem letzten Besuch ist nichts dazugekommen.", "zahl": 0, "mond": None,
                            "zuletzt_satz": "Zuletzt eingetragen: „x“ von Codex in „y“, 20. Okt., 17:36."}
        d = self.organ.read_spiralcells(1)
        self.assertTrue(d["link"].endswith("/#von=kinos"))
        self.assertEqual(d["satz"], "Zuletzt eingetragen: „x“ von Codex in „y“, 20. Okt., 17:36.", "nie leer: der jüngste Eintrag")
        Attrappe.antwort = {"satz": "x", "zahl": 1, "mond": "3f2a9c1e-7b4d-4e2a-9f10-1A2B3C4D5E6F/../x"}
        self.assertTrue(self.organ.read_spiralcells(1)["link"].endswith("/#von=kinos"), "kein fremder Name im Link")

    def test_ruhendes_lichtwerk(self):
        alt = self.organ.LICHTWERK
        self.organ.LICHTWERK = "http://127.0.0.1:9"
        try:
            d = self.organ.read_spiralcells(1)
        finally:
            self.organ.LICHTWERK = alt
        self.assertEqual((d["status"], d["satz"]), ("ruht", "SPiRALCELLS ruht gerade."))


if __name__ == "__main__":
    unittest.main(verbosity=2)
