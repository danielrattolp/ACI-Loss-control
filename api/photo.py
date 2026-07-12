"""Proxy de imágenes privadas de Vercel Blob — solo usuarios autenticados.

Las fotos se guardan en un store PRIVADO (no accesibles por URL pública).
Este endpoint las entrega en streaming a quien tenga sesión válida:
  • Empleado (cookie aci_session == AUTH_TOKEN), o
  • Cliente (cookie aci_client_session válida en KV).
El <img> del navegador manda el cookie solo (mismo origen), así que basta
con apuntar src="/api/photo?u=<url del blob privado>".
"""
import os, json, urllib.request, urllib.error
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

AUTH_TOKEN = os.environ.get('AUTH_TOKEN', '')
BLOB_TOKEN = os.environ.get('BLOB_READ_WRITE_TOKEN', '').strip().strip('"').strip("'").strip()
_KV_URL    = os.environ.get('KV_REST_API_URL', '')
_KV_TOKEN  = os.environ.get('KV_REST_API_TOKEN', '')

def _kv(cmd):
    if not _KV_URL: return None
    req = urllib.request.Request(_KV_URL, data=json.dumps(cmd).encode(),
        headers={'Authorization': 'Bearer %s' % _KV_TOKEN, 'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req, timeout=8) as r:
        return json.loads(r.read())

def _kv_get(key):
    try:
        d = _kv(['GET', key]); v = d.get('result') if isinstance(d, dict) else None
        return json.loads(v) if v else None
    except: return None

class handler(BaseHTTPRequestHandler):
    def _cookies(self):
        raw = self.headers.get('cookie', '') or self.headers.get('Cookie', '')
        out = {}
        for p in raw.split(';'):
            p = p.strip()
            if '=' in p:
                k, v = p.split('=', 1); out[k] = v
        return out

    def _authorized(self):
        c = self._cookies()
        # empleado
        if AUTH_TOKEN and c.get('aci_session') == AUTH_TOKEN:
            return True
        tokh = self.headers.get('x-aci-session', '') or self.headers.get('X-ACI-Session', '')
        if AUTH_TOKEN and tokh == AUTH_TOKEN:
            return True
        # cliente con sesión válida
        sess = c.get('aci_client_session')
        if sess:
            sessions = _kv_get('aci_client_sessions') or {}
            info = sessions.get(sess)
            if isinstance(info, dict) and info.get('email'):
                return True
        return False

    def do_GET(self):
        if not self._authorized():
            self._err(401, 'No autorizado'); return
        if not BLOB_TOKEN:
            self._err(503, 'Blob no configurado'); return
        u = parse_qs(urlparse(self.path).query).get('u', [''])[0]
        if not u:
            self._err(400, 'Falta u'); return
        host = urlparse(u).hostname or ''
        if not host.endswith('.blob.vercel-storage.com'):
            self._err(400, 'URL no permitida'); return
        try:
            req = urllib.request.Request(u, headers={'Authorization': 'Bearer %s' % BLOB_TOKEN})
            with urllib.request.urlopen(req, timeout=15) as r:
                data = r.read()
                ctype = r.headers.get('Content-Type', 'application/octet-stream')
            self.send_response(200)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'private, max-age=3600')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.end_headers()
            self.wfile.write(data)
        except urllib.error.HTTPError as e:
            self._err(404 if e.code == 404 else 502, 'No encontrada')
        except Exception:
            self._err(502, 'Error al obtener imagen')

    def _err(self, code, msg):
        payload = json.dumps({'error': msg}).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args): pass
