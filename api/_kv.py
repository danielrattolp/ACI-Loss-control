"""Vercel KV helper — REST API wrapper."""
import json
import os
import urllib.request
import urllib.error

_URL   = os.environ.get('KV_REST_API_URL', '')
_TOKEN = os.environ.get('KV_REST_API_TOKEN', '')

def _headers():
    return {'Authorization': f'Bearer {_TOKEN}', 'Content-Type': 'application/json'}

def kv_get(key, default=None):
    if not _URL:
        return default
    try:
        req = urllib.request.Request(f'{_URL}/get/{key}', headers=_headers())
        with urllib.request.urlopen(req, timeout=5) as r:
            result = json.loads(r.read())['result']
            if result is None:
                return default
            return json.loads(result) if isinstance(result, str) else result
    except Exception:
        return default

def kv_set(key, value):
    if not _URL:
        return False
    try:
        payload = json.dumps({'value': json.dumps(value)}).encode()
        req = urllib.request.Request(f'{_URL}/set/{key}', data=payload, headers=_headers(), method='POST')
        with urllib.request.urlopen(req, timeout=5) as r:
            return json.loads(r.read()).get('result') == 'OK'
    except Exception:
        return False

def available():
    return bool(_URL and _TOKEN)
