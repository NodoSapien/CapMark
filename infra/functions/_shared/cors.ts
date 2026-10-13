// Manejo centralizado de CORS para Edge Functions

export function getCorsHeaders(): Record<string, string> {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'authorization, apikey, content-type, accept',
    'access-control-allow-methods': 'GET, POST, HEAD, OPTIONS',
  };
}

export function handleCorsPreflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(),
    });
  }
  return null;
}
