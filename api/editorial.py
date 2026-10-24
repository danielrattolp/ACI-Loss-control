"""Dedicated editorial endpoint. Never accepts operational session credentials."""
from http.server import BaseHTTPRequestHandler
from http.cookies import SimpleCookie
import json
import logging
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from editorial.service import Service, Rejected
from editorial.storage import Store, StorageUnavailable

def dispatch(method, headers, payload, service, secure=True):
    if len(payload)>450000: return 413,{'error':'Contenido demasiado grande.'},{}
    cookies=SimpleCookie()
    try: cookies.load(headers.get('Cookie',''))
    except Exception: pass
    token=cookies['aci_editorial'].value if 'aci_editorial' in cookies else ''
    extra={}
    try:
        if method=='GET':
            action='state' if headers.get('X-CMS-State')=='1' else 'public'
            body={}
        else:
            if headers.get('X-CMS-Request')!='1' or headers.get('Sec-Fetch-Site','same-origin') not in {'same-origin','none'}:
                raise Rejected(403,'Solicitud no permitida.')
            if not headers.get('Content-Type','').startswith('application/json'):
                raise Rejected(415,'Se requiere JSON.')
            body=json.loads(payload)
            if not isinstance(body,dict): raise ValueError()
            action=body.get('action')
            if action in {'state','public'}: raise Rejected(400,'Usa GET para consultar.')
        result=service.execute(action,body,token,headers.get('X-Real-IP','unknown'))
        flags='; Path=/api/editorial; HttpOnly; SameSite=Strict'+('; Secure' if secure else '')
        if action=='login': extra['Set-Cookie']='aci_editorial='+result.pop('token')+flags+'; Max-Age=28800'
        if action=='logout': extra['Set-Cookie']='aci_editorial='+flags+'; Max-Age=0'
        return 200,result,extra
    except Rejected as exc: return exc.status,{'error':exc.message},extra
    except StorageUnavailable as exc:
        logging.getLogger(__name__).warning('Editorial unavailable: %s',exc.code)
        return 503,{'error':exc.message,'code':exc.code},extra
    except (ValueError,TypeError): return 400,{'error':'Solicitud inválida.'},extra
    except Exception as exc:
        logging.getLogger(__name__).error('Editorial unavailable: CMS_INTERNAL (%s)',type(exc).__name__)
        return 503,{'error':'Servicio editorial no disponible. Ningún cambio fue confirmado.','code':'CMS_INTERNAL'},extra

class handler(BaseHTTPRequestHandler):
    def do_GET(self): self.respond(b'')
    def do_POST(self):
        try: size=int(self.headers.get('Content-Length','0'))
        except ValueError: size=-1
        if not 0<=size<=450000:
            self.send_error(413); return
        self.respond(self.rfile.read(size))
    def respond(self, payload):
        status,data,extra=dispatch(self.command,self.headers,payload,Service(Store()))
        raw=json.dumps(data,ensure_ascii=False).encode()
        self.send_response(status)
        for key,value in {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',**extra}.items(): self.send_header(key,value)
        self.end_headers(); self.wfile.write(raw)
