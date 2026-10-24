"""Real HTTP smoke check against the local Flask adapter and isolated temporary storage."""
import http.cookiejar
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.error
import urllib.request
from editorial.service import password_hash

class HttpWorkflow(unittest.TestCase):
    def test_review_publish_revoke(self):
        with tempfile.TemporaryDirectory() as temp:
            with socket.socket() as sock:
                sock.bind(('127.0.0.1',0)); port=sock.getsockname()[1]
            password=secrets.token_urlsafe(24)
            env={**os.environ,'CMS_LOCAL_DB':temp+'/editorial.sqlite3','CMS_ADMIN_EMAIL':'owner@example.com','CMS_ADMIN_PASSWORD_HASH':password_hash(password)}
            process=subprocess.Popen([sys.executable,'-m','flask','--app','app','run','--host','127.0.0.1','--port',str(port),'--no-reload'],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,cwd=Path(__file__).resolve().parents[1])
            try:
                base=f'http://127.0.0.1:{port}'
                admin=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
                editor=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
                def request(client,action=None,**body):
                    headers={'X-CMS-State':'1'} if action=='state' else {}
                    raw=None
                    if action and action!='state':
                        headers.update({'X-CMS-Request':'1','Content-Type':'application/json'})
                        raw=json.dumps({'action':action,**body}).encode()
                    with client.open(urllib.request.Request(base+'/api/editorial',data=raw,headers=headers)) as response:
                        return json.load(response)
                for _ in range(100):
                    if process.poll() is not None:self.fail('HTTP server exited')
                    try:request(admin);break
                    except urllib.error.URLError:time.sleep(.1)
                else:self.fail('HTTP server did not start')
                for path in ['/editor','/editor.js','/editor.css','/public-content.js','/public-preview']:
                    with admin.open(base+path) as response:self.assertEqual(response.status,200)
                request(admin,'login',email='owner@example.com',password=password)
                state=request(admin,'state')
                request(admin,'activate',version=state['version'],password=password+'editor')
                request(editor,'login',email='francisco.montenegro@acilatam.cl',password=password+'editor')
                state=request(editor,'state');content={k:f['value'] for k,f in state['fields'].items()}
                content['text-1']='Empresa · revisión ortográfica'
                request(editor,'draft',version=state['version'],content=content)
                self.assertEqual(request(admin)['content'],{})
                state=request(admin,'state');revision=state['revisions'][-1]['id']
                with self.assertRaises(urllib.error.HTTPError) as error:
                    request(editor,'publish',version=state['version'],revision=revision)
                self.assertEqual(error.exception.code,403)
                request(admin,'publish',version=state['version'],revision=revision)
                self.assertEqual(request(admin)['content']['text-1'],content['text-1'])
                state=request(admin,'state');request(admin,'restore',version=state['version'],revision='original')
                self.assertEqual(request(admin)['content'],{})
                state=request(admin,'state');request(admin,'revoke',version=state['version'])
                with self.assertRaises(urllib.error.HTTPError) as error:request(editor,'state')
                self.assertEqual(error.exception.code,403)
                self.assertEqual(request(admin,'state')['role'],'admin')
            finally:
                process.terminate();process.wait(timeout=10)

if __name__=='__main__':unittest.main()
