# Stack Sugerido — Gestor de Lecturas

> El stack es una **sugerencia argumentada**, no una decisión cerrada. La elección final
> es tuya. Se justifica contra los RNF y las restricciones del alcance.

## Restricciones que condicionan el stack

- Multiplataforma Android/iOS desde una base de código (RNF-003).
- Sincronización multi-dispositivo con cuenta y operación offline (F-05, RNF-004, RNF-005).
- Modelo relacional claro: Obra 1–N Fuente, Obra 1–N Progreso.
- Verificación de links del lado servidor para evitar CORS y no bloquear la UI (RF-017, RNF-008).
- Un solo desarrollador; conviene reutilizar herramientas ya conocidas.
- Camino futuro hacia un bot de Telegram (fase 2).

## Opción A (recomendada)

| Capa | Elección | Justificación |
|------|----------|---------------|
| App / UI | **Ionic + Capacitor** con TypeScript (React o Vue como framework) | Una sola base de código para Android, iOS y web (RNF-003); stack ya familiar → menor curva. |
| Persistencia local + offline | **SQLite** vía Capacitor (o Dexie/IndexedDB en web) | Datos y edición sin conexión, con confirmación local antes de sincronizar (RNF-004, RNF-007). |
| Backend, auth y sync | **Supabase** (Postgres + Auth + Realtime) | Auth lista (RF-015, RNF-006); Realtime para sync < 10 s (RNF-005); Postgres relacional encaja con Obra/Fuente/Progreso; ya lo manejas. |
| Verificación de links | **Edge Function** (serverless) que hace `HEAD`/`GET` con timeout ≤ 5 s | Chequeo del lado servidor: evita CORS y no bloquea la UI (RF-017, RNF-008). |
| Organización del código | Separación por capas dominio/aplicación/infraestructura/UI | Permite cambiar el backend de sync sin tocar la lógica de negocio (RNF-009). |
| Futuro: bot Telegram (fase 2) | **grammY** (Node + TypeScript) contra la misma API de Supabase | Reutiliza tu experiencia previa con bots; comparte la fuente de verdad de datos. |

## Opción B (alternativa)

| Capa | Elección | Trade-off frente a A |
|------|----------|----------------------|
| App / UI | **React Native (Expo)** | Rendimiento nativo (no WebView) y ecosistema móvil maduro, pero te aleja del stack habitual y del objetivo web. |
| Backend / sync | **Firebase (Firestore + Auth)** | Sync offline muy pulido, pero NoSQL: el modelo relacional Obra/Fuente/Progreso queda menos natural y hay más *lock-in*. |
| Sync avanzado (opcional) | **PowerSync / ElectricSQL** sobre Postgres | Sync local-first con Postgres si la calidad offline es crítica; más piezas que mantener para un proyecto personal. |

## Recomendación

Para un MVP personal con multi-dispositivo, offline y modelo relacional, **Opción A**
(Ionic + Capacitor + Supabase) ofrece el mejor equilibrio entre esfuerzo, portabilidad y
reutilización de lo que ya dominas, y deja el camino abierto al bot de Telegram en fase 2.
