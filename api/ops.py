"""Ops persistence — almacén POR OPERACIÓN con bloqueo optimista.

Modelo de datos:
  aci_op:{id}    -> JSON de una operación (incluye _v y _updatedAt)
  aci_op_v:{id}  -> entero de versión (para compare-and-set atómico)
  aci_ops_ids    -> SET de ids de operaciones (índice)
  aci_ops        -> (LEGACY) blob único — se conserva como respaldo

Autorización:
  • Empleados (cookie/header/query con AUTH_TOKEN): leen y escriben TODAS las ops.
  • Clientes (cookie aci_client_session): leen SOLO las ops de su empresa (org).
  • Sin credencial válida: 401.

Concurrencia:
  • PUT de una sola operación con verificación de versión (compare-and-set).
    Si otro usuario guardó primero, responde 409 con la versión fresca para
    que el cliente recargue y reaplique — nunca se pierde un dato en silencio.
  • Compatibilidad: si el índice nuevo está vacío (antes de migrar), lee del
    blob legacy. El POST masivo escribe el blob (respaldo) y además refleja
    cada operación en el almacén nuevo.
"""
import json, os, urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

AUTH_TOKEN = os.environ.get('AUTH_TOKEN', '')
_KV_URL   = os.environ.get('KV_REST_API_URL', '')
_KV_TOKEN = os.environ.get('KV_REST_API_TOKEN', '')

IDS_KEY    = 'aci_ops_ids'
LEGACY_KEY = 'aci_ops'
def _opkey(i): return 'aci_op:' + i
def _vkey(i):  return 'aci_op_v:' + i

# compare-and-set atómico: solo escribe si la versión coincide
_CAS = (
    "local cur = redis.call('GET', KEYS[2]) "
    "if cur and tonumber(cur) ~= tonumber(ARGV[2]) then return 'CONFLICT' end "
    "redis.call('SET', KEYS[1], ARGV[1]) "
    "local nv = (tonumber(ARGV[2]) or 0) + 1 "
    "redis.call('SET', KEYS[2], tostring(nv)) "
    "return tostring(nv)"
)

