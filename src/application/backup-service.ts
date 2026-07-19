import { Fuente } from '@domain/fuente';
import { Obra } from '@domain/obra';
import { ProgresoEntry } from '@domain/progreso';
import { Repositorio } from './ports';

/**
 * Backup/restore 100% local (modo absolutamente local, sin Supabase). Permite poseer los
 * datos y moverlos entre dispositivos manualmente por archivo, sin backend alguno.
 */
export interface Backup {
  app: 'capmark';
  version: 1;
  exportadoEn: string;
  obras: { obra: Obra; fuentes: Fuente[]; progreso: ProgresoEntry[] }[];
}

export class BackupService {
  constructor(private repo: Repositorio) {}

  /** Exporta todo el catálogo con sus fuentes e historial a un objeto serializable. */
  async exportar(): Promise<Backup> {
    const obras = await this.repo.listarObras();
    const detalle = await Promise.all(
      obras.map(async (obra) => ({
        obra,
        fuentes: await this.repo.listarFuentes(obra.id),
        progreso: await this.repo.listarProgreso(obra.id),
      })),
    );
    return { app: 'capmark', version: 1, exportadoEn: new Date().toISOString(), obras: detalle };
  }

  /**
   * Restaura un backup. `reemplazar` borra las obras del backup antes de reinsertarlas
   * (evita duplicar fuentes/progreso); las demás obras locales se conservan (merge).
   */
  async importar(backup: Backup, reemplazar = true): Promise<{ obras: number }> {
    if (backup?.app !== 'capmark' || backup.version !== 1 || !Array.isArray(backup.obras)) {
      throw new Error('Archivo de backup no válido para CapMark.');
    }
    for (const { obra, fuentes, progreso } of backup.obras) {
      if (reemplazar) await this.repo.eliminarObra(obra.id);
      await this.repo.guardarObra(obra);
      await this.repo.guardarFuentes(obra.id, fuentes);
      for (const p of progreso) await this.repo.agregarProgreso(p);
    }
    return { obras: backup.obras.length };
  }
}
