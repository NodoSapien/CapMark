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
}
