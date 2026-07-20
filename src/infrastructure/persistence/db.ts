import Dexie, { Table } from 'dexie';
import { Fuente } from '@domain/fuente';
import { Obra } from '@domain/obra';
import { ProgresoEntry } from '@domain/progreso';

/**
 * Persistencia local-first sobre IndexedDB (web) vía Dexie. En build nativo (Capacitor)
 * este adaptador se sustituye por SQLite tras el mismo puerto Repositorio (RNF-004/007).
 */
export class CapMarkDB extends Dexie {
  obras!: Table<Obra, string>;
  fuentes!: Table<Fuente, string>;
  progreso!: Table<ProgresoEntry, string>;

  constructor() {
    super('capmark');
    this.version(1).stores({
      obras: 'id, titulo, estado, prioridad, actualizadaEn',
      fuentes: 'id, obraId, esPrincipal',
      progreso: 'id, obraId, registradoEn',
    });
    // v2: agrega campo url? en obras (campo opcional, sin índice; Dexie lo persiste automáticamente)
    this.version(2).stores({
      obras: 'id, titulo, tipo, estado, prioridad, actualizadaEn',
      fuentes: 'id, obraId, esPrincipal',
      progreso: 'id, obraId, registradoEn',
    });
    // v3: nuevos campos opcionales autor, artista, estadoPublicacion, calificacion, obrasRelacionadas
    this.version(3).stores({
      obras: 'id, titulo, tipo, estado, prioridad, actualizadaEn',
      fuentes: 'id, obraId, esPrincipal',
      progreso: 'id, obraId, registradoEn',
    });
  }
}

export const db = new CapMarkDB();
