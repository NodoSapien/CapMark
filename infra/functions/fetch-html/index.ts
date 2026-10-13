// Edge Function: proxy de descarga de HTML seguro para el scraper OPT-IN.
// Protegido contra SSRF, con CORS estructurado y autenticación.
// GET ?url=https://...

import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/auth.ts';
import { safeFetch } from '../_shared/ssrf.ts';

declare const Deno: {
  serve(handler: (req: Request) => Promise<Response>): void;
};

const MAX_HTML_BYTES = 5 * 1024 * 1024; // 5 MB

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  const authError = requireAuth(req);
  if (authError) return authError;

  const cors = getCorsHeaders();

  let target: string | null = null;
  try {
    target = new URL(req.url).searchParams.get('url');
  } catch {
    return new Response(JSON.stringify({ error: 'URL malformada' }), {
      status: 400,
      headers: { ...cors, 'content-type': 'application/json' },
    });
  }

  if (!target || !/^https?:\/\//i.test(target)) {
    return new Response(JSON.stringify({ error: 'Parámetro url inválido o no suministrado' }), {
      status: 400,
      headers: { ...cors, 'content-type': 'application/json' },
    });
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);

  try {
    const res = await safeFetch(target, {
      method: 'GET',
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; CapMark/0.1)',
        accept: 'text/html,application/xhtml+xml',
      },
      signal: ctrl.signal,
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Servidor remoto respondió con estado ${res.status}` }), {
        status: 502,
        headers: { ...cors, 'content-type': 'application/json' },
      });
    }

    const blob = await res.blob();
    if (blob.size > MAX_HTML_BYTES) {
      return new Response(JSON.stringify({ error: 'El contenido excede el límite máximo permitido (5MB)' }), {
        status: 413,
        headers: { ...cors, 'content-type': 'application/json' },
      });
    }

    const html = await blob.text();
    return new Response(html, {
      headers: { ...cors, 'content-type': 'text/html; charset=utf-8' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al descargar recurso';
    const isSecurityError = msg.includes('Acceso bloqueado por seguridad');
    return new Response(JSON.stringify({ error: msg }), {
      status: isSecurityError ? 400 : 502,
      headers: { ...cors, 'content-type': 'application/json' },
    });
  } finally {
    clearTimeout(timer);
  }
});
