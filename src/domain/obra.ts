import {
  DomainError,
  ESTADOS_OBRA,
  EstadoObra,
  Prioridad,
  PRIORIDADES,
  TIPOS_OBRA,
  TipoObra,
  EstadoPublicacion,
  ESTADOS_PUBLICACION,
} from './types';

export interface Obra {
  id: string;
  titulo: string;
  tipo: TipoObra;
  nombresAlternativos: string[];
  tags: string[];
  estado: EstadoObra;
  prioridad: Prioridad;
  url?: string; // URL de lectura actual (cambiable)
  notas?: string;
  autor?: string;
  artista?: string;
  estadoPublicacion?: EstadoPublicacion;
  calificacion?: number; // 0 a 5, paso 0.5
  obrasRelacionadas?: string[]; // IDs de otras obras
  creadaEn: string; // ISO 8601
  actualizadaEn: string; // ISO 8601
}

export interface NuevaObra {
  titulo: string;
  tipo: TipoObra;
  nombresAlternativos?: string[];
  tags?: string[];
  estado?: EstadoObra;
  prioridad?: Prioridad;
  url?: string; // URL de lectura actual
  notas?: string;
  autor?: string;
  artista?: string;
  estadoPublicacion?: EstadoPublicacion;
  calificacion?: number;
  obrasRelacionadas?: string[];
}

const norm = (s: string) => s.trim();
const dedup = (xs: string[]) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs.map(norm).filter(Boolean)) {
    const key = x.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(x);
    }
  }
  return out;
};

/** RF-001/002/003/004/005: crea una obra validando sus invariantes. */
export function crearObra(input: NuevaObra, id: string, ahora = new Date()): Obra {
  const titulo = norm(input.titulo);
  if (!titulo) throw new DomainError('La obra requiere un título principal (RF-001).');
  if (!TIPOS_OBRA.includes(input.tipo)) throw new DomainError(`Tipo inválido: ${input.tipo} (RF-001).`);

  const estado = input.estado ?? 'pendiente';
  if (!ESTADOS_OBRA.includes(estado)) throw new DomainError(`Estado inválido: ${estado} (RF-004).`);

  const prioridad = input.prioridad ?? 'media'; // RF-005: por defecto media
  if (!PRIORIDADES.includes(prioridad)) throw new DomainError(`Prioridad inválida: ${prioridad} (RF-005).`);

  if (input.calificacion !== undefined) {
    if (input.calificacion < 0 || input.calificacion > 5) throw new DomainError(`La calificación debe estar entre 0 y 5.`);
    if (input.calificacion % 0.5 !== 0) throw new DomainError(`La calificación debe ser múltiplo de 0.5.`);
  }

  if (input.estadoPublicacion !== undefined && !ESTADOS_PUBLICACION.includes(input.estadoPublicacion)) {
    throw new DomainError(`Estado de publicación inválido: ${input.estadoPublicacion}.`);
  }

  const iso = ahora.toISOString();
  const urlRaw = input.url?.trim();
  return {
    id,
    titulo,
    tipo: input.tipo,
    nombresAlternativos: dedup(input.nombresAlternativos ?? []),
    tags: dedup(input.tags ?? []), // RF-003: sin duplicados dentro de la obra
    estado,
    prioridad,
    url: urlRaw || undefined,
    notas: input.notas?.trim() || undefined,
    autor: input.autor?.trim() || undefined,
    artista: input.artista?.trim() || undefined,
    estadoPublicacion: input.estadoPublicacion,
    calificacion: input.calificacion,
    obrasRelacionadas: dedup(input.obrasRelacionadas ?? []),
    creadaEn: iso,
    actualizadaEn: iso,
  };
}

/** Aplica cambios parciales revalidando invariantes y refrescando `actualizadaEn`. */
export function editarObra(obra: Obra, cambios: Partial<NuevaObra>, ahora = new Date()): Obra {
  const merged = crearObra(
    {
      titulo: cambios.titulo ?? obra.titulo,
      tipo: cambios.tipo ?? obra.tipo,
      nombresAlternativos: cambios.nombresAlternativos ?? obra.nombresAlternativos,
      tags: cambios.tags ?? obra.tags,
      estado: cambios.estado ?? obra.estado,
      prioridad: cambios.prioridad ?? obra.prioridad,
      url: cambios.url !== undefined ? cambios.url : obra.url,
      notas: cambios.notas ?? obra.notas,
      autor: cambios.autor !== undefined ? cambios.autor : obra.autor,
      artista: cambios.artista !== undefined ? cambios.artista : obra.artista,
      estadoPublicacion: cambios.estadoPublicacion !== undefined ? cambios.estadoPublicacion : obra.estadoPublicacion,
      calificacion: cambios.calificacion !== undefined ? cambios.calificacion : obra.calificacion,
      obrasRelacionadas: cambios.obrasRelacionadas ?? obra.obrasRelacionadas,
    },
    obra.id,
    ahora,
  );
  return { ...merged, creadaEn: obra.creadaEn };
}

/** RF-013: ¿coincide la obra con el término, por título o alias (case-insensitive)? */
export function coincideBusqueda(obra: Obra, termino: string): boolean {
  const t = termino.trim().toLowerCase();
  if (!t) return true;
  if (obra.titulo.toLowerCase().includes(t)) return true;
  return obra.nombresAlternativos.some((n) => n.toLowerCase().includes(t));
}
