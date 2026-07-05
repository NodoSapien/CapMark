# Requisitos No Funcionales — Gestor de Lecturas

Cada RNF incluye una métrica verificable. Los números marcados como *(supuesto)* son
propuestas razonables a ajustar (S6).

## Rendimiento

### RNF-001 — Respuesta del catálogo
La lista de obras y la aplicación de filtros (RF-014) responden en **< 300 ms** con hasta
**1 000 obras** en un dispositivo móvil de gama media. *(supuesto)*

### RNF-002 — Esfuerzo de actualización
Actualizar el capítulo actual de una obra (RF-011) requiere **≤ 3 toques** desde la vista
de la obra.

## Portabilidad / Plataforma

### RNF-003 — Multiplataforma
La app funciona en **Android e iOS** desde una **única base de código**, con la web como
objetivo opcional secundario.

## Disponibilidad y Sincronización

### RNF-004 — Operación offline
La app permite **consultar y editar** datos sin conexión y **sincronizar** los cambios al
recuperarla, resolviendo conflictos por "última escritura gana" (S5).

### RNF-005 — Latencia de sincronización
Un cambio hecho en un dispositivo se refleja en los demás dispositivos del usuario en
**< 10 s** con conexión normal. *(supuesto)*

## Seguridad

### RNF-006 — Acceso y transporte
El acceso a los datos requiere autenticación (RF-015) y todo dato en tránsito viaja
cifrado sobre **HTTPS/TLS**.

## Integridad de datos

### RNF-007 — No pérdida de progreso
Ante un cierre inesperado, no se pierde el historial de progreso: toda actualización
confirmada persiste **localmente antes** de sincronizarse.

## Verificación de fuentes

### RNF-008 — Verificación no bloqueante
La verificación de una fuente (RF-017) completa o expira en **≤ 5 s por fuente** y se
ejecuta sin bloquear la interfaz. *(supuesto)*

## Mantenibilidad

### RNF-009 — Separación por capas
El código se organiza en capas (dominio / aplicación / infraestructura / UI) de modo que
el backend de sincronización pueda sustituirse **sin reescribir la lógica de negocio**.
*(recomendación de diseño; supuesto)*

## Escalabilidad de datos personales

### RNF-010 — Volumen soportado
El diseño soporta al menos **2 000 obras** y **20 000 entradas de progreso** sin
degradación perceptible en las operaciones de RNF-001. *(supuesto)*
