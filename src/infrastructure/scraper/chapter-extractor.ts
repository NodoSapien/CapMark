import { PropuestaCapitulo } from '@application/ports';

/**
 * Extractor de capítulo PURO (sin red): dado un HTML, intenta encontrar el número de
 * capítulo más alto mencionado. Se mantiene simple y testeable a propósito; es la pieza
 * frágil ante cambios de los sitios, por eso el resultado se PROPONE, no se guarda.
 */
const PATRONES: RegExp[] = [
  /cap[íi]tulo\s*#?\s*(\d+(?:\.\d+)?)/gi,
  /\bcap\.?\s*(\d+(?:\.\d+)?)/gi,
  /\bchapter\s*#?\s*(\d+(?:\.\d+)?)/gi,
  /\bch\.?\s*(\d+(?:\.\d+)?)/gi,
];

export function extraerCapitulo(html: string, fuenteUrl: string): PropuestaCapitulo | undefined {
  const encontrados: { valor: number; etiqueta: string; patron: number }[] = [];
  PATRONES.forEach((re, patronIdx) => {
    for (const m of html.matchAll(re)) {
      const valor = Number.parseFloat(m[1]);
      if (Number.isFinite(valor)) encontrados.push({ valor, etiqueta: m[0].trim(), patron: patronIdx });
    }
  });
  if (encontrados.length === 0) return undefined;

  // Tomamos el capítulo más alto (normalmente el último publicado / visible).
  encontrados.sort((a, b) => b.valor - a.valor);
  const mejor = encontrados[0];

  // Confianza: patrón explícito "capítulo/chapter" > abreviaturas; más coincidencias = más confianza.
  const distintos = new Set(encontrados.map((e) => e.valor)).size;
  const confianza: PropuestaCapitulo['confianza'] =
    mejor.patron <= 1 && distintos > 2 ? 'alta' : distintos > 1 ? 'media' : 'baja';

  return { capitulo: mejor.valor, etiqueta: mejor.etiqueta, confianza, fuenteUrl };
}
