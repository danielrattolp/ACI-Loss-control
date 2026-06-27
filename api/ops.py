"""Ops persistence — Vercel KV."""
import json
from http.server import BaseHTTPRequestHandler
from _kv import kv_get, kv_set

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        ops = kv_get('aci_ops', [])
        self._json(200, ops)

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length) if length else b'[]'
        try:
            ops = json.loads(body)
        except Exception:
            ops = []
        kv_set('aci_ops', ops)
        self._json(200, {'ok': True})

    def _json(self, code, data):
        payload = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args):
        pass
