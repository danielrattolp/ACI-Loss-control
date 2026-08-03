"""Web Push (VAPID) — suscripción del cliente + envío desde el operador.

KV:
  push_subs -> { email: [ subscription, ... ] }   (una por dispositivo)

Endpoints:
  GET  ?action=pubkey                      -> { publicKey }        (público)
  POST {action:'subscribe', subscription}  -> guarda la suscripción (sesión cliente)
  POST {action:'unsubscribe', endpoint}    -> elimina (sesión cliente)
  POST {action:'send', opId, title, body, url} -> envía push       (operador AUTH_TOKEN)

Llaves VAPID desde variables de entorno (nunca hardcodeadas).
"""
import json, os, urllib.request
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

AUTH_TOKEN   = os.environ.get('AUTH_TOKEN', '')
VAPID_PUBLIC  = os.environ.get('VAPID_PUBLIC_KEY', '')
VAPID_PRIVATE = os.environ.get('VAPID_PRIVATE_KEY', '')
VAPID_SUBJECT = os.environ.get('VAPID_SUBJECT', 'mailto:contacto@acilatam.cl')
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
        val = json.loads(v) if v else default
        return val if val is not None else default
    except Exception:
        return default


def kv_set(key, value):
    try: return bool(_kv(['SET', key, json.dumps(value)]))
    except Exception: return False


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        action = parse_qs(urlparse(self.path).query).get('action', [''])[0]
        if action == 'pubkey':
            self._json(200, {'publicKey': VAPID_PUBLIC})
            return
        self._json(400, {'error': 'Acción desconocida'})

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        try:
            body = json.loads(self.rfile.read(length) or b'{}')
        except Exception:
            self._json(400, {'error': 'JSON inválido'}); return
        action = body.get('action')

        if action == 'subscribe':
            email = self._client_email()
            if not email:
                self._json(401, {'error': 'No autorizado'}); return
            sub = body.get('subscription')
            if not isinstance(sub, dict) or not sub.get('endpoint'):
                self._json(400, {'error': 'Suscripción inválida'}); return
            subs = kv_get('push_subs', {}) or {}
            arr = subs.get(email, [])
            arr = [s for s in arr if s.get('endpoint') != sub['endpoint']]  # dedupe
            arr.append(sub)
            subs[email] = arr
            kv_set('push_subs', subs)
            self._json(200, {'ok': True})
            return

        if action == 'unsubscribe':
            email = self._client_email()
            if not email:
                self._json(401, {'error': 'No autorizado'}); return
            endpoint = body.get('endpoint')
            subs = kv_get('push_subs', {}) or {}
            if email in subs:
                subs[email] = [s for s in subs[email] if s.get('endpoint') != endpoint]
                kv_set('push_subs', subs)
            self._json(200, {'ok': True})
            return

        if action == 'test':
            email = self._client_email()
            if not email:
                self._json(401, {'error': 'No autorizado'}); return
            subs = kv_get('push_subs', {}) or {}
            sent, removed, errors = self._send_to_emails([email], {'title': 'ACI Loss Control', 'body': 'Notificación de prueba ✓', 'url': '/cliente'})
            env_vapid = sorted([repr(k) for k in os.environ.keys() if 'VAPID' in k.upper()])
            self._json(200, {'ok': True, 'sent': sent, 'expired': removed, 'subs': len(subs.get(email, [])),
                             'email': email, 'errors': errors[:3],
                             'vapid_priv_set': bool(VAPID_PRIVATE), 'vapid_pub_set': bool(VAPID_PUBLIC),
                             'priv_len': len(VAPID_PRIVATE), 'env_vapid_keys': env_vapid})
            return

        if action == 'send':
            if not self._is_employee():
                self._json(401, {'error': 'No autorizado'}); return
            op_id = body.get('opId')
            title = body.get('title') or 'ACI Loss Control'
            msg   = body.get('body') or ''
            url   = body.get('url') or '/cliente'
            tag   = body.get('tag')
            payload = {'title': title, 'body': msg, 'url': url}
            if tag: payload['tag'] = tag
            emails = self._emails_for_op(op_id)
            sent, removed, errors = self._send_to_emails(emails, payload)
            self._json(200, {'ok': True, 'sent': sent, 'expired': removed, 'recipients': len(emails), 'errors': errors[:3]})
            return

        self._json(400, {'error': 'Acción desconocida'})

    # ── helpers ──
    def _emails_for_op(self, op_id):
        if not op_id: return []
        op = kv_get('aci_op:' + op_id, {}) or {}
        clients = op.get('clients') or []
        empresa_ids = [c.get('empresa_id') for c in clients if isinstance(c, dict) and c.get('empresa_id')]
        empresas = kv_get('aci_empresas', {}) or {}
        emails = []
        for eid in empresa_ids:
            e = empresas.get(eid)
            if isinstance(e, dict):
                emails += e.get('contactos', [])
        # únicos + solo contactos con alertas activadas
        return [em for em in dict.fromkeys(emails) if self._alerts_on(em)]

    def _send_to_emails(self, emails, payload):
        errors = []
        try:
            from pywebpush import webpush, WebPushException
        except ImportError as ex:
            return 0, 0, ['pywebpush no instalado: ' + str(ex)]
        if not VAPID_PRIVATE:
            return 0, 0, ['VAPID_PRIVATE_KEY no configurada']
        subs = kv_get('push_subs', {}) or {}
        sent, expired = 0, []
        changed = False
        for em in emails:
            arr = subs.get(em, [])
            keep = []
            for s in arr:
                try:
                    webpush(subscription_info=s, data=json.dumps(payload),
                            vapid_private_key=VAPID_PRIVATE, vapid_claims={'sub': VAPID_SUBJECT})
                    sent += 1
                    keep.append(s)
                except WebPushException as ex:
                    code = getattr(getattr(ex, 'response', None), 'status_code', None)
                    if code in (404, 410):
                        expired.append(s.get('endpoint')); changed = True  # suscripción muerta → descartar
                    else:
                        keep.append(s)
                        errors.append('WebPush ' + str(code) + ': ' + str(ex)[:180])
                except Exception as ex:
                    keep.append(s)
                    errors.append(type(ex).__name__ + ': ' + str(ex)[:180])
            if len(keep) != len(arr):
                subs[em] = keep; changed = True
        if changed:
            kv_set('push_subs', subs)
        return sent, len(expired), errors

    def _cookie_val(self, name):
        raw = self.headers.get('cookie', '') or self.headers.get('Cookie', '')
        for part in raw.split(';'):
            part = part.strip()
            if part.startswith(name + '='):
                return part.split('=', 1)[1]
        return ''

    def _client_email(self):
        sess = self._cookie_val('aci_client_session')
        if not sess: return None
        sessions = kv_get('aci_client_sessions', {}) or {}
        info = sessions.get(sess)
        if not isinstance(info, dict): return None
        clients = kv_get('aci_clients', {}) or {}
        c = clients.get(info.get('email'))
        if not isinstance(c, dict) or not c.get('active', True): return None
        return info.get('email')

    def _alerts_on(self, email):
        clients = kv_get('aci_clients', {}) or {}
        c = clients.get(email)
        return isinstance(c, dict) and c.get('active', True) and c.get('alertsOptIn', True)

    def _is_employee(self):
        tok = self._cookie_val('aci_session')
        if not tok:
            tok = self.headers.get('x-aci-session', '') or self.headers.get('X-ACI-Session', '')
        if not tok:
            tok = parse_qs(urlparse(self.path).query).get('_t', [''])[0]
        return bool(AUTH_TOKEN) and tok == AUTH_TOKEN

    def _json(self, code, data):
        payload = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args): pass
