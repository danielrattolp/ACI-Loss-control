"""Login endpoint — verifica credenciales y devuelve token de sesión."""
from http.server import BaseHTTPRequestHandler
import json
import os

AUTH_USER  = os.environ.get('AUTH_USER',  'aci')
AUTH_PASS  = os.environ.get('AUTH_PASS',  '')
AUTH_TOKEN = os.environ.get('AUTH_TOKEN', '')

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(length) or b'{}')
        user   = body.get('user', '').strip()
        passwd = body.get('pass', '').strip()

        if AUTH_PASS and AUTH_TOKEN and user == AUTH_USER and passwd == AUTH_PASS:
            self._json(200, {'ok': True, 'token': AUTH_TOKEN})
        else:
            self._json(401, {'ok': False, 'error': 'Credenciales incorrectas'})

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _json(self, code, data):
        payload = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args):
        pass
