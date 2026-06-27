"""Client account management — admin only."""
import json, os, secrets, hashlib, urllib.request
from http.server import BaseHTTPRequestHandler

def _hash(p): return hashlib.sha256(p.encode()).hexdigest()

AUTH_TOKEN = os.environ.get('AUTH_TOKEN', '')
_KV_URL    = os.environ.get('KV_REST_API_URL', '')
_KV_TOKEN  = os.environ.get('KV_REST_API_TOKEN', '')

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
        if not self._authorized():
            self._json(401, {'error': 'Unauthorized'}); return
        clients = kv_get('aci_clients', {})
        safe = {email: {'name': c['name'], 'email': email, 'active': c.get('active', True)}
                for email, c in clients.items()}
        self._json(200, safe)

    def do_POST(self):
        if not self._authorized():
            self._json(401, {'error': 'Unauthorized'}); return
        length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(length) or b'{}')
        action = body.get('action')
        clients = kv_get('aci_clients', {})

        if action == 'create':
            email    = (body.get('email')    or '').strip().lower()
            name     = (body.get('name')     or '').strip()
            password = (body.get('password') or '').strip()
            if not email or not name or not password:
                self._json(400, {'error': 'email, nombre y contraseña requeridos'}); return
            clients[email] = {'name': name, 'password_hash': _hash(password), 'active': True, 'force_change': True}
            kv_set('aci_clients', clients)
            self._json(200, {'ok': True, 'email': email, 'name': name})

        elif action == 'reset_password':
            email    = (body.get('email')    or '').strip().lower()
            password = (body.get('password') or '').strip()
            if email not in clients or not password:
                self._json(404, {'error': 'Cliente no encontrado o contraseña vacía'}); return
            clients[email]['password_hash'] = _hash(password)
            kv_set('aci_clients', clients)
            self._json(200, {'ok': True})

        elif action == 'toggle':
            email = (body.get('email') or '').strip().lower()
            if email not in clients:
                self._json(404, {'error': 'Cliente no encontrado'}); return
            clients[email]['active'] = not clients[email].get('active', True)
            kv_set('aci_clients', clients)
            self._json(200, {'ok': True, 'active': clients[email]['active']})

        elif action == 'delete':
            email = (body.get('email') or '').strip().lower()
            clients.pop(email, None)
            kv_set('aci_clients', clients)
            self._json(200, {'ok': True})

        else:
            self._json(400, {'error': 'Acción desconocida'})

    def _authorized(self):
        cookie = self.headers.get('cookie', '')
        token  = next((c.split('=', 1)[1] for c in cookie.split(';')
                       if c.strip().startswith('aci_session=')), '')
        if not token:
            token = self.headers.get('x-aci-session', '')
        return AUTH_TOKEN and token == AUTH_TOKEN

    def _json(self, code, data):
        payload = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args): pass
