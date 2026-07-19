import { beforeEach, describe, expect, it } from 'vitest';
import { FuenteService } from './fuente-service';
import { fakeIdGen, fakeVerifier, MemoryRepositorio } from '@test/support';

const OBRA = 'obra-1';

describe('FuenteService', () => {
  let repo: MemoryRepositorio;
  let svc: FuenteService;
  beforeEach(() => {
    repo = new MemoryRepositorio();
    svc = new FuenteService(repo, fakeIdGen(), fakeVerifier('caida'));
  });

  it('la primera fuente queda principal por defecto (RF-009)', async () => {
    const fs = await svc.agregar(OBRA, { nombreEnSitio: 'A', url: 'https://a.com' });
    expect(fs[0].esPrincipal).toBe(true);
  });

  it('marcar principal deja exactamente una (RF-009)', async () => {
    await svc.agregar(OBRA, { nombreEnSitio: 'A', url: 'https://a.com' });
    const fs = await svc.agregar(OBRA, { nombreEnSitio: 'B', url: 'https://b.com' });
    const marcadas = await svc.marcarPrincipal(OBRA, fs[1].id);
    expect(marcadas.filter((f) => f.esPrincipal)).toHaveLength(1);
    expect(marcadas.find((f) => f.esPrincipal)?.nombreEnSitio).toBe('B');
  });

  it('eliminar la principal deja la obra sin principal (RF-010)', async () => {
    const fs = await svc.agregar(OBRA, { nombreEnSitio: 'A', url: 'https://a.com' });
    const rest = await svc.eliminar(OBRA, fs[0].id);
    expect(rest).toHaveLength(0);
  });

  it('verificar registra estado y fecha (RF-017)', async () => {
    const fs = await svc.agregar(OBRA, { nombreEnSitio: 'A', url: 'https://a.com' });
    const [f] = await svc.verificar(OBRA, fs[0].id);
    expect(f.estadoVerificacion).toBe('caida');
    expect(f.verificadaEn).toBeDefined();
  });
});
