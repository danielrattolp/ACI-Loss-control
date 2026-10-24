import io
import json
import os
import unittest
import urllib.error
from unittest.mock import patch

from api.editorial import dispatch
from editorial.service import Service
from editorial.storage import Store


class StorageDiagnostics(unittest.TestCase):
    def setUp(self):
        self.environment = patch.dict(os.environ, {
            'VERCEL_ENV': 'preview',
            'VERCEL_GIT_COMMIT_REF': 'editor-test',
            'KV_REST_API_URL': 'https://test-store.example.invalid',
            'KV_REST_API_TOKEN': 'test-value-must-never-be-logged',
        }, clear=True)
        self.environment.start()
        self.addCleanup(self.environment.stop)

    def call(self):
        return dispatch('GET', {}, b'', Service(Store()))

    def test_missing_preview_binding_has_specific_safe_error(self):
        os.environ.pop('KV_REST_API_TOKEN')
        with self.assertLogs('api.editorial', level='WARNING') as logs:
            status, body, _ = self.call()
        self.assertEqual(status, 503)
        self.assertEqual(body['code'], 'CMS_STORAGE_MISSING')
        self.assertIn('KV_REST_API_TOKEN', body['error'])
        self.assertNotIn(os.environ['KV_REST_API_URL'], json.dumps(body) + str(logs.output))

    def test_upstream_auth_error_never_exposes_token_or_url(self):
        error = urllib.error.HTTPError(os.environ['KV_REST_API_URL'], 403,
                                      os.environ['KV_REST_API_TOKEN'], {}, None)
        with patch('editorial.storage.urllib.request.urlopen', side_effect=error), self.assertLogs('api.editorial') as logs:
            status, body, _ = self.call()
        self.assertEqual(status, 503)
        self.assertEqual(body['code'], 'CMS_STORAGE_AUTH')
        output = json.dumps(body) + str(logs.output)
        for name in ['KV_REST_API_TOKEN', 'KV_REST_API_URL']:
            self.assertNotIn(os.environ[name], output)

    def test_remote_connection_error_is_distinct(self):
        with patch('editorial.storage.urllib.request.urlopen', side_effect=urllib.error.URLError('offline')), self.assertLogs('api.editorial'):
            status, body, _ = self.call()
        self.assertEqual(status, 503)
        self.assertEqual(body['code'], 'CMS_STORAGE_CONNECTION')

    def test_invalid_remote_response_is_not_a_client_error(self):
        for raw in [b'not-json', b'[]', b'{"error":"EVAL disabled"}']:
            with self.subTest(raw=raw), patch('editorial.storage.urllib.request.urlopen', return_value=io.BytesIO(raw)), self.assertLogs('api.editorial'):
                status, body, _ = self.call()
            self.assertEqual(status, 503)
            self.assertEqual(body['code'], 'CMS_STORAGE_RESPONSE')

    def test_empty_remote_store_is_a_valid_unpublished_site(self):
        with patch('editorial.storage.urllib.request.urlopen', return_value=io.BytesIO(b'{"result":null}')):
            status, body, _ = self.call()
        self.assertEqual(status, 200)
        self.assertEqual(body, {'content': {}, 'revision': None})

    def test_recovered_connection_takes_precedence_over_archived_binding(self):
        os.environ.update({'ACI_REDIS_REST_API_URL':'https://recovered.example.invalid',
                           'ACI_REDIS_REST_API_TOKEN':'recovered-test-token'})
        with patch('editorial.storage.urllib.request.urlopen', return_value=io.BytesIO(b'{"result":null}')) as request:
            status, body, _ = self.call()
        self.assertEqual(status, 200)
        outgoing=request.call_args.args[0]
        self.assertEqual(outgoing.full_url,'https://recovered.example.invalid')
        self.assertEqual(outgoing.get_header('Authorization'),'Bearer recovered-test-token')
        self.assertNotIn('recovered-test-token',json.dumps(body))

    def test_partial_recovered_binding_does_not_mix_with_legacy_token(self):
        os.environ['ACI_REDIS_REST_API_URL']='https://recovered.example.invalid'
        with patch('editorial.storage.urllib.request.urlopen') as request, self.assertLogs('api.editorial'):
            status, body, _ = self.call()
        self.assertEqual(status,503)
        self.assertEqual(body['code'],'CMS_STORAGE_MISSING')
        self.assertIn('ACI_REDIS_REST_API_TOKEN',body['error'])
        request.assert_not_called()

    def test_recovered_failure_never_falls_back_to_archived_database(self):
        os.environ.update({'ACI_REDIS_REST_API_URL':'https://recovered.example.invalid',
                           'ACI_REDIS_REST_API_TOKEN':'recovered-test-token'})
        with patch('editorial.storage.urllib.request.urlopen',side_effect=urllib.error.URLError('offline')) as request, self.assertLogs('api.editorial'):
            status, body, _ = self.call()
        self.assertEqual(status,503)
        self.assertEqual(body['code'],'CMS_STORAGE_CONNECTION')
        request.assert_called_once()

    def test_vercel_generated_recovered_names_have_priority(self):
        os.environ.update({
            'ACI_REDIS_KV_REST_API_URL':'https://native-recovered.example.invalid',
            'ACI_REDIS_KV_REST_API_TOKEN':'native-recovered-test-token',
            'ACI_REDIS_REST_API_URL':'https://manually-configured.example.invalid',
            'ACI_REDIS_REST_API_TOKEN':'manually-configured-token',
        })
        with patch('editorial.storage.urllib.request.urlopen',return_value=io.BytesIO(b'{"result":null}')) as request:
            status, _, _ = self.call()
        self.assertEqual(status,200)
        outgoing=request.call_args.args[0]
        self.assertEqual(outgoing.full_url,'https://native-recovered.example.invalid')
        self.assertEqual(outgoing.get_header('Authorization'),'Bearer native-recovered-test-token')

    def test_partial_vercel_generated_binding_does_not_use_older_connection(self):
        os.environ['ACI_REDIS_KV_REST_API_URL']='https://native-recovered.example.invalid'
        with patch('editorial.storage.urllib.request.urlopen') as request, self.assertLogs('api.editorial'):
            status, body, _ = self.call()
        self.assertEqual(status,503)
        self.assertEqual(body['code'],'CMS_STORAGE_MISSING')
        self.assertIn('ACI_REDIS_KV_REST_API_TOKEN',body['error'])
        request.assert_not_called()


if __name__ == '__main__':
    unittest.main()
