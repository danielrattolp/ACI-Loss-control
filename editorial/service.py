"""Editorial permissions and immutable revisions; isolated from operational accounts."""
import copy
import hashlib
import hmac
import json
import os
from pathlib import Path
import secrets
import time

FIELDS = json.loads(Path(__file__).with_name('fields.json').read_text())
IMAGES = json.loads(Path(__file__).with_name('images.json').read_text())
EMAIL = 'francisco.montenegro@acilatam.cl'
DEFAULT_ADMIN_EMAIL = 'danielratto@acilatam.cl'

def admin_email():
    return os.environ.get('CMS_ADMIN_EMAIL', DEFAULT_ADMIN_EMAIL).strip().lower()

DAY = 86400

class Rejected(Exception):
    def __init__(self, status, message):
        self.status, self.message = status, message

def password_hash(password, salt=None):
    if not isinstance(password, str) or not 14 <= len(password) <= 256:
        raise Rejected(400, 'La contraseña debe tener entre 14 y 256 caracteres.')
    salt = salt or secrets.token_hex(16)
    digest = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()
    return f'scrypt${salt}${digest}'

def matches(password, encoded):
    try:
        kind, salt, _ = encoded.split('$')
        return kind == 'scrypt' and hmac.compare_digest(password_hash(password, salt), encoded)
    except (ValueError, AttributeError, Rejected):
        return False

def initial():
    return {'version': 0, 'editor': None, 'sessions': {}, 'revisions': [], 'published': None, 'attempts': {}, 'audit': []}

class Service:
    def __init__(self, store, clock=time.time):
        self.store, self.clock = store, clock

    def execute(self, action, body, token='', ip='local'):
        state, tag = self.store.load()
        now = int(self.clock())
        def fail(code, text): raise Rejected(code, text)
        def save():
            state['version'] += 1
            if not self.store.save(tag, state): fail(409, 'Hubo otro cambio. Recarga e intenta nuevamente.')
        def audit(event):
            state['audit'].append({'event': event, 'at': now, 'actor': actor})
        if action == 'public':
            revision = next((r for r in state['revisions'] if r['id'] == state['published']), None)
            return {'content': revision['content'] if revision else {}, 'revision': state['published']}
        if action == 'login':
            email = str(body.get('email', '')).strip().lower()
            bucket = hashlib.sha256(ip.encode()).hexdigest()
            recent = [t for t in state['attempts'].get(bucket, []) if t > now - 900]
            if len(recent) >= 8: fail(429, 'Demasiados intentos. Espera 15 minutos.')
            admin = admin_email()
            editor = state['editor']
            role = None
            if admin and email == admin and not os.environ.get('CMS_ADMIN_PASSWORD_HASH'):
                fail(503, 'Falta habilitar CMS_ADMIN_PASSWORD_HASH para este entorno de Vercel y volver a desplegar.')
            if admin and email == admin and matches(body.get('password'), os.environ.get('CMS_ADMIN_PASSWORD_HASH', '')):
                role = 'admin'
            elif email == EMAIL and editor and not editor['revoked'] and now < editor['expires'] and matches(body.get('password'), editor['hash']):
                role = 'editor'
            if not role:
                state['attempts'][bucket] = recent + [now]
                save()
                fail(401, 'Credenciales incorrectas o acceso vencido.')
            raw = secrets.token_urlsafe(32)
            state['sessions'] = {k:v for k,v in state['sessions'].items() if v['expires'] > now}
            state['sessions'][hashlib.sha256(raw.encode()).hexdigest()] = {'role':role,'email':email,'expires':now+8*3600,'generation':editor['generation'] if role=='editor' else hashlib.sha256(os.environ.get('CMS_ADMIN_PASSWORD_HASH','').encode()).hexdigest()}
            state['attempts'].pop(bucket, None)
            save()
            return {'token':raw}
        session_id = hashlib.sha256(token.encode()).hexdigest()
        session = state['sessions'].get(session_id)
        if not session or session['expires'] <= now: fail(401, 'Inicia sesión nuevamente.')
        role, actor = session['role'], session['email']
        editor = state['editor']
        if role == 'admin' and (actor != admin_email() or session['generation'] != hashlib.sha256(os.environ.get('CMS_ADMIN_PASSWORD_HASH','').encode()).hexdigest()):
            fail(401, 'La cuenta administradora cambió. Inicia sesión nuevamente.')
        if role == 'editor' and (not editor or editor['revoked'] or now >= editor['expires'] or editor['generation'] != session['generation']):
            fail(403, 'El acceso editorial venció o fue revocado.')
        if action == 'logout':
            state['sessions'].pop(session_id, None); save(); return {'ok':True}
        if action == 'state':
            return {'role':role,'email':actor,'version':state['version'],'fields':FIELDS,'images':IMAGES,'published':state['published'],'revisions':state['revisions'], 'editor': {k:v for k,v in editor.items() if k!='hash'} if editor else None,'audit':state['audit'] if role=='admin' else []}
        if body.get('version') != state['version']: fail(409, 'La página cambió. Recarga antes de guardar.')
        if action == 'draft':
            content = body.get('content')
            if not isinstance(content, dict) or set(content) != set(FIELDS): fail(400, 'Contenido incompleto o campos desconocidos.')
            for key, value in content.items():
                if not isinstance(value, str) or len(value)>4000: fail(400, 'Texto inválido o demasiado largo.')
                kind=FIELDS[key]['kind']
                if kind=='image':
                    if value not in IMAGES: fail(400, 'Selecciona una imagen existente en la biblioteca.')
                if kind=='position' and (not value.isdigit() or not 0<=int(value)<=100): fail(400,'Encuadre inválido.')
            revision={'id':secrets.token_hex(12),'content':copy.deepcopy(content),'author':actor,'at':now}
            state['revisions'].append(revision); audit('draft:'+revision['id'])
        elif action in {'activate','revoke','publish','restore'}:
            if role!='admin': fail(403,'Solo el administrador puede realizar esta acción.')
            if action=='activate':
                if admin_email()==EMAIL: fail(400,'El administrador debe ser una cuenta diferente.')
                state['editor']={'email':EMAIL,'hash':password_hash(body.get('password')),'activated':now,'expires':now+30*DAY,'revoked':False,'generation':secrets.token_hex(16)}
            elif action=='revoke':
                if editor: editor['revoked']=True
            else:
                revision=next((r for r in state['revisions'] if r['id']==body.get('revision')),None)
                if not revision and body.get('revision')!='original': fail(404,'Versión inexistente.')
                state['published']=revision['id'] if revision else None
            audit(action+':'+str(body.get('revision','')))
        else: fail(400,'Acción desconocida.')
        save()
        return {'ok':True}
