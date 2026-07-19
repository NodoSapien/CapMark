# CapMark — Gestor de Lecturas

Tracker personal y multiplataforma de **manga, manhua y novelas**. No pierdas el punto de
lectura aunque los sitios cambien de nombre o se caigan: cada obra guarda **varias fuentes**,
su **capítulo actual con historial**, su **estado** y su **prioridad**.

> Es un *tracker*, no un lector: la fuente se abre en el navegador externo. Diseño
> **local-first** — funciona sin conexión y sin backend; la sincronización es opcional.

## Características

- **Catálogo** de obras: título, tipo, nombres alternativos, tags, estado y prioridad.
- **Fuentes por obra** con nombre-en-el-sitio, URL y marca de fuente principal.
- **Progreso e historial** fechado; capítulos con decimales (p. ej. `179.5`).
- **Búsqueda** por título/alias y **filtros** combinables por tag, estado y prioridad.
- **Verificación de fuentes** (opt-in): comprueba si un link responde y señala las caídas.
- **Detección de capítulo** (opt-in, semi-asistida): lee una fuente y **propone** el capítulo;
  tú confirmas antes de guardar. Nunca actualiza solo.
- **Backend auto-instanciable**: un comando levanta tu propia sincronización, sin paneles.

## Arranque rápido (app, sin backend)

```bash
npm install
npm run dev        # http://localhost:5173
```

La app persiste en el navegador (IndexedDB). Pulsa **"Cargar datos de ejemplo"** para probarla.

## Backend auto-instanciable (opcional, para sincronizar)

No hay que configurar nada a mano. Un comando genera secretos, levanta Postgres + Auth +
Realtime + Edge Functions y **aplica las migraciones solo**:

```bash
./scripts/bootstrap.sh      # o: npm run bootstrap
```

Luego rellena en `.env` las claves que imprime el arranque y reinicia `npm run dev`.
Parar: `npm run backend:down`.

Requisitos: Docker (con Compose) y OpenSSL. Ver `infra/` y `.env.example`.

## Móvil (Capacitor)

```bash
npm run build
npx cap add android      # y/o: npx cap add ios
npx cap sync
npx cap open android
```

## Arquitectura (separación por capas — RNF-009)

```
src/
  domain/          Entidades, tipos e invariantes. Sin dependencias externas.
  application/     Casos de uso + puertos (interfaces). No conoce Ionic ni Supabase.
  infrastructure/  Adaptadores: Dexie/IndexedDB, verificador, scraper, sync, DI.
  ui/              Ionic React (páginas y componentes).
infra/             Backend self-hosted como código (compose, migraciones, functions).
```

El dominio no importa infraestructura: el backend de sync es sustituible sin tocar la lógica.

## Scripts

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | App en desarrollo (Vite) |
| `npm run build` | Typecheck + build de producción |
| `npm test` | Tests unitarios (Vitest) |
| `npm run bootstrap` | Auto-instancia el backend |
| `npm run backend:up` / `:down` / `:logs` | Controla el backend |

## Documentación

Los documentos fundacionales (visión, alcance, requisitos, features, stack y plan de
trabajo) están en [`Docs/`](./Docs).

## Estado

MVP en construcción. La sincronización (outbox + Realtime) es la Fase 3 del plan
(`Docs/06-plan-de-trabajo.md`); el adaptador está preparado como puerto.
