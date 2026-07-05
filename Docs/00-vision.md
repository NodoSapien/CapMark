# Visión — Gestor de Lecturas

> Documento fundacional. Título de trabajo: **Gestor de Lecturas** (ajustable).

## 1. Problema

Como lector habitual de manga, manhua y novelas, pierdes el punto donde ibas cuando
un sitio de lectura se cae, cambia de dominio o cuando saltas entre *mirrors*. Los
mismos títulos aparecen con nombres distintos según el sitio, lo que dificulta
reencontrarlos, y no tienes un registro claro de qué obras dejaste en pausa, cuáles
abandonaste y en qué capítulo quedaste en cada una.

## 2. Propuesta de valor

Un único lugar, sincronizado entre todos tus dispositivos, para no volver a perder el
punto de lectura de tus obras aunque los sitios cambien de nombre o se caigan. Cada
obra guarda **varias fuentes** (cada una con el nombre con que aparece en ese sitio y su
URL), su **capítulo/punto actual** con **historial**, su **estado** y su **prioridad**.

## 3. Objetivos

- **O1.** Centralizar el seguimiento de todas tus lecturas (manga, manhua, novelas) en un solo catálogo.
- **O2.** Sobrevivir a la caída o al cambio de sitios, guardando múltiples fuentes con su nombre por obra.
- **O3.** Recuperar al instante el punto de lectura desde cualquiera de tus dispositivos.

## 4. Actores

| Actor | Tipo | Descripción |
|-------|------|-------------|
| Lector | Primario (humano) | Único usuario. Registra obras, fuentes y progreso, y consulta su catálogo. |
| Servicio de sincronización | Secundario (sistema/nube) | Persiste y replica los datos entre los dispositivos del Lector. |
| Sitio de lectura externo | Externo | Página web fuente de cada obra; su URL se verifica pero no se controla. |

## 5. Criterios de éxito

- Al abrir cualquier obra, ves de inmediato el capítulo/punto donde quedaste, sin buscar en historiales externos.
- Ante un sitio caído, encuentras en segundos una fuente alternativa ya registrada para esa obra.
- Actualizas el progreso desde un dispositivo y lo ves reflejado en los demás.
- Puedes distinguir de un vistazo qué obras están en `leyendo`, `pausado`, `abandonado`, `completado` o `pendiente`.

## 6. Supuestos

Registrados explícitamente por faltar confirmación o por ser decisiones de diseño tentativas:

- **S1.** Un solo usuario (uso personal); no hay multiusuario ni listas compartidas.
- **S2.** El registro y la actualización son **manuales**; la única asistencia automática es **verificar si un link responde** (semi). No hay *scraping* ni rastreo automático de capítulos nuevos.
- **S3.** El progreso se mide por **capítulo**, con página o punto como dato opcional.
- **S4.** Se incluye un campo de **notas** por obra como opcional (prioridad baja); confírmalo o descártalo.
- **S5.** Estrategia de conflictos de sincronización: **última escritura gana** (razonable para un único usuario en varios dispositivos).
- **S6.** Los números de las métricas (tamaños, tiempos) de los RNF son propuestas razonables, a ajustar contigo.
