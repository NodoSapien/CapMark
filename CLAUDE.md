# CapMark — guía para trabajar en este repo

Tracker local-first de manga/manhua/novelas (Ionic React + Capacitor + TypeScript).
Backend de sincronización **opcional y auto-instanciable** (Supabase self-hosted por Docker).

## Comandos

- `npm run dev` — app (Vite, http://localhost:5173)
- `npm test` — Vitest (`src/**/*.test.ts`)
- `npm run typecheck` — `tsc --noEmit`
- `npm run build` — typecheck + build
- `npm run bootstrap` — levanta el backend con secretos + migraciones (no manual)
- `make check` — lo que corre CI (typecheck + test + build)

## Arquitectura por capas (respetar RNF-009)

Dependencias **solo hacia adentro**. No romper esta dirección:

```
ui  →  application  →  domain
          ↑
    infrastructure  (implementa los puertos de application; se inyecta en el container)
```

- `src/domain` — entidades, tipos, reglas puras. **No importa nada** de otras capas.
- `src/application` — casos de uso (`*-service.ts`) y **puertos** (`ports.ts`, interfaces).
  No conoce Ionic, Dexie ni Supabase.
- `src/infrastructure` — adaptadores concretos (Dexie, verificador HTTP, scraper, sync) y el
  composition root `container.ts` (único sitio que instancia adaptadores).
- `src/ui` — Ionic React. Habla con `container`, nunca con adaptadores directamente.

Aliases de import: `@domain`, `@application`, `@infrastructure`, `@ui`, `@test`.

## Convenciones

- Nombres de dominio en español (Obra, Fuente, Progreso), consistente con `Docs/`.
- Cada regla enlaza su requisito en comentarios (p. ej. `// RF-009`). Ver `Docs/02` y `Docs/03`.
- Lógica nueva con reglas → va en `domain` con su test; orquestación → `application`.
- Persistencia: implementar el puerto `Repositorio`; hoy Dexie (web), SQLite en nativo.
- El **scraper es opt-in y semi-asistido** (decisión de producto, S2): PROPONE, nunca guarda solo.

## Backend

`infra/docker-compose.yml` + `infra/migrations/*.sql` (se aplican al primer arranque) +
`infra/functions/*` (Edge Functions). Secretos en `.env` (generado por `bootstrap.sh`).
La app funciona sin backend; `container.sync.disponible()` decide si hay sincronización.

## Plan

Roadmap por fases en `Docs/06-plan-de-trabajo.md`. Sync completo (outbox + Realtime) = Fase 3.
