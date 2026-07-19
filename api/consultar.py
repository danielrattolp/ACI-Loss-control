"""Vercel serverless function — Consultor IA (Anthropic API).

Acceso restringido a empleados (AUTH_TOKEN vía cookie aci_session, header
X-ACI-Session o query ?_t=). Evita que terceros consuman la API key.
"""
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import os

AUTH_TOKEN = os.environ.get("AUTH_TOKEN", "")

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

- Cap. 13.3: Measurement Uncertainty (incertidumbre; alineado con ISO GUM)
- Cap. 17.5: Voyage Analysis & Reconciliation — 5ª Edición, julio 2025 (VAR/VSRR)
- Cap. 17.4: OBQ/ROB (fórmula de cuña)
- Cap. 7: Temperature Determination · Cap. 9.1: Densidad/API · Cap. 10.3: S&W

REGLAS DE CITACIÓN Y TRAZABILIDAD (obligatorias):
1. Cita SIEMPRE el capítulo y sección específicos (ej: "API MPMS 17.5 §4.3", "Cap. 11.1").
2. Distingue explícitamente lo que la norma ESTABLECE (cítalo) de tu INTERPRETACIÓN
   profesional (márcala como "interpretación"). No presentes opinión como norma.
3. Si no estás seguro de la cita exacta, dilo abiertamente en lugar de inventarla.
4. Nunca inventes cifras: usa solo los datos entregados. Si falta un dato, decláralo.
5. Reproduce el conocimiento normativo con tus palabras; no cites texto extenso literal.

MARCO CONCEPTUAL DE REFERENCIA (hechos y procedimientos técnicos):
- VCF (11.1): corrige volumen observado a estándar (60°F/15°C) según densidad y expansión.
  GOV×VCF=GSV; GSV×(1−S&W)=NSV; TCV=GSV+FW (agua libre excluida del GSV). Tablas 6A/6B/6C/6D.
- VEF (17.9): ratio buque/tierra en ≥5 viajes calificantes; banda ±0.3% del ratio medio;
  se rechazan viajes contra figura de buque, post-dique, cambio de tablas, gross error >2%.
- VAR (17.5): compara B/L↔outturn (tierra-tierra), buque/tierra en carga y descarga, y tránsito.
  Tierra teórica = figura buque ÷ VEF. Tolerancia de pérdida ±0.5% como referencia (es contractual).
- VSRR (17.5): descompone la pérdida en causas (evaporación, a bordo, contracción, ROB no
  detectado, error de línea, error de medición); residual debe tender a cero.
- Incertidumbre (13.3): combinar fuentes por RSS; U=k·uc (k=2≈95%); una diferencia es
  significativa solo si supera la incertidumbre combinada, si no es ruido de medición.
- Temperatura (7): verificación entre equipos ≤0.5°F; medir cada tanque a varios niveles.
- OBQ/ROB (17.4): fórmula de cuña para volúmenes pequeños en tanques con trim.
- Muestreo (8): manual (thief/beaker) o automático (in-line); sets primaria/retención buque/
  retención tierra/arbitraje; etiquetado, sellado y período de retención.
- Densidad/API (9.1): hidrómetro; medir a T conocida y corregir a 15°C/60°F; API=(141.5/SG@60)−131.5.
- S&W (10): centrífuga (10.3/10.4), destilación o Karl Fischer (10.9); el S&W se descuenta del GSV → NSV.
- STS (17.11 / EI HM 52): alije buque-buque con equipos cerrados certificados; registrar in-transit
  difference; definir buque de control; STS plan firmado por ambos Masters.
- Draft Survey (17.14): cantidad por desplazamiento (calado antes/después); correcciones por trim,
  escora y densidad del agua; deducibles (constante, lastre, combustible, aguas). Aplica a graneles.
- Cálculo estático (12.1.1): secuencia TOV→GOV→GSV→NSV con redondeo; descontar OBQ/ROB y agua libre.
- Aforo/calibración (2.8/3.1): tablas de aforo certificadas; verificar alturas de referencia;
  aforo manual con cinta certificada corregida por temperatura.

Responde siempre en español, con precisión técnica. Cuando calcules, muestra el procedimiento
paso a paso. Si detectas una práctica que contradice la norma API, señálalo claramente.
Actúa como CONCEPTUADOR: explica el concepto, da el procedimiento y cita el capítulo; no
reproduzcas texto literal de la norma."""


class handler(BaseHTTPRequestHandler):
    def _is_employee(self):
        raw = self.headers.get("cookie", "") or self.headers.get("Cookie", "")
        tok = ""
        for part in raw.split(";"):
            part = part.strip()
            if part.startswith("aci_session="):
                tok = part.split("=", 1)[1]; break
        if not tok:
            tok = self.headers.get("x-aci-session", "") or self.headers.get("X-ACI-Session", "")
        if not tok:
            tok = parse_qs(urlparse(self.path).query).get("_t", [""])[0]
        return bool(AUTH_TOKEN) and tok == AUTH_TOKEN

    def do_POST(self):
        if not self._is_employee():
            self._json(401, {"error": "No autorizado"})
            return
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
        # Contenido: si es lista (multimodal: imágenes + texto) se conserva tal
        # cual; si es texto se limita a un tope amplio (los checklists/JSON de
        # módulo son grandes y antes se truncaban a 8000 → análisis incompleto).
        valid = []
        for m in messages:
            if not (isinstance(m, dict) and m.get("role") in ("user", "assistant") and m.get("content")):
                continue
            c = m["content"]
            if isinstance(c, list):
                valid.append({"role": m["role"], "content": c})
            else:
                valid.append({"role": m["role"], "content": str(c)[:120000]})
        if not valid:
            self._json(400, {"error": "Sin mensajes válidos."})
            return

        # Anthropic exige: contenido no vacío, empezar con 'user' y alternar roles.
        # El contenido puede ser texto (str) o multimodal (lista de bloques).
        seq = []
        for m in valid:
            content = m["content"]
            is_list = isinstance(content, list)
            if is_list:
                if not content:
                    continue
            else:
                content = content.strip()
                if not content:
                    continue
            role = m["role"]
            if not seq and role != "user":
                continue  # descartar mensajes 'assistant' iniciales
            if seq and seq[-1]["role"] == role and not is_list and not isinstance(seq[-1]["content"], list):
                seq[-1]["content"] += "\n\n" + content  # fusionar consecutivos de texto
            else:
                seq.append({"role": role, "content": content})
        if not seq or seq[-1]["role"] != "user":
            self._json(400, {"error": "La conversación debe terminar en un mensaje del usuario."})
            return

        try:
            client = anthropic.Anthropic(api_key=api_key)
            response = client.messages.create(
                model="claude-opus-4-8",
                max_tokens=2048,
                system=SYSTEM_PROMPT,
                messages=seq,
            )
            reply = next((b.text for b in response.content if b.type == "text"), "")
            self._json(200, {"reply": reply})
        except anthropic.AuthenticationError:
            self._json(401, {"error": "API key inválida."})
        except anthropic.RateLimitError:
            self._json(429, {"error": "Límite de tasa alcanzado. Intenta en unos segundos."})
        except anthropic.BadRequestError as exc:
            self._json(400, {"error": "Solicitud inválida al modelo: " + str(getattr(exc, "message", None) or exc)[:400]})
        except Exception as exc:
            self._json(500, {"error": str(exc)[:400]})

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
