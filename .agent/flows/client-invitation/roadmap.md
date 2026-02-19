# Roadmap: Invitación y Acceso de Clientes

> Último update: Feb 2026

---

## ✅ Completado

### Infraestructura base
- [x] Tabla `project_access` con `client_id` nullable
- [x] `accept_external_invitation` con auto-create project_access
- [x] `can_view_project()` RLS helper
- [x] `can_view_client_data()` RLS helper (función creada)
- [x] `organization_invitations` con columnas `project_id` y `client_id`
- [x] `linkCollaboratorToProjectAction` con soporte `client_id`

### Frontend
- [x] `ClientForm` con Modo A (contacto existente) y Modo B (invitar por email)
- [x] `inviteClientToProjectAction` (5 pasos orquestados)
- [x] `addExternalCollaboratorWithProjectAction` (invitación con contexto)
- [x] Página de aceptación de invitación (`/invite/accept`)
- [x] `AcceptInvitationClient` con manejo de external vs member
- [x] `createClientAction` con auto-grant si `linked_user_id`
- [x] Email de invitación (`TeamInvitationEmail`)
- [x] Notificaciones in-app para usuarios existentes
- [x] Modal automático (`PendingInvitationChecker`)

---

## ⚠️ Parcialmente implementado

### RLS financieras para scoping de clientes (DB/018 Sección 3)
- [x] Función `can_view_client_data()` creada
- [ ] RLS paralelas en tablas financieras:
  - [ ] `client_commitments` → SELECT policy usando `can_view_client_data`
  - [ ] `client_payments` → SELECT policy usando `can_view_client_data`
  - [ ] `client_payment_schedule` → SELECT policy (via commitment → client)
  - [ ] `quotes` → SELECT policy para que el cliente vea sus presupuestos

**Impacto**: Sin estas RLS, un cliente podría (en teoría) ver datos de otros clientes si hace queries directas. El frontend filtra correctamente, pero **no hay protección a nivel DB**.

**Prioridad**: 🔴 Alta — seguridad

---

## 📋 Pendiente

### Mejoras de UX
- [ ] Mostrar estado de invitación en la lista de clientes (pendiente/aceptada/expirada)
- [ ] Botón "Re-invitar" cuando la invitación expiró
- [ ] Indicador visual de "tiene acceso al portal" vs "solo entidad financiera"
- [ ] Desvincular usuario de project_access sin eliminar project_client

### Mejoras técnicas
- [ ] Renombrar `linkCollaboratorToProjectAction` → `grantProjectAccessToExternalUser`
- [ ] Soporte multi-client per user en mismo proyecto (EC-7 en design-decisions)
- [ ] Sincronización email: si el contacto cambia de email, actualizar invitación pendiente
- [ ] Revocar `project_access` cuando se desactiva un `project_client` (actualmente `deactivateClientAction` lo hace, verificar completitud)
- [ ] Trigger que auto-elimine `project_access` cuando se hace soft-delete de `project_client`

### Portal del Cliente
- [ ] Vista de avance de obra (read-only)
- [ ] Vista de documentos compartidos
- [ ] Vista de pagos/compromisos (scoped por client_id)
- [ ] Vista de presupuestos/certificaciones

### Documentar en external-access
- [ ] Marcar en `external-access/README.md` que todo lo de clientes se movió a `client-invitation`
- [ ] Actualizar `external-access/technical-map.md` para que no duplique info

---

## 🔮 Futuro (no planificado)

- [ ] Roles granulares por proyecto (en vez de solo "viewer")
- [ ] Acceso temporal/expiración automática de project_access
- [ ] Dashboard compartido read-only (link público sin login)
- [ ] Notificaciones a clientes cuando se sube un documento/avance
