# Design Decisions: Proyectos

> Por qué se hizo así. Alternativas descartadas y edge cases.

---

## Decisiones de Diseño

### D1: Separación en 3 tablas (projects / project_data / project_settings)

- **Elegimos**: Separar la identidad del proyecto (nombre, estado, color) en `projects`, la info extendida (ubicación, superficies, descripción) en `project_data`, y la config visual (custom color, palette theme) en `project_settings`.
- **Alternativa descartada**: Una sola tabla `projects` con 30+ columnas.
- **Razón**: Cada grupo de campos tiene diferente frecuencia de consulta y diferentes permisos de actualización. La tabla `projects` es ultraliviana para queries de listado y sidebar. `project_data` solo se carga en vistas de detalle. `project_settings` son configuraciones internas que raramente se consultan en listas.

### D2: Tipos y Modalidades como tablas separadas (no enum)

- **Elegimos**: `project_types` y `project_modalities` como tablas con `organization_id` nullable (system defaults) y soft delete.
- **Alternativa descartada**: Enum PostgreSQL o columna text libre.
- **Razón**: Las organizaciones necesitan crear sus propios tipos ("Vivienda Modular", "Refacción Parcial"), y los system defaults deben ser compartidos. Un enum no permite esto sin migraciones. Una text libre impide filtrado consistente.

### D3: project_status como PostgreSQL enum

- **Elegimos**: Enum `project_status` con valores `active`, `planning`, `inactive`, `completed`.
- **Alternativa descartada**: Text libre o check constraint.
- **Razón**: El estado es parte central de la lógica de billing (conteo de activos), sidebar (excluir completed), y filtros. Enum garantiza integridad a nivel de base de datos y permite optimización de índices.

### D4: Límite de proyectos activos mediante función SQL (billing)

- **Elegimos**: Función `billing.check_active_project_limit()` que consulta el plan de la org y cuenta proyectos con status `active` o `planning`.
- **Alternativa descartada**: Validar en frontend o en el action sin función SQL.
- **Razón**: La validación debe ser server-side y consultable desde multiple entry points (crear proyecto, cambiar estado inline, swap). Una función SQL centraliza la lógica y puede ser usada en triggers futuros.

### D5: Swap modal para intercambio de estados

- **Elegimos**: Cuando se alcanza el límite, en vez de bloquear al usuario, se ofrece un modal para desactivar otro proyecto y así poder activar el nuevo.
- **Alternativa descartada**: Simplemente mostrar error y pedir que desactive manualmente.
- **Razón**: UX fluida — el usuario resuelve el conflicto en el mismo flujo sin necesidad de salir del formulario, navegar a otro proyecto, cambiarlo, y volver.

### D6: Color del proyecto: preset + custom + palette

- **Elegimos**: Sistema de 3 niveles: (1) color preset en `projects.color`, (2) color custom HSL en `project_settings`, (3) tema automático desde paleta de imagen.
- **Alternativa descartada**: Solo un color hex.
- **Razón**: Los presets cubren el 80% de usos. El custom color con hue permite generar variaciones (backgrounds, borders) sin guardar cada variante. La paleta automática es el toque premium para orgs que suben fotos.

### D7: `last_active_at` para ordenamiento del sidebar

- **Elegimos**: Columna `last_active_at` actualizada cada vez que el usuario entra a un proyecto. El sidebar ordena por este campo.
- **Alternativa descartada**: Ordenar por `updated_at` o por nombre.
- **Razón**: `updated_at` cambia con cualquier edición (incluso de otros miembros), no refleja relevancia personal. Nombre es fijo. `last_active_at` es per-user relevance pero se guarda a nivel de proyecto para simplicidad (no per-user ranking).

### D8: `React.cache` para getProjectById

- **Elegimos**: `getProjectById` wrapeado en `React.cache()` para deduplicar calls dentro del mismo request (page + generateMetadata).
- **Alternativa descartada**: Llamar dos veces o pasar como prop desde layout.
- **Razón**: El layout no debe hacer data fetching (regla de performance). Page y `generateMetadata` necesitan el proyecto, pero son invocaciones independientes en Next.js. `React.cache` resuelve elegantemente.

---

## Edge Cases y Gotchas

### E1: Proyectos over-limit al cambiar de plan

- **Escenario**: Org tiene 10 proyectos activos con plan Premium, baja a plan Starter (límite 3). Los 10 proyectos siguen activos.
- **Impacto**: Se marca `is_over_limit = true` en proyectos que superan el límite. No se desactivan automáticamente.
- **Solución futura**: Dashboard de billing que alerte y sugiera qué proyectos desactivar.

### E2: `last_active_at` no es per-user

- **Escenario**: Si María entra a "Torre Palermo" y luego Carlos entra a "Casa Nordelta", el sidebar de María mostrará "Casa Nordelta" primero aunque ella no la visitó.
- **Impacto**: Menor — en práctica los equipos trabajan en los mismos proyectos.
- **Solución futura**: Mover el tracking a `user_organization_preferences` per-user con un array de últimos proyectos.

### E3: project_data puede no existir

- **Escenario**: Si el proyecto se crea sin ubicación, `project_data` se inserta con campos vacíos. Pero si el insert falla (no-critical), no hay row.
- **Impacto**: Los updates hacen `upsert` con `onConflict: 'project_id'`, así que siempre se resuelve.
- **Solución futura**: Crear `project_data` siempre con trigger `AFTER INSERT ON projects`.

### E4: Colaboradores bloqueados (🔒 Próximamente)

- **Escenario**: La sección de Colaboradores en Participantes está visualmente bloqueada con `pointer-events-none`.
- **Impacto**: Los handlers existen y las tablas (`project_access`) están listas. Solo falta activar la UI.
- **Solución futura**: Remover el overlay lock y habilitar la sección cuando el flow de external-access esté completo.

---

## Relación con otros Flows

| Flow | Cómo se conecta |
|------|-----------------|
| **IAM** | `organization_members` → `created_by`, RLS via `can_view_org`/`can_mutate_org` |
| **External Access** | `project_access` → colaboradores con acceso a proyectos vía `can_view_project()` |
| **Finance** | `unified_financial_movements_view` filtra por `project_id` para dashboard financiero |
| **Billing** | `check_active_project_limit()` limita proyectos activos según plan |
| **Client Portal** | `client_portal_branding/settings` configuran qué ve el cliente |
| **Catalog** | Materiales, equipos, mano de obra se vinculan a proyectos vía `project_id` |
| **Planner** | Tareas y cronograma pertenecen a un proyecto |
| **General Costs** | Allocations distribuyen gastos generales a proyectos (🚧) |
