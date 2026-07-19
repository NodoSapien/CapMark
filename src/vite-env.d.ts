/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend auto-instanciable (opcional). Sin estas variables, la app es 100% local. */
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Edge Function de verificación de links (RF-017). */
  readonly VITE_VERIFY_URL?: string;
  /** Proxy/Edge Function para el scraper opt-in (evita CORS). */
  readonly VITE_SCRAPER_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
