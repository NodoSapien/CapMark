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

  async push(): Promise<void> {
    if (!this.disponible()) return;
    // TODO(Fase 3): subir outbox de cambios locales; LWW por `actualizadaEn`.
  }

  async pull(): Promise<void> {
    if (!this.disponible()) return;
    // TODO(Fase 3): traer cambios remotos vía Realtime/REST y fusionar por LWW.
  }
}
