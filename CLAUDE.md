# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# CapMark — guía para trabajar en este repo

Tracker local-first de manga/manhua/novelas (Ionic React + Capacitor + TypeScript).
Backend de sincronización **opcional y auto-instanciable** (Supabase self-hosted por Docker).

## Comandos

- `pnpm run dev` — app (Vite, http://localhost:5173)
- `pnpm test` — Vitest (`src/**/*.test.ts`)
- `pnpm run typecheck` — `tsc --noEmit`
- `pnpm run build` — typecheck + build
- `pnpm run bootstrap` — levanta el backend con secretos + migraciones (no manual)
- `make check` — lo que corre CI (typecheck + test + build)
- Un solo test: `pnpm vitest run src/application/progreso-service.test.ts` (o `-t "nombre"`);
  `pnpm run test:watch` para modo watch
- `pnpm run test:smoke-db` — smoke test de Postgres + migraciones (requiere Docker)
- `pnpm run backend:up|backend:down|backend:logs` — controla el backend ya generado

Los tests corren en entorno `node` (sin DOM): solo `src/**/*.test.ts`, sin tests de UI.
Helpers compartidos de tests en `src/test/support.ts` (alias `@test`).

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

Los servicios reciben sus dependencias por constructor (repo, `idGen`, `reloj`, verifier), así
que en tests se inyectan fakes en vez de Dexie/HTTP. Un servicio nuevo se registra en
`src/infrastructure/container.ts`, que además expone `importFromPostgres` (consola del navegador,
`window.capmark`); su lógica vive en `src/infrastructure/dev/` para mantener el container solo como cableado.

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

## Skills y agentes (dev-ai-toolkit)

`tools/dev-ai-toolkit` es un submódulo (`git clone --recurse-submodules`). Los skills/agentes se enlazan
en `.claude/` (ignorado por git) con:
`./tools/dev-ai-toolkit/install.sh --project --stack react,supabase --with-base`

## Extensión de navegador

`extension/` (MV3, sin build) captura la pestaña activa y la encola; `src/infrastructure/extension/`
valida los mensajes y propone el capítulo reutilizando `extraerCapitulo`. El protocolo vive en
`src/application/captura-externa.ts`. Sigue la regla S2: propone, nunca guarda solo.
