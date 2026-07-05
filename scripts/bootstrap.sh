#!/usr/bin/env bash
# CapMark — auto-instanciación del backend. Idempotente: puedes ejecutarlo varias veces.
# Uso:  ./scripts/bootstrap.sh
# Requisitos: docker (con compose) y openssl. La app web funciona SIN esto (local-first).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"

echo "▶ CapMark bootstrap"

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
  echo "  · .env ya existe; no se sobreescribe."
fi

# 2. Verifica docker.
if ! command -v docker >/dev/null 2>&1; then
  echo "✗ Docker no está instalado. La app web funciona igual con: npm install && npm run dev"
  exit 0
fi

# 3. Levanta el backend. Las migraciones se aplican solas al primer arranque.
echo "  · Levantando backend (Postgres + Auth + Realtime + Edge Functions)…"
docker compose --env-file "$ENV_FILE" -f "$ROOT/infra/docker-compose.yml" up -d

echo "✓ Listo. Backend en http://localhost:8000 · Postgres en localhost:5432"
echo "  App:  npm install && npm run dev   (http://localhost:5173)"
