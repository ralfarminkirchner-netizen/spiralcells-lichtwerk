"""Künstlicher Upstream: keine Sockets, Dienste, Provider oder Bestandswrites."""
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import Mock

QUELLE = Path(__file__).resolve().parents[1] / "server" / "lichtwerk_server.py"
spec = importlib.util.spec_from_file_location("lichtwerk_beleg_test", QUELLE)
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)


class Belegwege(unittest.TestCase):
    def handler(self, path="/api/participations", body=None, profiles=False):
        h = object.__new__(server.Lichtwerk)
        h.path = path
        h.autorenprofile = profiles
        h.headers = {"Host": "127.0.0.1:8411", "Origin": "http://127.0.0.1:8411",
                     "Sec-Fetch-Site": "same-origin", "Content-Type": "application/json"}
        h._body = Mock(return_value=self.participation() if body is None else body)
        h._oben_json = Mock(return_value=(200, {"id": "test-ralf", "handle": "Ralf", "agent_type": "human"}))
        h._oben = Mock(return_value=(201, b'{"id":"test-beleg"}'))
        h._json = Mock()
        h._weiter = Mock()
        return h

    def participation(self, **extra):
        return {"work_id": "test-origin", "context_work_id": "test-context", "variant_id": "test-version",
                "role": "Material", "reason": "Künstlicher Prüfbeleg", "author_id": "test-ralf", **extra}

    def emergence(self, **extra):
        return {"work_id": "test-origin", "title": "Künstlicher Versuch", "body": "Nur isoliertes Testmaterial.",
                "kind": "attempt", "author_id": "test-ralf", **extra}

    def assert_rejected(self, h, status):
        h.do_POST()
        self.assertEqual(h._json.call_args.args[0], status)
        h._oben.assert_not_called()
        h._weiter.assert_not_called()

    def test_three_existing_routes_forward_exactly_once(self):
        source = {"system": "vault", "locator": "/synthetic-only/Original.md", "content_sha256": "a" * 64}
        cases = [
            ("/api/participations", self.participation(source_ref=source, version_binding="pinned", status="active")),
            ("/api/participations/test-participation/withdraw", {"author_id": "test-ralf", "reason": "Nicht mehr passend."}),
            ("/api/emergence-events", self.emergence(source_ref=source, variant_ids=["test-version"],
               conditions=["Künstliche Bedingung"], contradicts_event_ids=["test-previous"], status="documented")),
        ]
        for path, body in cases:
            with self.subTest(path=path):
                h = self.handler(path, body)
                h.do_POST()
                h._oben.assert_called_once_with("POST", path, body)
                h._weiter.assert_called_once_with(201, b'{"id":"test-beleg"}')
                h._json.assert_not_called()

    def test_no_cross_origin_missing_origin_or_cross_site_write(self):
        for changes in [{"Origin": "http://foreign.test"}, {"Origin": None}, {"Sec-Fetch-Site": "cross-site"},
                        {"Host": "foreign.test:8411"}]:
            with self.subTest(changes=changes):
                h = self.handler()
                h.headers.update(changes)
                self.assert_rejected(h, 403)
                h._body.assert_not_called()
                h._oben_json.assert_not_called()

    def test_only_explicit_paths_and_no_query_rewriting(self):
        for path, status in [
            ("/api/participations?next=elsewhere", 400),
            ("/api/participations/test-id/withdraw?other=1", 400),
            ("http://elsewhere.test/api/emergence-events", 400),
            ("/api/participations/../withdraw", 403),
            ("/api/participations/a%2Fb/withdraw", 403),
            ("/api/participations/a/b/withdraw", 403),
            ("/api/participations/" + "a" * 81 + "/withdraw", 403),
            ("/api/emergence-events/test-id", 403),
        ]:
            with self.subTest(path=path):
                h = self.handler(path)
                self.assert_rejected(h, status)
                h._body.assert_not_called()

    def test_required_fields_and_no_generated_or_execution_fields(self):
        for body in [[], {}, self.participation(reason=" "), self.participation(id="made-up"),
                     self.participation(request_id="pretend-idempotence"), self.participation(execute_model=True),
                     self.participation(version_binding="other")]:
            with self.subTest(body=body):
                h = self.handler(body=body)
                self.assert_rejected(h, 400)
                h._oben_json.assert_not_called()

    def test_withdrawal_cannot_be_created_or_rewritten(self):
        h = self.handler(body=self.participation(status="withdrawn", supersedes_id="test-previous"))
        self.assert_rejected(h, 400)
        h = self.handler("/api/participations/test-participation/withdraw",
                         {"author_id": "test-ralf", "reason": "Rücknahme", "variant_id": "test-other"})
        self.assert_rejected(h, 400)

    def test_default_actor_boundary_and_opt_in_existing_profile(self):
        for profiles in [False, True]:
            with self.subTest(profiles=profiles):
                h = self.handler(body=self.participation(author_id="test-model"), profiles=profiles)
                h._oben_json.return_value = (200, {"id": "test-model", "agent_type": "model"})
                if profiles:
                    h.do_POST()
                    h._oben.assert_called_once()
                else:
                    self.assert_rejected(h, 403)
        for profile in [(404, None), (200, {"id": "other-profile"})]:
            h = self.handler(profiles=True)
            h._oben_json.return_value = profile
            self.assert_rejected(h, 403)
        h = self.handler(body=self.participation(author_id="../../elsewhere"), profiles=True)
        self.assert_rejected(h, 403)
        h._oben_json.assert_not_called()

    def test_canonical_writer_rejection_is_preserved_without_technical_details(self):
        for path, body in [("/api/participations", self.participation()),
                           ("/api/emergence-events", self.emergence()),
                           ("/api/participations/test-participation/withdraw", {"author_id": "test-ralf", "reason": "Rücknahme"})]:
            with self.subTest(path=path):
                h = self.handler(path, body)
                raw = json.dumps({"detail": "Unbekannter Verweis: works/private-test-id /Volumes/private/source"}).encode()
                h._oben.return_value = (422, raw)
                h.do_POST()
                h._oben.assert_called_once()
                h._weiter.assert_not_called()
                status, response = h._json.call_args.args
                self.assertEqual(status, 422)
                self.assertNotIn("private", response["satz"])

    def test_ambiguous_post_response_never_retries_or_claims_failure(self):
        for result in [(500, b'{}'), (408, b'{}'), (201, b'not-json'), (201, b'{}'), (200, b'{"id":"test"}')]:
            with self.subTest(result=result):
                h = self.handler()
                h._oben.return_value = result
                h.do_POST()
                h._oben.assert_called_once()
                h._json.assert_called_once_with(503, {"satz": server.BELEG_UNKLAR})
                h._weiter.assert_not_called()
        h = self.handler()
        h._oben.side_effect = server.Fehler(503, "SPiRALCELLS ruht gerade.")
        h.do_POST()
        h._oben.assert_called_once()
        h._json.assert_called_once_with(503, {"satz": server.BELEG_UNKLAR})

    def test_read_only_entrance_stays_closed_for_all_three_routes(self):
        for path in ["/api/participations", "/api/participations/test-id/withdraw", "/api/emergence-events"]:
            h = object.__new__(server.Leseeingang)
            h.path, h._json, h._oben = path, Mock(), Mock()
            h.do_POST()
            h._json.assert_called_once_with(403, {"satz": h.SATZ})
            h._oben.assert_not_called()


if __name__ == "__main__":
    unittest.main()
