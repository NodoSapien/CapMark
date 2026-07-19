import { DomainError, EstadoFuente } from './types';

export interface Fuente {
  id: string;
  obraId: string;
  nombreEnSitio: string;
  url: string;
  esPrincipal: boolean;
  estadoVerificacion: EstadoFuente;
  verificadaEn?: string; // ISO 8601
}

export interface NuevaFuente {
  nombreEnSitio: string;
  url: string;
  esPrincipal?: boolean;
}

function validarUrl(raw: string): string {
  const url = raw.trim();
  if (!url) throw new DomainError('La fuente requiere una URL (RF-008).');
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new DomainError('La URL de la fuente debe ser http(s) (RF-008).');
    }
  } catch {
    throw new DomainError(`URL inválida: ${url} (RF-008).`);
  }
  return url;
}

/** RF-008: crea una fuente con nombre-en-el-sitio y URL válida. */
export function crearFuente(obraId: string, input: NuevaFuente, id: string): Fuente {
  return {
    id,
    obraId,
    nombreEnSitio: input.nombreEnSitio.trim() || new URL(validarUrl(input.url)).hostname,
    url: validarUrl(input.url),
    esPrincipal: input.esPrincipal ?? false,
    estadoVerificacion: 'sin_verificar',
  };
}

/**
 * RF-009: garantiza como máximo una fuente principal.
 * Devuelve la lista con `principalId` marcada como principal y el resto en false.
 */
export function marcarPrincipal(fuentes: Fuente[], principalId: string): Fuente[] {
  if (!fuentes.some((f) => f.id === principalId)) {
    throw new DomainError('La fuente a marcar como principal no pertenece a la obra (RF-009).');
  }
  return fuentes.map((f) => ({ ...f, esPrincipal: f.id === principalId }));
}

/** RF-009: la fuente ofrecida por defecto para abrir. */
export function fuentePrincipal(fuentes: Fuente[]): Fuente | undefined {
  return fuentes.find((f) => f.esPrincipal) ?? fuentes[0];
}
