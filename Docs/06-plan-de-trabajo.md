# Plan de Trabajo — Gestor de Lecturas (CapMark)

> Deriva de los documentos `00`–`05`. Cada fase declara su alcance, entregables y la
> trazabilidad a los RF (`02`) y RNF (`03`). El orden respeta las dependencias técnicas:
> primero la infraestructura auto-instanciable y el dominio, luego offline, sync y UI.

---

## 0. Principio rector: infraestructura auto-instanciable

Requisito explícito del proyecto: **no montar Supabase (ni backend alguno) a mano**. Toda la
infraestructura debe poder levantarse **con un comando**, versionada como código, de modo que
cualquier persona (o cualquier dispositivo/entorno) instancie su propio backend sin pasos
manuales en paneles web.

Esto se traduce en reglas que atraviesan **todas** las fases:

- **Backend self-hosted por Docker Compose.** Nada de crear proyectos a mano en un panel.
  `docker compose up` levanta Postgres + Auth + Realtime + Edge Functions.
- **Todo como código.** Esquema, migraciones, políticas RLS, funciones Edge, roles y datos
  semilla viven en el repo y se aplican solos al arrancar.
- **Configuración por `.env`.** Un `.env.example` documenta cada variable; `scripts/bootstrap.sh`
  genera secretos, aplica migraciones y deja el entorno listo (idempotente).
- **Cero acoplamiento a un proveedor.** La lógica de negocio no conoce a Supabase (RNF-009);
  el backend se sustituye cambiando solo la capa de infraestructura.

### Decisión de infraestructura (a confirmar)

| Opción | Encaje con "auto-instanciable" | Trade-off |
|--------|-------------------------------|-----------|
| **A · Supabase self-hosted (Docker Compose)** — *recomendada* | Mantiene el stack de `05` (Postgres, Auth, Realtime, Edge Functions) pero **sin panel manual**: todo por `compose` + migraciones CLI. | Varios contenedores; consume más recursos en el host. |
| **B · PocketBase (binario único)** | Máxima facilidad de "que se instancie solo": un ejecutable con SQLite, Auth, Realtime y admin embebidos. | Se aparta del stack documentado; menos potente en SQL relacional avanzado. |

Este plan asume **Opción A**. Si priorizas la fricción mínima de instanciación sobre mantener
Postgres, se adapta a **Opción B** sin cambiar las fases 1–8 (solo la capa de infraestructura).

---

## 1. Arquitectura de referencia (RNF-009)

Separación en capas para que el backend de sync sea sustituible sin tocar la lógica de negocio:

```
apps/
  mobile/            # Ionic + Capacitor + TS (React) — UI
packages/
  domain/            # Entidades, tipos, reglas (Obra, Fuente, Progreso) — sin deps de infra
  application/       # Casos de uso / servicios (orquestan dominio + puertos)
  infrastructure/    # Adaptadores: SQLite local, cliente Supabase, cola de sync
infra/
  docker-compose.yml # Backend completo self-hosted
  migrations/        # SQL versionado (esquema + RLS)
  functions/         # Edge Functions (verificación de links)
scripts/
  bootstrap.sh       # Un comando: levanta y configura todo
```

- **domain** no importa nada de `infrastructure` (dependencias hacia adentro).
- Los casos de uso hablan con **puertos** (interfaces); los repositorios concretos viven en infra.

---

## 2. Fases

### Fase 0 — Andamiaje + infraestructura auto-instanciable
**Objetivo:** que `git clone` + `./scripts/bootstrap.sh` deje app y backend corriendo.

- Monorepo con la estructura por capas (§1) y toolchain Ionic + Capacitor + TS (React).
- `infra/docker-compose.yml`: Postgres + Auth + Realtime + Edge Functions self-hosted.
- `infra/migrations/` gestionadas por CLI; se aplican al arrancar (idempotente).
- `.env.example` + `scripts/bootstrap.sh` (genera secretos, aplica migraciones, verifica salud).
- CI mínimo: lint + typecheck + build; arranque del compose en el pipeline como smoke test.
- **Entregable:** un comando levanta todo; README de "instanciar tu propio backend".
- **Cubre:** RNF-003 (base de código única), RNF-009 (capas). Habilita todo lo demás.

### Fase 1 — Modelo de datos y dominio (núcleo F-01…F-03)
- Esquema Postgres: `obra`, `nombre_alternativo`, `tag`, `obra_tag`, `fuente`, `progreso`.
- Relaciones: Obra 1–N Fuente, Obra 1–N Progreso; unicidad de tag por obra.
- **RLS por usuario** desde el día uno (aísla datos por cuenta; base de RNF-006).
- Capa `domain`: entidades y tipos (estados, prioridad, tipo de obra) con sus invariantes.
- **Entregable:** migraciones aplicables + tipos de dominio con pruebas de invariantes.
- **Cubre:** RF-001…RF-005, RF-008 (modelo), RF-011/RF-012 (modelo de progreso e historial).

### Fase 2 — Persistencia local + offline (F-05 parcial)
- SQLite vía Capacitor (Dexie/IndexedDB en web) tras interfaces de repositorio.
- **Outbox / cola de cambios** para operar sin conexión; confirmación **local antes** de sync.
- Estrategia de conflictos "última escritura gana" (S5) modelada en los registros.
- **Entregable:** CRUD local funcional sin red; los cambios quedan encolados.
- **Cubre:** RNF-004 (offline), RNF-007 (no pérdida de progreso).

