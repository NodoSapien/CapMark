// Capa de dominio: vocabulario del negocio. Sin dependencias de infraestructura ni UI.

export type TipoObra = 'manga' | 'manhua' | 'manwha' | 'manhwa' | 'anime' | 'webtoon' | 'novela' | 'novela-visual';
export const TIPOS_OBRA: TipoObra[] = ['manga', 'manhua', 'manwha', 'manhwa', 'anime', 'webtoon', 'novela', 'novela-visual'];

export type EstadoObra = 'pendiente' | 'leyendo' | 'pausado' | 'abandonado' | 'completado';
export const ESTADOS_OBRA: EstadoObra[] = ['pendiente', 'leyendo', 'pausado', 'abandonado', 'completado'];

export type Prioridad = 'alta' | 'media' | 'baja';
export const PRIORIDADES: Prioridad[] = ['alta', 'media', 'baja'];

export type EstadoFuente = 'activa' | 'caida' | 'sin_verificar';

/** Error de violación de una invariante de dominio. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
