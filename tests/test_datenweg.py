"""Datenweg des Lichtwerks: Schreiben nur über die vorgesehenen Routen, nur als Ralf,
gleiche request_id bei Wiederholung, keine Kennungen in der Oberfläche.

Startet eine eigene SPiRALCELLS-Instanz auf einer frischen Kopie der gesicherten
state.json und davor den Lichtwerk-Server, wie im Betrieb mit Leseeingang.
Ralfs echte Daten werden nie berührt. Belegt die Ports 8415 bis 8417 und 8421.

    python3 -m unittest tests/test_datenweg.py -v
"""
import glob
import hashlib
import http.client
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.error
import urllib.request

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOONCELLS = "/Volumes/ThunderBolt4_2TB/Development/Projects/mooncells"
ECHT = "/Volumes/ThunderBolt4_2TB/Development/AppData/mooncells/state.json"
SKIZZEN = os.path.join(os.path.dirname(WURZEL), "kin-os-sichten-codex")
UUID = re.compile(r"\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b", re.I)


def frei(port):
    with socket.socket() as s:
        return s.connect_ex(("127.0.0.1", port)) != 0


def warte(url, sek=15):
    t = time.time()
    while time.time() - t < sek:
        try:
            urllib.request.urlopen(url, timeout=1).read()
            return True
        except Exception:
            time.sleep(0.2)
    return False


