#!/usr/bin/env bash
# CapMark — Smoke test de base de datos para CI y entorno local.
# Verifica que Postgres levante y que las migraciones iniciales y RLS se hayan aplicado.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT/infra/docker-compose.yml"
ENV_FILE="${ROOT}/.env"

# Si no existe .env, usa .env.example para el entorno de test
if [[ ! -f "$ENV_FILE" ]]; then
  ENV_FILE="$ROOT/.env.example"
fi

echo "▶ Esperando a que el contenedor de PostgreSQL esté listo..."
MAX_ATTEMPTS=45
ATTEMPT=0
READY=false

while [[ $ATTEMPT -lt $MAX_ATTEMPTS ]]; do
  if docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T db pg_isready -U postgres >/dev/null 2>&1; then
    READY=true
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  sleep 1
done

if [[ "$READY" != "true" ]]; then
  echo "✗ Error: PostgreSQL no respondió dentro de los $MAX_ATTEMPTS segundos."
  exit 1
fi

echo "✓ PostgreSQL aceptando conexiones. Ejecutando verificaciones de integridad de esquema..."

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T db psql -v ON_ERROR_STOP=1 -U postgres -d postgres <<'SQL'
DO $$
DECLARE
  v_count INT;
BEGIN
  -- 1. Verificar tablas requeridas
  SELECT count(*) INTO v_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name IN ('obra', 'fuente', 'progreso');

  IF v_count <> 3 THEN
    RAISE EXCEPTION 'Faltan tablas requeridas en el esquema public. Encontradas: % de 3', v_count;
  END IF;

  -- 2. Verificar tipos ENUM
  SELECT count(*) INTO v_count
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public' AND t.typname IN ('tipo_obra', 'estado_obra', 'prioridad', 'estado_fuente');

  IF v_count <> 4 THEN
    RAISE EXCEPTION 'Faltan tipos ENUM requeridos. Encontrados: % de 4', v_count;
  END IF;

  -- 3. Verificar esquema auth y funciones de compatibilidad
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    RAISE EXCEPTION 'El esquema auth no existe.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    RAISE EXCEPTION 'La función auth.uid() no existe.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'auth' AND p.proname = 'role'
  ) THEN
    RAISE EXCEPTION 'La función auth.role() no existe.';
  END IF;

  -- 4. Verificar que RLS esté activado en las tablas
  SELECT count(*) INTO v_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('obra', 'fuente', 'progreso')
    AND rowsecurity = true;

  IF v_count <> 3 THEN
    RAISE EXCEPTION 'RLS no está habilitado en todas las tablas requeridas. Habilitadas: % de 3', v_count;
  END IF;

  RAISE NOTICE '✓ Todas las validaciones de esquema, enums, funciones auth y RLS pasaron exitosamente.';
END $$;
SQL

echo "✓ Smoke test de base de datos completado con éxito."
