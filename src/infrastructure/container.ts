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
  // Uso desde consola del navegador:
  // await capmark.importFromPostgres({ token: '...' }) o await capmark.importFromPostgres({ email: '...', password: '...' })
  async importFromPostgres(options?: {
    token?: string;
    email?: string;
    password?: string;
    authUrl?: string;
    restUrl?: string;
  }) {
    let token = options?.token;
    const authUrl = options?.authUrl || 'http://localhost:9999';
    const restUrl = options?.restUrl || 'http://localhost:3000';

    if (!token) {
      if (!options?.email || !options?.password) {
        throw new Error(
          'Se requiere token o credenciales ({ email, password }) para importar desde Postgres.',
        );
      }
      console.log(`Obteniendo token para ${options.email}...`);
      const loginRes = await fetch(`${authUrl}/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: options.email, password: options.password }),
      });
      if (!loginRes.ok) {
        throw new Error(`Fallo de autenticación: ${loginRes.status} ${loginRes.statusText}`);
      }
      const data = await loginRes.json();
      token = data.access_token;
    }

    console.log('Leyendo obras de Postgres...');
    const obrasRes = await fetch(`${restUrl}/obra`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!obrasRes.ok) {
      throw new Error(`Fallo al leer obras: ${obrasRes.status} ${obrasRes.statusText}`);
    }
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
