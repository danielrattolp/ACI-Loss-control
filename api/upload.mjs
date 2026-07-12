// Subida de imágenes a Vercel Blob (store PRIVADO) — solo empleados.
// Usa la librería oficial @vercel/blob, que maneja el contrato REST correcto.
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

  // ── Auth: empleado ────────────────────────────────────────
  const cookie = req.headers.cookie || '';
  let tok = (cookie.split(';').map(c => c.trim())
    .find(c => c.startsWith('aci_session=')) || '').split('=')[1] || '';
  if (!tok) tok = req.headers['x-aci-session'] || '';
  if (!AUTH_TOKEN || tok !== AUTH_TOKEN) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  // ── Body ──────────────────────────────────────────────────
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') body = {};

  let dataB64 = body.dataBase64 || '';
  if (typeof dataB64 === 'string' && dataB64.startsWith('data:')) {
    dataB64 = dataB64.split(',')[1] || '';
  }
  const contentType = body.contentType || 'image/jpeg';
  const filename = String(body.filename || 'foto.jpg')
    .replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80) || 'foto.jpg';
  if (!dataB64) { res.status(400).json({ error: 'Imagen vacía' }); return; }

  let buffer;
  try { buffer = Buffer.from(dataB64, 'base64'); }
  catch { res.status(400).json({ error: 'Imagen inválida' }); return; }
  if (!buffer.length) { res.status(400).json({ error: 'Imagen vacía' }); return; }

  // ── Subida (privada) ──────────────────────────────────────
  try {
    const blob = await put(`aci/${Date.now()}-${filename}`, buffer, {
      access: 'private',
      addRandomSuffix: true,
      contentType,
    });
    res.status(200).json({ ok: true, url: blob.url, pathname: blob.pathname });
  } catch (e) {
    res.status(502).json({ error: 'Blob rechazó la subida', detail: String((e && e.message) || e).slice(0, 300) });
  }
}
