"""Formen ansehen (Etappe 2) und behalten (Etappe 3): Der KiNFORMER rechnet vom Server aus, die Vorschau
schreibt nichts, unter jeder Form steht ein ehrlicher Herkunftssatz, nirgends erscheint eine Kennung.
Behalten legt die Form genau einmal in Ralfs Zweig, mit einem Faden „verweist auf“ zum Original,
ohne „erweitert“ und ohne „remixt-aus“; geprüft nur an der Testkopie.

Startet eine eigene SPiRALCELLS-Instanz auf einer frischen Kopie der gesicherten state.json,
einen Stellvertreter des KiNFORMER (mit dessen echtem Formweg, ohne Netz und ohne Speicher)
und davor zwei Lichtwerke: eines mit Stellvertreter, eines mit ruhendem KiNFORMER.
Belegt die Ports 8423 bis 8426. Ralfs echte Daten werden nie berührt.

    python3 -m unittest tests/test_formen.py -v
"""
import glob
import hashlib
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

sys.dont_write_bytecode = True   # weder hier noch im formformer-Ordner entsteht ein Zwischenspeicher

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOONCELLS = "/Volumes/ThunderBolt4_2TB/Development/Projects/mooncells"
FORMWEG = "/Volumes/ThunderBolt4_2TB/Development/Projects/formformer/formen_http.py"
ECHT = "/Volumes/ThunderBolt4_2TB/Development/AppData/mooncells/state.json"
UUID = re.compile(r"\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b", re.I)
SUMME = re.compile(r"\b[0-9a-f]{40,64}\b", re.I)
PFAD = re.compile(r"/(?:Users|Volumes|home|private|tmp|opt)/|~/|\$HOME/|-(?:Users|Volumes)-")


def laden(name, pfad):
    spec = importlib.util.spec_from_file_location(name, pfad)
    modul = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modul)
    return modul


server = laden("lichtwerk_formen_test", os.path.join(WURZEL, "server", "lichtwerk_server.py"))
formweg = laden("formen_http_stellvertreter", FORMWEG)
sys.path.insert(0, os.path.join(WURZEL, "tests"))
from test_datenweg import frei, warte, sha   # noqa: E402  gleiche Helfer wie der Datenweg


class Stellvertreter(BaseHTTPRequestHandler):
    """Antwortet wie 9062 auf den beiden Formwegen und merkt sich, wer mit welchem Origin kam.
    Mit `verfaelscht` liefert er eine Seite ohne oder mit doppeltem Herkunftsabsatz."""
    aufrufe = []
    verfaelscht = None

    def log_message(self, *a):
        pass

    def _antwort(self, status, obj):
        roh = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(roh)))
        self.end_headers()
        self.wfile.write(roh)

    def do_GET(self):
        Stellvertreter.aufrufe.append(("GET", self.path, self.headers.get("Origin")))
        if self.path == "/api/formen/richtungen":
            self._antwort(200, {"richtungen": [{"key": k, **v} for k, v in formweg.RICHTUNGEN.items()]})
        else:
            self._antwort(404, {"error": "Unbekannter Aufruf."})

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(n) or b"{}")
        Stellvertreter.aufrufe.append(("POST", self.path, self.headers.get("Origin"), body.get("richtung")))
        try:
            form = formweg.ausformen(body.get("titel"), body.get("text"), body.get("richtung"))
            if Stellvertreter.verfaelscht == "ohne":
                form["html"] = re.sub(r'<p class="herkunft">.*?</p>', "", form["html"], flags=re.S)
            elif Stellvertreter.verfaelscht == "doppelt":
                form["html"] = re.sub(r'(<p class="herkunft">.*?</p>)', r"\1\1", form["html"], flags=re.S)
            self._antwort(200, form)
        except ValueError as f:
            self._antwort(400, {"error": str(f)})


