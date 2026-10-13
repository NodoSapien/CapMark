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

  it('lista páginas con paginación y ensambla el progreso actual por batch', async () => {
    await svc.crear({ titulo: 'Obra 1', tipo: 'manga' });
    const o2 = await svc.crear({ titulo: 'Obra 2', tipo: 'manga' });
    await svc.crear({ titulo: 'Obra 3', tipo: 'manga' });

    // Agregar progreso para o2
    await repo.agregarProgreso({
      id: 'p1',
      obraId: o2.id,
      capitulo: 15,
      registradoEn: new Date().toISOString(),
    });

    const pag1 = await svc.listarPagina({}, { pagina: 1, limite: 2 });
    expect(pag1.items).toHaveLength(2);
    expect(pag1.total).toBe(3);
    expect(pag1.totalPaginas).toBe(2);
    expect(pag1.pagina).toBe(1);

    const item2 = pag1.items.find((i) => i.obra.id === o2.id);
    expect(item2?.capitulo).toBe(15);

    const pag2 = await svc.listarPagina({}, { pagina: 2, limite: 2 });
    expect(pag2.items).toHaveLength(1);
    expect(pag2.items[0].obra.titulo).toBe('Obra 3');
  });

  it('lista tags únicos ordenados alfabéticamente', async () => {
    await svc.crear({ titulo: 'A', tipo: 'manga', tags: ['fantasia', 'accion'] });
    await svc.crear({ titulo: 'B', tipo: 'manga', tags: ['aventura', 'accion'] });

    const tags = await svc.listarTags();
    expect(tags).toEqual(['accion', 'aventura', 'fantasia']);
  });
});
