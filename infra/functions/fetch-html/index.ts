// Edge Function: proxy de descarga de HTML para el scraper OPT-IN (evita CORS).
// El extractor de capítulo corre en el cliente sobre el HTML que devuelve esta función.
// GET ?url=https://...

Deno.serve(async (req: Request) => {
  const cors = { 'access-control-allow-origin': '*' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const target = new URL(req.url).searchParams.get('url');
  if (!target || !/^https?:\/\//i.test(target)) {
    return new Response('url inválida', { status: 400, headers: cors });
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(target, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'user-agent': 'Mozilla/5.0 CapMark', accept: 'text/html' },
    });
    const html = await res.text();
    return new Response(html, { headers: { ...cors, 'content-type': 'text/html; charset=utf-8' } });
  } catch {
    return new Response('', { status: 502, headers: cors });
  } finally {
    clearTimeout(timer);
  }
});
