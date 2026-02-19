# Decisiones de Diseño: Invitación y Acceso de Clientes

> Por qué se hizo así, alternativas descartadas, edge cases conocidos y gotchas.

---

## 1. Tabla unificada `project_access` (no tablas separadas por tipo)

### Decisión
Tanto miembros internos como actores externos (clientes, contadores, directores de obra) usan la misma tabla `project_access` para controlar acceso a proyectos.

### Justificación
- **Una sola RLS** para verificar acceso (`can_view_project`)
- **Un solo JOIN** para queries que necesiten "todos los que ven este proyecto"
- `access_type` ("member", "external", "client") permite diferenciar sin tablas separadas
- `client_id` nullable permite scoping financiero sin complejidad adicional

### Alternativa descartada
Tabla `client_project_access` separada → más tablas, más mantenimiento, RLS duplicada.

---

## 2. `client_id` nullable en `project_access` como mecanismo de scoping

### Decisión
`project_access.client_id` es FK a `project_clients.id`. Cuando es NULL, el usuario ve todo el proyecto. Cuando tiene valor, solo ve datos de ese cliente.

### Justificación
- **Unificado**: Un Director de Obra externo tiene `client_id = NULL` → ve todo
- **Scoped**: Un representante del cliente tiene `client_id = X` → solo ve sus datos
- **Simple**: La función `can_view_client_data(project_id, client_id)` resuelve todo en un paso

### Gotcha conocida
Si un usuario es representante de **dos clientes distintos** en el mismo proyecto, necesitaría dos registros en `project_access`. El UNIQUE constraint `(project_id, user_id)` lo impide. 

**Workaround actual**: No soportado. Si se necesita, habría que crear un `project_access_clients` (M:N).

---

## 3. El contacto se auto-crea en Modo B pero NO se auto-elimina

### Decisión
`inviteClientToProjectAction` crea automáticamente un `contacts` si el email no existe como contacto de la organización. Pero si la invitación es rechazada o el `project_client` se elimina, el contacto **no se borra**.

### Justificación
- El contacto tiene valor como dato de CRM independientemente del proyecto
- Eliminar un contacto afectaría otras áreas (quotes, subcontratos que referencien ese contacto)
- El contacto queda como "lead" en el CRM

---

## 4. Actor externo es a nivel organización, no proyecto

### Decisión
`organization_external_actors` registra que un usuario "pertenece" a una org como externo. No importa a cuántos proyectos tenga acceso.

### Justificación
- **Simplifica auditoría**: "¿Quiénes son los externos de mi org?" → una query
- **Evita duplicados**: Un usuario puede tener acceso a 5 proyectos pero es un solo actor
- **Soporta desactivación global**: Desactivar actor → todos sus accesos se pueden revocar

### Implicación
Al crear la invitación, se pasa `actorType = "client"`. Pero un mismo usuario podría ser "client" en un proyecto y "accountant" en otro. El `actor_type` del `organization_external_actors` se setea con el del primer ingreso.

---

## 5. SECURITY DEFINER para `accept_external_invitation`

### Decisión
La función RPC usa SECURITY DEFINER en vez de INVOKER.

### Justificación
Cuando el usuario acepta una invitación:
- NO es miembro de la organización todavía
- Las RLS de `organization_external_actors`, `project_access`, etc. **lo bloquearían**
- SECURITY DEFINER bypasea RLS y ejecuta como owner

### Riesgo mitigado
- La función valida token, status, expiración internamente
- No acepta inputs arbitrarios (solo token + user_id)
- `search_path = 'public'` previene inyección de schema

---

## 6. Doble canal de invitación: email + in-app

### Decisión
Cuando se invita alguien, se envía:
1. **Email** (siempre)
2. **Notificación in-app** + **Modal overlay** (solo si el usuario ya tiene cuenta Seencel)

### Justificación
- Si el usuario no tiene cuenta, solo el email sirve
- Si ya tiene cuenta, el modal es más inmediato (lo ve al abrir Seencel)
- La campanita (notificación) queda como recordatorio persistente

---

## 7. `linkCollaboratorToProjectAction` mezcla conceptos

### Problema conocido
Esta action se llama `linkCollaborator...` pero se usa tanto para colaboradores como para clientes. La diferencia es:
- Colaborador: `access_type = "external"`, `client_id = null`
- Cliente: `access_type = "client"`, `client_id = <project_client.id>`

### Decisión actual
Mantener la función compartida. El nombre es confuso pero la lógica es idéntica:
1. Auto-crear/reactivar `organization_external_actors`
2. Insertar `project_access` con los parámetros dados

### Posible mejora
Renombrar a `grantProjectAccessToExternalUser` para reflejar mejor la intención.

---

## 8. El `project_client` se crea ANTES del acceso

### Decisión
En `inviteClientToProjectAction`, primero se crea `project_clients` y después se genera la invitación. Si la invitación falla, el `project_client` **ya existe**.

### Justificación
- El `project_client` tiene valor independiente (se usa para presupuestos, compromisos financieros)
- No debería depender de si la persona acepta o no la invitación
- El acceso al portal es un bonus, no un requisito del client entity

### Consecuencia
La action puede retornar `{ success: true, invited: false, error: "..." }` → El cliente fue creado pero la invitación falló. El frontend muestra un toast informativo.

---

## 9. Edge Cases documentados

### EC-1: Email ya es miembro interno
`addExternalCollaboratorWithProjectAction` verifica si el email pertenece a un `organization_member` activo. Si sí → error "Ya es miembro interno".

### EC-2: Invitación pendiente duplicada
Se verifica `organization_invitations` con status "pending". Si existe → error "Ya existe invitación pendiente".

### EC-3: Usuario ya tiene `project_access`
Se verifica antes de crear. Si ya existe → error "Ya tiene acceso a este proyecto".

### EC-4: Actor existente pero inactivo (soft-deleted)
`accept_external_invitation` reactiva el actor (`is_active = true, is_deleted = false`). No crea uno nuevo.

### EC-5: Invitación expirada
El RPC verifica `expires_at`. Si pasó → error "Invitación expirada". Se pueden crear nuevas.

### EC-6: Un contacto es cliente en 2 proyectos diferentes
✅ Soportado. Cada proyecto tiene su propio `project_clients` y `project_access`.

### EC-7: El admin se invita a sí mismo
No hay validación explícita. Pero como ya es miembro, `project_access` probablemente ya existe vía can_view_project → no afecta.

### EC-8: El email del contacto cambia después de la invitación
La invitación guarda el email directamente. Si el contacto cambia de email, la invitación original sigue apuntando al email viejo. No hay sincronización automática.
