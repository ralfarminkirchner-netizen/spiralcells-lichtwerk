"""Read-only fixed Reader proxy; artificial responses, no sockets or app state."""
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import Mock, patch
from urllib.parse import urlencode, urlparse, parse_qs
import urllib.error

spec = importlib.util.spec_from_file_location('vault_source_lichtwerk', Path(__file__).resolve().parents[1] / 'server/lichtwerk_server.py')
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)


class VaultSourceProxy(unittest.TestCase):
    def setUp(self):
        self.handler = object.__new__(server.Lichtwerk)
        self.path = '/Users/example/ADHS OS VAULT/Original.md'
        self.digest = 'a' * 64
        self.query = urlencode({'path': self.path, 'content_sha256': self.digest})
        self.result = {'source_ref': {'content_sha256': self.digest}, 'vault_path': self.path,
                       'source': {'kind': 'research', 'key': 'b' * 64, 'source_revision_id': self.digest},
                       'selection': {'start': 0, 'end': 5, 'quote': 'Probe'}}

    def response(self, value):
        response = Mock()
        response.__enter__ = Mock(return_value=response)
        response.__exit__ = Mock(return_value=False)
        response.read.return_value = json.dumps(value).encode()
        return response

    def test_fixed_readonly_local_route_preserves_source_contract(self):
        with patch.object(server.urllib.request, 'urlopen', return_value=self.response(self.result)) as request:
            self.assertEqual(self.handler._vault_source(self.query), self.result)
        url = urlparse(request.call_args.args[0])
        self.assertEqual((url.scheme, url.hostname, url.port, url.path),
                         ('http', '127.0.0.1', 53450, '/api/research-vault-source'))
        self.assertEqual(parse_qs(url.query), {'path': [self.path], 'content_sha256': [self.digest]})
        self.assertEqual(request.call_args.kwargs, {'timeout': 4})
        self.assertIn('/lichtwerk/vault-source', server.Leseeingang.DURCH)

    def test_invalid_duplicate_and_host_parameters_never_reach_network(self):
        for query in ['', self.query + '&path=/other', self.query + '&host=evil.example',
                      urlencode({'path': 'https://evil.example', 'content_sha256': self.digest}),
                      urlencode({'path': self.path, 'content_sha256': '../bad'})]:
            with self.subTest(query=query), patch.object(server.urllib.request, 'urlopen') as request:
                with self.assertRaises(server.Fehler) as caught:
                    self.handler._vault_source(query)
                self.assertEqual(caught.exception.status, 400)
                request.assert_not_called()

    def test_mismatched_malformed_and_missing_binding_are_rejected(self):
        for result in [None, [], {'source_ref': None}, dict(self.result, vault_path='/another'),
                       dict(self.result, source_ref={'content_sha256': '0' * 64})]:
            with self.subTest(result=result), patch.object(server.urllib.request, 'urlopen', return_value=self.response(result)):
                with self.assertRaises(server.Fehler) as caught:
                    self.handler._vault_source(self.query)
                self.assertEqual(caught.exception.status, 503)

    def test_oversize_response_is_bounded(self):
        response = self.response(self.result)
        response.read.return_value = b' ' * 512001
        with patch.object(server.urllib.request, 'urlopen', return_value=response):
            with self.assertRaises(server.Fehler):
                self.handler._vault_source(self.query)
        response.read.assert_called_once_with(512001)

    def test_reader_refusal_and_absence_have_human_readable_errors(self):
        for error, status in [(urllib.error.HTTPError('http://local', 400, 'private source', {}, None), 400),
                              (OSError('private path'), 503)]:
            with self.subTest(error=error), patch.object(server.urllib.request, 'urlopen', side_effect=error):
                with self.assertRaises(server.Fehler) as caught:
                    self.handler._vault_source(self.query)
                self.assertEqual(caught.exception.status, status)
                self.assertNotIn('private', str(caught.exception))


if __name__ == '__main__':
    unittest.main()
