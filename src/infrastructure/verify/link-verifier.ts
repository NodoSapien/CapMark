import { LinkVerifier } from '@application/ports';
import { EstadoFuente } from '@domain/types';

const TIMEOUT_MS = 5000; // RNF-008: ≤ 5 s por fuente

/**
 * RF-017 / RNF-008. Verificación del lado servidor cuando hay backend auto-instanciable:
 * si `VITE_VERIFY_URL` apunta a la Edge Function, se delega ahí (evita CORS). Sin backend,
 * hace un intento best-effort desde el cliente (modo no-cors: si resuelve, se asume activa).
 */
export class HttpLinkVerifier implements LinkVerifier {
  constructor(private edgeFnUrl = import.meta.env.VITE_VERIFY_URL as string | undefined) {}

  async verificar(url: string): Promise<{ estado: EstadoFuente; verificadaEn: string }> {
    const verificadaEn = new Date().toISOString();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      if (this.edgeFnUrl) {
        const res = await fetch(this.edgeFnUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ url }),
          signal: ctrl.signal,
        });
        const data = (await res.json()) as { ok: boolean };
        return { estado: data.ok ? 'activa' : 'caida', verificadaEn };
      }
      // Fallback sin backend: no-cors da respuesta opaca; si no lanza, la tomamos como activa.
      await fetch(url, { method: 'HEAD', mode: 'no-cors', signal: ctrl.signal });
      return { estado: 'activa', verificadaEn };
    } catch {
      return { estado: 'caida', verificadaEn };
    } finally {
      clearTimeout(timer);
    }
  }
}