### Fase 3 — Autenticación y sincronización (F-05)
- Supabase Auth self-hosted; sesión persistente entre aperturas (RF-015).
- Motor de sync: sube el outbox al reconectar, recibe cambios por Realtime, resuelve por LWW.
- **Entregable:** dos dispositivos/usuarios sincronizando altas, cambios y borrados.
- **Cubre:** RF-015, RF-016; RNF-005 (< 10 s), RNF-006 (HTTPS/TLS en transporte).

### Fase 4 — UI de obras y fuentes (F-01, F-02)
- Catálogo (lista) + alta/edición de obra: título, tipo, alias, tags, estado, prioridad, notas.
- Gestión de fuentes: agregar/editar/eliminar, marcar **principal** (máx. una), abrir en navegador.
- Interacción optimizada: actualizar capítulo en **≤ 3 toques** desde la obra.
- **Entregable:** flujo completo de gestión del catálogo en móvil.
- **Cubre:** RF-001…RF-010; RNF-002 (≤ 3 toques).

### Fase 5 — Progreso e historial (F-03)
- Registrar punto actual (capítulo con decimales, p. ej. `10.5`; página/punto opcional).
- Mostrar el último punto **sin abrir submenús**; historial fechado y cronológico.
- "Última lectura" derivada de la última entrada del historial.
- **Entregable:** vista de progreso con historial y edición rápida.
- **Cubre:** RF-011, RF-012.

### Fase 6 — Búsqueda y filtrado (F-04)
- Búsqueda por título o alias, **insensible a mayúsculas**.
- Filtros combinables por tag, estado y prioridad, con **contador** de coincidencias.
- Índices/estrategia para rendimiento con catálogo grande.
- **Entregable:** buscador + filtros combinados.
- **Cubre:** RF-013, RF-014; RNF-001 (< 300 ms con 1 000 obras).

### Fase 7 — Verificación de fuentes (F-06)
- **Edge Function** `HEAD`/`GET` con timeout ≤ 5 s (evita CORS, corre en servidor).
- Registrar estado por fuente (`activa` / `caída` / `sin verificar`) con fecha; señal visual.
- Ejecución **no bloqueante** de la UI.
- **Entregable:** botón "verificar" por fuente + indicador de caídas.
- **Cubre:** RF-017; RNF-008 (≤ 5 s, no bloqueante).

### Fase 8 — Endurecimiento y release
- Pruebas de volumen: **2 000 obras / 20 000 entradas** sin degradar RNF-001 (RNF-010).
- Builds Android e iOS (Capacitor); web como objetivo secundario opcional (RNF-003).
- HTTPS/TLS de extremo a extremo; revisión de RLS y secretos.
- Documentación de despliegue self-host y guía de "instancia tu backend".
- **Entregable:** app empaquetada + guía de despliegue reproducible.
- **Cubre:** RNF-001, RNF-003, RNF-006, RNF-010.

---

## 3. Trazabilidad fase → requisitos

| Fase | Features | RF | RNF |
|------|----------|----|-----|
| 0 | — (base) | — | RNF-003, RNF-009 |
| 1 | F-01…F-03 | RF-001…005, 008, 011, 012 (modelo) | RNF-006 (RLS) |
| 2 | F-05 | — | RNF-004, RNF-007 |
| 3 | F-05 | RF-015, RF-016 | RNF-005, RNF-006 |
| 4 | F-01, F-02 | RF-001…RF-010 | RNF-002 |
| 5 | F-03 | RF-011, RF-012 | RNF-007 |
| 6 | F-04 | RF-013, RF-014 | RNF-001 |
| 7 | F-06 | RF-017 | RNF-008 |
| 8 | — (release) | — | RNF-001, RNF-003, RNF-006, RNF-010 |

Cobertura: RF-001…RF-017 y RNF-001…RNF-010 asignados. Sin requisitos huérfanos.

---

## 4. Corte de MVP y priorización

- **Ruta crítica:** Fases 0 → 1 → 2 → 3 → 4 → 5. Con ellas hay un tracker sincronizado usable.
- **Diferibles sin romper el flujo** (RF `Should`/`Could`): RF-005, RF-007, RF-009, RF-014, RF-017
  → Fases 6 y 7 pueden acotarse si hace falta recortar.
- **Fase 2 (Telegram, grammY):** fuera de este plan; reutiliza la misma API/backend (`01` §3).

---

## 5. Definition of Done (por fase)

1. Requisitos de la fase cumplidos y trazados a su RF/RNF.
2. Pruebas automatizadas del dominio/casos de uso relevantes en verde.
3. `./scripts/bootstrap.sh` sigue levantando todo desde cero (no se rompió la auto-instancia).
4. Lint + typecheck + build en CI en verde.
5. Cambios documentados en el README de despliegue cuando toquen infraestructura.

---

## 6. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Supabase self-hosted pesa en el host | Fricción de instanciación | Documentar requisitos mínimos; tener lista la Opción B (PocketBase) como plan de fuga. |
| Conflictos de sync más allá de LWW | Pérdida de ediciones | LWW es suficiente para un usuario (S5); registrar timestamps por campo si se detectan choques. |
| Rendimiento con catálogo grande | Incumplir RNF-001/010 | Índices desde Fase 1; prueba de volumen en Fase 8 antes del release. |
| Verificación de links bloqueada por CORS | RF-017 inviable en cliente | Se hace en Edge Function del lado servidor desde el diseño (Fase 7). |