def _kv(cmd):
    if not _KV_URL: return None
    req = urllib.request.Request(_KV_URL, data=json.dumps(cmd).encode(),
        headers={'Authorization': f'Bearer {_KV_TOKEN}', 'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def _result(cmd, default=None):
    try:
        d = _kv(cmd)
        return d.get('result') if isinstance(d, dict) else default
    except: return default

def _get_json(key, default=None):
    v = _result(['GET', key])
    if not v: return default
    try: return json.loads(v)
    except: return default

def _now(): return datetime.now(timezone.utc).isoformat()

# ── Almacén por operación ────────────────────────────────────
def _all_ops():
    ids = _result(['SMEMBERS', IDS_KEY]) or []
    if not ids:
        legacy = _get_json(LEGACY_KEY, [])
        return legacy if isinstance(legacy, list) else []
    vals = _result(['MGET'] + [_opkey(i) for i in ids]) or []
    ops = []
    for v in vals:
        if not v: continue
        try: ops.append(json.loads(v))
        except: pass
    return ops

def _get_op(i):
    v = _result(['GET', _opkey(i)])
    if v:
        try: return json.loads(v)
        except: return None
    legacy = _get_json(LEGACY_KEY, [])
    if isinstance(legacy, list):
        return next((o for o in legacy if isinstance(o, dict) and o.get('id') == i), None)
    return None

def _write_op(op):
    """Escritura con bloqueo optimista. Devuelve (ok, resultado).
    ok=True -> resultado = nueva versión (int).
    ok=False -> resultado = 'conflict' | 'no-id'."""
    i = op.get('id')
    if not i: return (False, 'no-id')
    expected = int(op.get('_v') or 0)
    op = dict(op)
    op['_v'] = expected + 1
    op['_updatedAt'] = _now()
    res = _result(['EVAL', _CAS, '2', _opkey(i), _vkey(i), json.dumps(op), str(expected)])
    if res == 'CONFLICT': return (False, 'conflict')
    _kv(['SADD', IDS_KEY, i])
    return (True, expected + 1)

def _force_write(op):
    """Escritura forzada (import/POST masivo): ignora versión, incrementa."""
    i = op.get('id')
    if not i: return
    curv = _result(['GET', _vkey(i)])
    try: nv = (int(curv) if curv else 0) + 1
    except: nv = 1
    op = dict(op); op['_v'] = nv; op['_updatedAt'] = _now()
    _kv(['SET', _opkey(i), json.dumps(op)])
    _kv(['SET', _vkey(i), str(nv)])
    _kv(['SADD', IDS_KEY, i])

# ── Filtrado por cliente ─────────────────────────────────────
def _op_client(op):
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
    # ── Autorización ─────────────────────────────────────────
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
        sess = self._cookie_val('aci_client_session')
        if not sess: return None
        sessions = _get_json('aci_client_sessions', {}) or {}
        info = sessions.get(sess)
        if not isinstance(info, dict): return None
        clients = _get_json('aci_clients', {}) or {}
        client = clients.get(info.get('email'))
        if not isinstance(client, dict) or not client.get('active', True): return None
        return info.get('org') or info.get('name') or ''

    def _qs(self, key):
        return parse_qs(urlparse(self.path).query).get(key, [''])[0]

    # ── GET ──────────────────────────────────────────────────
    def do_GET(self):
        op_id = self._qs('id')
        emp = self._is_employee()
        org = None if emp else self._client_org()
        if not emp and not org:
            self._json(401, {'error': 'No autorizado'}); return

        if op_id:
            op = _get_op(op_id)
            if not op: self._json(404, {'error': 'No encontrada'}); return
            if not emp and not _belongs(op, (org or '').strip().lower()):
                self._json(403, {'error': 'Sin acceso'}); return
            self._json(200, op); return

        ops = _all_ops()
        if emp:
            self._json(200, ops); return
        o = (org or '').strip().lower()
        self._json(200, [op for op in ops if _belongs(op, o)])

    # ── PUT: guardar UNA operación con bloqueo optimista ─────
    def do_PUT(self):
        if not self._is_employee():
            self._json(401, {'error': 'No autorizado'}); return
        length = int(self.headers.get('Content-Length', 0))
        try: op = json.loads(self.rfile.read(length) or b'{}')
        except: op = None
        if not isinstance(op, dict) or not op.get('id'):
            self._json(400, {'error': 'Operación inválida'}); return
        ok, res = _write_op(op)
        if ok:
            self._json(200, {'ok': True, '_v': res}); return
        if res == 'conflict':
            fresh = _get_op(op['id'])
            self._json(409, {'error': 'conflict', 'op': fresh}); return
        self._json(400, {'error': res})

    # ── DELETE: borrar UNA operación ─────────────────────────
    def do_DELETE(self):
        if not self._is_employee():
            self._json(401, {'error': 'No autorizado'}); return
        op_id = self._qs('id')
        if not op_id:
            self._json(400, {'error': 'Falta id'}); return
        _kv(['DEL', _opkey(op_id)])
        _kv(['DEL', _vkey(op_id)])
        _kv(['SREM', IDS_KEY, op_id])
        self._json(200, {'ok': True})

    # ── POST masivo (import/respaldo): escribe blob + refleja ─
    def do_POST(self):
        if not self._is_employee():
            self._json(401, {'error': 'No autorizado'}); return
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length) if length else b'[]'
        try: ops = json.loads(body)
        except: ops = []
        if not isinstance(ops, list):
            self._json(400, {'error': 'Formato inválido'}); return
        # Respaldo legacy (blob) + reflejo en almacén nuevo
        try: _kv(['SET', LEGACY_KEY, json.dumps(ops)])
        except: pass
        for op in ops:
            if isinstance(op, dict) and op.get('id'):
                _force_write(op)
        self._json(200, {'ok': True, 'count': len(ops)})

    def _json(self, code, data):
        payload = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args): pass
