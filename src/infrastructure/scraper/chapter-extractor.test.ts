import { describe, expect, it } from 'vitest';
import { extraerCapitulo } from './chapter-extractor';

describe('extraerCapitulo (scraper opt-in)', () => {
  it('toma el capítulo más alto mencionado', () => {
    const html = '<a>Capítulo 10</a><a>Capítulo 42</a><a>Cap. 41</a>';
    const p = extraerCapitulo(html, 'https://x.com');
    expect(p?.capitulo).toBe(42);
  });

  it('soporta capítulos con decimales', () => {
    const p = extraerCapitulo('Chapter 179.5 disponible', 'https://x.com');
    expect(p?.capitulo).toBe(179.5);
  });

  it('devuelve undefined si no hay nada que detectar', () => {
    expect(extraerCapitulo('<p>sin números de capítulo</p>', 'https://x.com')).toBeUndefined();
  });
});
