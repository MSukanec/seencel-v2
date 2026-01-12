---
description: Audit and Roadmap for User Presence & Analytics System
---

# Auditoría de Sistema de Presencia y Analytics

> **Objetivo**: Observabilidad total (Quién, Dónde, Cuánto Tiempo, Historial).

## 1. Análisis del Estado Actual

Basado en `user_presence_functions.md`, el sistema actual utiliza un enfoque basado en **Base de Datos (Postgres)** para todo.

### Componentes Actuales:
1.  **`heartbeat`**: Ping periódico (30s). `UPDATE user_presence SET last_seen_at = now()`.
2.  **`presence_set_view`**: `UPDATE user_presence SET current_view`.
3.  **`analytics_enter_view`**: `INSERT INTO user_view_history`.
4.  **`analytics_exit_view`** (Implícito): `UPDATE user_view_history SET exited_at`.

### ✅ Puntos Fuertes:
- **Persistencia Real:** Al usar DB en lugar de memoria/sockets, tienes un historial auditable real ("¿Qué hizo Juan ayer?").
- **Consultas SQL:** Puedes sacar métricas de "Tiempo en Pantalla" con SQL directo.
- **Simplicidad:** No requiere infraestructura extra (Redis, Sockets complejos).

### ⚠️ Puntos Débiles / Riesgos:
1.  **Conflicto de Pestañas (The "Tab Problem"):**
    - Si el usuario abre 2 pestañas, la lógica `WHERE exited_at IS NULL` causará conflictos. Cerrará la sesión de la Pestaña A cuando navegues en la Pestaña B.
    - **Resultado:** Datasucia en `duration_seconds` y parpadeo en `current_view`.
2.  **Verbosidad (Chatty API):**
    - Al cambiar de ruta, el frontend dispara `exit` + `enter` + `set_view`. Son 3 llamadas a la DB.
    - **Resultado:** Latencia y carga innecesaria en la DB.
3.  **Sesiones "Colgadas":**
    - Si el usuario cierra el navegador de golpe (sin `beforeunload`), el registro en `user_view_history` queda abierto (`exited_at = NULL`) para siempre (o hasta que entre de nuevo).
    - **Resultado:** Métricas de tiempo de sesión infladas o erróneas.

---

## 2. Recomendación "Enterprise" (Arquitectura Propuesta)

Para llegar al 100%, propongo un sistema **Atomico** y **Aware de Pestañas**.

### Cambios en Tablas:
1.  **`user_presence`**: Agregar `session_id` (o `tab_id`).
2.  **`user_view_history`**: Agregar `tab_id` uuid. Esto permite separar historias si el usuario es multitarea.

### Cambios en Funciones (Consolidación):

En lugar de 3 funciones, usaremos **2 Principales**:

#### A. `analytics_track_navigation(p_view, p_tab_id, p_prev_view)`
*Esta función hace todo en una sola transacción DB:*
1.  **Cierra** el registro anterior para ese `p_tab_id` (si existe).
2.  **Inserta** el nuevo registro en `user_view_history`.
3.  **Actualiza** `user_presence` con la nueva vista y el timestamp.

#### B. `heartbeat(p_tab_id)`
1.  Actualiza `user_presence`.
2.  (Opcional Avanzado) Actualiza el `duration` del registro activo en `user_view_history` incrementalmente (para no perder data si crashea).

---

## 3. Plan de Acción (Workflow)

1.  **Consolidar Tablas:**
    - Modificar `user_view_history` para incluir `tab_id` (UUID generado por el cliente al abrir la app).
    - Asegurar índices correctos.
2.  **Reescribir Funciones:**
    - Crear la "Super Función" `analytics_track_navigation`.
    - Optimizar `heartbeat`.
3.  **Frontend (Hook Unificado - `useAnalytics`):**
    - Generar `tabId` (useRef/sessionStorage).
    - Al cambiar `pathname`: Llamar a `track_navigation`.
    - Intervalo 30s: Llamar a `heartbeat`.
    - `useBeacons` para intentos de cierre de página (best effort).

---

## 4. Veredicto Final

**¿Están bien tus tablas actuales?**
Sí, para un MVP robusto están bien.
**¿Se puede mejorar?**
Sí, el problema de las pestañas múltiples te va a ensuciar los datos si no lo manejamos con un ID de sesión/pestaña.

**¿Seguimos con el plan de optimización?**

---

## 5. Estándares de Base de Datos para Auditoría (CRÍTICO)

Para evitar inconsistencias futuras con Triggers y RLS, se establecen las siguientes **Reglas de Oro**:

### Regla #1: Denormalización de `organization_id`
**TODAS** las tablas que pertenezcan a una organización (incluso tablas "hijas" como `kanban_lists` o `kanban_cards`) **DEBEN** tener una columna `organization_id` (con FK a `organizations` y `NOT NULL`).
- **Por qué:** Los triggers de auditoría (ej: `handle_updated_by`) y las políticas RLS necesitan verificar la organización **SIN joins complejos**.
- **Acción:** Al crear tablas hijas, siempre copiar el `organization_id` del padre.

### Regla #2: Integridad Estricta de Auditoría
Los campos `created_by` y `updated_by` deben ser **Foreign Keys a `organization_members(id)`**, NO a `auth.users(id)`.
- **Por qué:** El sistema de auditoría debe rastrear qué *miembro* hizo la acción (para roles, permisos, etc.), no solo qué usuario técnico.
- **Triggers:** Se debe usar la función estándar `handle_updated_by()` que resuelve automáticamente `auth.uid() -> member_id` usando el `organization_id` de la tabla (ver Regla #1).

### Regla #3: Triggers Estándar
Cada tabla auditable debe tener:
1. `BEFORE INSERT/UPDATE`: Trigger llamando a `handle_updated_by()`.
2. `AFTER INSERT/UPDATE/DELETE`: Trigger llamando a la función de log correspondiente (ej: `log_kanban_child_activity`).

> Ver `audit-logging-guidelines.md` para templates de código.

