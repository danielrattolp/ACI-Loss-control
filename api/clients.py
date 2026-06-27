"""Client account management — admin only."""
import json, sys
import os
import secrets
sys.path.insert(0, os.path.dirname(__file__))
from http.server import BaseHTTPRequestHandler
from _kv import kv_get, kv_set

AUTH_TOKEN = os.environ.get('AUTH_TOKEN', '')

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Requires ACI employee session
        if not self._authorized():
            self._json(401, {'error': 'Unauthorized'})
            return
        clients = kv_get('aci_clients', {})
        # Strip tokens from list view for safety
        safe = {email: {'name': c['name'], 'email': email, 'active': c.get('active', True)}
                for email, c in clients.items()}
        self._json(200, safe)

    def do_POST(self):
        if not self._authorized():
            self._json(401, {'error': 'Unauthorized'})
            return
        length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(length) or b'{}')
        action = body.get('action')

        clients = kv_get('aci_clients', {})

        if action == 'create':
            email = (body.get('email') or '').strip().lower()
            name  = (body.get('name')  or '').strip()
            if not email or not name:
                self._json(400, {'error': 'email y name requeridos'})
                return
            token = secrets.token_urlsafe(32)
            clients[email] = {'name': name, 'token': token, 'active': True}
            kv_set('aci_clients', clients)
            self._json(200, {'ok': True, 'token': token, 'email': email, 'name': name})

        elif action == 'regenerate':
            email = (body.get('email') or '').strip().lower()
            if email not in clients:
                self._json(404, {'error': 'Cliente no encontrado'})
                return
            token = secrets.token_urlsafe(32)
            clients[email]['token'] = token
            kv_set('aci_clients', clients)
            self._json(200, {'ok': True, 'token': token})

        elif action == 'toggle':
            email = (body.get('email') or '').strip().lower()
            if email not in clients:
                self._json(404, {'error': 'Cliente no encontrado'})
                return
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
        return AUTH_TOKEN and token == AUTH_TOKEN

    def _json(self, code, data):
        payload = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args):
        pass
