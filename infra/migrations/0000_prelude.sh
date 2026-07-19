#!/bin/bash
# CapMark — prelude de inicialización. Corre ANTES de 0001_init.sql (orden alfabético en
# /docker-entrypoint-initdb.d). Crea lo que la migración de esquema da por hecho pero que
# en este compose "enfocado" nadie provee:
#   · el esquema `auth` y los helpers auth.uid()/auth.role() que usan las políticas RLS,
#   · los roles que esperan PostgREST/GoTrue/Realtime, CON la contraseña real ($POSTGRES_PASSWORD).
#
# Necesario porque montamos ./migrations sobre /docker-entrypoint-initdb.d, lo que oculta
# los scripts internos de la imagen supabase/postgres que normalmente harían esto. Es un
# .sh (no .sql) porque necesita interpolar el secreto $POSTGRES_PASSWORD del entorno.
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<EOSQL
-- Roles con la MISMA contraseña con la que se conectan los servicios (evita el bucle de
-- "password authentication failed"). Idempotente: crea o reajusta la contraseña.
do \$do\$ begin
  if not exists (select from pg_roles where rolname='anon') then
    create role anon nologin noinherit; end if;
  if not exists (select from pg_roles where rolname='authenticated') then
    create role authenticated nologin noinherit; end if;
  if not exists (select from pg_roles where rolname='service_role') then
    create role service_role nologin noinherit bypassrls; end if;

  if not exists (select from pg_roles where rolname='authenticator') then
    create role authenticator login noinherit password '${POSTGRES_PASSWORD}';
  else
    alter role authenticator login noinherit password '${POSTGRES_PASSWORD}'; end if;

  if not exists (select from pg_roles where rolname='supabase_auth_admin') then
    create role supabase_auth_admin login createrole password '${POSTGRES_PASSWORD}';
  else
    alter role supabase_auth_admin login createrole password '${POSTGRES_PASSWORD}'; end if;

  if not exists (select from pg_roles where rolname='supabase_admin') then
    create role supabase_admin login createrole createdb replication bypassrls password '${POSTGRES_PASSWORD}';
  else
    alter role supabase_admin login password '${POSTGRES_PASSWORD}'; end if;
end \$do\$;

grant anon, authenticated, service_role to authenticator;

-- GoTrue corre sus migraciones como supabase_auth_admin y crea sus tablas en el esquema
-- auth. Sin este search_path intenta crear 'schema_migrations' en public (sin permiso) y
-- falla. Con auth primero, sus objetos van al esquema correcto.
alter role supabase_auth_admin set search_path = auth, public;

-- Esquema auth (lo poblará GoTrue) + helpers que consumen las políticas RLS de 0001_init.sql.
create schema if not exists auth authorization supabase_auth_admin;
grant usage on schema auth to anon, authenticated, service_role;

-- auth.uid()/auth.role() deben existir YA (0001_init.sql las usa en initdb, antes de que
-- GoTrue arranque). Se ceden a supabase_auth_admin para que la migración de GoTrue pueda
-- hacerles CREATE OR REPLACE sin el error "must be owner of function". OJO: GoTrue las
-- sobrescribe con una versión que lee 'request.jwt.claim.sub' (PostgREST < v11); por eso
-- bootstrap.sh las vuelve a fijar a la versión JSON de abajo TRAS el arranque de GoTrue.
create or replace function auth.uid() returns uuid language sql stable as \$fn\$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  )::uuid
\$fn\$;

create or replace function auth.role() returns text language sql stable as \$fn\$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  )
\$fn\$;

alter function auth.uid() owner to supabase_auth_admin;
alter function auth.role() owner to supabase_auth_admin;
EOSQL

echo "✓ prelude: esquema auth + auth.uid()/auth.role() + roles listos"
