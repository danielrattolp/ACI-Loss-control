"""Vercel serverless function — ops persistence stub.
En Vercel el filesystem es efímero; los datos se guardan en localStorage del navegador.
Este endpoint acepta las peticiones para evitar errores en la consola."""
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self._ok(b"[]")

    def do_POST(self):
        # consume body to avoid broken pipe
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length:
            self.rfile.read(content_length)
        self._ok(b'{"ok":true}')

    def _ok(self, body):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass
