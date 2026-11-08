import { beforeEach, describe, expect, it } from 'vitest';
import { CapturaService } from './captura-service';
import { CatalogoService } from './catalogo-service';
import { FuenteService } from './fuente-service';
import { ProgresoService } from './progreso-service';
import { CapturaExterna } from './captura-externa';
import { fakeIdGen, fakeReloj, fakeVerifier, MemoryRepositorio } from '@test/support';

const captura: CapturaExterna = {
  id: 'c1',
  titulo: 'x',
  url: 'https://site.test/obra/1',
  texto: '',
  capturadaEn: '2024-01-01T00:00:00Z',
};

describe('CapturaService', () => {
  let repo: MemoryRepositorio;
  let catalogo: CatalogoService;
  let svc: CapturaService;
  let progreso: ProgresoService;
  beforeEach(() => {
    repo = new MemoryRepositorio();
    const id = fakeIdGen();
    const reloj = fakeReloj();
    catalogo = new CatalogoService(repo, id, reloj);
    progreso = new ProgresoService(repo, id, reloj);
    svc = new CapturaService(catalogo, new FuenteService(repo, id, fakeVerifier()), progreso);
  });

  it('crea obra, fuente y progreso cuando no existe', async () => {
    const r = await svc.confirmar(captura, { titulo: 'Solo Leveling', capitulo: 12 });
    expect(r).toMatchObject({ obraNueva: true, fuenteAgregada: true, progresoRegistrado: true });
    expect((await repo.listarFuentes(r.obraId))[0].url).toBe(captura.url);
    expect((await progreso.actual(r.obraId))?.capitulo).toBe(12);
  });

  it('reutiliza la obra existente y no duplica la fuente', async () => {
    const o = await catalogo.crear({ titulo: 'Naruto', tipo: 'manga' });
    await svc.confirmar(captura, { titulo: 'naruto', capitulo: 1 });
    const r = await svc.confirmar(captura, { titulo: 'NARUTO', capitulo: 2 });
    expect(r).toMatchObject({ obraId: o.id, obraNueva: false, fuenteAgregada: false });
    expect(await repo.listarObras()).toHaveLength(1);
    expect(await repo.listarFuentes(o.id)).toHaveLength(1);
  });

  it('sin capítulo solo registra obra y fuente', async () => {
    const r = await svc.confirmar(captura, { titulo: 'Berserk' });
    expect(r.progresoRegistrado).toBe(false);
  });
});
