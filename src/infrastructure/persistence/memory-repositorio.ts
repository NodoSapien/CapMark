import { FiltroObras, OpcionesPaginacion, ResultadoPaginado } from '@application/dtos/catalogo';
import { Repositorio } from '@application/ports';
import { Fuente } from '@domain/fuente';
import { Obra } from '@domain/obra';
import { ProgresoEntry } from '@domain/progreso';

/**
 * Repositorio en memoria. Útil para tests de la capa de aplicación y como fallback
 * (p. ej. SSR o entornos sin IndexedDB). Implementa el mismo puerto que Dexie/SQLite.
 */
export class MemoryRepositorio implements Repositorio {
  private obras = new Map<string, Obra>();
  private fuentes = new Map<string, Fuente[]>();
  private progreso = new Map<string, ProgresoEntry[]>();

  async guardarObra(obra: Obra): Promise<void> {
    this.obras.set(obra.id, obra);
  }
  async obtenerObra(id: string): Promise<Obra | undefined> {
    return this.obras.get(id);
  }
  async listarObras(): Promise<Obra[]> {
    return [...this.obras.values()];
  }
  async eliminarObra(id: string): Promise<void> {
    this.obras.delete(id);
    this.fuentes.delete(id);
    this.progreso.delete(id);
  }
  async guardarFuentes(obraId: string, fuentes: Fuente[]): Promise<void> {
    this.fuentes.set(obraId, [...fuentes]);
  }
  async listarFuentes(obraId: string): Promise<Fuente[]> {
    return [...(this.fuentes.get(obraId) ?? [])];
  }
  async buscarObras(
    filtro: FiltroObras,
    paginacion: OpcionesPaginacion,
  ): Promise<ResultadoPaginado<Obra>> {
    let filtradas = [...this.obras.values()];

    if (filtro.termino) {
      const q = filtro.termino.trim().toLowerCase();
      filtradas = filtradas.filter(
        (o) =>
          o.titulo.toLowerCase().includes(q) ||
          o.nombresAlternativos.some((a) => a.toLowerCase().includes(q)),
      );
    }
    if (filtro.tag) {
      const tagLower = filtro.tag.toLowerCase();
      filtradas = filtradas.filter((o) => o.tags.some((t) => t.toLowerCase() === tagLower));
    }
    if (filtro.estado) {
      filtradas = filtradas.filter((o) => o.estado === filtro.estado);
    }
    if (filtro.prioridad) {
      filtradas = filtradas.filter((o) => o.prioridad === filtro.prioridad);
    }

    filtradas.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));

    const total = filtradas.length;
    const totalPaginas = Math.ceil(total / paginacion.limite) || 1;
    const inicio = (paginacion.pagina - 1) * paginacion.limite;
    const items = filtradas.slice(inicio, inicio + paginacion.limite);

    return {
      items,
      total,
      pagina: paginacion.pagina,
      totalPaginas,
    };
  }

  async listarTags(): Promise<string[]> {
    const set = new Set<string>();
    for (const o of this.obras.values()) {
      for (const t of o.tags) set.add(t);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }

  async agregarProgreso(entry: ProgresoEntry): Promise<void> {
    const list = this.progreso.get(entry.obraId) ?? [];
    list.push(entry);
    this.progreso.set(entry.obraId, list);
  }

  async listarProgreso(obraId: string): Promise<ProgresoEntry[]> {
    return [...(this.progreso.get(obraId) ?? [])];
  }

  async obtenerUltimoProgresoPorObras(obraIds: string[]): Promise<Map<string, ProgresoEntry>> {
    const resultado = new Map<string, ProgresoEntry>();
    for (const id of obraIds) {
      const list = this.progreso.get(id);
      if (list && list.length > 0) {
        // Ordenado por fecha descendente
        const ultimo = [...list].sort(
          (a, b) => new Date(b.registradoEn).getTime() - new Date(a.registradoEn).getTime(),
        )[0];
        if (ultimo) resultado.set(id, ultimo);
      }
    }
    return resultado;
  }
}