class Formen(unittest.TestCase):
    SC, LW, KF, LW_RUHT = 8423, 8424, 8425, 8426

    @classmethod
    def setUpClass(cls):
        for p in (cls.SC, cls.LW, cls.KF, cls.LW_RUHT):
            assert frei(p), "Port %d ist belegt" % p
        cls.echt_vorher = sha(ECHT) if os.path.exists(ECHT) else None
        cls.tmp = tempfile.mkdtemp(prefix="lichtwerk-formen-", dir=os.path.join(WURZEL, "testdaten"))
        quelle = sorted(glob.glob(os.path.join(WURZEL, "sicherung", "state-vor-start-*.json")))[0]
        cls.daten = os.path.join(cls.tmp, "state.json")
        shutil.copy(quelle, cls.daten)
        cls.kf = ThreadingHTTPServer(("127.0.0.1", cls.KF), Stellvertreter)
        threading.Thread(target=cls.kf.serve_forever, daemon=True).start()
        env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
        lw = os.path.join(WURZEL, "server", "lichtwerk_server.py")
        cls.prozesse = [
            subprocess.Popen([sys.executable, "-m", "server.app", "--host", "127.0.0.1", "--port", str(cls.SC),
                              "--data", cls.daten, "--instance", "lichtwerk-formen-test"], cwd=MOONCELLS, env=env,
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL),
            subprocess.Popen([sys.executable, lw, "--port", str(cls.LW), "--spiralcells", "http://127.0.0.1:%d" % cls.SC,
                              "--kinformer", "http://127.0.0.1:%d" % cls.KF, "--behalten"], env=env,
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL),
            subprocess.Popen([sys.executable, lw, "--port", str(cls.LW_RUHT), "--spiralcells", "http://127.0.0.1:%d" % cls.SC,
                              "--kinformer", "http://127.0.0.1:9"], env=env,
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL),
        ]
        assert warte("http://127.0.0.1:%d/api/health" % cls.SC), "SPiRALCELLS-Testinstanz startet nicht"
        assert warte("http://127.0.0.1:%d/" % cls.LW) and warte("http://127.0.0.1:%d/" % cls.LW_RUHT)
        g = cls.req(cls, "GET", "/api/graph")[1]
        werke = {w["id"]: w for w in g["works"]}
        baeume = {t["id"]: t for t in g["worktrees"]}
        cls._werke, cls._baeume = werke, baeume
        texte = [v for v in g["variants"] if cls.werk_von(cls, v)["work_type"] == "text" and v["content"].strip()
                 and not server.ist_app_zustand(v["content"])]
        cls.text = max(texte, key=lambda v: len(formweg.saetze(server.fuer_formen(v["content"], "karten"))))
        cls.alle_texte = texte
        cls.mit_kennung = next((v for v in texte if UUID.search(v["content"]) or PFAD.search(v["content"])), None)
        cls.app_zustand = next(v for v in g["variants"] if server.ist_app_zustand(v["content"]))
        cls.app_text = next((v for v in g["variants"] if cls.werk_von(cls, v)["work_type"] != "text"
                             and not server.ist_app_zustand(v["content"]) and v["content"].strip()), None)

    def werk_von(self, v):
        """Der Mond einer Ausprägung; neue Zweige kennt erst der frische Graph."""
        if v["worktree_id"] not in self._baeume:
            g = self.req("GET", "/api/graph")[1]
            self._werke.update({w["id"]: w for w in g["works"]})
            self._baeume.update({t["id"]: t for t in g["worktrees"]})
        return self._werke[self._baeume[v["worktree_id"]]["work_id"]]

    @classmethod
    def tearDownClass(cls):
        for p in cls.prozesse:
            p.terminate()
            p.wait(5)
        cls.kf.shutdown()
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def req(self, methode, pfad, body=None, port=None):
        port = port or self.LW
        h = {"Content-Type": "application/json", "Origin": "http://127.0.0.1:%d" % port, "Sec-Fetch-Site": "same-origin"}
        r = urllib.request.Request("http://127.0.0.1:%d%s" % (port, pfad), method=methode, headers=h,
                                   data=None if body is None else json.dumps(body).encode())
        try:
            with urllib.request.urlopen(r, timeout=30) as a:
                status, roh, kopf = a.status, a.read(), dict(a.headers)
        except urllib.error.HTTPError as e:
            status, roh, kopf = e.code, e.read(), dict(e.headers)
        try:
            return status, json.loads(roh or b"null"), kopf
        except json.JSONDecodeError:
            return status, roh.decode("utf-8", "replace"), kopf

    def vorschau(self, v, richtung, port=None):
        return self.req("POST", "/lichtwerk/formen/vorschau", {"auspraegung": v["id"], "richtung": richtung}, port)

    # ------------------------------------------------------------------ Tests
    def test_01_menschlich_wie_im_browser(self):
        with open(os.path.join(WURZEL, "tests", "menschlich-beispiele.json"), encoding="utf-8") as f:
            beispiele = json.load(f)
        self.assertGreaterEqual(len(beispiele), 10)
        for b in beispiele:
            self.assertEqual(server.menschlich(b["eingabe"]), b["menschlich"], b["eingabe"])
            self.assertEqual(server.kurz(b["eingabe"], 40), b["kurz40"], b["eingabe"])

    def test_02_nur_gemeldete_richtungen(self):
        s, d, _ = self.req("GET", "/lichtwerk/formen/richtungen")
        self.assertEqual(s, 200)
        self.assertEqual([r["key"] for r in d["richtungen"]], list(formweg.RICHTUNGEN))
        saetze = {r["key"]: r["satz"] for r in d["richtungen"]}   # eigene Sätze, kein behauptetes Sinnverstehen
        self.assertEqual((saetze["plakat"], saetze["karten"]), ("Die ersten drei Sätze, groß gesetzt.", "Jeder Satz eine Karte."))
        self.assertEqual({r["key"] for r in d["richtungen"] if r["kommt"]}, {"klang", "film"})
        for richtung in ("klang", "kino"):
            s, a, _ = self.vorschau(self.text, richtung)
            self.assertEqual(s, 400, richtung)

    def test_03_vorschau_schreibt_nichts_und_ruft_ohne_origin(self):
        vorher, zahlen = sha(self.daten), {k: len(v) for k, v in self.req("GET", "/api/graph")[1].items()}
        Stellvertreter.aufrufe.clear()
        for richtung in ("plakat", "lesetuch", "karten", "schaubild", "spiel"):
            s, f, _ = self.vorschau(self.text, richtung)
            self.assertEqual(s, 200, richtung)
            self.assertTrue(f["geht"] and f["ehrlich"], richtung)
        self.assertEqual(sha(self.daten), vorher, "die Testdaten bleiben unverändert")
        self.assertEqual({k: len(v) for k, v in self.req("GET", "/api/graph")[1].items()}, zahlen)
        self.assertTrue(Stellvertreter.aufrufe)
        self.assertTrue(all(a[2] is None for a in Stellvertreter.aufrufe), "der KiNFORMER wird ohne Origin gerufen")

    def test_04_ehrlicher_herkunftssatz(self):
        text = server.fuer_formen(self.text["content"], "karten")
        n = len(formweg.saetze(text))
        self.assertGreater(n, 3, "der Prüftext braucht mehr als drei Sätze")
        erwartet = {"plakat": "Die ersten drei von %d Sätzen, groß gesetzt." % n,
                    "lesetuch": "Alle %d Sätze, neu gesetzt." % n,
                    "karten": "%d Karten, jeder Satz eine." % n}
        for richtung in ("plakat", "lesetuch", "karten", "schaubild", "spiel"):
            s, f, _ = self.vorschau(self.text, richtung)
            herkunft = re.findall(r'<p class="herkunft">(.*?)</p>', f["html"], re.S)
            self.assertEqual(len(herkunft), 1, richtung)
            self.assertNotIn("unverändert", f["html"], richtung)
            self.assertTrue(herkunft[0].startswith("Geformt von KiNFORMER als "), richtung)
            if richtung in erwartet:
                self.assertTrue(f["satz"].startswith(erwartet[richtung]), "%s: %s" % (richtung, f["satz"]))
            if richtung == "spiel":   # die Zahlen nennt der KiNFORMER, den Satz setzt das Lichtwerk
                self.assertTrue(f["satz"].startswith(formweg.ausformen("Probe", text, "spiel")["satz"].split(" Die ersten")[0]))
            if richtung == "schaubild":
                self.assertTrue(f["satz"].startswith("Jeder Absatz ein Zweig, seine weiteren Sätze als Blätter."))

    def test_05_ruhige_saetze_statt_formen(self):
        s, f, _ = self.vorschau(self.app_zustand, "karten")
        self.assertEqual((s, f), (200, {"geht": False, "satz": "Das ist ein gespeicherter App-Zustand. Formen gibt es für Texte."}))
        if self.app_text:
            s, f, _ = self.vorschau(self.app_text, "karten")
            self.assertEqual((s, f["geht"]), (200, False))
        s, f, _ = self.req("GET", "/lichtwerk/formen/richtungen", port=self.LW_RUHT)
        self.assertEqual((s, f["satz"]), (503, "Der KiNFORMER ruht gerade. Formen geht, sobald er wach ist."))
        s, f, _ = self.vorschau(self.text, "karten", port=self.LW_RUHT)
        self.assertEqual(s, 503)

    def test_06_zu_lang_und_leer_ohne_aufruf(self):
        handler = object.__new__(server.Lichtwerk)
        handler._richtungen = lambda: [{"key": "karten", "name": "Karten", "satz": "", "kommt": False}]
        graph = {"works": [{"id": "w", "work_type": "text", "title": "T"}], "worktrees": [{"id": "t", "work_id": "w"}],
                 "variants": [{"id": "lang", "worktree_id": "t", "label": "L", "content": "Satz. " * 20_000},
                              {"id": "leer", "worktree_id": "t", "label": "L", "content": " \n "}]}
        handler._oben_json = lambda *a: (200, graph)
        handler._kinformer_ruf = lambda *a, **k: self.fail("bei zu langem oder leerem Text wird nicht geformt")
        q = handler._formquelle({"auspraegung": "lang", "richtung": "karten"})
        self.assertIn("100.000 Zeichen", q["satz"])
        q = handler._formquelle({"auspraegung": "leer", "richtung": "karten"})
        self.assertEqual(q["satz"], "Diese Ausprägung hat keinen Text zum Formen.")

    def test_07_keine_kennung_in_formen(self):
        proben = [self.text] + ([self.mit_kennung] if self.mit_kennung else [])
        for v in proben:
            for richtung in ("plakat", "lesetuch", "karten", "schaubild", "spiel"):
                s, f, _ = self.vorschau(v, richtung)
                sichtbar = json.dumps({k: f[k] for k in ("titel", "satz", "herkunft", "html", "name")}, ensure_ascii=False)
                for muster in (UUID, SUMME, PFAD):
                    self.assertIsNone(muster.search(sichtbar), "%s in %s" % (muster.pattern, richtung))
        if self.mit_kennung:
            self.assertTrue(self.vorschau(self.mit_kennung, "karten")[1]["ersetzt"])

    def test_08_falsche_auftraege(self):
        for body in ({"auspraegung": self.text["id"]}, {"auspraegung": self.text["id"], "richtung": "karten", "text": "x"},
                     {"auspraegung": "../graph", "richtung": "karten"}, []):
            s, f, _ = self.req("POST", "/lichtwerk/formen/vorschau", body)
            self.assertEqual(s, 400, body)
        s, f, _ = self.req("POST", "/lichtwerk/formen/vorschau", {"auspraegung": "gibt-es-nicht", "richtung": "karten"})
        self.assertEqual(s, 404)
        s, f, kopf = self.req("GET", "/")
        self.assertIn("connect-src 'self'", kopf.get("Content-Security-Policy", ""))

    # ------------------------------------------------------------- Behalten
    def graph(self):
        return self.req("GET", "/api/graph")[1]

    def behalten(self, v, richtung, port=None):
        return self.req("POST", "/lichtwerk/formen/behalten", {"auspraegung": v["id"], "richtung": richtung}, port)

    def ralf(self, g):
        return next((a for a in g["agents"] if a["agent_type"] == "human" and a["handle"] == "Ralf"), None)

    def test_10_behalten_braucht_ralfs_eintrag_und_den_schalter(self):
        vorher = sha(self.daten)
        s, f, _ = self.behalten(self.text, "karten")
        self.assertEqual((s, f["satz"]), (409, "Für dich gibt es in SPiRALCELLS noch keinen eigenen Eintrag."))
        s, f, _ = self.behalten(self.text, "karten", port=self.LW_RUHT)
        self.assertEqual(s, 403, "ohne --behalten gibt es den Weg nicht")
        s, f, _ = self.behalten(self.app_zustand, "karten")
        self.assertEqual(s, 422)
        self.assertEqual(sha(self.daten), vorher)
        self.assertFalse(self.vorschau(self.text, "karten", port=self.LW_RUHT)[1].get("behalten"))

    def test_11_behalten_legt_einmal_ab_mit_faden_zum_original(self):
        s, a, _ = self.req("POST", "/api/agents", {"handle": "Ralf", "agent_type": "human", "description": "Test"})
        self.assertIn(s, (200, 201))
        g0 = self.graph()
        ralf = self.ralf(g0)
        s, f, _ = self.behalten(self.text, "karten")
        self.assertEqual((s, f["behalten"], f["schon"]), (201, True, False))
        g1 = self.graph()
        neu = [v for v in g1["variants"] if v["id"] not in {x["id"] for x in g0["variants"]}]
        kanten = [e for e in g1["edges"] if e["id"] not in {x["id"] for x in g0["edges"]}]
        self.assertEqual(len(neu), 1)
        form = neu[0]
        self.assertEqual(form["author_id"], ralf["id"])
        self.assertTrue(form["notes"].startswith("Form ohne Modell · KiNFORMER · Karten. "))
        self.assertTrue(form["content"].lower().startswith("<!doctype html>"))
        self.assertTrue(form["label"].startswith("Karten aus "))
        self.assertIsNone(form["derived_from"])
        self.assertEqual(form["contribution"]["mode"], "review")
        self.assertEqual(form["contribution"]["seen_variant_ids"], [self.text["id"]])
        self.assertEqual([(e["edge_type"], e["from_variant_id"], e["to_variant_id"], e["author_id"]) for e in kanten],
                         [("verweist-auf", form["id"], self.text["id"], ralf["id"])], "nur der Faden, kein erweitert, kein remixt-aus")
        self.assertEqual(self.werk_von(form)["id"], self.werk_von(self.text)["id"], "die Form liegt im selben Mond")
        s, f, _ = self.behalten(self.text, "karten")
        self.assertEqual((s, f["schon"], f["faden_neu"]), (200, True, False))
        g2 = self.graph()
        self.assertEqual((len(g2["variants"]), len(g2["edges"])), (len(g1["variants"]), len(g1["edges"])), "zweimal Halten legt nicht zweimal ab")
        Formen.form = form

    def test_12_zweig_bewegt_sich_dazwischen(self):
        form = getattr(Formen, "form", None)
        self.assertIsNotNone(form)
        g = self.graph()
        ralf = self.ralf(g)
        einwurf = {"work_id": self.werk_von(form)["id"], "worktree_id": form["worktree_id"], "derived_from": form["id"],
                   "request_id": "lichtwerk-test-dazwischen-0001", "label": "Dazwischen", "content": "Ein Gedanke dazwischen.",
                   "author_id": ralf["id"], "contribution": {"mode": "continuation"}}
        s, a, _ = self.req("POST", "/api/variant-branches", einwurf)
        self.assertEqual(s, 201)
        g1 = self.graph()
        s, f, _ = self.behalten(self.text, "karten")
        self.assertEqual((s, f["schon"]), (200, True), "die Form liegt schon, auch wenn sich der Zweig bewegt hat")
        s, f, _ = self.behalten(self.text, "lesetuch")
        self.assertEqual(s, 201)
        g2 = self.graph()
        neu = [v for v in g2["variants"] if v["id"] not in {x["id"] for x in g1["variants"]}]
        self.assertEqual(len(neu), 1)
        self.assertEqual((neu[0]["worktree_id"], neu[0]["derived_from"]), (form["worktree_id"], a["variant"]["id"]),
                         "Weiterarbeit in Ralfs Zweig, an seiner letzten Fassung")
        self.assertEqual((neu[0]["contribution"]["mode"], neu[0]["contribution"]["seen_variant_ids"]), ("continuation", [self.text["id"]]))

    def test_13_fehlender_faden_wird_nachgezogen(self):
        g = self.graph()
        ralf = self.ralf(g)
        s, f, _ = self.vorschau(self.text, "plakat")
        baum = Formen.form["worktree_id"]
        letzte = sorted((v for v in g["variants"] if v["worktree_id"] == baum), key=lambda v: v["created_at"])[-1]
        direkt = {"work_id": self.werk_von(Formen.form)["id"], "worktree_id": baum, "derived_from": letzte["id"],
                  "request_id": "test-abbruch-ohne-faden-0001", "label": f["titel"], "content": f["html"],
                  "notes": "Form ohne Modell · KiNFORMER · Plakat. " + f["satz"], "author_id": ralf["id"],
                  "contribution": {"mode": "continuation", "seen_variant_ids": [self.text["id"]]}}
        r = urllib.request.Request("http://127.0.0.1:%d/api/variant-branches" % self.SC, method="POST",
                                   data=json.dumps(direkt).encode(), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(r, timeout=15) as a:   # ein Abbruch zwischen Form und Faden, nachgestellt an der Testkopie
            self.assertEqual(a.status, 201)
        g1 = self.graph()
        s, f, _ = self.behalten(self.text, "plakat")
        self.assertEqual((s, f["schon"], f["faden_neu"]), (200, True, True))
        g2 = self.graph()
        self.assertEqual(len(g2["variants"]), len(g1["variants"]))
        self.assertEqual(len(g2["edges"]), len(g1["edges"]) + 1)

    def test_14_einwurf_legt_keine_form_ab(self):
        g = self.graph()
        ralf = self.ralf(g)
        body = {"work_id": self.werk_von(self.text)["id"], "new_worktree": True, "request_id": "lichtwerk-form-abcdef123456",
                "label": "x", "content": "x", "author_id": ralf["id"], "contribution": {"mode": "review", "seen_variant_ids": []}}
        s, f, _ = self.req("POST", "/api/variant-branches", body)
        self.assertEqual(s, 400)

    def test_15_formen_am_form_korn_formt_das_original(self):
        a = self.vorschau(Formen.form, "schaubild")[1]
        b = self.vorschau(self.text, "schaubild")[1]
        self.assertEqual(a["html"], b["html"])

    def test_16_saetze_im_einzelnen(self):
        e = {"html": "<svg><text><tspan>kurz</tspan></text></svg>", "satz": "1 Karten zum Umdrehen und Ordnen."}
        self.assertEqual(server.was_blieb("plakat", e, 2, "Eins. Zwei."), "Beide Sätze, groß gesetzt.")
        self.assertEqual(server.was_blieb("spiel", e, None, "Eins."), "Eine Karte zum Umdrehen.")
        text = "## Ziel\nWir bauen zuerst den Boden, dann das Haus.\n- Fundament gießen\n- Wände stellen"
        self.assertIn("zeigt das Bild nur die Aufzählung", server.was_blieb("schaubild", e, None, text))
        self.assertNotIn("zeigt das Bild nur", server.was_blieb("schaubild", e, None, "## Ziel\n- Fundament\n- Wände"))
        # Aufzählungsnotiz beim Plakat nur, wenn die gezeigten drei Sätze Zeichen hatten
        self.assertNotIn("Aufzählungszeichen", server.was_blieb("plakat", e, 5, "Eins. Zwei. Drei. Vier.\n- Fünf"))
        self.assertIn("Aufzählungszeichen", server.was_blieb("plakat", e, 5, "- Eins. Zwei. Drei. Vier. Fünf."))

    def test_17_herkunft_nicht_genau_einmal_bleibt_vorschau(self):
        andere = [v for v in self.alle_texte if v["id"] not in (self.text["id"], (self.mit_kennung or {}).get("id"))][:2]
        try:
            for modus, v in zip(("ohne", "doppelt"), andere):
                Stellvertreter.verfaelscht = modus
                s, f, _ = self.vorschau(v, "lesetuch")
                self.assertEqual((s, f["ehrlich"], f["behalten"]), (200, False, False), modus)
                vorher = len(self.graph()["variants"])
                s, f, _ = self.behalten(v, "lesetuch")
                self.assertEqual(s, 409, modus)
                self.assertEqual(len(self.graph()["variants"]), vorher)
        finally:
            Stellvertreter.verfaelscht = None

    def test_18_gleichzeitiges_halten_legt_einmal_ab(self):
        v = [x for x in self.alle_texte if x["id"] != self.text["id"]][-1]
        vorher = self.graph()
        ergebnisse = []
        faeden = [threading.Thread(target=lambda: ergebnisse.append(self.behalten(v, "karten")[0])) for _ in range(4)]
        for t in faeden:
            t.start()
        for t in faeden:
            t.join(30)
        self.assertEqual(sorted(ergebnisse), [200, 200, 200, 201])
        nachher = self.graph()
        self.assertEqual(len(nachher["variants"]), len(vorher["variants"]) + 1)
        self.assertEqual(len(nachher["edges"]), len(vorher["edges"]) + 1)

    def test_19_form_kennzeichen_sind_vorbehalten(self):
        ralf = self.ralf(self.graph())
        body = {"work_id": self.werk_von(self.text)["id"], "new_worktree": True, "request_id": "lichtwerk-test-falsch-0001",
                "label": "Karten aus Falsch", "content": "<!doctype html><p>x</p>", "notes": "Form ohne Modell · KiNFORMER · Karten. 1 Karte.",
                "author_id": ralf["id"], "contribution": {"mode": "review", "seen_variant_ids": [self.text["id"]]}}
        s, f, _ = self.req("POST", "/api/variant-branches", body)
        self.assertEqual(s, 400)

    def test_20_ruhender_kinformer_beim_behalten(self):
        s, f, _ = self.behalten(self.text, "plakat", port=self.LW_RUHT)
        self.assertEqual(s, 403, "ohne --behalten kein Weg")
        def ruht():
            raise server.Fehler(503, "Der KiNFORMER ruht gerade. Formen geht, sobald er wach ist.")
        handler = object.__new__(server.Lichtwerk)
        handler._richtungen = ruht
        with self.assertRaises(server.Fehler) as fehler:
            handler._behalten({"auspraegung": self.text["id"], "richtung": "plakat"})
        self.assertEqual((fehler.exception.status, fehler.exception.satz), (503, "Der KiNFORMER ruht gerade. Formen geht, sobald er wach ist."))

    def test_99_echte_daten_unberuehrt(self):
        if self.echt_vorher:
            self.assertEqual(sha(ECHT), self.echt_vorher)


if __name__ == "__main__":
    unittest.main(verbosity=2)
