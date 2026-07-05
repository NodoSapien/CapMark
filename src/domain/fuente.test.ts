import { describe, expect, it } from 'vitest';
import { crearFuente, fuentePrincipal, marcarPrincipal } from './fuente';
import { DomainError } from './types';

describe('crearFuente (RF-008)', () => {
  it('rechaza URL no http(s)', () => {
    expect(() => crearFuente('o1', { nombreEnSitio: 'X', url: 'ftp://x' }, 'f1')).toThrow(DomainError);
  });
  it('usa el hostname como nombre si no se da uno', () => {
    const f = crearFuente('o1', { nombreEnSitio: '', url: 'https://mangadex.org/title/1' }, 'f1');
    expect(f.nombreEnSitio).toBe('mangadex.org');
  });
});

describe('marcarPrincipal (RF-009)', () => {
  it('deja exactamente una principal', () => {
    const fs = [
      crearFuente('o1', { nombreEnSitio: 'A', url: 'https://a.com' }, 'f1'),
      crearFuente('o1', { nombreEnSitio: 'B', url: 'https://b.com' }, 'f2'),
    ];
    const out = marcarPrincipal(fs, 'f2');
    expect(out.filter((f) => f.esPrincipal).map((f) => f.id)).toEqual(['f2']);
    expect(fuentePrincipal(out)?.id).toBe('f2');
  });
});
