#!/usr/bin/env bash
# CapMark — auto-instanciación del backend. Idempotente: puedes ejecutarlo varias veces.
# Uso:  ./scripts/bootstrap.sh
# Requisitos: docker (con compose) y openssl. La app web funciona SIN esto (local-first).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"

echo "▶ CapMark bootstrap"

# 0. Verifica herramientas necesarias.
if ! command -v openssl >/dev/null 2>&1; then
  echo "✗ Error: openssl no está instalado. Se requiere para generar secretos criptográficos seguros."
  exit 1
fi

# 1. Genera .env con secretos si no existe (nada de configuración manual en paneles).
if [[ ! -f "$ENV_FILE" ]]; then
  echo "  · Generando .env con secretos aleatorios…"
  cp "$ROOT/.env.example" "$ENV_FILE"
  PG_PASS="$(openssl rand -hex 16)"
  JWT="$(openssl rand -hex 32)"
  # Reemplazos portables (BSD/GNU sed).
  sed -i.bak "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${PG_PASS}|" "$ENV_FILE"
  sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=${JWT}|" "$ENV_FILE"
  rm -f "$ENV_FILE.bak"
  echo "  · .env creado. Revisa VITE_SUPABASE_ANON_KEY si activas sync."
else
  echo "  · .env ya existe; validando robustez de secretos..."
  CURR_PASS="$(grep -E '^POSTGRES_PASSWORD=' "$ENV_FILE" | cut -d '=' -f2- || true)"
  CURR_JWT="$(grep -E '^JWT_SECRET=' "$ENV_FILE" | cut -d '=' -f2- || true)"

  if [[ -z "$CURR_PASS" || "$CURR_PASS" == "postgres" || "$CURR_PASS" == "change-me-please" ]]; then
    echo "✗ Error: POSTGRES_PASSWORD en .env está vacío o usa un valor por defecto inseguro."
    exit 1
  fi

  if [[ -z "$CURR_JWT" || ${#CURR_JWT} -lt 32 || "$CURR_JWT" == *"super-secret"* ]]; then
    echo "✗ Error: JWT_SECRET en .env debe tener al menos 32 caracteres y no usar valores de ejemplo."
    exit 1
  fi
  echo "  · Secretos validados."
fi

# 2. Verifica docker.
if ! command -v docker >/dev/null 2>&1; then
  echo "✗ Docker no está instalado. La app web funciona igual con: pnpm install && pnpm run dev"
  exit 0
fi

# 3. Levanta el backend (db + auth + rest). Las migraciones se aplican solas al primer
#    arranque. Realtime y Edge Functions quedan tras el perfil `full` (sync en vivo, Fase 3):
#    para activarlos:  docker compose --profile full up -d
echo "  · Levantando backend (Postgres + Auth + REST)…"
docker compose --env-file "$ENV_FILE" -f "$ROOT/infra/docker-compose.yml" up -d

# 4. Ajuste post-arranque: durante sus migraciones GoTrue sobrescribe auth.uid() con una
#    versión que lee 'request.jwt.claim.sub' (PostgREST < v11). Con PostgREST v12 eso devuelve
#    NULL y RLS bloquea todo. Esperamos a que la API de GoTrue esté arriba (⇒ migraciones
#    aplicadas) y volvemos a fijar la versión que lee 'request.jwt.claims' (JSON). Idempotente.
echo "  · Esperando a GoTrue para ajustar auth.uid()…"
for _ in $(seq 1 60); do
  curl -sf http://localhost:9999/health >/dev/null 2>&1 && break
  sleep 1
done
docker compose --env-file "$ENV_FILE" -f "$ROOT/infra/docker-compose.yml" exec -T db \
  psql -v ON_ERROR_STOP=1 -U postgres -d postgres <<'SQL' >/dev/null 2>&1 && echo "  · auth.uid() ajustado (compatible PostgREST v12)."
create or replace function auth.uid() returns uuid language sql stable as $fn$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  )::uuid
$fn$;
alter function auth.uid() owner to supabase_auth_admin;
SQL

echo "✓ Listo."
echo "  · REST (backup/restore): http://localhost:3000   · Auth: http://localhost:9999   · Postgres: localhost:5432"
echo "  · App:  pnpm install && pnpm run dev   (http://localhost:5173)"
