# User Journey: Dar acceso a un cliente externo

> Tutorial paso a paso. Escrito como si el lector no supiera nada de Seencel.

## Escenario

- **Matías** es dueño de **Constructora Lenga** (organización en Seencel)
- Acaba de crear el proyecto **"Colegio Elumar"**
- Quiere que **Mariano Pérez** (socio del colegio) pueda entrar a Seencel y ver el avance, pagos y documentos del proyecto

---

## Paso 1: Crear los contactos ✅

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

---

## Paso 2: Vincular el cliente al proyecto ✅

Matías va al proyecto → pestaña **Participantes** → sección **Clientes** → **Vincular Cliente**.

Vincula **"Colegio Elumar S.A."** con rol **"Mandante"**.

**Tabla involucrada**: `project_clients`
- `project_clients.project_id` = Colegio Elumar
- `project_clients.contact_id` = Colegio Elumar S.A. (contacto empresa)
- `project_clients.client_role_id` = Mandante

**Archivos frontend**:
- Form: `src/features/clients/forms/clients-form.tsx`
- Action: `src/features/clients/actions.ts` → `createClientAction`

> A partir de acá, los **pagos y compromisos** se cargan contra este `project_client`. Es la entidad financiera.

---

## Paso 3: Dar acceso a Mariano al proyecto

Matías va al proyecto → **Participantes** → sección **Colaboradores** → **Vincular Colaborador**.

El formulario muestra los **contactos persona con email** de la organización.

### Caso A: Mariano tiene cuenta en Seencel (✅ linked_user_id)

El sistema:
1. Auto-crea `organization_external_actors` para Mariano (si no existe)
2. Crea `project_access` vinculando a Mariano al proyecto
3. Mariano puede seleccionar un **cliente asociado** para scoping (ej: "Colegio Elumar S.A.")

**Tablas involucradas**:
- `organization_external_actors` → creado automáticamente
- `project_access` → acceso al proyecto con `client_id` opcional

### Caso B: Mariano NO tiene cuenta en Seencel

El sistema:
1. Envía **invitación por email** a mariano@colegio.com
2. Crea registro en `organization_invitations` con `project_id` y `client_id`
3. Crea **notificación in-app** si el email coincide con un usuario Seencel

**Tablas involucradas**:
- `organization_invitations` → con `project_id` y `client_id` para auto-vinculación

**Archivos frontend**:
- Form: `src/features/external-actors/forms/collaborator-form.tsx`
- Actions: `src/features/external-actors/project-access-actions.ts`

> El `client_id` determina que Mariano **solo vea datos financieros de ese cliente**. Si es NULL, vería todo el proyecto (caso de un director de obra externo).

---

## Paso 4: Mariano acepta y entra al Portal

### Si ya tenía cuenta (Caso A):
Mariano inicia sesión y ya ve el proyecto en su Portal de Cliente.

### Si fue invitado (Caso B):
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
├── Crea contacto "Colegio Elumar S.A." ──→ contacts
├── Crea contacto "Mariano Pérez" ──→ contacts
│
├── Vincula "Colegio Elumar S.A." al proyecto ──→ project_clients
│   └── Carga pagos/compromisos contra este client
│
└── Da acceso a Mariano (desde Participantes del proyecto)
    ├── Caso A (con cuenta): auto-crea actor externo + project_access
    └── Caso B (sin cuenta): envía invitación → al aceptar auto-crea todo
        │
        └── MARIANO inicia sesión → Portal de Cliente
            └── RLS filtra: can_view_client_data() → solo ve datos de "Colegio Elumar S.A."
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
