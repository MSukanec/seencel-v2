# Roadmap: Creación de Organización

> Estado actual y pendientes accionables.

---

## Estado Actual

| Aspecto | Estado | Nota |
|---------|--------|------|
| Flujo de creación completo | ✅ Funciona | Probado en dev y prod |
| Business mode "professional" | ✅ Disponible | Default para todos |
| Business mode "supplier" | 🔒 Bloqueado visualmente | Solo admin puede bypass |
| Feature flag org_creation_enabled | ✅ Funciona | Controla acceso desde UI |
| Default Kanban board | ✅ "General" + 3 listas | Creado en step 9 |
| Logo upload durante creación | ✅ Non-blocking | Falla silenciosamente |
| Rate limiting (3/hora) | ✅ Activo | Por usuario |
| Trigger billing events | ✅ Fixed con DB/084 | Requiere ejecución en prod |

---

## Pendientes de Limpieza

### 🟡 P1: Eliminar Dead Code

**Archivo muerto**: `src/app/[locale]/(onboarding)/workspace-setup/workspace-setup-view.tsx`

Es la versión vieja del workspace-setup-view (sin step de org type, sin feature flags, sin admin bypass). El `page.tsx` importa de `src/features/onboarding/views/workspace-setup-view.tsx`.

**Acción**: Borrar el archivo en `app/.../workspace-setup-view.tsx`.

---

### 🟡 P2: Eliminar Función SQL Orphan

**Función**: `iam.step_create_default_kanban_board(p_org_id)`

Existe pero no se usa. El Step 9 de `handle_new_organization` tiene el código inline. Las funciones crean boards distintos ("Mi Panel" vs "General").

**Acción**: Crear script SQL para DROP de la función orphan, o refactorizar Step 9 para usar la función (actualizando su lógica).

---

### 🟡 P3: Eliminar Overload de step_create_organization

**Función**: `iam.step_create_organization(p_owner_id, p_org_name, p_plan_id)` (3 params)

El overload de 4 params (con `p_business_mode`) es el que se usa. El de 3 params no se llama desde ningún lugar.

**Acción**: Crear script SQL para DROP del overload de 3 params.

---

### 🟢 P4: Agregar .schema() a feature_flags query

**Archivo**: `workspace-setup/page.tsx`, línea 28

```diff
-supabase.from('feature_flags').select('status').eq('key', 'org_creation_enabled').single()
+supabase.schema('public').from('feature_flags').select('status').eq('key', 'org_creation_enabled').single()
```

**Impacto**: Consistencia del patrón.

---

## Pendientes Funcionales

### 🔵 F1: Activar Business Mode "Supplier"

Cuando esté listo:
1. Remover bloqueo visual en `workspace-setup-view.tsx`
2. Diseñar qué cambia para suppliers (features, permisos, UI)
3. Posiblemente crear steps específicos para suppliers en `handle_new_organization`

### 🔵 F2: Refactorizar Step 9 como Step Function

Actualmente el Kanban board se crea inline. Para consistencia con el patrón de step functions:
1. Actualizar `step_create_default_kanban_board` para crear "General" + 3 listas
2. Reemplazar inline con `PERFORM iam.step_create_default_kanban_board(v_org_id, v_member_id)`

### 🔵 F3: user_organization_preferences desde RPC

El RPC no crea `user_organization_preferences`. Lo hace el action en frontend. Evaluar si agregar como Step 10 dentro del RPC para garantizar integridad si el RPC se llama desde otro contexto.
