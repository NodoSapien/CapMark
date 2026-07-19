import { ProgresoEntry, puntoActual, registrarProgreso } from '@domain/progreso';
import { IdGen, NuevoProgreso, Reloj, Repositorio } from './ports';

/** Casos de uso de progreso e historial (F-03). */
export class ProgresoService {
  constructor(private repo: Repositorio, private id: IdGen, private reloj: Reloj) {}

  /** RF-011/012: registra el punto actual; cada actualización crea una entrada fechada. */
  async registrar(obraId: string, input: NuevoProgreso): Promise<ProgresoEntry> {
    const entry = registrarProgreso(obraId, input, this.id.nuevo(), this.reloj.ahora());
    await this.repo.agregarProgreso(entry);
    return entry;
  }

  /** RF-012: historial en orden cronológico descendente (lo más reciente primero). */
  async historial(obraId: string): Promise<ProgresoEntry[]> {
    const h = await this.repo.listarProgreso(obraId);
    return [...h].sort((a, b) => b.registradoEn.localeCompare(a.registradoEn));
  }

  async actual(obraId: string): Promise<ProgresoEntry | undefined> {
    return puntoActual(await this.repo.listarProgreso(obraId));
  }
}
