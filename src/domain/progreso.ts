import { DomainError } from './types';

export interface ProgresoEntry {
  id: string;
  obraId: string;
  capitulo: number; // admite no enteros: 10.5 (RF-011)
  punto?: string; // página o punto opcional
  registradoEn: string; // ISO 8601 (RF-012)
}

export interface NuevoProgreso {
  capitulo: number;
  punto?: string;
}

/** RF-011/012: registra una entrada de progreso validando el capítulo. */
export function registrarProgreso(
  obraId: string,
  input: NuevoProgreso,
  id: string,
  ahora = new Date(),
): ProgresoEntry {
  if (!Number.isFinite(input.capitulo) || input.capitulo < 0) {
    throw new DomainError(`Capítulo inválido: ${input.capitulo} (RF-011).`);
  }
  return {
    id,
    obraId,
    capitulo: input.capitulo,
    punto: input.punto?.trim() || undefined,
    registradoEn: ahora.toISOString(),
  };
}

/** RF-011/012: entrada más reciente = punto actual + fecha de "última lectura". */
export function puntoActual(historial: ProgresoEntry[]): ProgresoEntry | undefined {
  if (historial.length === 0) return undefined;
  return [...historial].sort((a, b) => b.registradoEn.localeCompare(a.registradoEn))[0];
}
