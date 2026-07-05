# Features — Gestor de Lecturas

Cada feature agrupa uno o más RF. Trazabilidad bidireccional: ningún RF huérfano,
ninguna feature vacía.

## F-01 — Gestión de obras
Alta, edición y clasificación del catálogo de lecturas.
- **RFs:** RF-001, RF-002, RF-003, RF-004, RF-005, RF-006, RF-007
- **En MVP:** Sí

## F-02 — Gestión de fuentes por obra
Varias fuentes por obra, cada una con su nombre-en-el-sitio, URL y marca de principal.
- **RFs:** RF-008, RF-009, RF-010
- **En MVP:** Sí

## F-03 — Progreso e historial
Registro del punto actual y su historial fechado.
- **RFs:** RF-011, RF-012
- **En MVP:** Sí

## F-04 — Búsqueda y filtrado
Encontrar obras por título/alias y acotar el catálogo por tag, estado y prioridad.
- **RFs:** RF-013, RF-014
- **En MVP:** Sí

## F-05 — Sincronización multi-dispositivo
Cuenta, autenticación y replicación de datos entre dispositivos, con soporte offline.
- **RFs:** RF-015, RF-016
- **En MVP:** Sí

## F-06 — Verificación de fuentes (semi)
Comprobar a petición si un link responde y señalar las fuentes caídas.
- **RFs:** RF-017
- **En MVP:** Sí

---

## Corte del MVP

Las seis features (F-01 a F-06) forman el MVP. Dentro de ellas, los RF con prioridad
`Should`/`Could` (RF-005, RF-007, RF-009, RF-014, RF-017) pueden posponerse sin romper el
flujo principal si hiciera falta acotar.

**Fuera del MVP:** el bot de Telegram para actualizar el progreso se difiere a **fase 2**;
no genera RFs en esta versión y por eso no figura como feature (para no dejar una feature
vacía).

## Verificación de trazabilidad

| Feature | RFs | ¿Vacía? |
|---------|-----|---------|
| F-01 | RF-001…RF-007 | No |
| F-02 | RF-008, RF-009, RF-010 | No |
| F-03 | RF-011, RF-012 | No |
| F-04 | RF-013, RF-014 | No |
| F-05 | RF-015, RF-016 | No |
| F-06 | RF-017 | No |

Cobertura: RF-001 … RF-017 asignados a exactamente una feature. Sin RF huérfanos.
