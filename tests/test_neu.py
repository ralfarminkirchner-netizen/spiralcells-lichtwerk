"""Wiederkommen (Etappe 4) und lesbare Links (Etappe 5) auf dem Server: derselbe Satz und dieselben Namen wie im
Browser (an denselben Beispielen wie tests/ankunft.test.mjs), dazu die Lesewege /lichtwerk/neu und /lichtwerk/monde.
Keine Sockets, keine Prozesse, kein Bestand: künstliche Graphen.

    python3 -m unittest tests/test_neu.py -v
"""
import importlib.util
import json
import os
import sys
import unittest
from unittest.mock import Mock

sys.dont_write_bytecode = True
WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("lichtwerk_neu_test", os.path.join(WURZEL, "server", "lichtwerk_server.py"))
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)


def graph():
    agenten = [{"id": "a-codex", "agent_type": "model", "handle": "Codex — Architektur"},
               {"id": "a-hermes", "agent_type": "model", "handle": "Hermes"},
               {"id": "a-quelle", "agent_type": "model", "handle": "Moonfingers Quellenübernahme"},
               {"id": "a-ralf", "agent_type": "human", "handle": "Ralf"}]
    werke = [{"id": "w1", "title": "Zentrale · Material bekommt Form", "created_at": "2026-10-12T08:00:00+00:00"},
             {"id": "w2", "title": "Doppelt", "created_at": "2026-10-19T12:05:00+00:00"},
             {"id": "w3", "title": "Doppelt", "created_at": "2026-10-12T08:00:00+00:00"},
             {"id": "w4", "title": "Doppelt", "created_at": "2026-10-19T09:00:00+00:00"}]
    baeume = [{"id": "t1", "work_id": "w1", "author_id": "a-codex"}, {"id": "t2", "work_id": "w2", "author_id": "a-hermes"},
              {"id": "t3", "work_id": "w1", "author_id": "a-ralf"}, {"id": "t4", "work_id": "w3", "author_id": "a-quelle"}]
    v = lambda i, t, a, zeit, **x: {"id": i, "worktree_id": t, "author_id": a, "created_at": zeit, "label": i, "content": "Text.",
                                    "notes": "", "status": "entwurf", "derived_from": None, **x}
    varianten = [v("alt", "t1", "a-codex", "2026-10-15T08:00:00+00:00"),
                 v("c1", "t1", "a-codex", "2026-10-21T08:00:00+00:00"), v("c2", "t1", "a-codex", "2026-10-21T09:30:00+02:00"),
                 v("h1", "t2", "a-hermes", "2026-10-21T08:10:00+00:00"),
                 v("r1", "t3", "a-ralf", "2026-10-21T08:20:00+00:00"),
                 v("f1", "t3", "a-ralf", "2026-10-21T08:21:00+00:00", content="<!doctype html><p>x</p>",
                   notes="Form ohne Modell · KiNFORMER · Karten. 1 Karte.", contribution={"mode": "review", "seen_variant_ids": ["c1"]})]
    varianten += [v("q%d" % k, "t4", "a-quelle", "2026-10-21T07:%02d:00+00:00" % k) for k in range(13)]
    kanten = [{"id": "k1", "edge_type": "verweist-auf", "from_variant_id": "c2", "to_variant_id": "c1", "author_id": "a-codex", "created_at": "2026-10-21T08:30:00+00:00"},
              {"id": "k2", "edge_type": "verweist-auf", "from_variant_id": "f1", "to_variant_id": "c1", "author_id": "a-ralf", "created_at": "2026-10-21T08:21:01+00:00"}]
    return {"agents": agenten, "works": werke, "worktrees": baeume, "variants": varianten, "edges": kanten, "findings": []}


