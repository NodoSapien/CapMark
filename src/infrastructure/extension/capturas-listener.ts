// Receives captures from the extension bridge (content script on the app origin) and turns
// them into proposals. Nothing is persisted here: the UI shows the proposal and the user confirms.

import {
  CAPMARK_APP_SOURCE,
  CAPMARK_EXT_SOURCE,
  CapturaExterna,
  validarCaptura,
} from '@application/captura-externa';
import type { PropuestaCapitulo } from '@application/ports';
import { extraerCapitulo } from '../scraper/chapter-extractor';

export interface PropuestaCaptura {
  captura: CapturaExterna;
  capitulo?: PropuestaCapitulo;
}

/** Pure: message payload -> valid proposals (invalid captures are dropped). */
export function procesarMensaje(data: unknown): PropuestaCaptura[] {
  if (typeof data !== 'object' || data === null) return [];
  const d = data as { source?: unknown; type?: unknown; capturas?: unknown };
  if (d.source !== CAPMARK_EXT_SOURCE || d.type !== 'capturas' || !Array.isArray(d.capturas)) return [];
  const out: PropuestaCaptura[] = [];
  for (const raw of d.capturas) {
    const captura = validarCaptura(raw);
    if (captura) out.push({ captura, capitulo: extraerCapitulo(captura.texto, captura.url) });
  }
  return out;
}

/** Subscribes to extension messages; acks processed ids so the extension can clear its queue. */
export function escucharCapturas(onPropuestas: (p: PropuestaCaptura[]) => void): () => void {
  const handler = (e: MessageEvent) => {
    if (e.source !== window || e.origin !== window.location.origin) return;
    const propuestas = procesarMensaje(e.data);
    if (propuestas.length === 0) return;
    onPropuestas(propuestas);
    window.postMessage(
      { source: CAPMARK_APP_SOURCE, type: 'ack', ids: propuestas.map((p) => p.captura.id) },
      window.location.origin,
    );
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}
