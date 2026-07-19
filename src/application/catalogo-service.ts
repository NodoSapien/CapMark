import { coincideBusqueda, crearObra, editarObra, Obra } from '@domain/obra';
import { EstadoObra, Prioridad } from '@domain/types';
import { IdGen, NuevaObra, Reloj, Repositorio } from './ports';

export interface Filtro {
  termino?: string; // RF-013
  tag?: string; // RF-014
  estado?: EstadoObra; // RF-014
  prioridad?: Prioridad; // RF-014
}

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

  /** RF-013 + RF-014: búsqueda por título/alias y filtros combinables. */
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
