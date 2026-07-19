import {
  DomainError,
  ESTADOS_OBRA,
  EstadoObra,
  Prioridad,
  PRIORIDADES,
  TIPOS_OBRA,
  TipoObra,
} from './types';

export interface Obra {
  id: string;
  titulo: string;
  tipo: TipoObra;
  nombresAlternativos: string[];
  tags: string[];
  estado: EstadoObra;
  prioridad: Prioridad;
  notas?: string;
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
  notas?: string;
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

  const iso = ahora.toISOString();
  return {
    id,
    titulo,
    tipo: input.tipo,
    nombresAlternativos: dedup(input.nombresAlternativos ?? []),
    tags: dedup(input.tags ?? []), // RF-003: sin duplicados dentro de la obra
    estado,
    prioridad,
    notas: input.notas?.trim() || undefined,
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
      notas: cambios.notas ?? obra.notas,
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
