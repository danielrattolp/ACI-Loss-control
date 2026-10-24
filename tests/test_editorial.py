import copy
import os
import tempfile
import unittest
from unittest.mock import patch
from editorial.service import Service, Rejected, FIELDS, EMAIL, password_hash, initial
from editorial.storage import Store
from api.editorial import dispatch

class Memory:
    def __init__(self): self.state=initial(); self.tag=0
    def load(self): return copy.deepcopy(self.state), self.tag
    def save(self, tag, state):
        if tag!=self.tag:return False
        self.state=copy.deepcopy(state);self.tag+=1;return True

class EditorialTests(unittest.TestCase):
    def setUp(self):
        self.env=patch.dict(os.environ,{'CMS_ADMIN_EMAIL':'owner@example.com','CMS_ADMIN_PASSWORD_HASH':password_hash('admin-password-for-tests')})
        self.env.start();self.addCleanup(self.env.stop)
        self.now=100000;self.store=Memory();self.s=Service(self.store,lambda:self.now)
        self.admin=self.s.execute('login',{'email':'owner@example.com','password':'admin-password-for-tests'})['token']
        self.content={k:f['value'] for k,f in FIELDS.items()}
    def action(self, name, token=None, **body):
        return self.s.execute(name,{'version':self.store.state['version'],**body},token or self.admin)
    def activate(self):
        self.action('activate',password='editor-password-for-tests')
        return self.s.execute('login',{'email':EMAIL,'password':'editor-password-for-tests'})['token']
    def reject(self,status,fn):
        with self.assertRaises(Rejected) as c:fn()
        self.assertEqual(c.exception.status,status)
    def test_configured_owner_requires_password_and_retains_admin_role(self):
        with patch.dict(os.environ):
            os.environ.pop('CMS_ADMIN_EMAIL', None)
            self.reject(401,lambda:self.s.execute('login',{'email':'danieratto@acilatam.cl','password':'incorrect-password'}))
            token=self.s.execute('login',{'email':'danieratto@acilatam.cl','password':'admin-password-for-tests'})['token']
            self.assertEqual(self.action('state',token)['role'],'admin')
            self.action('activate',token,password='editor-password-for-tests')
            self.action('revoke',token)
            self.assertEqual(self.action('state',token)['email'],'danieratto@acilatam.cl')

    def test_missing_admin_binding_is_not_a_wrong_password(self):
        with patch.dict(os.environ, {'CMS_ADMIN_PASSWORD_HASH': ''}):
            self.reject(503, lambda: self.s.execute('login', {
                'email': 'owner@example.com', 'password': 'admin-password-for-tests'}))
        self.assertEqual(self.store.state['attempts'], {})

    def test_editor_draft_requires_owner_publication_and_keeps_history(self):
        token=self.activate();self.content['text-1']='Corrección áéíóú <script>alert(1)</script>'
        self.action('draft',token,content=self.content)
        revision=self.store.state['revisions'][-1]['id']
        self.assertEqual(self.s.execute('public',{})['content'],{})
        for action in ['publish','restore','revoke','activate']:
            self.reject(403,lambda:self.action(action,token,revision=revision,password='cannot-reset-owner'))
        self.action('publish',revision=revision)
        self.assertEqual(self.s.execute('public',{})['content']['text-1'],self.content['text-1'])
        self.content['text-1']='Nueva versión';self.action('draft',token,content=self.content)
        self.action('publish',revision=self.store.state['revisions'][-1]['id'])
        self.action('restore',revision=revision)
        self.assertEqual(len(self.store.state['revisions']),2)
        self.assertNotIn('hash',self.action('state')['editor'])
    def test_expiration_and_revocation_invalidate_existing_session(self):
        token=self.activate();self.now+=30*86400
        self.reject(401,lambda:self.action('state',token)) # session also expires
        self.reject(401,lambda:self.s.execute('login',{'email':EMAIL,'password':'editor-password-for-tests'}))
        self.now=100000;token=self.activate();self.action('revoke')
        self.reject(403,lambda:self.action('draft',token,content=self.content))
        self.action('state') # owner retains access
    def test_grant_expires_even_with_a_recent_session(self):
        self.activate();self.now+=30*86400-100
        token=self.s.execute('login',{'email':EMAIL,'password':'editor-password-for-tests'})['token']
        self.now+=100
        self.reject(403,lambda:self.action('state',token))

    def test_admin_secret_rotation_invalidates_old_sessions(self):
        with patch.dict(os.environ,{'CMS_ADMIN_PASSWORD_HASH':password_hash('a-new-admin-password')}):
            self.reject(401,lambda:self.action('state'))

    def test_reactivation_invalidates_old_session(self):
        token=self.activate();self.activate();self.reject(403,lambda:self.action('state',token))
    def test_forbidden_fields_urls_and_lost_updates(self):
        token=self.activate()
        for edits in [{'unknown':'value'},{'hero-image':'https://evil.example/x.png'},{'hero-position':'101'}]:
            self.reject(400,lambda:self.action('draft',token,content={**self.content,**edits}))
        self.reject(409,lambda:self.s.execute('draft',{'version':-1,'content':self.content},token))
        with patch.object(self.store,'save',return_value=False):
            self.reject(409,lambda:self.action('draft',token,content=self.content))
    def test_auth_csrf_and_cookie_boundaries(self):
        self.reject(401,lambda:self.s.execute('state',{},'operational-token'))
        payload=b'{"action":"login","email":"owner@example.com","password":"admin-password-for-tests"}'
        self.assertEqual(dispatch('POST',{'Content-Type':'application/json'},payload,self.s)[0],403)
        headers={'Content-Type':'application/json','X-CMS-Request':'1'}
        code,data,extra=dispatch('POST',headers,payload,self.s)
        self.assertEqual(code,200);self.assertNotIn('token',data)
        self.assertIn('HttpOnly',extra['Set-Cookie']);self.assertIn('Secure',extra['Set-Cookie'])
        headers['Sec-Fetch-Site']='cross-site'
        self.assertEqual(dispatch('POST',headers,payload,self.s)[0],403)
        headers={'Cookie':'aci_session='+self.admin,'X-CMS-State':'1'}
        self.assertEqual(dispatch('GET',headers,b'',self.s)[0],401)
    def test_login_throttled_and_storage_failure_closed(self):
        for _ in range(8):self.reject(401,lambda:self.s.execute('login',{'email':EMAIL,'password':'incorrect-password'},ip='attacker'))
        self.reject(429,lambda:self.s.execute('login',{},ip='attacker'))
        with patch.object(self.store,'load',side_effect=RuntimeError()):
            self.assertEqual(dispatch('GET',{},b'',self.s)[0],503)
    def test_sqlite_compare_and_set(self):
        with tempfile.TemporaryDirectory() as d,patch.dict(os.environ,{'CMS_LOCAL_DB':d+'/cms.db'}):
            a,b=Store(True),Store(True);state,tag=a.load();other,stale=b.load()
            self.assertTrue(a.save(tag,state));self.assertFalse(b.save(stale,other))

    def test_remote_preview_and_production_storage_are_isolated(self):
        store=Store()
        with patch.dict(os.environ,{'VERCEL_ENV':'production'}):
            production=store.key()
        with patch.dict(os.environ,{'VERCEL_ENV':'preview','VERCEL_GIT_COMMIT_REF':'editor-branch'}):
            preview=store.key()
            with patch.object(store,'command',side_effect=[None,1]) as command:
                state,tag=store.load()
                self.assertTrue(store.save(tag,state))
                self.assertEqual(command.call_args_list[0].args[0],['GET',preview])
                self.assertEqual(command.call_args_list[1].args[0][3],preview)
        with patch.dict(os.environ,{'VERCEL_ENV':'preview','VERCEL_GIT_COMMIT_REF':'another-branch'}):
            self.assertNotEqual(preview,store.key())
        self.assertEqual(production,'aci:editorial:v1')
        self.assertNotEqual(production,preview)

    def test_unidentified_remote_environment_fails_closed(self):
        with patch.dict(os.environ,clear=True):
            with self.assertRaises(RuntimeError):Store().key()
        with patch.dict(os.environ,{'VERCEL_ENV':'preview'},clear=True):
            with self.assertRaises(RuntimeError):Store().key()

if __name__=='__main__':unittest.main()
