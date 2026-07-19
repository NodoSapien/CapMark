import { PropuestaCapitulo, SourceScraper } from '@application/ports';
import { extraerCapitulo } from './chapter-extractor';

/**
 * Adaptador scraper genérico. Descarga el HTML de la fuente y delega en el extractor puro.
 * En navegador, fetch cross-origin choca con CORS: si `VITE_SCRAPER_PROXY` está configurado
 * (Edge Function / worker del backend auto-instanciable), la descarga se enruta por ahí.
 *
 * Es opt-in y semi-asistido: solo se invoca a petición del usuario y su salida se PROPONE.
 */
export class GenericScraper implements SourceScraper {
  constructor(private proxy = import.meta.env.VITE_SCRAPER_PROXY as string | undefined) {}

  soporta(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }

  async detectar(url: string): Promise<PropuestaCapitulo | undefined> {
    const target = this.proxy ? `${this.proxy}?url=${encodeURIComponent(url)}` : url;
    const res = await fetch(target, { headers: { accept: 'text/html' } });
    if (!res.ok) return undefined;
    const html = await res.text();
    return extraerCapitulo(html, url);
  }
}
