import { describe, expect, it } from 'vitest';
import { filaAObra, leerBackupDesdePostgres } from './importar-desde-postgres';

const fila = {
  id: 'o1',
  titulo: 'Berserk',
  tipo: 'manga' as const,
  nombres_alt: ['ベルセルク'],
  tags: ['dark'],
  estado: 'leyendo' as const,
  prioridad: 'alta' as const,
  notas: null,
  creada_en: '2024-01-01T00:00:00Z',
  actualizada_en: '2024-02-01T00:00:00Z',
};

const json = (body: unknown, ok = true) =>
  ({ ok, status: ok ? 200 : 401, statusText: ok ? 'OK' : 'Unauthorized', json: async () => body }) as Response;

describe('importar desde Postgres', () => {
  it('mapea snake_case a la entidad Obra camelCase', () => {
    const obra = filaAObra(fila);
    expect(obra.nombresAlternativos).toEqual(['ベルセルク']);
    expect(obra.creadaEn).toBe('2024-01-01T00:00:00Z');
    expect(obra.actualizadaEn).toBe('2024-02-01T00:00:00Z');
    expect(obra.notas).toBeUndefined();
  });

  it('aplica valores por defecto cuando faltan columnas opcionales', () => {
    const obra = filaAObra({ ...fila, nombres_alt: null, tags: null, estado: null, prioridad: null });
    expect(obra).toMatchObject({ nombresAlternativos: [], tags: [], estado: 'pendiente', prioridad: 'media' });
  });

  it('rechaza sin token ni credenciales', async () => {
    await expect(leerBackupDesdePostgres({})).rejects.toThrow(/token o credenciales/);
  });

  it('arma un Backup v1 usando el token recibido', async () => {
    const llamadas: string[] = [];
    const fetchFn = (async (url: string, init?: RequestInit) => {
      llamadas.push(`${url}|${(init?.headers as Record<string, string>)?.Authorization}`);
      return json([fila]);
    }) as unknown as typeof fetch;
    const backup = await leerBackupDesdePostgres({ token: 't', fetchFn });
    expect(backup).toMatchObject({ app: 'capmark', version: 1 });
    expect(backup.obras).toHaveLength(1);
    expect(llamadas).toEqual(['http://localhost:3000/obra|Bearer t']);
  });

  it('propaga el error si la lectura falla', async () => {
    const fetchFn = (async () => json(null, false)) as unknown as typeof fetch;
    await expect(leerBackupDesdePostgres({ token: 't', fetchFn })).rejects.toThrow(/Fallo al leer obras: 401/);
  });
});
