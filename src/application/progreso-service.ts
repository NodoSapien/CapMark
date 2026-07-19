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

  /** Fija un capítulo y auto-rellena todos los capítulos enteros anteriores si no existen. */
  async fijar(obraId: string, input: NuevoProgreso): Promise<ProgresoEntry> {
    const target = input.capitulo;
    const historialActual = await this.repo.listarProgreso(obraId);
    const setCapitulos = new Set(historialActual.map((e) => e.capitulo));
    
    // Rellenar enteros anteriores (ej: si target es 50, rellenar 1..49)
    if (target > 1) {
      const tope = Math.floor(target);
      // Iteramos creando entradas con la hora actual ligeramente desfasada 
      // (aunque al final todos tendrán tiempos similares, el último será el target)
      for (let i = 1; i <= tope; i++) {
        if (!setCapitulos.has(i) && i !== target) {
          const entry = registrarProgreso(obraId, { capitulo: i }, this.id.nuevo(), this.reloj.ahora());
          await this.repo.agregarProgreso(entry);
        }
      }
    }

    // Registrar finalmente el capítulo deseado para que quede como el más reciente
    return this.registrar(obraId, input);
  }

  async eliminar(id: string): Promise<void> {
    await this.repo.eliminarProgreso(id);
  }
}
