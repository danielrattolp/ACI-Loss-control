"""Client magic-link auth."""
import json, sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from http.server import BaseHTTPRequestHandler
from _kv import kv_get, kv_set

CLIENT_SESSION_TTL = 60 * 60 * 24 * 7  # 7 days (stored server-side, not in cookie max-age)

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(length) or b'{}')
        token = (body.get('token') or '').strip()

        if not token:
            self._json(400, {'error': 'Token requerido'})
            return

        clients = kv_get('aci_clients', {})
        match = next(
            ((email, c) for email, c in clients.items()
             if c.get('token') == token and c.get('active', True)),
            None
        )

        if not match:
            self._json(401, {'error': 'Link inválido o expirado'})
            return

        email, client = match
        # Generate a session token separate from the magic link token
        import secrets
        session_token = secrets.token_urlsafe(32)

        # Store session → client mapping
        sessions = kv_get('aci_client_sessions', {})
        sessions[session_token] = {'email': email, 'name': client['name']}
        kv_set('aci_client_sessions', sessions)

        self._json(200, {
            'ok': True,
            'session': session_token,
            'name': client['name'],
            'email': email
        })

    def do_GET(self):
        # Validate existing session
        cookie = self.headers.get('cookie', '')
        sess = next((c.split('=', 1)[1] for c in cookie.split(';')
                     if c.strip().startswith('aci_client_session=')), '')
        if not sess:
            self._json(401, {'error': 'No session'})
            return

        sessions = kv_get('aci_client_sessions', {})
        info = sessions.get(sess)
        if not info:
            self._json(401, {'error': 'Session inválida'})
            return

        # Check client is still active
        clients = kv_get('aci_clients', {})
        client = clients.get(info['email'])
        if not client or not client.get('active', True):
            self._json(401, {'error': 'Acceso revocado'})
            return

        self._json(200, {'ok': True, 'name': info['name'], 'email': info['email']})

    def _json(self, code, data):
        payload = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args):
        pass
