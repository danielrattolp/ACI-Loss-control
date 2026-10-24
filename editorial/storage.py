"""Fail-closed storage with atomic compare-and-set, including across Vercel instances."""
import json
import os
import sqlite3
import urllib.request
from editorial.service import initial

class Store:
    def __init__(self, local=False):
        self.local=local
    def command(self, args):
        url=os.environ.get('KV_REST_API_URL','')
        token=os.environ.get('KV_REST_API_TOKEN','')
        if not url.startswith('https://') or not token: raise RuntimeError('Almacenamiento editorial no configurado')
        req=urllib.request.Request(url,data=json.dumps(args).encode(),headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
        with urllib.request.urlopen(req,timeout=8) as response: result=json.load(response)
        if 'error' in result: raise RuntimeError('Error del almacenamiento editorial')
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
        else: raw=self.command(['GET','aci:editorial:v1'])
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
        return self.command(['EVAL',script,1,'aci:editorial:v1',expected or '',raw])==1
