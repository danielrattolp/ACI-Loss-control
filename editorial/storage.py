"""Fail-closed storage with atomic compare-and-set, including across Vercel instances."""
import hashlib
import json
import os
import sqlite3
import urllib.error
import urllib.request
from editorial.service import initial

class StorageUnavailable(RuntimeError):
    """Only fixed, non-secret diagnostics may reach logs or HTTP responses."""
    def __init__(self, code, message):
        self.code, self.message = code, message
        super().__init__(code)

class Store:
    def __init__(self, local=False):
        self.local=local
    def key(self):
        environment=os.environ.get('VERCEL_ENV','')
        if environment=='production':
            return 'aci:editorial:v1'
        if environment not in {'preview','development'}:
            raise StorageUnavailable('CMS_ENV_MISSING', 'Vercel no identifica el entorno. Habilita sus variables de sistema y vuelve a desplegar.')
        branch=os.environ.get('VERCEL_GIT_COMMIT_REF') or os.environ.get('VERCEL_URL')
        if not branch:
            raise StorageUnavailable('CMS_PREVIEW_MISSING', 'Falta identificar la rama de prueba. Habilita las variables de sistema de Vercel y vuelve a desplegar.')
        identity=hashlib.sha256(branch.encode()).hexdigest()[:24]
        return f'aci:editorial:v1:{environment}:{identity}'
    def command(self, args):
        recovered=('ACI_REDIS_REST_API_URL','ACI_REDIS_REST_API_TOKEN')
        names=recovered if any(os.environ.get(name) for name in recovered) else ('KV_REST_API_URL','KV_REST_API_TOKEN')
        url=os.environ.get(names[0],'')
        token=os.environ.get(names[1],'')
        if not url or not token:
            raise StorageUnavailable('CMS_STORAGE_MISSING', f'Falta configurar {names[0]} y {names[1]} para este entorno de Vercel.')
        if not url.startswith('https://'):
            raise StorageUnavailable('CMS_STORAGE_URL', 'La dirección del almacenamiento editorial debe usar HTTPS.')
        req=urllib.request.Request(url,data=json.dumps(args).encode(),headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
        try:
            with urllib.request.urlopen(req,timeout=8) as response: result=json.load(response)
        except urllib.error.HTTPError as exc:
            if exc.code in {401,403}:
                raise StorageUnavailable('CMS_STORAGE_AUTH', 'El almacenamiento rechazó el acceso. Revisa su conexión y los permisos del token.') from None
            raise StorageUnavailable('CMS_STORAGE_UNAVAILABLE', 'El almacenamiento no está disponible. Revisa su estado antes de reintentar.') from None
        except (urllib.error.URLError,TimeoutError,OSError):
            raise StorageUnavailable('CMS_STORAGE_CONNECTION', 'No se pudo conectar con el almacenamiento editorial.') from None
        except (ValueError,UnicodeError):
            raise StorageUnavailable('CMS_STORAGE_RESPONSE', 'El almacenamiento devolvió una respuesta inválida.') from None
        if not isinstance(result,dict) or 'error' in result or 'result' not in result:
            raise StorageUnavailable('CMS_STORAGE_RESPONSE', 'El almacenamiento no confirmó la operación. Revisa que su conexión permita GET, EVAL y SET.')
        return result['result']
    def db(self):
        from pathlib import Path
        path=os.environ.get('CMS_LOCAL_DB',str(Path(__file__).resolve().parents[1]/'.editorial-local.sqlite3'))
        Path(path).parent.mkdir(parents=True,exist_ok=True)
        db=sqlite3.connect(path)
        db.execute('CREATE TABLE IF NOT EXISTS cms (id INTEGER PRIMARY KEY, data TEXT NOT NULL)')
        return db
    def load(self):
        if self.local:
            with self.db() as db: row=db.execute('SELECT data FROM cms WHERE id=1').fetchone()
            raw=row[0] if row else None
        else: raw=self.command(['GET',self.key()])
        return (json.loads(raw) if raw else initial()), raw
    def save(self, expected, state):
        raw=json.dumps(state,ensure_ascii=False,separators=(',',':'))
        if self.local:
            with self.db() as db:
                db.execute('BEGIN IMMEDIATE')
                row=db.execute('SELECT data FROM cms WHERE id=1').fetchone()
                if (row[0] if row else None)!=expected: return False
                db.execute('INSERT OR REPLACE INTO cms VALUES (1,?)',(raw,))
            return True
        script="local old=redis.call('GET',KEYS[1]); if (not old and ARGV[1]=='') or old==ARGV[1] then redis.call('SET',KEYS[1],ARGV[2]); return 1 end; return 0"
        return self.command(['EVAL',script,1,self.key(),expected or '',raw])==1
