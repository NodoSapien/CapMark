import { Obra } from '@domain/obra';
import { EstadoObra, Prioridad } from '@domain/types';

export interface FiltroObras {
  termino?: string; // RF-013
  tag?: string; // RF-014
  estado?: EstadoObra; // RF-014
  prioridad?: Prioridad; // RF-014
}

export interface OpcionesPaginacion {
  pagina: number; // 1-indexed
  limite: number; // Items por página
}

export interface ResultadoPaginado<T> {
  items: T[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface ItemCatalogo {
  obra: Obra;
  capitulo?: number;
  ultima?: string;
}

export type PaginaCatalogo = ResultadoPaginado<ItemCatalogo>;
