// Protocol between the browser extension and the app. The extension only COLLECTS raw page
// data; the app decides what to propose and the user confirms (S2: never saves on its own).

export const CAPMARK_EXT_SOURCE = 'capmark-ext';
export const CAPMARK_APP_SOURCE = 'capmark-app';
export const MAX_TEXTO = 20_000;

export interface CapturaExterna {
  id: string;
  titulo: string;
  url: string;
  /** Visible page text (trimmed); the app extracts the chapter from it. */
  texto: string;
  capturadaEn: string; // ISO 8601
}

/** Validates an untrusted object coming from window.postMessage. Returns undefined if invalid. */
export function validarCaptura(raw: unknown): CapturaExterna | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id) return undefined;
  if (typeof r.titulo !== 'string' || !r.titulo.trim()) return undefined;
  if (typeof r.url !== 'string') return undefined;
  let url: URL;
  try {
    url = new URL(r.url);
  } catch {
    return undefined;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
  const texto = typeof r.texto === 'string' ? r.texto.slice(0, MAX_TEXTO) : '';
  const capturadaEn = typeof r.capturadaEn === 'string' ? r.capturadaEn : new Date(0).toISOString();
  return { id: r.id, titulo: r.titulo.trim(), url: url.toString(), texto, capturadaEn };
}
