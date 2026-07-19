import { describe, expect, it } from 'vitest';
import { ProgresoService } from './progreso-service';
import { fakeIdGen, fakeReloj, MemoryRepositorio } from '@test/support';

const OBRA = 'obra-1';

describe('ProgresoService', () => {
  it('cada registro crea una entrada fechada y el historial va desc (RF-012)', async () => {
    const svc = new ProgresoService(new MemoryRepositorio(), fakeIdGen(), fakeReloj());
    await svc.registrar(OBRA, { capitulo: 1 });
    await svc.registrar(OBRA, { capitulo: 2 });
    await svc.registrar(OBRA, { capitulo: 3 });
    const h = await svc.historial(OBRA);
    expect(h.map((e) => e.capitulo)).toEqual([3, 2, 1]);
  });

  it('el punto actual es la entrada más reciente (RF-011)', async () => {
    const svc = new ProgresoService(new MemoryRepositorio(), fakeIdGen(), fakeReloj());
    await svc.registrar(OBRA, { capitulo: 10 });
    await svc.registrar(OBRA, { capitulo: 10.5, punto: 'mitad' });
    const actual = await svc.actual(OBRA);
    expect(actual).toMatchObject({ capitulo: 10.5, punto: 'mitad' });
  });

  it('rechaza capítulos negativos (RF-011)', async () => {
    const svc = new ProgresoService(new MemoryRepositorio(), fakeIdGen(), fakeReloj());
    await expect(svc.registrar(OBRA, { capitulo: -1 })).rejects.toThrow();
  });
});
