export default function middleware(request) {
  const url = new URL(request.url);

  // Solo proteger /operaciones y sub-rutas
  if (!url.pathname.startsWith('/operaciones')) return;

  const auth = request.headers.get('Authorization');
  if (auth) {
    const [scheme, encoded] = auth.split(' ');
    if (scheme === 'Basic' && encoded) {
      const [user, pass] = atob(encoded).split(':');
      const validUser = process.env.AUTH_USER || 'aci';
      const validPass = process.env.AUTH_PASS;
      if (validPass && user === validUser && pass === validPass) return;
    }
  }

  return new Response('🔒 Acceso restringido — ACI Loss Control\nContacte a su administrador para obtener credenciales.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="ACI Loss Control — Solo personal autorizado"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export const config = {
  matcher: ['/operaciones', '/operaciones/:path*'],
};
