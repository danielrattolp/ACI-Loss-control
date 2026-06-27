"""Client email/password auth."""
import json, os, secrets, hashlib, urllib.request
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

def _hash(password):
    return hashlib.sha256(password.encode()).hexdigest()

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(length) or b'{}')
        email    = (body.get('email')    or '').strip().lower()
        password = (body.get('password') or '').strip()

        if not email or not password:
            self._json(400, {'error': 'Email y contraseña requeridos'}); return

        clients = kv_get('aci_clients', {})
        client  = clients.get(email)

        if not client or not client.get('active', True):
            self._json(401, {'error': 'Credenciales incorrectas'}); return
        if client.get('password_hash') != _hash(password):
            self._json(401, {'error': 'Credenciales incorrectas'}); return

        session_token = secrets.token_urlsafe(32)
        sessions = kv_get('aci_client_sessions', {})
        sessions[session_token] = {'email': email, 'name': client['name']}
        kv_set('aci_client_sessions', sessions)
        self._json(200, {'ok': True, 'session': session_token,
                         'name': client['name'], 'email': email})

    def do_GET(self):
        cookie = self.headers.get('cookie', '')
        sess = next((c.split('=', 1)[1] for c in cookie.split(';')
                     if c.strip().startswith('aci_client_session=')), '')
        if not sess:
            self._json(401, {'error': 'No session'}); return
        sessions = kv_get('aci_client_sessions', {})
        info = sessions.get(sess)
        if not info:
            self._json(401, {'error': 'Session inválida'}); return
        clients = kv_get('aci_clients', {})
        client = clients.get(info['email'])
        if not client or not client.get('active', True):
            self._json(401, {'error': 'Acceso revocado'}); return
        self._json(200, {'ok': True, 'name': info['name'], 'email': info['email']})

    def _json(self, code, data):
        payload = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args): pass
