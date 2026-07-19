import { describe, expect, it } from 'vitest';
import { BackupService } from './backup-service';
import { CatalogoService } from './catalogo-service';
import { FuenteService } from './fuente-service';
import { ProgresoService } from './progreso-service';
import { fakeIdGen, fakeReloj, fakeVerifier, MemoryRepositorio } from '@test/support';

describe('BackupService (modo absolutamente local)', () => {
  it('exporta e importa un round-trip completo en un repo limpio', async () => {
    const src = new MemoryRepositorio();
    const cat = new CatalogoService(src, fakeIdGen(), fakeReloj());
    const fue = new FuenteService(src, fakeIdGen(), fakeVerifier());
    const pro = new ProgresoService(src, fakeIdGen(), fakeReloj());

    const o = await cat.crear({ titulo: 'Berserk', tipo: 'manga', tags: ['seinen'] });
    await fue.agregar(o.id, { nombreEnSitio: 'A', url: 'https://a.com' });
    await pro.registrar(o.id, { capitulo: 364 });

    const backup = await new BackupService(src).exportar();
    expect(backup.obras).toHaveLength(1);

    // Restaura en un repo vacío distinto.
    const dst = new MemoryRepositorio();
    const res = await new BackupService(dst).importar(backup);
    expect(res.obras).toBe(1);
    expect(await dst.obtenerObra(o.id)).toMatchObject({ titulo: 'Berserk' });
    expect(await dst.listarFuentes(o.id)).toHaveLength(1);
    expect((await dst.listarProgreso(o.id))[0].capitulo).toBe(364);
  });

  it('rechaza archivos que no son backups de CapMark', async () => {
    const svc = new BackupService(new MemoryRepositorio());
    // @ts-expect-error forma inválida a propósito
    await expect(svc.importar({ foo: 'bar' })).rejects.toThrow();
  });

  it('reimportar no duplica fuentes ni progreso', async () => {
    const repo = new MemoryRepositorio();
    const cat = new CatalogoService(repo, fakeIdGen(), fakeReloj());
    const fue = new FuenteService(repo, fakeIdGen(), fakeVerifier());
    const pro = new ProgresoService(repo, fakeIdGen(), fakeReloj());
    const o = await cat.crear({ titulo: 'X', tipo: 'manga' });
    await fue.agregar(o.id, { nombreEnSitio: 'A', url: 'https://a.com' });
    await pro.registrar(o.id, { capitulo: 1 });

    const backup = await new BackupService(repo).exportar();
    const svc = new BackupService(repo);
    await svc.importar(backup);
    await svc.importar(backup);
    expect(await repo.listarFuentes(o.id)).toHaveLength(1);
    expect(await repo.listarProgreso(o.id)).toHaveLength(1);
  });
});