class Neu(unittest.TestCase):
    def test_satz_wie_im_browser(self):
        with open(os.path.join(WURZEL, "tests", "ankunft-beispiele.json"), encoding="utf-8") as f:
            for b in json.load(f):
                self.assertEqual(server.satz_aus(b["zahlen"]), b["satz"])

    def test_namen_wie_im_browser(self):
        with open(os.path.join(WURZEL, "tests", "link-beispiele.json"), encoding="utf-8") as f:
            for b in json.load(f):
                self.assertEqual(server.grundname(b["titel"]), b["name"], b["titel"])
        namen = server.mond_namen(graph()["works"])
        self.assertEqual(namen, {"w1": "zentrale-material-bekommt-form", "w3": "doppelt", "w4": "doppelt-19-okt", "w2": "doppelt-19-okt-1405"})

    def test_neu_ohne_ralf_und_formen_utc(self):
        z = server.neu_seit(graph(), server._ms("2026-10-21T06:00:00+00:00"))
        self.assertEqual(z["stimmen"], [["Codex", 2], ["Hermes", 1]])
        self.assertEqual((z["zahl"], z["uebernahmen"], z["faeden"], z["monde"]), (16, 13, 1, 3))
        self.assertEqual(z["juengster"], "w2", "h1 um 08:10Z ist die jüngste Ankunft")
        self.assertEqual(server.satz_aus(z), "Seit deinem letzten Besuch eingetragen: zwei Ausprägungen von Codex, eine von Hermes und "
                                              "13 aus einer technischen Übernahme, in drei Monden. Dazu ein neuer Faden.")
        # 09:30+02:00 ist 07:30Z: nach 07:45Z zählt von Codex nur c1
        self.assertEqual(server.neu_seit(graph(), server._ms("2026-10-21T07:45:00Z"))["stimmen"], [["Codex", 1], ["Hermes", 1]])

    def test_zuletzt_wie_im_browser(self):
        with open(os.path.join(WURZEL, "tests", "zuletzt-beispiele.json"), encoding="utf-8") as f:
            for b in json.load(f):
                self.assertEqual(server.zuletzt_satz(b["eintrag"]), b["satz"])
        liste = server.zuletzt_eintraege(graph())
        self.assertEqual(len(liste), 5)
        self.assertEqual([e["label"] for e in liste[:3]], ["h1", "c1", "c2"], "jüngste zuerst, ohne Ralfs Einwurf und ohne Form")
        self.assertEqual(liste[0], {"mond": "doppelt-19-okt-1405", "titel": "Doppelt", "label": "h1", "stimme": "Hermes",
                                    "wann": "2026-10-21T08:10:00+00:00"})
        self.assertIsNone(liste[3]["stimme"], "eine Übernahme hat keine Stimme")

    def test_lesewege(self):
        h = object.__new__(server.Lichtwerk)
        h._oben_json = Mock(return_value=(200, graph()))
        h._json = Mock()
        h._neu("")
        self.assertEqual(h._json.call_args.args[1]["satz"], "Seit deinem letzten Besuch ist nichts dazugekommen.")
        leer = h._json.call_args.args[1]
        self.assertEqual(len(leer["zuletzt"]), 5, "auch ohne Neues stehen die letzten Einträge da")
        self.assertEqual(leer["zuletzt_satz"], "Zuletzt eingetragen: „h1“ von Hermes in „Doppelt“, 21. Okt., 10:10.")
        self.assertEqual(set(leer) >= {"satz", "zahl", "stimmen", "uebernahmen", "faeden", "befunde", "monde", "mond"}, True, "nur additiv")
        h._neu("1792044000000")   # 2026-10-15 ist lange vor allem Neuen: alles nach dem 15. 08:00Z
        antwort = h._json.call_args.args[1]
        self.assertTrue(antwort["satz"].startswith("Seit deinem letzten Besuch eingetragen:"))
        self.assertNotIn("juengster", antwort)
        self.assertEqual(antwort["mond"], "doppelt-19-okt-1405")
        with self.assertRaises(server.Fehler):
            h._neu("gestern")
        h._monde()
        self.assertEqual(h._monde()[0], {"name": "zentrale-material-bekommt-form", "titel": "Zentrale · Material bekommt Form"})
        self.assertNotIn("w1", json.dumps(h._monde()))


if __name__ == "__main__":
    unittest.main(verbosity=2)
