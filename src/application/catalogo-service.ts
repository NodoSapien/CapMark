import { coincideBusqueda, crearObra, editarObra, Obra } from '@domain/obra';
import {
  FiltroObras,
  ItemCatalogo,
  OpcionesPaginacion,
  PaginaCatalogo,
  ResultadoPaginado,
} from './dtos/catalogo';
import { IdGen, NuevaObra, Reloj, Repositorio } from './ports';

export type Filtro = FiltroObras;
export type { ItemCatalogo, OpcionesPaginacion, PaginaCatalogo, ResultadoPaginado };

/** Casos de uso del catálogo (F-01, F-04). */
export class CatalogoService {
  constructor(private repo: Repositorio, private id: IdGen, private reloj: Reloj) {}

  async crear(input: NuevaObra): Promise<Obra> {
    const obra = crearObra(input, this.id.nuevo(), this.reloj.ahora());
    await this.repo.guardarObra(obra);
    return obra;
  }

  async editar(id: string, cambios: Partial<NuevaObra>): Promise<Obra> {
    const actual = await this.repo.obtenerObra(id);
    if (!actual) throw new Error(`Obra no encontrada: ${id}`);
    const obra = editarObra(actual, cambios, this.reloj.ahora());
    await this.repo.guardarObra(obra);
    return obra;
  }

  /** RF-006: elimina la obra y, en cascada, sus fuentes e historial. */
  async eliminar(id: string): Promise<void> {
    await this.repo.eliminarObra(id);
  }

  async obtener(id: string): Promise<Obra | undefined> {
    return this.repo.obtenerObra(id);
  }

  /**
   * RF-013 + RF-014: búsqueda paginada y optimizada con batch loading del último progreso.
   * Evita problemas de N+1 consultas y sobrecarga de memoria en dispositivos móviles.
   */
  async listarPagina(
    filtro: FiltroObras = {},
    paginacion: OpcionesPaginacion = { pagina: 1, limite: 20 },
  ): Promise<PaginaCatalogo> {
    const res = await this.repo.buscarObras(filtro, paginacion);
    const ids = res.items.map((o) => o.id);
    const progresoMap = await this.repo.obtenerUltimoProgresoPorObras(ids);

    const items: ItemCatalogo[] = res.items.map((obra) => {
      const p = progresoMap.get(obra.id);
      return {
        obra,
        capitulo: p?.capitulo,
        ultima: p?.registradoEn,
      };
    });

    return {
      items,
      total: res.total,
      pagina: res.pagina,
      totalPaginas: res.totalPaginas,
    };
  }

  /**
   * Obtiene la lista única de tags existentes sin cargar el catálogo completo en memoria.
   */
  async listarTags(): Promise<string[]> {
    return this.repo.listarTags();
  }

  /** RF-013 + RF-014: búsqueda por título/alias y filtros combinables (mantenido por compatibilidad). */
  async buscar(filtro: Filtro = {}): Promise<Obra[]> {
    const todas = await this.repo.listarObras();
    return todas
      .filter((o) => coincideBusqueda(o, filtro.termino ?? ''))
      .filter((o) => (filtro.tag ? o.tags.some((t) => t.toLowerCase() === filtro.tag!.toLowerCase()) : true))
      .filter((o) => (filtro.estado ? o.estado === filtro.estado : true))
      .filter((o) => (filtro.prioridad ? o.prioridad === filtro.prioridad : true))
      .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
  }
}
