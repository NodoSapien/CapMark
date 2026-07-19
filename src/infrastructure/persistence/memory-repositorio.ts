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
  async agregarProgreso(entry: ProgresoEntry): Promise<void> {
    const list = this.progreso.get(entry.obraId) ?? [];
    list.push(entry);
    this.progreso.set(entry.obraId, list);
  }
  async listarProgreso(obraId: string): Promise<ProgresoEntry[]> {
    return [...(this.progreso.get(obraId) ?? [])];
  }
}
