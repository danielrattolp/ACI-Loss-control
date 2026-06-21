"""Vercel serverless function — Consultor IA (Anthropic API)."""
from http.server import BaseHTTPRequestHandler
import json
import os

SYSTEM_PROMPT = """Eres un experto en medición y custody transfer de petróleo crudo y productos
refinados, con más de 25 años de experiencia operativa en terminales marítimas y Loss Control.
Tu conocimiento abarca la totalidad de las normas API MPMS (Manual of Petroleum Measurement Standards),
capítulos 1 al 23, con especial dominio en:

NORMAS CLAVE:
- Cap. 11.1: VCF (Volume Correction Factor) — tablas 6A, 6B, 6C, 6D para crudos,
  productos, lubricantes; conversión GOV→GSV→NSV
- Cap. 12: Calculation of Petroleum Quantities — medición estática y dinámica
- Cap. 17: Marine Measurement — ullage, VEF, STS operations
- Cap. 17.09: VEF (Vessel Experience Factor)
- Cap. 17.11: Ship-to-Ship operations
- Cap. 18: Custody Transfer

Responde siempre en español, con precisión técnica. Cuando cites normas, indica el capítulo
y sección específica. Cuando calcules, muestra el procedimiento paso a paso.
Si detectas una práctica que contradice la norma API, señálalo claramente."""


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            import anthropic
        except ImportError:
            self._json(500, {"error": "Paquete 'anthropic' no instalado en el servidor."})
            return

        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            self._json(500, {"error": "ANTHROPIC_API_KEY no configurada en el servidor."})
            return

        content_length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(content_length))
        except Exception:
            self._json(400, {"error": "JSON inválido."})
            return

        messages = body.get("messages", [])
        valid = [
            {"role": m["role"], "content": str(m["content"])[:8000]}
            for m in messages
            if isinstance(m, dict) and m.get("role") in ("user", "assistant") and m.get("content")
        ]
        if not valid:
            self._json(400, {"error": "Sin mensajes válidos."})
            return

        try:
            client = anthropic.Anthropic(api_key=api_key)
            response = client.messages.create(
                model="claude-opus-4-8",
                max_tokens=2048,
                system=SYSTEM_PROMPT,
                messages=valid,
            )
            reply = next((b.text for b in response.content if b.type == "text"), "")
            self._json(200, {"reply": reply})
        except anthropic.AuthenticationError:
            self._json(401, {"error": "API key inválida."})
        except anthropic.RateLimitError:
            self._json(429, {"error": "Límite de tasa alcanzado. Intenta en unos segundos."})
        except Exception as exc:
            self._json(500, {"error": str(exc)})

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def _json(self, code, data):
        payload = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self._cors_headers()
        self.end_headers()
        self.wfile.write(payload)

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, *args):
        pass  # suppress default access logs
