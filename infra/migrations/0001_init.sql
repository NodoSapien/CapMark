-- CapMark — esquema inicial (Fase 1 del plan).
-- Se aplica SOLO en el primer arranque de Postgres (docker-entrypoint-initdb.d).
-- Modelo: Obra 1–N Fuente, Obra 1–N Progreso. RLS por usuario desde el día uno (RNF-006).

-- Roles mínimos que esperan PostgREST/GoTrue en este compose enfocado.
do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select from pg_roles where rolname = 'authenticator') then
    create role authenticator login password 'postgres' noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'supabase_auth_admin') then
    create role supabase_auth_admin login password 'postgres' createrole;
  end if;
end $$;
grant anon, authenticated to authenticator;

-- ---------------------------------------------------------------------------
create type tipo_obra as enum ('manga', 'manhua', 'novela');
create type estado_obra as enum ('pendiente', 'leyendo', 'pausado', 'abandonado', 'completado');
create type prioridad as enum ('alta', 'media', 'baja');
create type estado_fuente as enum ('activa', 'caida', 'sin_verificar');

create table obra (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid(),
  titulo         text not null check (length(trim(titulo)) > 0),   -- RF-001
  tipo           tipo_obra not null,
  nombres_alt    text[] not null default '{}',                      -- RF-002
  tags           text[] not null default '{}',                      -- RF-003
  estado         estado_obra not null default 'pendiente',          -- RF-004
  prioridad      prioridad not null default 'media',                -- RF-005
  notas          text,                                              -- RF-007
  creada_en      timestamptz not null default now(),
  actualizada_en timestamptz not null default now()                 -- LWW (S5)
);

create table fuente (
  id            uuid primary key default gen_random_uuid(),
  obra_id       uuid not null references obra(id) on delete cascade, -- RF-006 cascada
  user_id       uuid not null default auth.uid(),
  nombre_sitio  text not null,                                       -- RF-008
  url           text not null check (url ~* '^https?://'),           -- RF-008
  es_principal  boolean not null default false,                      -- RF-009
  estado_verif  estado_fuente not null default 'sin_verificar',      -- RF-017
  verificada_en timestamptz
);
-- RF-009: como máximo una fuente principal por obra.
create unique index fuente_una_principal on fuente(obra_id) where es_principal;

create table progreso (
  id            uuid primary key default gen_random_uuid(),
  obra_id       uuid not null references obra(id) on delete cascade, -- RF-006 cascada
  user_id       uuid not null default auth.uid(),
  capitulo      numeric not null check (capitulo >= 0),              -- RF-011 (admite 10.5)
  punto         text,
  registrado_en timestamptz not null default now()                  -- RF-012
);

-- Índices para RNF-001 (catálogo < 300 ms) y RNF-010 (volumen).
create index obra_user_idx on obra(user_id);
create index obra_estado_idx on obra(user_id, estado);
create index obra_prioridad_idx on obra(user_id, prioridad);
create index fuente_obra_idx on fuente(obra_id);
create index progreso_obra_idx on progreso(obra_id, registrado_en desc);

-- ---------------------------------------------------------------------------
-- RLS: cada usuario solo ve y edita sus propios datos (RNF-006).
alter table obra enable row level security;
alter table fuente enable row level security;
alter table progreso enable row level security;

create policy obra_propia on obra
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy fuente_propia on fuente
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy progreso_propio on progreso
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;

-- Trigger para mantener actualizada_en (base de la resolución LWW).
create or replace function touch_actualizada_en() returns trigger as $$
begin new.actualizada_en = now(); return new; end;
$$ language plpgsql;
create trigger obra_touch before update on obra
  for each row execute function touch_actualizada_en();
