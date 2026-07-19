import { MemoryRepositorio } from '@infrastructure/persistence/memory-repositorio';
import { IdGen, LinkVerifier, Reloj } from '@application/ports';
import { EstadoFuente } from '@domain/types';

/** IdGen determinista para tests: id-1, id-2, … */
export function fakeIdGen(): IdGen {
  let n = 0;
  return { nuevo: () => `id-${++n}` };
}

/** Reloj que avanza 1 s en cada llamada, para historiales ordenables. */
export function fakeReloj(desde = new Date('2024-01-01T00:00:00Z')): Reloj {
  let t = desde.getTime();
  return {
    ahora: () => {
      const now = new Date(t);
      t += 1000;
      return now;
    },
  };
}

/** LinkVerifier que devuelve un estado fijo, sin red. */
export function fakeVerifier(estado: EstadoFuente = 'activa'): LinkVerifier {
  return {
    verificar: async () => ({ estado, verificadaEn: new Date('2024-06-01T00:00:00Z').toISOString() }),
  };
}

export { MemoryRepositorio };
