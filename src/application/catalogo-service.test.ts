import { beforeEach, describe, expect, it } from 'vitest';
import { CatalogoService } from './catalogo-service';
import { fakeIdGen, fakeReloj, MemoryRepositorio } from '@test/support';

function nuevo() {
  const repo = new MemoryRepositorio();
  return { repo, svc: new CatalogoService(repo, fakeIdGen(), fakeReloj()) };
}

describe('CatalogoService', () => {
  let repo: MemoryRepositorio;
  let svc: CatalogoService;
  beforeEach(() => ({ repo, svc } = nuevo()));

  it('crea y persiste una obra', async () => {
    const o = await svc.crear({ titulo: 'Berserk', tipo: 'manga' });
    expect(await repo.obtenerObra(o.id)).toMatchObject({ titulo: 'Berserk', tipo: 'manga' });
  });

  it('busca por alias, insensible a mayúsculas (RF-013)', async () => {
    await svc.crear({ titulo: 'Solo Leveling', tipo: 'manhua', nombresAlternativos: ['Only I Level Up'] });
    await svc.crear({ titulo: 'Naruto', tipo: 'manga' });
    const r = await svc.buscar({ termino: 'only i level' });
    expect(r.map((o) => o.titulo)).toEqual(['Solo Leveling']);
  });

  it('combina filtros de estado y prioridad (RF-014)', async () => {
    await svc.crear({ titulo: 'A', tipo: 'manga', estado: 'leyendo', prioridad: 'alta' });
    await svc.crear({ titulo: 'B', tipo: 'manga', estado: 'leyendo', prioridad: 'baja' });
    await svc.crear({ titulo: 'C', tipo: 'manga', estado: 'pausado', prioridad: 'alta' });
    const r = await svc.buscar({ estado: 'leyendo', prioridad: 'alta' });
    expect(r.map((o) => o.titulo)).toEqual(['A']);
  });

  it('ordena el catálogo por título', async () => {
    await svc.crear({ titulo: 'Zeta', tipo: 'manga' });
    await svc.crear({ titulo: 'Alfa', tipo: 'manga' });
    expect((await svc.buscar()).map((o) => o.titulo)).toEqual(['Alfa', 'Zeta']);
  });

  it('elimina la obra y su rastro (RF-006)', async () => {
    const o = await svc.crear({ titulo: 'X', tipo: 'manga' });
    await svc.eliminar(o.id);
    expect(await repo.obtenerObra(o.id)).toBeUndefined();
  });
});
