// Edge Function: verificación de links del lado servidor protegida contra SSRF.
// Evita el CORS del cliente y aplica timeout ≤ 5 s. Responde { ok: boolean }.
// POST { "url": "https://..." }

import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/auth.ts';
import { safeFetch } from '../_shared/ssrf.ts';

declare const Deno: {
  serve(handler: (req: Request) => Promise<Response>): void;
};

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  const authError = requireAuth(req);
  if (authError) return authError;

  const cors = getCorsHeaders();

  try {
    const { url } = await req.json();
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      return Response.json({ ok: false, error: 'url inválida' }, { status: 400, headers: cors });
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);

    try {
      let res = await safeFetch(url, { method: 'HEAD', signal: ctrl.signal });
      // Algunos sitios no soportan HEAD: reintenta con GET liviano
      if (res.status === 405 || res.status === 501) {
        res = await safeFetch(url, { method: 'GET', signal: ctrl.signal });
      }
      return Response.json({ ok: res.ok, status: res.status }, { headers: cors });
    } finally {
      clearTimeout(timer);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al verificar link';
    const isSecurityError = msg.includes('Acceso bloqueado por seguridad');
    return Response.json({ ok: false, error: msg }, { status: isSecurityError ? 400 : 200, headers: cors });
  }
});
