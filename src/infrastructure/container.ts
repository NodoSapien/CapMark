// Composition root: única capa que conoce a los adaptadores concretos y los inyecta en
// los servicios de aplicación. Cambiar de backend = cambiar aquí, sin tocar dominio/UI.

import { BackupService } from '@application/backup-service';
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
  backup: new BackupService(repo),
  sync: new SupabaseSync(),

  // Helper para development: importa datos desde la BD Postgres vía REST.
  // Uso desde consola del navegador: await capmark.importFromPostgres()
  async importFromPostgres(token?: string) {
    if (!token) {
      console.log('Obteniendo token de bulk@capmark.local...');
      const loginRes = await fetch('http://localhost:9999/token?grant_type=password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'bulk@capmark.local', password: 'bulk-import-123456' }),
      });
      const { access_token } = await loginRes.json();
      token = access_token;
    }

    console.log('Leyendo obras de Postgres...');
    const obrasRes = await fetch('http://localhost:3000/obra', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const obras = await obrasRes.json();

    // Formato de backup requerido por BackupService
    const backup = {
      app: 'capmark' as const,
      version: 1 as const,
      exportadoEn: new Date().toISOString(),
      obras: obras.map((o: any) => ({
        obra: {
          id: o.id,
          titulo: o.titulo,
          tipo: o.tipo,
          nombres_alt: o.nombres_alt || [],
          tags: o.tags || [],
          estado: o.estado || 'pendiente',
          prioridad: o.prioridad || 'media',
          notas: o.notas,
          creada_en: o.creada_en,
          actualizada_en: o.actualizada_en,
        },
        fuentes: [],
        progreso: [],
      })),
    };

    console.log(`Importando ${backup.obras.length} obras en Dexie...`);
    await this.backup.importar(backup);
    console.log('✓ Listo. Recarga la página (F5) para verlas en el catálogo.');
  },
};

export type Container = typeof container;
