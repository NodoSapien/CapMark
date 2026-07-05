// Edge Function: verificación de links del lado servidor (RF-017, RNF-008).
// Evita el CORS del cliente y aplica timeout ≤ 5 s. Responde { ok: boolean }.
// POST { "url": "https://..." }

Deno.serve(async (req: Request) => {
  const cors = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { url } = await req.json();
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      return Response.json({ ok: false, error: 'url inválida' }, { status: 400, headers: cors });
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal });
      // Algunos sitios no soportan HEAD: reintenta con GET liviano.
      if (res.status === 405 || res.status === 501) {
        res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal });
      }
      return Response.json({ ok: res.ok, status: res.status }, { headers: cors });
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return Response.json({ ok: false }, { headers: cors });
  }
});
