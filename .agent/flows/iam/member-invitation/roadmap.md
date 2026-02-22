# Roadmap: Invitación de Miembros

> Estado actual y pendientes de implementación.

---

## ✅ Completado

| Qué | Detalles |
|-----|----------|
| Envío de invitación | `sendInvitationAction()` con validaciones de asientos, duplicados, rol |
| Email de invitación | Template `TeamInvitationEmail` vía Resend |
| Página de aceptación | `page.tsx` + `accept-invitation-client.tsx` con estados: no logueado, logueado, ya existente |
| Aceptación via RPC | `iam.accept_organization_invitation` → INSERT/REACTIVATE membership |
| Validación de asientos en RPC | Calcula disponibilidad antes de crear membership |
| Reenvío de invitación | `resendInvitationAction()` con nuevo token y email |
| Revocación de invitación | `revokeInvitationAction()` → DELETE invitación |
| Registro de eventos billing | INSERT en `billing.organization_member_events` al aceptar |
| Trigger de auditoría | `audit.log_member_billable_change()` en organization_members |
| Fix schema reference | `DB/084_fix_member_events_schema_ref.sql` → trigger corregido |
| UI de resumen de asientos | Balance vertical en modal de invitación (incluidos, comprados, en uso, disponibles) |
| Compra de asientos desde modal | Botón "Comprar más asientos" accesible siempre |

---

## ⏳ Pendiente: Corto plazo

### P1: Estado `waiting_seat` para invitaciones sin asiento
**Prioridad**: Media
**Descripción**: Cuando se acepta una invitación pero no hay asientos, en vez de solo retornar error, marcar la invitación como `waiting_seat` y notificar al admin.
**Archivos a modificar**: 
- `iam.accept_organization_invitation` (agregar nuevo status)
- `iam.organization_invitations` (habilitar status `waiting_seat`)
- Notificación al admin cuando hay invitaciones esperando asientos

### P2: Consolidar eventos duplicados de billing
**Prioridad**: Baja
**Descripción**: La función `accept_organization_invitation` y el trigger `log_member_billable_change` ambos insertan en `billing.organization_member_events`. Evaluar si consolidar en uno solo o agregar deduplicación.
**Archivos a modificar**:
- `iam.accept_organization_invitation` (evaluar remover INSERT directo)
- O `audit.log_member_billable_change` (evaluar si el trigger es suficiente)

### P3: Notificación in-app al admin cuando se acepta una invitación
**Prioridad**: Media
**Descripción**: Actualmente solo se crea el membership. El admin no recibe notificación de que alguien aceptó su invitación.
**Archivos a modificar**:
- `iam.accept_organization_invitation` o trigger post-accept
- `notifications` + `user_notifications` INSERT

---

## 🔮 Pendiente: Largo plazo

### L1: Invitaciones bulk (CSV/lista de emails)
Permitir al admin pegar una lista de emails y enviar invitaciones masivas en un solo paso.

### L2: Invitación con link compartible (sin email específico)
Generar un link de invitación que cualquiera pueda usar, con límite de usos y expiración.

### L3: Automatizar asignación de roles por dominio de email
Si el email es `@constructoralenga.com` → auto-asignar rol Editor.
