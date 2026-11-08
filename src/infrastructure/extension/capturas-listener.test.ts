import { describe, expect, it } from 'vitest';
import { validarCaptura } from '@application/captura-externa';
import { procesarMensaje } from './capturas-listener';

const ok = {
  id: 'c1',
  titulo: ' Solo Leveling ',
  url: 'https://example.com/obra/1',
  texto: 'Capítulo 12 ... Capítulo 11 ... Capítulo 10',
  capturadaEn: '2024-01-01T00:00:00Z',
};

describe('captura externa', () => {
  it('valida y normaliza una captura correcta', () => {
    expect(validarCaptura(ok)).toMatchObject({ titulo: 'Solo Leveling', url: 'https://example.com/obra/1' });
  });

  it('rechaza protocolos no http(s), ids vacíos y títulos vacíos', () => {
    expect(validarCaptura({ ...ok, url: 'javascript:alert(1)' })).toBeUndefined();
    expect(validarCaptura({ ...ok, id: '' })).toBeUndefined();
    expect(validarCaptura({ ...ok, titulo: '  ' })).toBeUndefined();
    expect(validarCaptura(null)).toBeUndefined();
  });

  it('procesa solo mensajes de la extensión y propone el capítulo', () => {
    const r = procesarMensaje({ source: 'capmark-ext', type: 'capturas', capturas: [ok, { bad: true }] });
    expect(r).toHaveLength(1);
    expect(r[0].capitulo?.capitulo).toBe(12);
  });

  it('ignora mensajes de otras fuentes', () => {
    expect(procesarMensaje({ source: 'other', type: 'capturas', capturas: [ok] })).toEqual([]);
    expect(procesarMensaje('x')).toEqual([]);
  });
});
