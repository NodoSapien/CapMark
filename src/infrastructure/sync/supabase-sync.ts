import { SyncPort } from '@application/ports';

/**
 * Adaptador de sincronización opcional contra el backend auto-instanciable (Supabase
 * self-hosted). La app es local-first: si no hay backend configurado, `disponible()` es
 * false y todo sigue funcionando en local. Estrategia de conflictos: última escritura gana.
 *
 * Stub deliberado: el motor de sync completo (outbox + Realtime) es la Fase 3 del plan.
 */
export class SupabaseSync implements SyncPort {
  private url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  private key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  disponible(): boolean {
    return Boolean(this.url && this.key);
  }

  /**
   * Sondea si el backend responde, con timeout corto. Usa `no-cors` para que un servidor
   * vivo cuente como alcanzable aunque no mande cabeceras CORS (solo nos importa "responde
   * o no"). A prueba de fallos: cualquier error de red o timeout devuelve `false`; nunca
   * lanza, así la app nunca se rompe por estar sin conexión (RNF-004).
   */
  async probarConexion(): Promise<boolean> {
    if (!this.disponible()) return false;
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 3000);
    try {
      await fetch(this.url as string, { mode: 'no-cors', signal: ctrl.signal });
      return true;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  async push(): Promise<void> {
    if (!this.disponible()) return;
    // TODO(Fase 3): subir outbox de cambios locales; LWW por `actualizadaEn`.
  }

  async pull(): Promise<void> {
    if (!this.disponible()) return;
    // TODO(Fase 3): traer cambios remotos vía Realtime/REST y fusionar por LWW.
  }
}
