import { crearFuente, Fuente, marcarPrincipal } from '@domain/fuente';
import { IdGen, LinkVerifier, NuevaFuente, Repositorio } from './ports';

/** Casos de uso de fuentes por obra (F-02, F-06). */
export class FuenteService {
  constructor(private repo: Repositorio, private id: IdGen, private verifier: LinkVerifier) {}

  async listar(obraId: string): Promise<Fuente[]> {
    return this.repo.listarFuentes(obraId);
  }

  /** RF-008: agrega una fuente. Si es la primera, queda principal por defecto. */
  async agregar(obraId: string, input: NuevaFuente): Promise<Fuente[]> {
    const fuentes = await this.repo.listarFuentes(obraId);
    const nueva = crearFuente(obraId, { ...input, esPrincipal: input.esPrincipal ?? fuentes.length === 0 }, this.id.nuevo());
    let siguiente = [...fuentes, nueva];
    if (nueva.esPrincipal) siguiente = marcarPrincipal(siguiente, nueva.id); // RF-009: máx. una principal
    await this.repo.guardarFuentes(obraId, siguiente);
    return siguiente;
  }

  /** RF-010: elimina una fuente; si era la principal, la obra queda sin principal. */
  async eliminar(obraId: string, fuenteId: string): Promise<Fuente[]> {
    const fuentes = (await this.repo.listarFuentes(obraId)).filter((f) => f.id !== fuenteId);
    await this.repo.guardarFuentes(obraId, fuentes);
    return fuentes;
  }

  async marcarPrincipal(obraId: string, fuenteId: string): Promise<Fuente[]> {
    const fuentes = marcarPrincipal(await this.repo.listarFuentes(obraId), fuenteId);
    await this.repo.guardarFuentes(obraId, fuentes);
    return fuentes;
  }

  /** RF-017 / RNF-008: verifica una fuente sin bloquear; persiste estado + fecha. */
  async verificar(obraId: string, fuenteId: string): Promise<Fuente[]> {
    const fuentes = await this.repo.listarFuentes(obraId);
    const fuente = fuentes.find((f) => f.id === fuenteId);
    if (!fuente) throw new Error(`Fuente no encontrada: ${fuenteId}`);
    const { estado, verificadaEn } = await this.verifier.verificar(fuente.url);
    const siguiente = fuentes.map((f) =>
      f.id === fuenteId ? { ...f, estadoVerificacion: estado, verificadaEn } : f,
    );
    await this.repo.guardarFuentes(obraId, siguiente);
    return siguiente;
  }
}
