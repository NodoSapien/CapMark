import { CapturaExterna } from './captura-externa';
import { CatalogoService } from './catalogo-service';
import { FuenteService } from './fuente-service';
import { ProgresoService } from './progreso-service';
import { TipoObra } from '@domain/types';

export interface ConfirmacionCaptura {
  titulo: string;
  tipo?: TipoObra;
  capitulo?: number;
}

export interface ResultadoCaptura {
  obraId: string;
  obraNueva: boolean;
  fuenteAgregada: boolean;
  progresoRegistrado: boolean;
}

/**
 * Confirms a capture the user already reviewed (S2: this is only called after confirmation).
 * Reuses an existing obra with the same title instead of duplicating it.
 */
export class CapturaService {
  constructor(
    private catalogo: CatalogoService,
    private fuentes: FuenteService,
    private progreso: ProgresoService,
  ) {}

  /** Existing obra whose title or alias matches exactly (case-insensitive), if any. */
  async obraExistente(titulo: string) {
    const t = titulo.trim().toLowerCase();
    const candidatas = await this.catalogo.buscar({ termino: titulo });
    return candidatas.find(
      (o) => o.titulo.toLowerCase() === t || o.nombresAlternativos.some((a) => a.toLowerCase() === t),
    );
  }

  async confirmar(captura: CapturaExterna, c: ConfirmacionCaptura): Promise<ResultadoCaptura> {
    const existente = await this.obraExistente(c.titulo);
    const obra = existente ?? (await this.catalogo.crear({ titulo: c.titulo, tipo: c.tipo ?? 'manga' }));

    const actuales = await this.fuentes.listar(obra.id);
    const yaEsta = actuales.some((f) => f.url === captura.url);
    if (!yaEsta) {
      await this.fuentes.agregar(obra.id, {
        nombreEnSitio: new URL(captura.url).hostname,
        url: captura.url,
      });
    }

    let progresoRegistrado = false;
    if (c.capitulo !== undefined) {
      await this.progreso.registrar(obra.id, { capitulo: c.capitulo });
      progresoRegistrado = true;
    }
    return { obraId: obra.id, obraNueva: !existente, fuenteAgregada: !yaEsta, progresoRegistrado };
  }
}
