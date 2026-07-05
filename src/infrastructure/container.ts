// Composition root: única capa que conoce a los adaptadores concretos y los inyecta en
// los servicios de aplicación. Cambiar de backend = cambiar aquí, sin tocar dominio/UI.

import { CatalogoService } from '@application/catalogo-service';
import { FuenteService } from '@application/fuente-service';
import { ProgresoService } from '@application/progreso-service';
import { ScraperService } from '@application/scraper-service';
import { db } from './persistence/db';
import { DexieRepositorio } from './persistence/dexie-repositorio';
import { GenericScraper } from './scraper/generic-scraper';
import { SupabaseSync } from './sync/supabase-sync';
import { idGen, reloj } from './system';
import { HttpLinkVerifier } from './verify/link-verifier';

const repo = new DexieRepositorio(db);
const verifier = new HttpLinkVerifier();

export const container = {
  catalogo: new CatalogoService(repo, idGen, reloj),
  fuentes: new FuenteService(repo, idGen, verifier),
  progreso: new ProgresoService(repo, idGen, reloj),
  scraper: new ScraperService([new GenericScraper()]),
  sync: new SupabaseSync(),
};

export type Container = typeof container;
