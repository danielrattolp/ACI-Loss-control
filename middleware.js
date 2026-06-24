export default function middleware(request) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/operaciones')) return;

  // Login page itself siempre accesible
  if (url.pathname === '/operaciones/login') return;

  // Verificar cookie de sesión
  const cookie = request.headers.get('cookie') || '';
  const token = cookie.split(';').map(c => c.trim())
    .find(c => c.startsWith('aci_session='))
    ?.split('=')[1];

  const validToken = process.env.AUTH_TOKEN;

  if (validToken && token === validToken) return; // acceso permitido

  // Redirigir a login
  return Response.redirect(new URL('/operaciones/login', request.url), 302);
}

export const config = {
  matcher: ['/operaciones', '/operaciones/:path*'],
};
