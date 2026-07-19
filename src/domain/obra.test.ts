import { describe, expect, it } from 'vitest';
import { coincideBusqueda, crearObra, editarObra } from './obra';
import { DomainError } from './types';

describe('crearObra', () => {
  it('exige título y tipo (RF-001)', () => {
    expect(() => crearObra({ titulo: '  ', tipo: 'manga' }, 'id')).toThrow(DomainError);
    // @ts-expect-error tipo inválido
    expect(() => crearObra({ titulo: 'X', tipo: 'comic' }, 'id')).toThrow(DomainError);
  });

  it('aplica prioridad media por defecto (RF-005)', () => {
    expect(crearObra({ titulo: 'X', tipo: 'manga' }, 'id').prioridad).toBe('media');
  });

  it('deduplica tags sin distinguir mayúsculas (RF-003)', () => {
    const o = crearObra({ titulo: 'X', tipo: 'manga', tags: ['Acción', 'acción', ' acción '] }, 'id');
    expect(o.tags).toEqual(['Acción']);
  });
});

describe('editarObra', () => {
  it('conserva creada_en y refresca actualizada_en', () => {
    const t0 = new Date('2020-01-01T00:00:00Z');
    const o = crearObra({ titulo: 'X', tipo: 'manga' }, 'id', t0);
    const t1 = new Date('2021-06-06T00:00:00Z');
    const e = editarObra(o, { estado: 'leyendo' }, t1);
    expect(e.creadaEn).toBe(o.creadaEn);
    expect(e.actualizadaEn).toBe(t1.toISOString());
    expect(e.estado).toBe('leyendo');
  });
});

describe('coincideBusqueda (RF-013)', () => {
  const o = crearObra({ titulo: 'Solo Leveling', tipo: 'manhua', nombresAlternativos: ['나 혼자만 레벨업'] }, 'id');
  it('encuentra por título, insensible a mayúsculas', () => {
    expect(coincideBusqueda(o, 'solo')).toBe(true);
  });
  it('encuentra por alias', () => {
    expect(coincideBusqueda(o, '레벨업')).toBe(true);
  });
  it('no coincide con término ajeno', () => {
    expect(coincideBusqueda(o, 'naruto')).toBe(false);
  });
});
