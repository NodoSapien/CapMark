// Middleware de autorización para Edge Functions
import { getCorsHeaders } from './cors.ts';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

export function requireAuth(req: Request): Response | null {
  const expectedAnonKey = Deno.env.get('ANON_KEY');
  const expectedJwtSecret = Deno.env.get('JWT_SECRET');

  // Si no hay secretos configurados en el entorno (modo desarrollo desatendido), permitir
  if (!expectedAnonKey && !expectedJwtSecret) {
    return null;
  }

  const apiKey = req.headers.get('apikey');
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (expectedAnonKey && (apiKey === expectedAnonKey || token === expectedAnonKey)) {
    return null;
  }

  // Token presente
  if (token) {
    return null;
  }

  return new Response(JSON.stringify({ ok: false, error: 'No autorizado: se requiere cabecera apikey o Authorization' }), {
    status: 401,
    headers: { ...getCorsHeaders(), 'content-type': 'application/json' },
  });
}
