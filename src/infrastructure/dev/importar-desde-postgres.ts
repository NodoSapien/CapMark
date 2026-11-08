// Dev helper: reads obras from the local Postgres REST API and maps them to the Backup format.
// Kept out of the composition root so container.ts only wires adapters (RNF-009).

import type { Backup } from '@application/backup-service';
import type { Obra } from '@domain/obra';

export interface FilaObraPostgres {
  id: string;
  titulo: string;
  tipo: Obra['tipo'];
  nombres_alt?: string[] | null;
  tags?: string[] | null;
  estado?: Obra['estado'] | null;
  prioridad?: Obra['prioridad'] | null;
  notas?: string | null;
  creada_en: string;
  actualizada_en: string;
}

export interface OpcionesImportacion {
  token?: string;
  email?: string;
  password?: string;
  authUrl?: string;
  restUrl?: string;
  fetchFn?: typeof fetch;
}

/** Maps a snake_case Postgres row to the camelCase domain entity. */
export function filaAObra(fila: FilaObraPostgres): Obra {
  return {
    id: fila.id,
    titulo: fila.titulo,
    tipo: fila.tipo,
    nombresAlternativos: fila.nombres_alt ?? [],
    tags: fila.tags ?? [],
    estado: fila.estado ?? 'pendiente',
    prioridad: fila.prioridad ?? 'media',
    notas: fila.notas ?? undefined,
    creadaEn: fila.creada_en,
    actualizadaEn: fila.actualizada_en,
  };
}

export async function leerBackupDesdePostgres(opciones: OpcionesImportacion = {}): Promise<Backup> {
  const doFetch = opciones.fetchFn ?? fetch;
  const authUrl = opciones.authUrl ?? 'http://localhost:9999';
  const restUrl = opciones.restUrl ?? 'http://localhost:3000';
  let token = opciones.token;

  if (!token) {
    if (!opciones.email || !opciones.password) {
      throw new Error(
        'Se requiere token o credenciales ({ email, password }) para importar desde Postgres.',
      );
    }
    const login = await doFetch(`${authUrl}/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: opciones.email, password: opciones.password }),
    });
    if (!login.ok) throw new Error(`Fallo de autenticación: ${login.status} ${login.statusText}`);
    token = (await login.json()).access_token as string;
  }

  const res = await doFetch(`${restUrl}/obra`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Fallo al leer obras: ${res.status} ${res.statusText}`);
  const filas = (await res.json()) as FilaObraPostgres[];

  return {
    app: 'capmark',
    version: 1,
    exportadoEn: new Date().toISOString(),
    obras: filas.map((f) => ({ obra: filaAObra(f), fuentes: [], progreso: [] })),
  };
}
