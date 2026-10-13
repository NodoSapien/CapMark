// Cliente seguro anti-SSRF y validación de URLs
import { isPrivateIP } from './ip-validator.ts';

declare const Deno: {
  resolveDns?(query: string, recordType: string): Promise<string[]>;
};

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'db',
  'rest',
  'auth',
  'realtime',
  'functions',
  'host.docker.internal',
]);

export async function validateSafeUrl(rawUrl: string): Promise<{ ok: boolean; url?: URL; error?: string }> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, error: 'URL malformada' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Protocolo no permitido (solo http y https)' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Validar nombres de host internos de Docker o redes privadas
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan')
  ) {
    return { ok: false, error: 'Host interno o local no permitido' };
  }

  // Si el hostname es directamente una IP
  if (isPrivateIP(hostname)) {
    return { ok: false, error: 'Dirección IP privada o reservada no permitida' };
  }

  // Si Deno.resolveDns está disponible, resolver y verificar las IPs asociadas
  if (typeof Deno !== 'undefined' && typeof Deno.resolveDns === 'function') {
    try {
      const ips = await Deno.resolveDns(hostname, 'A').catch(() => []);
      for (const ip of ips) {
        if (isPrivateIP(ip)) {
          return { ok: false, error: `La dirección IP resuelta (${ip}) es privada o reservada` };
        }
      }
    } catch {
      // Si la resolución falla, no resolvemos a IP privada conocida pero dejamos que el fetch maneje el DNS
    }
  }

  return { ok: true, url: parsed };
}

export interface SafeFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  maxRedirects?: number;
  maxBytes?: number;
}

export async function safeFetch(
  targetUrl: string,
  options: SafeFetchOptions = {},
): Promise<Response> {
  const maxRedirects = options.maxRedirects ?? 4;
  let currentUrl = targetUrl;
  let redirectCount = 0;

  while (true) {
    const check = await validateSafeUrl(currentUrl);
    if (!check.ok) {
      throw new Error(`Acceso bloqueado por seguridad: ${check.error}`);
    }

    const res = await fetch(currentUrl, {
      method: options.method ?? 'GET',
      headers: options.headers,
      signal: options.signal,
      redirect: 'manual',
    });

    // Manejar redirecciones de forma manual para evitar evasión de SSRF
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get('location');
      if (!location) {
        return res;
      }
      redirectCount++;
      if (redirectCount > maxRedirects) {
        throw new Error('Demasiadas redirecciones HTTP');
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    return res;
  }
}
