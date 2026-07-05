# Alcance — Gestor de Lecturas

## 1. In-scope (MVP)

- **Catálogo de obras** con: título principal, tipo (manga / manhua / novela), nombres alternativos (0..N), tags múltiples, estado y prioridad.
- **Estados de obra**: `pendiente`, `leyendo`, `pausado`, `abandonado`, `completado`.
- **Prioridad** por obra (ganas de leer): `alta`, `media`, `baja`.
- **Fuentes por obra** (0..N): cada fuente con el nombre con que aparece en ese sitio, su URL, y una marca de fuente principal.
- **Progreso**: capítulo/punto actual + **historial de progreso** con fecha por cada actualización.
- **Búsqueda** por título o nombre alternativo, y **filtros** por tag, estado y prioridad.
- **Sincronización multi-dispositivo** con cuenta/autenticación y funcionamiento **offline**.
- **Verificación semi-asistida de fuentes**: a petición del usuario, comprobar si la URL responde y señalar las caídas.
- **Notas** de texto libre por obra (opcional).

## 2. Out-of-scope (no en esta versión)

| Fuera | Motivo |
|-------|--------|
| Rastreo/scraping automático de capítulos nuevos | Rechazado explícitamente; la app es semi-asistida, no automática. Complejidad alta y frágil ante cambios de los sitios. |
| Lector de contenido dentro de la app | Es un *tracker*: la fuente se abre en el navegador externo. Incluir un lector cambia por completo el producto. |
| Multiusuario, perfiles sociales o listas compartidas | Uso personal (S1). |
| Notificaciones push de nuevos capítulos | Depende de rastreo automático (fuera de alcance); se evalúa a futuro. |
| Bot de Telegram para actualizar el progreso | Diferido a **fase 2** por decisión del usuario. |

## 3. Ideas futuras

- **Bot de Telegram** que escriba contra la misma API para registrar/avanzar capítulos de forma rápida (fase 2; reutiliza experiencia previa con bots en grammY).
- Notificaciones de nuevos capítulos (requiere una fuente de verdad de capítulos publicados).
- Importar/exportar desde otros trackers (MyAnimeList, AniList).
- Recomendaciones basadas en tags e historial.
- Verificación programada de links (en vez de solo a petición).
