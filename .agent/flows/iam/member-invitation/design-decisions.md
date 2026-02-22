# Decisiones de Diseño: Invitación de Miembros

> Por qué se hizo así, alternativas descartadas, edge cases y gotchas.

---

## Decisiones de Diseño

### D1: Validación de asientos en dos capas (action + RPC)

**Elegimos**: Validar asientos tanto en `sendInvitationAction` (frontend) como en `accept_organization_invitation` (SQL RPC).

**Alternativa descartada**: Validar solo en el frontend.

**Razón**: Entre la invitación y la aceptación pueden pasar días. Si otro miembro fue invitado y aceptó antes, el asiento ya no está disponible. La validación en el RPC es la fuente de verdad. La del frontend es UX amigable para evitar enviar invitaciones que no podrán completarse.

---

### D2: RPC SECURITY DEFINER para aceptar invitaciones

**Elegimos**: `accept_organization_invitation` es SECURITY DEFINER (se ejecuta como super-user).

**Alternativa descartada**: Usar RLS normal.

**Razón**: El usuario que acepta la invitación **no es miembro de la organización todavía**. No puede pasar las RLS de `organization_members` ni `organization_invitations` porque no tiene acceso. El RPC bypasea RLS para poder crear el membership.

---

### D3: Registro de eventos de billing duplicado (función + trigger)

**Elegimos**: La función `accept_organization_invitation` hace INSERT explícito en `billing.organization_member_events` **Y** existe un trigger `audit.log_member_billable_change` en `organization_members` que también inserta.

**Alternativa descartada**: Tener solo uno de los dos.

**Razón**: Son complementarios:
- El trigger captura **cualquier** cambio en `organization_members` (no solo invitaciones)
- La función registra el evento con metadatos específicos como `performed_by`
- El trigger es una red de seguridad para casos que no pasan por la función (ej: UPDATE directo)

⚠️ **Gotcha**: Esto puede generar **eventos duplicados** para una misma acción. El consumer de `organization_member_events` debe ser tolerante a duplicados.

---

### D4: Reactivación de ex-miembros

**Elegimos**: Si un usuario fue miembro anteriormente (is_active=false), al aceptar una nueva invitación se reactiva el membership existente con el nuevo rol.

**Alternativa descartada**: Siempre crear un nuevo registro.

**Razón**: La constraint UNIQUE (organization_id, user_id) impide crear duplicados. Reactivan la fila existente mantiene el historial de `joined_at` original y evita registros zombis.

---

### D5: Token con expiración de 7 días

**Elegimos**: Las invitaciones expiran a los 7 días.

**Alternativa descartada**: Sin expiración / 30 días.

**Razón**: 7 días es suficiente para que alguien acepte. Si no acepta a tiempo, el admin puede reenviar con un nuevo token. Esto evita tokens abandonados indefinidamente y reduce riesgo de phishing.

---

### D6: Seat check con billing RPC centralizado

**Elegimos**: Usar el RPC `billing.get_organization_seat_status` para calcular disponibilidad.

**Alternativa descartada**: Calcular asientos inline en cada acción.

**Razón**: Centralizar la lógica de asientos en una sola función SQL evita duplicar el cálculo. El mismo RPC se usa en el UI (modal de invitación), en `sendInvitationAction`, y en `accept_organization_invitation`.

---

## Edge Cases y Gotchas

### E1: Invitación aceptada pero sin asientos disponibles

**Escenario**: Admin envía 3 invitaciones con solo 2 asientos disponibles. Las primeras 2 se aceptan OK, la 3ra falla con `no_seats_available`.

**Impacto**: El usuario ve un error al aceptar. No se crea el membership.

**Solución futura**: La invitación podría quedar en estado `waiting_seat` y notificar al admin que necesita comprar más asientos.

---

### E2: Mismo email invitado como miembro y como cliente/externo

**Escenario**: Jorge es invitado como miembro de la org. Separadamente, es invitado como cliente de un proyecto.

**Impacto**: Son flujos independientes. Puede ser miembro Y tener registros en `organization_external_actors` y `project_access`. Funcionalmente esto no causa conflicto porque el membership da acceso completo al dashboard (más amplio que el portal de cliente).

**Solución futura**: Considerar auto-detectar y consolidar roles al aceptar.

---

### E3: Admin se invita a sí mismo

**Escenario**: Un admin envía invitación a su propio email.

**Impacto**: `sendInvitationAction` verifica si el email ya es miembro activo. Si el admin está activo, retorna error "Este email ya es miembro". **Cubierto**.

---

### E4: Trigger `log_member_billable_change` con schema incorrecto

**Escenario**: El trigger referenciaba `organization_member_events` sin prefijo `billing.`, causando error 42P01 al aceptar invitaciones.

**Impacto**: Bloqueaba completamente el flujo de aceptación.

**Solución**: Fix aplicado en `DB/084_fix_member_events_schema_ref.sql`. El trigger ahora usa `billing.organization_member_events` con `search_path = 'audit', 'billing'`.

---

### E5: Invitación pendiente + usuario se registra en Seencel

**Escenario**: Se envía invitación a jorge@email.com (no existe en Seencel). Antes de aceptar, Jorge se registra en Seencel directamente.

**Impacto**: El trigger `iam.handle_registered_invitation` detecta el registro y cambia la invitación de `pending` a `registered`. Cuando Jorge abre el link, ya está logueado y puede aceptar directamente.

---

### E6: Invitación reenvíada vs token viejo

**Escenario**: Admin reenvía invitación. Jorge abre el email viejo con el token original.

**Impacto**: El token original fue reemplazado por `resendInvitationAction`. El viejo no existe → `get_invitation_by_token` retorna `invitation_not_found`. Jorge debe abrir el email nuevo.

---

## Relación con otros Flows

| Flow relacionado | Cómo se conecta |
|-----------------|-----------------|
| `client-invitation` | Usa la misma `organization_invitations` con `invitation_type='client'` pero flujo de aceptación distinto (`accept_client_invitation`) |
| `external-access` | Usa la misma `organization_invitations` con `invitation_type='external'` pero flujo de aceptación distinto (`accept_external_invitation`) |
| `billing/plan-subscription` | Los asientos incluidos vienen del plan (`billing.plans.features->>'seats_included'`) |
| `billing/seat-purchase` | Asientos adicionales se suman a `organizations.purchased_seats`, aumentando capacidad |
