"""Upstash/Vercel KV helper — uses pipeline REST API format."""
import json
import os
import urllib.request

_URL   = os.environ.get('KV_REST_API_URL', '')
_TOKEN = os.environ.get('KV_REST_API_TOKEN', '')

def _req(command):
    """Send a single Redis command via Upstash pipeline REST API."""
    if not _URL:
        return None
    payload = json.dumps(command).encode()
    req = urllib.request.Request(
        _URL,
        data=payload,
        headers={'Authorization': f'Bearer {_TOKEN}', 'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=8) as r:
        return json.loads(r.read())

def kv_get(key, default=None):
    try:
        data = _req(['GET', key])
        if data is None:
            return default
        result = data.get('result')
        if result is None:
            return default
        return json.loads(result)
    except Exception:
        return default

def kv_set(key, value):
    try:
        data = _req(['SET', key, json.dumps(value)])
        return data is not None and data.get('result') == 'OK'
    except Exception:
        return False

def available():
    return bool(_URL and _TOKEN)
