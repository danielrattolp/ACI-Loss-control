"""Counters persistence — Upstash KV."""
import json, os, urllib.request
from http.server import BaseHTTPRequestHandler

_KV_URL   = os.environ.get('KV_REST_API_URL', '')
_KV_TOKEN = os.environ.get('KV_REST_API_TOKEN', '')

def _kv(cmd):
    if not _KV_URL: return None
    req = urllib.request.Request(_KV_URL, data=json.dumps(cmd).encode(),
        headers={'Authorization': f'Bearer {_KV_TOKEN}', 'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req, timeout=8) as r:
        return json.loads(r.read())

def kv_get(key, default=None):
    try:
        d = _kv(['GET', key]); v = d and d.get('result')
        return json.loads(v) if v else default
    except: return default

def kv_set(key, value):
    try: return bool(_kv(['SET', key, json.dumps(value)]))
    except: return False

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self._json(200, kv_get('aci_counters', {}))

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length) if length else b'{}'
        try: counters = json.loads(body)
        except: counters = {}
        kv_set('aci_counters', counters)
        self._json(200, {'ok': True})

    def _json(self, code, data):
        payload = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args): pass
