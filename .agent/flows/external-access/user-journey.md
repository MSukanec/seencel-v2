# User Journey: Dar acceso a un cliente externo

> Tutorial paso a paso. Escrito como si el lector no supiera nada de Seencel.

## Escenario

- **Matías** es dueño de **Constructora Lenga** (organización en Seencel)
- Acaba de crear el proyecto **"Colegio Elumar"**
- Quiere que **Mariano Pérez** (socio del colegio) pueda entrar a Seencel y ver el avance, pagos y documentos del proyecto

---

## Paso 1: Crear los contactos (opcional)

Matías va a **Contactos** y crea dos registros:

| Contacto | Tipo | Email | Para qué |
|----------|------|-------|----------|
| Colegio Elumar S.A. | Empresa | admin@colegio.com | La entidad que paga (facturación) |
| Mariano Pérez | Persona | mariano@colegio.com | La persona que va a ver el portal |

**Tabla involucrada**: `contacts`
- `contacts.full_name` = "Mariano Pérez"
- `contacts.email` = "mariano@colegio.com"
- `contacts.organization_id` = Constructora Lenga

> Si Mariano ya tiene cuenta en Seencel, el sistema auto-linkea `contacts.linked_user_id` = mariano.users.id (pipeline `contact_auto_creation_pipeline`).

> **¿Por qué es opcional?** Porque el Paso 2 puede auto-crear contactos por email.

---

## Paso 2: Agregar cliente al proyecto ✅

Matías va al proyecto → pestaña **Participantes** → sección **Clientes** → **Agregar Cliente**.

El formulario tiene **dos modos** (toggle visual):

### Modo A: Contacto existente

Selecciona un contacto que ya existe en la organización (ej: **"Colegio Elumar S.A."** o **"Mariano Pérez"**) y le asigna un rol.

- Crea el vínculo `project_client`
- Si el contacto tiene `linked_user_id` (cuenta Seencel) → **auto-crea `project_access`** para darle acceso al portal
- Si el contacto NO tiene `linked_user_id` → solo queda como entidad financiera sin acceso

**Action**: `createClientAction` (con auto-grant post-insert)

### Modo B: Invitar por email

Matías ingresa el email **mariano@colegio.com** y opcionalmente el nombre "Mariano Pérez".

El sistema en un solo paso:
1. **Auto-crea el contacto** si no existe en la org
2. **Crea el `project_client`** con el rol asignado
3. Si Mariano **ya tiene cuenta** en Seencel → le da `project_access` directamente
4. Si Mariano **no tiene cuenta** → le envía una **invitación por email** con `project_id` + `client_id`

**Action**: `inviteClientToProjectAction`
(Reutiliza `linkCollaboratorToProjectAction` y `addExternalCollaboratorWithProjectAction` — no duplica lógica)

> Con el Modo B, un admin vincula y da acceso al cliente **en un solo paso**, sin necesidad de ir a otra sección.

**Archivos frontend**:
- Form: `src/features/clients/forms/clients-form.tsx` (formulario unificado con toggle)

> Los **pagos y compromisos** se cargan contra el `project_client`. Es la entidad financiera.

---

## Paso 3: Mariano acepta y entra al Portal

### Si ya tenía cuenta (Modo B, caso directo):
Mariano inicia sesión y ya ve el proyecto en su Portal de Cliente.

### Si fue invitado (Modo B, caso invitación):
1. Mariano recibe email con link de invitación
2. Se registra en Seencel (o inicia sesión si ya tenía cuenta)
3. Acepta la invitación
4. El RPC `accept_external_invitation` auto-crea:
   - `organization_external_actors` (actor externo)
   - `project_access` (acceso al proyecto con scoping)
5. Mariano es redirigido al Portal de Cliente

**Lo que ve Mariano**:
- ✅ Dashboard de avance de obra
- ✅ Documentos compartidos
- ✅ Pagos y compromisos **solo de "Colegio Elumar S.A."**
- ❌ NO ve materiales, costos internos, subcontratos, ni datos de otros clientes

**Función RLS que controla esto**: `can_view_client_data(project_id, client_id)`

---

## Diagrama completo

```
MATÍAS (org member de Constructora Lenga)
│
├── [Opcional] Crea contactos previamente en CRM ──→ contacts
│
└── Agrega cliente al proyecto (Participantes → Clientes → Agregar)
    │
    ├── Modo A (contacto existente): crea project_client
    │   ├── Si contacto tiene linked_user_id → auto-crea project_access
    │   └── Si no tiene linked_user_id → solo queda como entidad financiera
    │
    └── Modo B (invitar por email): crea contacto + project_client + acceso
        │
        ├── Si ya tiene cuenta → project_access directo
        └── Si no tiene cuenta → organization_invitations → email
            │
            └── MARIANO acepta invitación
                └── accept_external_invitation auto-crea:
                    ├── organization_external_actors
                    └── project_access (con client_id = scoping)
                        └── RLS: can_view_client_data() → solo ve sus datos
```

---

## Caso multi-cliente (Edificio Torres Sur)

```
Proyecto: Torres Sur
├── Depto 1 → project_client: "Familia López"
│   ├── Juan López → project_access (client_id = Familia López) → ve solo sus pagos
│   └── María López → project_access (client_id = Familia López) → ve solo sus pagos
│
├── Depto 2 → project_client: "Familia García"
│   └── Ana García → project_access (client_id = Familia García) → ve solo sus pagos
│
└── Director de Obra Externo → project_access (client_id = NULL) → ve TODO el proyecto
```

---

## Caso: Mismo cliente en múltiples proyectos

```
Mariano Pérez (contacts.linked_user_id = mariano.users.id)
├── Proyecto "Colegio Elumar"
│   └── project_access (client_id = "Colegio Elumar S.A.")
│
├── Proyecto "Gimnasio Municipal"
│   └── project_access (client_id = "Municipalidad")
│
└── organization_external_actors (1 solo registro por org)
    └── Mariano es actor externo de Constructora Lenga
```

> Cada vinculación a proyecto crea un `project_access` separado. El actor externo a nivel organización es único. Si se invita al mismo email a otro proyecto, se verifica que tenga actor externo activo y se crea solo el `project_access` nuevo.
