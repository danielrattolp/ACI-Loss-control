"""Empresas cliente (por RUT) + contactos — solo operador (AUTH_TOKEN).

Modelo empresa/RUT sobre el KV existente:
  aci_empresas  -> { empresa_id: { razon_social, rut, creado_en, contactos:[emails] } }
  aci_clients   -> { email: { name, org, password_hash, active, force_change,
                              empresa_id, rol:'cliente' } }   (login existente)

El RUT es la clave única de la empresa. Un RUT = una empresa = varios contactos.
La creación de la cuenta de login se hace server-side (nunca expone llaves).
"""
import json, os, secrets, hashlib, time, urllib.request
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

AUTH_TOKEN = os.environ.get('AUTH_TOKEN', '')
_KV_URL    = os.environ.get('KV_REST_API_URL', '')
_KV_TOKEN  = os.environ.get('KV_REST_API_TOKEN', '')


def _hash(p): return hashlib.sha256(p.encode()).hexdigest()


def _kv(cmd):
    if not _KV_URL: return None
    req = urllib.request.Request(_KV_URL, data=json.dumps(cmd).encode(),
        headers={'Authorization': f'Bearer {_KV_TOKEN}', 'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req, timeout=8) as r:
        return json.loads(r.read())


def kv_get(key, default=None):
    try:
        d = _kv(['GET', key]); v = d and d.get('result')
        val = json.loads(v) if v else default
        return val if val is not None else default
    except Exception:
        return default


def kv_set(key, value):
    try: return bool(_kv(['SET', key, json.dumps(value)]))
    except Exception: return False


# ── RUT chileno: normalización y validación (dígito verificador, módulo 11) ──
def rut_clean(rut):
    """Devuelve solo cuerpo+DV en mayúscula, sin puntos ni guion. '' si vacío."""
    if not rut: return ''
    s = str(rut).strip().upper().replace('.', '').replace('-', '').replace(' ', '')
    return s


def rut_dv(cuerpo):
    """Calcula el dígito verificador para el cuerpo numérico (string de dígitos)."""
    suma, mult = 0, 2
    for d in reversed(cuerpo):
        suma += int(d) * mult
        mult = 2 if mult == 7 else mult + 1
    resto = 11 - (suma % 11)
    if resto == 11: return '0'
    if resto == 10: return 'K'
    return str(resto)


def rut_valid(rut):
    s = rut_clean(rut)
    if len(s) < 2 or not s[:-1].isdigit(): return False
    cuerpo, dv = s[:-1], s[-1]
    return rut_dv(cuerpo) == dv


def rut_format(rut):
    """Formato canónico 12345678-9 (guarda así para consistencia)."""
    s = rut_clean(rut)
    if len(s) < 2: return s
    return s[:-1] + '-' + s[-1]


class handler(BaseHTTPRequestHandler):
    # ---- GET: listar empresas con sus contactos ----
    def do_GET(self):
        if not self._authorized():
            self._json(401, {'error': 'Unauthorized', 'auth_configured': bool(AUTH_TOKEN)}); return
        empresas = kv_get('aci_empresas', {}) or {}
        clients  = kv_get('aci_clients', {}) or {}
        out = {}
        for eid, e in empresas.items():
            if not isinstance(e, dict): continue
            contactos = []
            for email in (e.get('contactos') or []):
                c = clients.get(email)
                if isinstance(c, dict):
                    contactos.append({'email': email, 'name': c.get('name', email),
                                      'active': c.get('active', True),
                                      'alerts': c.get('alertsOptIn', True)})
            out[eid] = {'id': eid, 'razon_social': e.get('razon_social', ''),
                        'rut': e.get('rut', ''), 'creado_en': e.get('creado_en', ''),
                        'contactos': contactos}
        self._json(200, {'empresas': out})

    # ---- POST: lookup / create / add_contact / reset_all ----
    def do_POST(self):
        if not self._authorized():
            self._json(401, {'error': 'Unauthorized'}); return
        length = int(self.headers.get('Content-Length', 0))
        try:
            body = json.loads(self.rfile.read(length) or b'{}')
        except Exception:
            self._json(400, {'error': 'JSON inválido'}); return
        action = body.get('action')

        if action == 'lookup':
            rut = rut_format(body.get('rut'))
            if not rut_valid(rut):
                self._json(200, {'valid': False}); return
            empresas = kv_get('aci_empresas', {}) or {}
            for eid, e in empresas.items():
                if isinstance(e, dict) and e.get('rut') == rut:
                    clients = kv_get('aci_clients', {}) or {}
                    contactos = [{'email': em, 'name': (clients.get(em) or {}).get('name', em)}
                                 for em in (e.get('contactos') or [])]
                    self._json(200, {'valid': True, 'exists': True,
                                     'empresa': {'id': eid, 'razon_social': e.get('razon_social', ''),
                                                 'rut': rut, 'contactos': contactos}})
                    return
            self._json(200, {'valid': True, 'exists': False, 'rut': rut})
            return

        if action == 'create':
            razon = (body.get('razon_social') or '').strip()
            rut   = rut_format(body.get('rut'))
            c     = body.get('contact') or {}
            if not razon:
                self._json(400, {'error': 'Razón social requerida'}); return
            if not rut_valid(rut):
                self._json(400, {'error': 'RUT inválido (revisa el dígito verificador)'}); return
            err = self._validate_contact(c)
            if err:
                self._json(400, {'error': err}); return
            empresas = kv_get('aci_empresas', {}) or {}
            for e in empresas.values():
                if isinstance(e, dict) and e.get('rut') == rut:
                    self._json(409, {'error': 'Ya existe una empresa con ese RUT', 'exists': True}); return
            eid = 'emp_' + secrets.token_hex(6)
            email = (c.get('email') or '').strip().lower()
            empresas[eid] = {'razon_social': razon, 'rut': rut,
                             'creado_en': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                             'contactos': [email]}
            self._create_client(email, c, eid, razon)
            kv_set('aci_empresas', empresas)
            self._json(200, {'ok': True, 'empresa_id': eid, 'rut': rut})
            return

        if action == 'add_contact':
            eid = (body.get('empresa_id') or '').strip()
            c   = body.get('contact') or {}
            empresas = kv_get('aci_empresas', {}) or {}
            e = empresas.get(eid)
            if not isinstance(e, dict):
                self._json(404, {'error': 'Empresa no encontrada'}); return
            err = self._validate_contact(c)
            if err:
                self._json(400, {'error': err}); return
            email = (c.get('email') or '').strip().lower()
            if email in (e.get('contactos') or []):
                self._json(409, {'error': 'Ese contacto ya existe en la empresa'}); return
            self._create_client(email, c, eid, e.get('razon_social', ''))
            e.setdefault('contactos', []).append(email)
            kv_set('aci_empresas', empresas)
            self._json(200, {'ok': True, 'empresa_id': eid, 'email': email})
            return

        if action == 'delete_contact':
            email = (body.get('email') or '').strip().lower()
            clients = kv_get('aci_clients', {}) or {}
            clients.pop(email, None)
            kv_set('aci_clients', clients)
            empresas = kv_get('aci_empresas', {}) or {}
            for e in empresas.values():
                if isinstance(e, dict) and email in (e.get('contactos') or []):
                    e['contactos'] = [x for x in e['contactos'] if x != email]
            kv_set('aci_empresas', empresas)
            self._json(200, {'ok': True})
            return

        if action == 'set_alerts':
            email = (body.get('email') or '').strip().lower()
            enabled = bool(body.get('enabled'))
            clients = kv_get('aci_clients', {}) or {}
            if email not in clients:
                self._json(404, {'error': 'Contacto no encontrado'}); return
            clients[email]['alertsOptIn'] = enabled
            kv_set('aci_clients', clients)
            self._json(200, {'ok': True, 'enabled': enabled})
            return

        if action == 'reset_password':
            email = (body.get('email') or '').strip().lower()
            pw    = (body.get('password') or '').strip()
            if len(pw) < 6:
                self._json(400, {'error': 'La contraseña debe tener al menos 6 caracteres'}); return
            clients = kv_get('aci_clients', {}) or {}
            if email not in clients:
                self._json(404, {'error': 'Contacto no encontrado'}); return
            clients[email]['password_hash'] = _hash(pw)
            clients[email]['force_change'] = False
            clients[email]['active'] = True
            kv_set('aci_clients', clients)
            self._json(200, {'ok': True})
            return

        if action == 'reset_all':
            # "Empezar limpio": borra empresas y clientes de prueba.
            kv_set('aci_empresas', {})
            kv_set('aci_clients', {})
            self._json(200, {'ok': True, 'message': 'empresas y clientes reiniciados'})
            return

        self._json(400, {'error': 'Acción desconocida'})

    # ---- helpers ----
    def _validate_contact(self, c):
        email = (c.get('email') or '').strip().lower()
        name  = (c.get('name')  or '').strip()
        pw    = (c.get('password') or '').strip()
        if not name:  return 'Nombre del contacto requerido'
        if '@' not in email or '.' not in email: return 'Email inválido'
        if len(pw) < 6: return 'La contraseña debe tener al menos 6 caracteres'
        return None

    def _create_client(self, email, c, empresa_id, org):
        clients = kv_get('aci_clients', {}) or {}
        clients[email] = {
            'name': (c.get('name') or '').strip(),
            'org': org,
            'password_hash': _hash((c.get('password') or '').strip()),
            'active': True, 'force_change': True,
            'empresa_id': empresa_id, 'rol': 'cliente',
        }
        kv_set('aci_clients', clients)

    def _authorized(self):
        cookie = self.headers.get('cookie', '') or self.headers.get('Cookie', '')
        token  = next((c.split('=', 1)[1] for c in cookie.split(';')
                       if c.strip().startswith('aci_session=')), '')
        if not token:
            token = self.headers.get('x-aci-session', '') or self.headers.get('X-ACI-Session', '')
        if not token:
            token = parse_qs(urlparse(self.path).query).get('_t', [''])[0]
        return bool(AUTH_TOKEN) and token == AUTH_TOKEN

    def _json(self, code, data):
        payload = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args): pass
