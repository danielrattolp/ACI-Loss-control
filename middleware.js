export default function middleware(request) {
  const url = new URL(request.url);

  // ── /operaciones — empleados ─────────────────────────────────────────
  if (url.pathname.startsWith('/operaciones')) {
    if (url.pathname === '/operaciones/login') return;
    const cookie = request.headers.get('cookie') || '';
    const token = cookie.split(';').map(c => c.trim())
      .find(c => c.startsWith('aci_session='))?.split('=')[1];
    const validToken = process.env.AUTH_TOKEN;
    if (validToken && token === validToken) return;
    return Response.redirect(new URL('/operaciones/login', request.url), 302);
  }

  // ── /cliente — portal clientes ───────────────────────────────────────
  if (url.pathname.startsWith('/cliente')) {
    // Magic link (token en query string) → dejar pasar para que el JS lo procese
    if (url.searchParams.has('token')) return;
    // Verificar cookie de sesión de cliente
    const cookie = request.headers.get('cookie') || '';
    const sess = cookie.split(';').map(c => c.trim())
      .find(c => c.startsWith('aci_client_session='))?.split('=')[1];
    if (sess) return; // validación real la hace api/client_auth
    return Response.redirect(new URL('/cliente?sin-acceso=1', request.url), 302);
  }
}

export const config = {
  matcher: ['/operaciones', '/operaciones/:path*', '/cliente', '/cliente/:path*'],
};
