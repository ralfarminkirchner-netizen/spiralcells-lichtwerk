"""Isolierte Prüfungen mit künstlichen Profilen; keine Sockets, Prozesse oder Bestände."""
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import Mock, patch

QUELLE = Path(__file__).resolve().parents[1] / "server" / "lichtwerk_server.py"
spec = importlib.util.spec_from_file_location("lichtwerk_autoren_test", QUELLE)
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)


class Autorenprofile(unittest.TestCase):
    def handler(self, enabled=False):
        handler = object.__new__(server.Lichtwerk)
        handler.autorenprofile = enabled
        handler._weiter = Mock()
        handler._json = Mock()
        handler._oben = Mock(return_value=(201, b'{"variant":{"id":"test-result"}}'))
        return handler

    def body(self, **extra):
        return {"work_id": "test-work", "source_variant_id": "test-source",
                "new_worktree": True, "author_id": "test-model",
                "request_id": "lichtwerk-test-request-0001", "content": "Künstliches Testmaterial",
                "label": "Isolierter Test", **extra}

    def reject(self, handler, body, code=403):
        with self.assertRaises(server.Fehler) as caught:
            handler._einwurf(body)
        self.assertEqual(caught.exception.status, code)
        handler._oben.assert_not_called()

    def test_default_keeps_ralf_boundary(self):
        self.assertFalse(server.Lichtwerk.autorenprofile)
        handler = self.handler()
        handler._oben_json = Mock(return_value=(200, {
            "id": "test-model", "agent_type": "model", "handle": "Testmodell"}))
        self.reject(handler, self.body())
        handler._oben_json.return_value = (200, {
            "id": "test-human", "agent_type": "human", "handle": "Ralf"})
        handler._einwurf(self.body(author_id="test-human"))
        self.assertEqual(handler._oben.call_args.args[:2], ("POST", "/api/variant-branches"))

    def test_opt_in_forwards_existing_profile_and_request_unchanged(self):
        handler = self.handler(True)
        handler._oben_json = Mock(return_value=(200, {"id": "test-model", "agent_type": "model"}))
        body = self.body()
        handler._einwurf(body)
        handler._einwurf(body)
        self.assertEqual(handler._oben.call_count, 2)
        for call in handler._oben.call_args_list:
            self.assertEqual(call.args, ("POST", "/api/variant-branches", body))
            self.assertEqual(call.kwargs, {"zeit": 15})
        handler._oben_json.assert_called_with("GET", "/api/agents/test-model")

    def test_opt_in_rejects_unknown_mismatched_and_malformed_profiles(self):
        for status, profile in [(404, None), (200, None), (200, {"id": "another-profile"})]:
            with self.subTest(status=status, profile=profile):
                handler = self.handler(True)
                handler._oben_json = Mock(return_value=(status, profile))
                self.reject(handler, self.body())
        handler = self.handler(True)
        handler._oben_json = Mock()
        self.reject(handler, self.body(author_id="../../elsewhere"))
        handler._oben_json.assert_not_called()

    def test_worktree_author_must_match(self):
        for owner in ["test-model", "other-profile", None]:
            with self.subTest(owner=owner):
                handler = self.handler(True)
                handler._oben_json = Mock(side_effect=[
                    (200, {"id": "test-model"}),
                    (200, {"worktrees": [{"id": "test-tree", "author_id": owner}]}),
                ])
                body = self.body(worktree_id="test-tree", new_worktree=False)
                if owner == "test-model":
                    handler._einwurf(body)
                    handler._oben.assert_called_once()
                else:
                    self.reject(handler, body)

    def test_request_identity_and_body_validation_remain_required(self):
        for changes in [{"request_id": None}, {"request_id": "wrong"},
                        {"content": ""}, {"execute_model": True}]:
            handler = self.handler(True)
            handler._oben_json = Mock()
            self.reject(handler, self.body(**changes), code=400)
            handler._oben_json.assert_not_called()

    def test_health_adds_capability_without_changing_upstream_fields(self):
        upstream = {"instance_id": "synthetic-test-only", "capabilities": ["variant-branches"]}
        for enabled in [False, True]:
            handler = self.handler(enabled)
            handler.path = "/api/health"
            handler._schutz = Mock()
            handler._oben.return_value = (200, json.dumps(upstream).encode())
            handler.do_GET()
            expected = {**upstream, "lichtwerk": {"capabilities": {"authorSelection": enabled}}}
            handler._json.assert_called_once_with(200, expected)
            handler._schutz.assert_called_once_with(False)

    def test_health_does_not_disguise_failure(self):
        handler = self.handler(True)
        handler.path = "/api/health"
        handler._schutz = Mock()
        handler._oben.return_value = (503, b'{"error":"synthetic failure"}')
        handler.do_GET()
        handler._weiter.assert_called_once_with(503, b'{"error":"synthetic failure"}')
        handler._json.assert_not_called()

    def test_opt_in_keeps_same_origin_write_protection(self):
        handler = self.handler(True)
        handler.headers = {"Host": "127.0.0.1:8411", "Origin": "http://foreign.test",
                           "Content-Type": "application/json"}
        handler.path = "/api/variant-branches"
        handler._body = Mock()
        handler.do_POST()
        self.assertEqual(handler._json.call_args.args[0], 403)
        handler._body.assert_not_called()
        handler._oben.assert_not_called()

    def test_flag_is_opt_in_without_starting_a_server(self):
        for args, expected in [([], False), (["--autorenprofile"], True)]:
            with self.subTest(args=args), patch.object(server, "ThreadingHTTPServer") as constructor, \
                    patch.object(server, "print"), patch.object(server.Lichtwerk, "autorenprofile"):
                server.main(args)
                self.assertEqual(server.Lichtwerk.autorenprofile, expected)
                constructor.assert_called_once()


if __name__ == "__main__":
    unittest.main()
