import { PropuestaCapitulo, SourceScraper } from './ports';

/**
 * Módulo scraper OPT-IN (decisión del usuario). Filosofía semi-asistida (S2):
 * NUNCA escribe en la data local. Solo PROPONE un capítulo detectado en una fuente,
 * bajo demanda; la UI muestra la propuesta y el usuario confirma antes de registrar
 * el progreso (vía ProgresoService).
 */
export class ScraperService {
  constructor(private adaptadores: SourceScraper[]) {}

  /** ¿Hay algún adaptador capaz de leer esta URL? */
  soportado(url: string): boolean {
    return this.adaptadores.some((a) => a.soporta(url));
  }

  /** Devuelve la propuesta del primer adaptador que soporte la URL y logre detectar. */
  async detectar(url: string): Promise<PropuestaCapitulo | undefined> {
    for (const a of this.adaptadores) {
      if (!a.soporta(url)) continue;
      try {
        const propuesta = await a.detectar(url);
        if (propuesta) return propuesta;
      } catch {
        // adaptador frágil ante cambios del sitio: seguimos con el siguiente
      }
    }
    return undefined;
  }
}
