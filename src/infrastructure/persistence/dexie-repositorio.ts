import Dexie from 'dexie';
import { FiltroObras, OpcionesPaginacion, ResultadoPaginado } from '@application/dtos/catalogo';
import { Repositorio } from '@application/ports';
import { Fuente } from '@domain/fuente';
import { Obra } from '@domain/obra';
import { ProgresoEntry } from '@domain/progreso';
import { CapMarkDB } from './db';

/** Adaptador de Repositorio sobre Dexie/IndexedDB. Confirma en local antes de sincronizar. */
export class DexieRepositorio implements Repositorio {
  constructor(private db: CapMarkDB) {}

  async guardarObra(obra: Obra): Promise<void> {
    await this.db.obras.put(obra);
  }

  async obtenerObra(id: string): Promise<Obra | undefined> {
    return this.db.obras.get(id);
  }

  async listarObras(): Promise<Obra[]> {
    return this.db.obras.toArray();
  }

  async buscarObras(
    filtro: FiltroObras,
    paginacion: OpcionesPaginacion,
  ): Promise<ResultadoPaginado<Obra>> {
    const filtradas = await this.db.obras.filter((o) => {
      if (filtro.termino) {
        const q = filtro.termino.trim().toLowerCase();
        const match =
          o.titulo.toLowerCase().includes(q) ||
          o.nombresAlternativos.some((a) => a.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (filtro.tag) {
        const tagLower = filtro.tag.toLowerCase();
        if (!o.tags.some((t) => t.toLowerCase() === tagLower)) return false;
      }
      if (filtro.estado && o.estado !== filtro.estado) return false;
      if (filtro.prioridad && o.prioridad !== filtro.prioridad) return false;
      return true;
    }).toArray();

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
    try {
      const keys = await this.db.obras.orderBy('tags').uniqueKeys();
      return (keys as string[]).sort((a, b) => a.localeCompare(b, 'es'));
    } catch {
      const obras = await this.db.obras.toArray();
      const set = new Set<string>();
      for (const o of obras) {
        for (const t of o.tags) set.add(t);
      }
      return [...set].sort((a, b) => a.localeCompare(b, 'es'));
    }
  }

  async eliminarObra(id: string): Promise<void> {
    // RF-006: borrado en cascada de fuentes e historial.
    await this.db.transaction('rw', this.db.obras, this.db.fuentes, this.db.progreso, async () => {
      await this.db.obras.delete(id);
      await this.db.fuentes.where('obraId').equals(id).delete();
      await this.db.progreso.where('obraId').equals(id).delete();
    });
  }

  async guardarFuentes(obraId: string, fuentes: Fuente[]): Promise<void> {
    await this.db.transaction('rw', this.db.fuentes, async () => {
      await this.db.fuentes.where('obraId').equals(obraId).delete();
      if (fuentes.length) await this.db.fuentes.bulkPut(fuentes);
    });
  }

  async listarFuentes(obraId: string): Promise<Fuente[]> {
    return this.db.fuentes.where('obraId').equals(obraId).toArray();
  }

  async agregarProgreso(entry: ProgresoEntry): Promise<void> {
    await this.db.progreso.put(entry);
  }

  async listarProgreso(obraId: string): Promise<ProgresoEntry[]> {
    return this.db.progreso.where('obraId').equals(obraId).toArray();
  }

  async obtenerUltimoProgresoPorObras(obraIds: string[]): Promise<Map<string, ProgresoEntry>> {
    const map = new Map<string, ProgresoEntry>();
    if (obraIds.length === 0) return map;

    const promesas = obraIds.map(async (id) => {
      try {
        const ultimo = await this.db.progreso
          .where('[obraId+registradoEn]')
          .between([id, Dexie.minKey], [id, Dexie.maxKey])
          .last();
        if (ultimo) map.set(id, ultimo);
      } catch {
        const list = await this.db.progreso.where('obraId').equals(id).toArray();
        if (list.length > 0) {
          list.sort((a, b) => new Date(b.registradoEn).getTime() - new Date(a.registradoEn).getTime());
          map.set(id, list[0]);
        }
      }
    });

    await Promise.all(promesas);
    return map;
  }
}
