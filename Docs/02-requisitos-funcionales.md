# Requisitos Funcionales — Gestor de Lecturas

Convención: `El sistema debe [acción verificable]`. Actor por defecto: **Lector**.
Prioridad MoSCoW. Cada RF pertenece a exactamente una feature (ver `04-features.md`).

---

### RF-001 — Registrar obra
- **Enunciado:** El sistema debe permitir registrar una obra con su título principal y su tipo (manga, manhua o novela).
- **Actor:** Lector · **Prioridad:** Must · **Feature:** F-01
- **Criterios de aceptación:**
  1. No se puede guardar una obra sin título principal ni sin tipo.
  2. El tipo solo admite uno de los tres valores permitidos.

### RF-002 — Nombres alternativos
- **Enunciado:** El sistema debe permitir asociar a una obra una lista de nombres alternativos (0..N).
- **Actor:** Lector · **Prioridad:** Must · **Feature:** F-01
- **Criterios de aceptación:**
  1. Se pueden agregar y quitar nombres alternativos sin límite fijo.
  2. Los nombres alternativos quedan disponibles para la búsqueda (RF-013).

### RF-003 — Tags múltiples
- **Enunciado:** El sistema debe permitir asignar a una obra múltiples tags de texto libre.
- **Actor:** Lector · **Prioridad:** Must · **Feature:** F-01
- **Criterios de aceptación:**
  1. Una obra puede tener cero o muchos tags.
  2. Un mismo tag no se duplica dentro de la misma obra.

### RF-004 — Estado de la obra
- **Enunciado:** El sistema debe permitir asignar a cada obra un estado entre: pendiente, leyendo, pausado, abandonado, completado.
- **Actor:** Lector · **Prioridad:** Must · **Feature:** F-01
- **Criterios de aceptación:**
  1. Toda obra tiene exactamente un estado en todo momento (por defecto `pendiente` o `leyendo`).
  2. El estado es editable en cualquier momento.

### RF-005 — Prioridad
- **Enunciado:** El sistema debe permitir asignar a cada obra una prioridad de lectura (alta, media, baja).
- **Actor:** Lector · **Prioridad:** Should · **Feature:** F-01
- **Criterios de aceptación:**
  1. La prioridad es opcional; si no se asigna, se considera `media`.
  2. La prioridad puede usarse como filtro (RF-014).

### RF-006 — Editar y eliminar obra
- **Enunciado:** El sistema debe permitir editar y eliminar una obra existente.
- **Actor:** Lector · **Prioridad:** Must · **Feature:** F-01
- **Criterios de aceptación:**
  1. Al eliminar una obra se eliminan también sus fuentes y su historial de progreso.
  2. La eliminación pide confirmación.

### RF-007 — Notas por obra
- **Enunciado:** El sistema debe permitir registrar notas de texto libre asociadas a una obra.
- **Actor:** Lector · **Prioridad:** Could · **Feature:** F-01
- **Criterios de aceptación:**
  1. Las notas son opcionales y editables.

### RF-008 — Agregar fuentes a una obra
- **Enunciado:** El sistema debe permitir agregar a una obra múltiples fuentes, cada una con el nombre con que aparece en ese sitio y su URL.
- **Actor:** Lector · **Prioridad:** Must · **Feature:** F-02
- **Criterios de aceptación:**
  1. Una obra puede tener cero o muchas fuentes.
  2. Cada fuente exige al menos una URL válida.
  3. El nombre-en-el-sitio se guarda por fuente, independiente del título principal.

### RF-009 — Marcar fuente principal
- **Enunciado:** El sistema debe permitir marcar una de las fuentes de la obra como fuente principal/activa.
- **Actor:** Lector · **Prioridad:** Should · **Feature:** F-02
- **Criterios de aceptación:**
  1. Como máximo una fuente por obra es la principal.
  2. La fuente principal es la que se ofrece por defecto para abrir.

### RF-010 — Editar y eliminar fuentes
- **Enunciado:** El sistema debe permitir editar y eliminar fuentes de una obra.
- **Actor:** Lector · **Prioridad:** Must · **Feature:** F-02
- **Criterios de aceptación:**
  1. Eliminar la fuente principal deja la obra sin fuente principal hasta que se marque otra.

### RF-011 — Registrar y mostrar el punto actual
- **Enunciado:** El sistema debe permitir registrar el capítulo (y opcionalmente página o punto) donde el usuario quedó, y mostrarlo de forma visible en la obra.
- **Actor:** Lector · **Prioridad:** Must · **Feature:** F-03
- **Criterios de aceptación:**
  1. Cada obra muestra su último capítulo/punto registrado sin abrir submenús.
  2. El capítulo admite valores no enteros (p. ej. `10.5`).

### RF-012 — Historial de progreso
- **Enunciado:** El sistema debe conservar un historial de progreso con marca de fecha por cada actualización del capítulo/punto.
- **Actor:** Lector · **Prioridad:** Must · **Feature:** F-03
- **Criterios de aceptación:**
  1. Cada actualización crea una entrada con fecha/hora.
  2. El historial es consultable en orden cronológico.
  3. La fecha de la última entrada sirve como "última lectura" de la obra.

### RF-013 — Buscar por título o alias
- **Enunciado:** El sistema debe permitir buscar obras por su título principal o por cualquiera de sus nombres alternativos.
- **Actor:** Lector · **Prioridad:** Must · **Feature:** F-04
- **Criterios de aceptación:**
  1. La búsqueda encuentra la obra aunque el término coincida solo con un nombre alternativo.
  2. La búsqueda es insensible a mayúsculas/minúsculas.

### RF-014 — Filtrar por tag, estado y prioridad
- **Enunciado:** El sistema debe permitir filtrar el catálogo por tag, por estado y por prioridad.
- **Actor:** Lector · **Prioridad:** Should · **Feature:** F-04
- **Criterios de aceptación:**
  1. Los filtros pueden combinarse.
  2. El resultado indica cuántas obras coinciden.

### RF-015 — Autenticación de usuario
- **Enunciado:** El sistema debe permitir al usuario autenticarse para acceder a sus datos desde varios dispositivos.
- **Actor:** Lector · **Prioridad:** Must · **Feature:** F-05
- **Criterios de aceptación:**
  1. Sin sesión válida no se accede a los datos sincronizados.
  2. La sesión persiste entre aperturas de la app hasta cerrar sesión.

### RF-016 — Sincronizar entre dispositivos
- **Enunciado:** El sistema debe sincronizar altas, cambios y borrados de obras, fuentes y progreso entre los dispositivos del usuario.
- **Actor:** Lector / Servicio de sincronización · **Prioridad:** Must · **Feature:** F-05
- **Criterios de aceptación:**
  1. Un cambio hecho offline se propaga al reconectar.
  2. Ante conflicto, se aplica "última escritura gana" (S5).

### RF-017 — Verificar y señalar fuentes
- **Enunciado:** El sistema debe permitir verificar, a petición del usuario, si la URL de una fuente responde; registrar el resultado (activa / caída / sin verificar) con fecha; y señalar visualmente las fuentes caídas.
- **Actor:** Lector · **Prioridad:** Should · **Feature:** F-06
- **Criterios de aceptación:**
  1. Tras verificar, la fuente muestra su estado y la fecha de la comprobación.
  2. Las fuentes caídas se distinguen visualmente de las activas.
  3. La verificación no bloquea el resto de la interfaz (ver RNF-008).
