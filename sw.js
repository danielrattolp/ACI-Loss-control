// Service Worker — ACI Loss Control (Portal Cliente PWA)
// Navegación network-first (evita quedar con versión vieja) y maneja Web Push.
const CACHE = 'aci-cliente-v1';

self.addEventListener('install', (e) => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/cliente')));
  }
  // El resto (API, assets) pasa directo a la red.
});

// ── Web Push (Fase 5) ──────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (_) { data = { body: e.data ? e.data.text() : '' }; }
  const title = data.title || 'ACI Loss Control';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [80, 40, 80],
    tag: data.tag || 'aci-hito',
    renotify: true,
    data: { url: data.url || '/cliente' },
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/cliente';
  e.waitUntil((async () => {
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if (c.url.includes('/cliente') && 'focus' in c) return c.focus(); }
    if (clients.openWindow) return clients.openWindow(url);
  })());
});