def sha(p):
    with open(p, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


class Datenweg(unittest.TestCase):
    SC, LW, TOT, LESE = 8415, 8416, 8417, 8421

    @classmethod
    def setUpClass(cls):
        for p in (cls.SC, cls.LW, cls.TOT, cls.LESE):
            assert frei(p), "Port %d ist belegt" % p
        cls.echt_vorher = sha(ECHT) if os.path.exists(ECHT) else None
        cls.tmp = tempfile.mkdtemp(prefix="lichtwerk-test-", dir=os.path.join(WURZEL, "testdaten"))
        quelle = sorted(glob.glob(os.path.join(WURZEL, "sicherung", "state-vor-start-*.json")))[0]
        cls.daten = os.path.join(cls.tmp, "state.json")
        shutil.copy(quelle, cls.daten)
        env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
        cls.p1 = subprocess.Popen([sys.executable, "-m", "server.app", "--host", "127.0.0.1", "--port", str(cls.SC),
                                   "--data", cls.daten, "--instance", "lichtwerk-test"], cwd=MOONCELLS, env=env,
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        cls.p2 = subprocess.Popen([sys.executable, os.path.join(WURZEL, "server", "lichtwerk_server.py"), "--port", str(cls.LW),
                                   "--spiralcells", "http://127.0.0.1:%d" % cls.SC, "--leseeingang", str(cls.LESE)], env=env,
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        cls.p3 = subprocess.Popen([sys.executable, os.path.join(WURZEL, "server", "lichtwerk_server.py"), "--port", str(cls.TOT),
                                   "--spiralcells", "http://127.0.0.1:9"], env=env,
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        assert warte("http://127.0.0.1:%d/api/health" % cls.SC), "SPiRALCELLS-Testinstanz startet nicht"
        assert warte("http://127.0.0.1:%d/" % cls.LW) and warte("http://127.0.0.1:%d/" % cls.TOT)
        assert warte("http://127.0.0.1:%d/api/health" % cls.LESE), "Leseeingang antwortet nicht"

    @classmethod
    def tearDownClass(cls):
        for p in (cls.p1, cls.p2, cls.p3):
            p.terminate()
            p.wait(5)
        shutil.rmtree(cls.tmp, ignore_errors=True)

    # ------------------------------------------------------------ Helfer
    def req(self, methode, pfad, body=None, port=None, kopf=None):
        port = port or self.LW
        h = {"Content-Type": "application/json", "Origin": "http://127.0.0.1:%d" % port, "Sec-Fetch-Site": "same-origin"}
        h.update(kopf or {})
        h = {k: v for k, v in h.items() if v is not None}
        daten = None if body is None else json.dumps(body).encode()
        r = urllib.request.Request("http://127.0.0.1:%d%s" % (port, pfad), data=daten, method=methode, headers=h)
        try:
            with urllib.request.urlopen(r, timeout=15) as a:
                roh = a.read()
                try:
                    return a.status, json.loads(roh or b"null"), dict(a.headers)
                except json.JSONDecodeError:
                    return a.status, roh.decode("utf-8", "replace"), dict(a.headers)
        except urllib.error.HTTPError as e:
            roh = e.read()
            try:
                return e.code, json.loads(roh or b"null"), dict(e.headers)
            except json.JSONDecodeError:
                return e.code, roh.decode("utf-8", "replace"), dict(e.headers)

    def roh(self, port, pfad):
        """Eine Antwort ohne Weiterleitung zu folgen: Status, Kopf und Körper."""
        c = http.client.HTTPConnection("127.0.0.1", port, timeout=15)
        try:
            c.request("GET", pfad, headers={"Host": "127.0.0.1:%d" % port})
            a = c.getresponse()
            return a.status, {k.lower(): v for k, v in a.getheaders()}, a.read()
        finally:
            c.close()

    def zaehlen(self):
        g = self.graph()
        return ({k: len(v) for k, v in g.items()}, sum(1 for a in g["agents"] if a["agent_type"] == "human"))

    def graph(self):
        return self.req("GET", "/api/graph")[1]

    def ralf(self):
        s, a, _ = self.req("POST", "/api/agents", {"handle": "Ralf", "agent_type": "human", "description": "Test"})
        self.assertIn(s, (200, 201))
        return a

    def zentrale(self, g):
        w = next(w for w in g["works"] if w["title"].startswith("Zentrale"))
        trees = {t["id"] for t in g["worktrees"] if t["work_id"] == w["id"]}
        keim = next(v for v in g["variants"] if v["worktree_id"] in trees and v["label"].startswith("Gemeinsamer Auftrag · Runde 1 ("))
        return w, keim

    # ------------------------------------------------------- Leseeingang
    def test_00a_leseeingang_schreibt_nichts(self):
        vorher = self.zaehlen()
        self.assertEqual(vorher[1], 0, "zu Beginn gibt es keinen Eintrag Ralf")
        g = self.graph()
        w, keim = self.zentrale(g)
        einwurf = {"work_id": w["id"], "new_worktree": True, "source_variant_id": keim["id"],
                   "request_id": "lichtwerk-test-leseeingang-0001", "label": "x", "content": "x",
                   "author_id": g["agents"][0]["id"], "contribution": {"mode": "continuation"}}
        versuche = [("POST", "/api/agents", {"handle": "Ralf", "agent_type": "human", "description": "Werkraum"}),
                    ("POST", "/api/variant-branches", einwurf),
                    ("POST", "/api/edges", {"edge_type": "verweist-auf", "from_variant_id": keim["id"],
                                            "to_variant_id": keim["id"], "author_id": g["agents"][0]["id"]}),
                    ("POST", "/api/variants/%s/status" % keim["id"], {"status": "verworfen"}),
                    ("POST", "/werkstatt/standbild?name=x", {"bild": ""}),
                    ("PUT", "/api/variants/%s" % keim["id"], {}), ("DELETE", "/api/peers/x", {})]
        for herkunft in (self.LESE, self.LW):   # weder als eigene Seite noch mit fremdem Origin
            for m, p, body in versuche:
                s, a, _ = self.req(m, p, body, port=self.LESE, kopf={"Origin": "http://127.0.0.1:%d" % herkunft})
                self.assertEqual(s, 403, "%s %s über den Leseeingang" % (m, p))
        self.assertEqual(self.zaehlen(), vorher, "über den Leseeingang entsteht nichts, auch kein Eintrag Ralf")

    def test_00b_leseeingang_liest(self):
        s, g, _ = self.req("GET", "/api/graph", port=self.LESE)
        self.assertEqual(s, 200)
        self.assertEqual({k: len(v) for k, v in g.items()}, self.zaehlen()[0])
        for pfad in ("/lichtwerk/graph", "/lichtwerk/stand", "/api/agents"):
            self.assertEqual(self.req("GET", pfad, port=self.LESE)[0], 200, pfad)
        s, h, _ = self.req("GET", "/api/health", port=self.LESE)
        self.assertEqual(h["lichtwerk"], {"capabilities": {"authorSelection": False, "schreiben": False}, "eingang": "nur lesen"})
        s, h, _ = self.req("GET", "/api/health")
        self.assertEqual(h["lichtwerk"]["capabilities"]["authorSelection"], False, "im Betrieb ohne Autorenprofile")
        s, k, roh = self.roh(self.LESE, "/werkraum.html")
        self.assertEqual(s, 200)
        self.assertIn("content-security-policy", k)
        for pfad in ("/js/werkraum.js", "/js/werkdaten.js", "/werkraum.css", "/materialraum.css"):
            self.assertEqual(self.roh(self.LESE, pfad)[0], 200, pfad)
        s, k, _ = self.roh(self.LESE, "/")
        self.assertEqual((s, k.get("location")), (302, "http://127.0.0.1:%d/" % self.LW), "der Leseeingang führt ins Lichtwerk")
        for pfad in ("/lichtwerk/umgebung", "/api/export", "/api/agents/x", "/../server/lichtwerk_server.py"):
            self.assertEqual(self.roh(self.LESE, pfad)[0], 404, pfad)
        if os.path.isdir(SKIZZEN):
            for name in ("", "index.html", "sternwerft.html", "data.js"):
                if name and not os.path.isfile(os.path.join(SKIZZEN, name)):
                    continue
                self.assertEqual(self.roh(self.LESE, "/kin-os-sichten-codex/" + name)[0], 200, name or "Übersicht")
            self.assertEqual(self.roh(self.LESE, "/kin-os-sichten-codex")[0], 302)
            for pfad in ("/kin-os-sichten-codex/pruefung/", "/kin-os-sichten-codex/README.md",
                         "/kin-os-sichten-codex/../spiralcells-lichtwerk/server/lichtwerk_server.py"):
                self.assertEqual(self.roh(self.LESE, pfad)[0], 404, pfad)

    def test_00c_lichtwerk_leitet_fremde_seiten_um(self):
        ziel = "http://127.0.0.1:%d" % self.LESE
        for pfad in ("/werkraum.html", "/werkraum.html/", "/werkraum.html?x=1", "/kin-os-sichten-codex",
                     "/kin-os-sichten-codex/", "/kin-os-sichten-codex/sternwerft.html"):
            s, k, _ = self.roh(self.LW, pfad)
            self.assertEqual(s, 302, pfad)
            self.assertTrue(k["location"].startswith(ziel + "/"), pfad)
        for pfad in ("/", "/index.html", "/stil.css", "/js/haupt.js"):
            self.assertEqual(self.roh(self.LW, pfad)[0], 200, pfad)

    # ------------------------------------------------------------- Lesen
    def test_01_oberflaeche_ohne_kennungen_mit_schutzkopf(self):
        s, roh, kopf = self.req("GET", "/", kopf={"Content-Type": None, "Origin": None})
        self.assertEqual(s, 200)
        self.assertIn("Content-Security-Policy", kopf)
        for datei in glob.glob(os.path.join(WURZEL, "app", "**", "*.*"), recursive=True):
            if os.path.realpath(datei) != os.path.abspath(datei) or not datei.endswith((".js", ".css", ".html")):
                continue   # nur eigene Textdateien; fremde Verknüpfungen liefert der Server ohnehin nicht aus
            if os.sep + "kin-os-sichten-codex" + os.sep in datei:
                continue   # Codex' Skizzen-Hardlinks: das Lichtwerk liefert sie nicht aus, sie laufen auf dem Leseeingang
            with open(datei, encoding="utf-8") as f:
                self.assertIsNone(UUID.search(f.read()), "Kennung in " + datei)

    def test_02_graph_wird_unveraendert_durchgereicht(self):
        g = self.graph()
        self.assertEqual({k: len(v) for k, v in g.items()},
                         {"agents": 8, "works": 88, "worktrees": 142, "variants": 566, "edges": 118, "findings": 19})

    def test_03_fremde_adresse_und_fremde_seite_abgewiesen(self):
        s, a, _ = self.req("GET", "/api/graph", kopf={"Host": "evil.example:8416"})
        self.assertEqual(s, 403)
        s, a, _ = self.req("POST", "/api/edges", {"edge_type": "verweist-auf"}, kopf={"Origin": "http://evil.example"})
        self.assertEqual(s, 403)
        s, a, _ = self.req("POST", "/api/edges", {"edge_type": "verweist-auf"}, kopf={"Origin": None})
        self.assertEqual(s, 403)
        s, a, _ = self.req("POST", "/api/edges", {"edge_type": "verweist-auf"}, kopf={"Sec-Fetch-Site": "cross-site"})
        self.assertEqual(s, 403)
        s, a, _ = self.req("GET", "/api/graph", kopf={"Sec-Fetch-Site": "cross-site", "Sec-Fetch-Mode": "cors"})
        self.assertEqual(s, 403)

    def test_04_nur_vorgesehene_wege(self):
        for m, p in (("POST", "/api/import"), ("POST", "/api/sync"), ("POST", "/api/peers"), ("POST", "/api/variants"),
                     ("POST", "/api/works"), ("POST", "/api/findings"), ("DELETE", "/api/peers/x"), ("PUT", "/api/variants/x"),
                     ("GET", "/api/export"), ("POST", "/werkstatt/standbild")):
            s, a, _ = self.req(m, p, {})
            self.assertEqual(s, 403 if m != "GET" else 404, "%s %s" % (m, p))
        s, a, _ = self.req("GET", "/../server/lichtwerk_server.py")
        self.assertEqual(s, 404)
        for eintrag in os.listdir(os.path.join(WURZEL, "app")):   # Verknüpfungen nach außen werden nicht ausgeliefert
            if os.path.islink(os.path.join(WURZEL, "app", eintrag)):
                s, a, _ = self.req("GET", "/" + eintrag + "/")
                self.assertEqual(s, 404)

    # ----------------------------------------------------------- Schreiben
    def test_05_nur_ralf_wird_angelegt_und_nur_einmal(self):
        s, a, _ = self.req("POST", "/api/agents", {"handle": "Claude", "agent_type": "model"})
        self.assertEqual(s, 403)
        r1 = self.ralf()
        r2 = self.ralf()
        self.assertEqual(r1["id"], r2["id"])
        self.assertEqual(sum(1 for a in self.graph()["agents"] if a["agent_type"] == "human"), 1)

    def test_06_einwurf_braucht_kennung_und_ralf(self):
        g = self.graph()
        w, keim = self.zentrale(g)
        claude = next(a for a in g["agents"] if a["handle"].startswith("Claude"))
        body = {"work_id": w["id"], "new_worktree": True, "source_variant_id": keim["id"], "label": "Test", "content": "Text",
                "author_id": claude["id"], "contribution": {"mode": "continuation"}}
        s, a, _ = self.req("POST", "/api/variant-branches", body)
        self.assertEqual(s, 400, "ohne request_id")
        s, a, _ = self.req("POST", "/api/variant-branches", {**body, "request_id": "lichtwerk-test-0001-claude"})
        self.assertEqual(s, 403, "nicht in Ralfs Namen")
        s, a, _ = self.req("POST", "/api/variant-branches", {**body, "request_id": "lichtwerk-test-0001-x", "usages": []})
        self.assertEqual(s, 400, "fremde Felder")

    def test_06b_nur_ralfs_zweig_und_nur_weiterarbeit(self):
        ralf = self.ralf()
        g = self.graph()
        w, keim = self.zentrale(g)
        claude_baum = next(t for t in g["worktrees"] if t["work_id"] == w["id"] and t["id"] != keim["worktree_id"])
        letzte = [v for v in g["variants"] if v["worktree_id"] == claude_baum["id"]][-1]
        body = {"work_id": w["id"], "worktree_id": claude_baum["id"], "derived_from": letzte["id"], "request_id": "lichtwerk-test-fremd-0001",
                "label": "x", "content": "x", "author_id": ralf["id"], "contribution": {"mode": "continuation"}}
        s, a, _ = self.req("POST", "/api/variant-branches", body)
        self.assertEqual(s, 403, "fremder Zweig")
        body2 = {"work_id": w["id"], "new_worktree": True, "request_id": "lichtwerk-test-erst-0001", "label": "x", "content": "x",
                 "author_id": ralf["id"], "contribution": {"mode": "independent-first", "independence_basis": "behauptet"}}
        s, a, _ = self.req("POST", "/api/variant-branches", body2)
        self.assertEqual(s, 400, "Entstehung nur Weiterarbeit oder Gegenlese")

    def test_07_gleiche_kennung_legt_genau_einmal_ab(self):
        ralf = self.ralf()
        g = self.graph()
        w, keim = self.zentrale(g)
        vorher = len(g["variants"])
        body = {"work_id": w["id"], "new_worktree": True, "source_variant_id": keim["id"], "request_id": "lichtwerk-test-einwurf-0001",
                "label": "Einwurf im Test", "content": "Ein Gedanke aus dem Test.", "notes": "Im Lichtwerk abgelegt.",
                "author_id": ralf["id"], "contribution": {"mode": "continuation"}}
        s1, a1, _ = self.req("POST", "/api/variant-branches", body)
        s2, a2, _ = self.req("POST", "/api/variant-branches", body)
        self.assertEqual(s1, 201)
        self.assertIn(s2, (200, 201))
        self.assertEqual(a1["variant"]["id"], a2["variant"]["id"])
        g2 = self.graph()
        self.assertEqual(len(g2["variants"]), vorher + 1)
        self.assertEqual([e["edge_type"] for e in a1["edges"]], ["erweitert"])
        s3, a3, _ = self.req("POST", "/api/variant-branches", {**body, "content": "anderer Inhalt"})
        self.assertEqual(s3, 422, "gleiche Kennung, anderer Auftrag")
        self.assertEqual(len(self.graph()["variants"]), vorher + 1)
        Datenweg.neu = a1["variant"]["id"]

    def test_08_kristallisieren_und_status(self):
        neu = getattr(Datenweg, "neu", None)
        self.assertIsNotNone(neu)
        s, a, _ = self.req("POST", "/api/variants/%s/status" % neu, {"status": "grundformation"})
        self.assertEqual(s, 200)
        v = next(v for v in self.graph()["variants"] if v["id"] == neu)
        self.assertEqual(v["status"], "grundformation")
        s, a, _ = self.req("POST", "/api/variants/%s/status" % neu, {"status": "gelöscht"})
        self.assertEqual(s, 400)
        s, a, _ = self.req("POST", "/api/variants/%s/status" % neu, {"status": "entwurf", "label": "x"})
        self.assertEqual(s, 400)
        self.req("POST", "/api/variants/%s/status" % neu, {"status": "entwurf"})

    def test_09_verbinden_ohne_dopplung(self):
        ralf = self.ralf()
        g = self.graph()
        w, keim = self.zentrale(g)
        trees = {t["id"] for t in g["worktrees"] if t["work_id"] == w["id"]}
        a, b = [v for v in g["variants"] if v["worktree_id"] in trees and v["label"].startswith("Erstbeitrag")][:2]
        vorher = len(g["edges"])
        body = {"edge_type": "verweist-auf", "from_variant_id": a["id"], "to_variant_id": b["id"], "note": "Test", "author_id": ralf["id"]}
        s1, e1, _ = self.req("POST", "/api/edges", body)
        s2, e2, _ = self.req("POST", "/api/edges", body)
        self.assertEqual(s1, 201)
        self.assertEqual(s2, 200)
        self.assertTrue(e2.get("schon_vorhanden"))
        self.assertEqual(e1["id"], e2["id"])
        self.assertEqual(len(self.graph()["edges"]), vorher + 1)
        s, x, _ = self.req("POST", "/api/edges", {**body, "edge_type": "gehört-zu"})
        self.assertEqual(s, 400)
        s, x, _ = self.req("POST", "/api/edges", {**body, "to_variant_id": a["id"]})
        self.assertEqual(s, 400)

    def test_10_ruhender_dienst_gibt_menschlichen_satz(self):
        s, a, _ = self.req("GET", "/api/graph", port=self.TOT)
        self.assertEqual(s, 503)
        self.assertEqual(a, {"satz": "SPiRALCELLS ruht gerade."})
        s, a, _ = self.req("GET", "/lichtwerk/stand", port=self.TOT)
        self.assertEqual(s, 503)

    def test_11_umgebung_ohne_tisch_anfrage_und_ohne_pfade(self):
        s, a, _ = self.req("GET", "/lichtwerk/umgebung")
        self.assertEqual(s, 200)
        self.assertEqual([u["name"] for u in a], ["Zentrale", "KiNFORMER", "KiN", "Werkraum", "TiSCH"])
        self.assertEqual(a[3]["adresse"], "http://127.0.0.1:%d/werkraum.html" % self.LESE, "der Werkraum nur über den Leseeingang")
        self.assertIsNone(a[-1]["wach"])
        self.assertNotIn("/Volumes", json.dumps(a))

    def test_99_echte_daten_unberuehrt(self):
        if self.echt_vorher:
            self.assertEqual(sha(ECHT), self.echt_vorher)


if __name__ == "__main__":
    unittest.main(verbosity=2)
