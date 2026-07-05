import { IdGen, Reloj } from '@application/ports';

export const idGen: IdGen = {
  nuevo: () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
};

export const reloj: Reloj = {
  ahora: () => new Date(),
};
