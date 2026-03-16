# Roadmap: Proyectos

> Checklist operativo. Qué está listo, qué falta.

---

## ✅ Completado

| Qué | Detalles |
|-----|----------|
| **CRUD completo de proyectos** | Crear, editar, soft delete. Panel form + inline editing en DataTable |
| **Clasificación tipo/modalidad** | System defaults + custom por org. CRUD en settings view |
| **Identidad visual** | Color preset + custom HSL + imagen con paleta. Preview en card |
| **DataTable con inline editing** | Status, tipo, modalidad, fecha editables inline. Context menu completo |
| **Grid de cards** | Toggle table/cards con ViewToggle. Cards premium con imagen y color |
| **Mapa de proyectos** | Vista ubicación con geocoding y marcadores interactivos |
| **Detalle: sidebar drill-down** | Perfil, Apariencia, Ubicación, Participantes como sub-rutas |
| **Detalle: Perfil** | Autosave de nombre, código, descripción, superficies |
| **Detalle: Apariencia** | Color picker, image upload, palette toggle, card preview |
| **Detalle: Ubicación** | Mapa individual, geocoding, formulario de dirección |
| **Detalle: Participantes** | Vincular/desvincular clientes, invitar al portal. Historial |
| **Límite de proyectos activos** | Billing check + swap modal para intercambiar estados |
| **Migration modals → panels** | ClientForm, InviteClientPortalForm, CollaboratorForm migrados a panels |
| **RLS completa** | 34 policies en 9 tablas con permisos `projects.*` y `commercial.*` |
| **Audit completo** | 19 triggers de auditoría en todas las tablas |
| **Sidebar projects** | Lista de proyectos activos en sidebar con orden por `last_active_at` |

---

## ⏳ Pendiente: Corto plazo

### P1: Habilitar sección Colaboradores en Participantes
- **Prioridad**: Alta
- **Descripción**: Remover el overlay `pointer-events-none opacity-50` y el badge "Próximamente" de la sección de Colaboradores en `project-participants-view.tsx`. Los handlers, actions y tablas ya existen.
- **Archivos a modificar**: `features/projects/views/details/project-participants-view.tsx`
- **Dependencia**: Completar flow `external-access` y validar UX de vinculación.

### P2: Dashboard del proyecto con widgets reales
- **Prioridad**: Media
- **Descripción**: `project-dashboard-view.tsx` existe pero los widgets probablemente necesiten data real de materiales, tareas, finanzas.
- **Archivos a modificar**: `features/projects/views/project-dashboard-view.tsx`
- **Dependencia**: Que los features de materiales, tareas y finanzas tengan queries por `project_id`.

### P3: Exportar listado de proyectos a Excel
- **Prioridad**: Baja
- **Descripción**: Agregar botón de export en la toolbar de proyectos. Exportar DataTable filtrada.
- **Archivos a modificar**: `features/projects/views/projects-list-view.tsx`

### P4: Portal del cliente — secciones visibles
- **Prioridad**: Media
- **Descripción**: `client_portal_settings` tiene toggles para dashboard, installments, payments, logs, quotes. Falta UI de configuración en el detalle del proyecto y las vistas del portal que respeten estos toggles.
- **Archivos a crear**: Vista de configuración del portal en detail views.

---

## 🔮 Pendiente: Largo plazo

### F1: Archivado de proyectos completados
Mover proyectos `completed` a una vista de archivo con data read-only y menor storage.

### F2: Templates de proyecto
Crear un proyecto a partir de una plantilla preconfigurada (tipo, modalidad, categorías de gasto, estructura de tareas).

### F3: Multi-proyecto comparativo
Vista comparativa de KPIs entre proyectos seleccionados.

### F4: Duplicar proyecto
Clonar un proyecto existente con toda su configuración (sin data operativa).

### F5: Permisos por proyecto
RLS granular para que ciertos miembros solo vean/editen proyectos específicos (no todos los de la org).

### F6: Timeline del proyecto
Vista cronológica de hitos y eventos del proyecto (creación, cambios de estado, pagos importantes).
