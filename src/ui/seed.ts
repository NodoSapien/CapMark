import { container } from '@infrastructure/container';

/** Datos de ejemplo para probar la app sin backend (útil en la primera ejecución). */
export async function sembrarDemo(): Promise<void> {
  const solo = await container.catalogo.crear({
    titulo: 'Solo Leveling',
    tipo: 'manwha',
    nombresAlternativos: ['나 혼자만 레벨업', 'Only I Level Up'],
    tags: ['acción', 'fantasía'],
    estado: 'leyendo',
    prioridad: 'alta',
    url: 'https://asuracomic.net/series/solo-leveling',
  });
  await container.fuentes.agregar(solo.id, { nombreEnSitio: 'Asura Scans', url: 'https://asuracomic.net/', esPrincipal: true });
  await container.fuentes.agregar(solo.id, { nombreEnSitio: 'MangaDex', url: 'https://mangadex.org/' });
  await container.progreso.registrar(solo.id, { capitulo: 178 });
  await container.progreso.registrar(solo.id, { capitulo: 179.5, punto: 'primera mitad' });

  const omni = await container.catalogo.crear({
    titulo: 'Omniscient Reader',
    tipo: 'manwha',
    nombresAlternativos: ['전지적 독자 시점', 'ORV'],
    tags: ['aventura', 'apocalipsis'],
    estado: 'pausado',
    prioridad: 'media',
    url: 'https://www.webtoons.com/en/action/omniscient-reader',
  });
  await container.fuentes.agregar(omni.id, { nombreEnSitio: 'Webtoon', url: 'https://www.webtoons.com/', esPrincipal: true });
  await container.progreso.registrar(omni.id, { capitulo: 92 });

  const mushoku = await container.catalogo.crear({
    titulo: 'Mushoku Tensei',
    tipo: 'novela',
    tags: ['isekai'],
    estado: 'pendiente',
    prioridad: 'baja',
    url: 'https://novelbin.com/b/mushoku-tensei',
  });
  await container.fuentes.agregar(mushoku.id, { nombreEnSitio: 'NovelBin', url: 'https://novelbin.com/' });
}
