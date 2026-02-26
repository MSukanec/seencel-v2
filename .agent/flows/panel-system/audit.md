# Auditoría de Modales — Feb 2026

## Features que usan `openModal()` (111+ llamadas)

### Heaviest users (por cantidad de llamadas)

| Feature | Archivo | Llamadas |
|---------|---------|----------|
| Tasks | `tasks-catalog-view.tsx` | 7 |
| Tasks | `tasks-detail-recipe-view.tsx` | 6 |
| Tasks | `tasks-divisions-view.tsx` | 5 |
| Tasks | `tasks-parameters-view.tsx` | 4 |
| Materials | `materials-catalog-view.tsx` | múltiples |
| Materials | `materials-requirements-view.tsx` | múltiples |
| Materials | `materials-payments-view.tsx` | múltiples |
| Finance | `finance-movements-view.tsx` | múltiples |
| Finance | `finance-general-costs-view.tsx` | múltiples |
| Subcontracts | `subcontracts-payments-view.tsx` | 3 |
| Subcontracts | `subcontracts-list-view.tsx` | 2 |
| Projects | `projects-settings-view.tsx` | 3+ |
| Projects | `projects-list-view.tsx` | múltiples |
| Team | `team-members-view.tsx` | 3 |
| Units | `units-catalog-view.tsx` | 2 |
| SiteLog | `sitelog-entries-view.tsx` | 2 |
| SiteLog | `sitelog-settings-view.tsx` | 2 |
| Planner | `planner-view.tsx` | múltiples |
| Planner | `kanban-board.tsx` | múltiples |
| Planner | `planner-calendar.tsx` | múltiples |
| Quotes | `quotes-list-view.tsx` | múltiples |
| Quotes | `quote-base-view.tsx` | múltiples |
| Quotes | `quote-change-orders-view.tsx` | múltiples |
| Files | `files-gallery-view.tsx` | múltiples |
| Capital | múltiples views | múltiples |
| Contact | múltiples views | múltiples |

### Modales específicos (archivos *-modal.tsx)

| Archivo | Feature | Uso |
|---------|---------|-----|
| `delete-replacement-modal.tsx` | shared | Reemplazo al borrar entidades relacionadas |
| `import-history-modal.tsx` | shared/import | Historial de importaciones |
| `import-modal.tsx` | shared/import | Wizard de importación |
| `bank-transfer-detail-modal.tsx` | admin/finance | Detalle de transferencia |
| `contact-files-modal.tsx` | contact | Archivos de contacto |
| `movement-detail-modal.tsx` | finance | Detalle de movimiento financiero |
| `health-issue-explainer-modal.tsx` | health | Explicación de issues |
| `move-list-modal.tsx` | planner | Mover lista en Kanban |
| `project-swap-modal.tsx` | projects | Intercambiar proyecto |

### Dialogs (archivos *-dialog.tsx) — ESTOS SE MANTIENEN

| Archivo | Feature | Tipo |
|---------|---------|------|
| `delete-confirmation-dialog.tsx` | shared | Confirmación destructiva ✅ |
| `delete-dialog.tsx` | shared | Borrado genérico ✅ |
| `alert-dialog.tsx` | UI | Alert genérico ✅ |
| `dialog.tsx` | UI | Dialog base ✅ |
| `delete-course-dialog.tsx` | academy | Borrar curso ✅ |
| `move-to-folder-dialog.tsx` | files | Mover a carpeta ✅ |

### Forms que llaman `closeModal()` directamente

Todos estos forms están acoplados al modal system y necesitarán migración a `closePanel()`:

- `unit-form.tsx`, `unit-presentation-form.tsx`
- `team-invite-member-form.tsx`, `team-add-external-form.tsx`
- `subcontract-payment-form.tsx`
- `tasks-bulk-edit-form.tsx`, `tasks-recipe-form.tsx`, `tasks-recipe-labor-form.tsx`
- `tasks-recipe-material-form.tsx`, `tasks-recipe-resource-form.tsx`
- `tasks-template-form.tsx`, `tasks-division-form.tsx`
- `sitelog-entry-form.tsx`, `sitelog-type-form.tsx`
- `quote-form.tsx`
- `projects-type-form.tsx`, `projects-modality-form.tsx`, `projects-project-form.tsx`
- `organization-create-form.tsx`
- Y muchos más en materials, finance, capital, contact...

### Panels existentes (archivos *-panel.tsx) — referencia

| Archivo | Feature | Nota |
|---------|---------|------|
| `support-chat-panel.tsx` | admin/support | Panel de chat |
| `recipe-suggestion-panel.tsx` | ai | Sugerencias de receta |
| `block-config-panel.tsx` | reports | Config de bloques |

Estos ya usan un patrón tipo "panel" pero sin el sistema centralizado.
