"""Ops persistence — Upstash KV.

Autorización:
  • Empleados (cookie/He­ader/query con AUTH_TOKEN): leen y escriben TODAS las ops.
  • Clientes (cookie aci_client_session válida): leen SOLO las ops de su empresa (org).
  • Sin credencial válida: 401 (la 'bodega' ya no es pública).
"""
import json, os, urllib.request
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

AUTH_TOKEN = os.environ.get('AUTH_TOKEN', '')
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

def _op_client(op):
    """Nombre de empresa asociado a la op (campo nuevo op.client o legacy clients[0].name)."""
    if not isinstance(op, dict): return ''
    c = op.get('client')
    if isinstance(c, str) and c.strip(): return c.strip()
    arr = op.get('clients')
    if isinstance(arr, list) and arr and isinstance(arr[0], dict):
        n = arr[0].get('name')
        if isinstance(n, str): return n.strip()
    return ''

def _belongs(op, org_lower):
    c = _op_client(op).lower()
    if not c or not org_lower: return False
    return c in org_lower or org_lower in c

class handler(BaseHTTPRequestHandler):
    # ── Helpers de autorización ──────────────────────────────
    def _cookie_val(self, name):
        raw = self.headers.get('cookie', '') or self.headers.get('Cookie', '')
        for part in raw.split(';'):
            part = part.strip()
            if part.startswith(name + '='):
                return part.split('=', 1)[1]
        return ''

    def _is_employee(self):
        tok = self._cookie_val('aci_session')
        if not tok:
            tok = self.headers.get('x-aci-session', '') or self.headers.get('X-ACI-Session', '')
        if not tok:
            tok = parse_qs(urlparse(self.path).query).get('_t', [''])[0]
        return bool(AUTH_TOKEN) and tok == AUTH_TOKEN

    def _client_org(self):
        """Devuelve la org del cliente si la sesión es válida y está activa, si no None."""
        sess = self._cookie_val('aci_client_session')
        if not sess:
            return None
        sessions = kv_get('aci_client_sessions', {}) or {}
        info = sessions.get(sess)
        if not isinstance(info, dict):
            return None
        clients = kv_get('aci_clients', {}) or {}
        client = clients.get(info.get('email'))
        if not isinstance(client, dict) or not client.get('active', True):
            return None
        return info.get('org') or info.get('name') or ''

    # ── Endpoints ────────────────────────────────────────────
    def do_GET(self):
        ops = kv_get('aci_ops', []) or []
        if not isinstance(ops, list):
            ops = []
        if self._is_employee():
            self._json(200, ops); return
        org = self._client_org()
        if org:
            o = org.strip().lower()
            self._json(200, [op for op in ops if _belongs(op, o)]); return
        self._json(401, {'error': 'No autorizado'})

    def do_POST(self):
        if not self._is_employee():
            self._json(401, {'error': 'No autorizado'}); return
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length) if length else b'[]'
        try: ops = json.loads(body)
        except: ops = []
        if not isinstance(ops, list):
            self._json(400, {'error': 'Formato inválido'}); return
        kv_set('aci_ops', ops)
        self._json(200, {'ok': True})

    def _json(self, code, data):
        payload = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args): pass
