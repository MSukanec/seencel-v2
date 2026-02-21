# Decisiones de Diseño y Edge Cases

> Por qué se hizo así, alternativas descartadas, y trampas conocidas.

---

## Decisiones de Diseño

### D1: Tabla unificada `project_access` vs tablas por tipo

**Elegimos**: Una sola tabla `project_access` con campo `access_type`.

**Alternativa descartada**: Tablas separadas (`project_external_actors`, `project_client_users`, etc.)

**Razón**: `can_view_project()` solo hace un `EXISTS` en una tabla con índice compuesto. Con tablas separadas serían N queries. Además, agregar un nuevo tipo de actor es solo un nuevo `access_type`, no una tabla nueva.

### D2: `client_id` nullable en `project_access`

**Elegimos**: `client_id` nullable. Si es NULL → ve todo el proyecto. Si tiene valor → scoping.

**Alternativa descartada**: Crear registros separados por cada client visible.

**Razón**: Un director de obra externo necesita ver TODO el proyecto sin estar vinculado a un cliente. El NULL es el caso "sin restricción". Esto permite dos niveles de acceso con una sola tabla.

### D3: `project_clients` usa `contact_id`, no `user_id`

**Razón**: Un cliente puede ser una empresa (S.A., SRL) que no tiene cuenta de usuario. El contacto es la entidad de CRM. Solo las personas físicas que acceden al portal necesitan un `user_id` (via `contacts.linked_user_id`).

### D4: Pagos se cargan contra `project_client` (entidad), no contra usuarios individuales

**Razón**: "Colegio Elumar S.A." paga $500.000. No importa si Mariano o Gabriela ejecutan el pago — el compromiso es de la entidad. Los individuos son representantes, no deudores.

### D5: `can_view_client_data()` es SECURITY DEFINER

**Razón**: La función accede a tablas con RLS activo (`project_access`, `projects`, `organization_members`). Sin SECURITY DEFINER, la función heredaría los permisos del caller, creando recursión RLS infinita.

---

## Edge Cases y Gotchas

### E1: Un usuario tiene acceso a DOS project_clients del mismo proyecto

**Escenario**: Mariano es representante de "Colegio Elumar S.A." Y de "Fundación Elumar" en el mismo proyecto.

**Hoy**: No se puede. `UNIQUE(project_id, user_id)` impide dos registros.

**Solución futura**: Si se necesita, cambiar el UNIQUE a `UNIQUE(project_id, user_id, client_id)` y que `can_view_client_data()` busque TODOS los client_ids del usuario.

### E2: Se borra un `project_client` pero el `project_access` sigue apuntando

**Protección**: La FK tiene `ON DELETE SET NULL`. Si se borra el project_client, el `client_id` en project_access pasa a NULL → el usuario pasa a ver todo el proyecto.

**Acción recomendada**: Al desvincular un project_client, verificar si hay project_access records apuntando y avisar al usuario.

### E3: Un contacto cambia su `linked_user_id`

**Escenario**: El contacto "Mariano" tenía `linked_user_id = user_A`, pero se desvincula y se vincula a `user_B`.

**Impacto**: `project_access` apunta a `user_id`, no a `contact_id`. El `project_access` sigue apuntando a `user_A`. Se debe actualizar manualmente o crear un trigger.

### E4: El email del contacto no matchea con el email del usuario

**Escenario**: El contacto tiene `email = mariano@gmail.com` pero Mariano se registró con `mariano@colegio.com`.

**Impacto**: El auto-link no va a funcionar. Matías tendría que vincular manualmente (feature pendiente).

### E5: Policies paralelas y OR lógico

**Gotcha**: En PostgreSQL, si una tabla tiene MÚLTIPLES policies para el mismo comando (SELECT), se evalúan con **OR**. Esto significa que si la policy existente ya permite ver un row, la nueva no puede restringirlo.

**Implicación**: Las RLS paralelas que agregamos SOLO SUMAN acceso, nunca lo restringen. Los org_members siguen viendo todo porque su policy existente ya retorna TRUE.

### E6: Quotes usan `client_id` → `contacts.id` (no `project_clients.id`)

**Gotcha**: A diferencia de `client_payments` y `client_commitments` (que usan `client_id` → `project_clients.id`), la tabla `quotes` usa `client_id` → `contacts.id`. La RLS de quotes necesita resolver: contact → project_client → can_view_client_data(). Es un JOIN extra.

---

## Relación con otros Flows

| Flow | Relación |
|------|----------|
| **Contactos** | Los contactos son la base del CRM. Sin contactos no hay clientes ni actores externos. |
| **Equipo / Actores Externos** | Los actores externos se crean automáticamente al vincular un colaborador a un proyecto. La sección Equipo es de consulta (read-only). |
| **Clientes del Proyecto** | Los project_clients definen las entidades de facturación. El scoping depende de ellos. |
| **Portal de Cliente** | Es la UI que ven los usuarios con project_access. |
| **Finanzas (Pagos/Compromisos)** | Las RLS paralelas filtran datos financieros por client_id. |
| **Presupuestos** | Los quotes tienen scoping via contact → project_client. |

---

## D6: Auto-creación de actor externo al vincular colaborador

**Decisión**: Eliminar el paso manual de "Equipo → Actores Externos". Al vincular un colaborador a un proyecto desde Participantes, el sistema auto-crea `organization_external_actors` si no existe.

**Justificación**:
- Reduce el flujo de 7 pasos a 4
- El concepto de "actor externo" es interno al sistema — el usuario no necesita gestionarlo manualmente
- La tabla `organization_external_actors` sigue existiendo para control organizacional
- La invitación por email incluye `project_id` y `client_id` en `organization_invitations` para auto-crear `project_access` al aceptar

**Impacto**: La sección Equipo → Actores Externos pasa a ser read-only (listado de quiénes tienen acceso).
