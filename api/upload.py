"""Subida de imágenes a Vercel Blob — solo empleados.

El cliente envía la imagen ya comprimida (JPEG base64). Este endpoint la
sube a Vercel Blob (store público) usando BLOB_READ_WRITE_TOKEN y devuelve
la URL pública, que se guarda en la operación en lugar del base64.

Requiere: crear un store de Blob en el proyecto Vercel (Storage → Blob),
lo que agrega automáticamente la variable BLOB_READ_WRITE_TOKEN.
"""
import json, os, time, base64, re, urllib.request, urllib.error
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, quote

AUTH_TOKEN  = os.environ.get('AUTH_TOKEN', '')
# limpia comillas/espacios que a veces quedan al pegar el token en Vercel
BLOB_TOKEN  = os.environ.get('BLOB_READ_WRITE_TOKEN', '').strip().strip('"').strip("'").strip()
BLOB_HOST   = 'https://blob.vercel-storage.com'
API_VERSION = os.environ.get('BLOB_API_VERSION', '7')  # ajustable si el upstream lo pide

def _safe(name):
    name = (name or 'foto.jpg').strip().replace('\\', '/').split('/')[-1]
    name = re.sub(r'[^A-Za-z0-9._-]', '_', name)
    return name[:80] or 'foto.jpg'

class handler(BaseHTTPRequestHandler):
    def _is_employee(self):
        raw = self.headers.get('cookie', '') or self.headers.get('Cookie', '')
        tok = ''
        for part in raw.split(';'):
            part = part.strip()
            if part.startswith('aci_session='):
                tok = part.split('=', 1)[1]; break
        if not tok:
            tok = self.headers.get('x-aci-session', '') or self.headers.get('X-ACI-Session', '')
        if not tok:
            tok = parse_qs(urlparse(self.path).query).get('_t', [''])[0]
        return bool(AUTH_TOKEN) and tok == AUTH_TOKEN

    def do_POST(self):
        if not self._is_employee():
            self._json(401, {'error': 'No autorizado'}); return
        if not BLOB_TOKEN:
            self._json(503, {'error': 'Vercel Blob no configurado (falta BLOB_READ_WRITE_TOKEN)'}); return

        length = int(self.headers.get('Content-Length', 0))
        try:
            body = json.loads(self.rfile.read(length) or b'{}')
        except Exception:
            self._json(400, {'error': 'JSON inválido'}); return

        data_b64 = body.get('dataBase64') or ''
        if ',' in data_b64 and data_b64.strip().startswith('data:'):
            data_b64 = data_b64.split(',', 1)[1]   # tolera data URL completa
        content_type = body.get('contentType') or 'image/jpeg'
        filename = _safe(body.get('filename'))
        data_b64 = ''.join(data_b64.split())          # quita espacios/saltos
        data_b64 += '=' * (-len(data_b64) % 4)        # corrige padding
        try:
            raw = base64.b64decode(data_b64)
        except Exception:
            self._json(400, {'error': 'Imagen inválida'}); return
        if not raw:
            self._json(400, {'error': 'Imagen vacía'}); return

        pathname = 'aci/%d-%s' % (int(time.time() * 1000), filename)
        url = '%s/%s' % (BLOB_HOST, quote(pathname))
        req = urllib.request.Request(url, data=raw, method='PUT', headers={
            'authorization': 'Bearer %s' % BLOB_TOKEN,
            'x-api-version': API_VERSION,
            'x-content-type': content_type,
            'x-add-random-suffix': '1',
            'access': 'private',   # store privado; se sirven vía /api/photo autenticado
        })
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                out = json.loads(r.read())
            self._json(200, {'ok': True, 'url': out.get('url'), 'pathname': out.get('pathname')})
        except urllib.error.HTTPError as e:
            detail = ''
            try: detail = e.read().decode('utf-8', 'ignore')[:400]
            except Exception: pass
            self._json(502, {'error': 'Blob rechazó la subida', 'status': e.code, 'detail': detail})
        except Exception as e:
            self._json(502, {'error': 'No se pudo subir a Blob', 'detail': str(e)[:200]})

    def _json(self, code, data):
        payload = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args): pass
