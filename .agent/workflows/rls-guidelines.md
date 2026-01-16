---
description: Guidelines for creating Row Level Security policies in Supabase
---

# RLS Guidelines for SEENCEL

Este documento define las reglas para crear políticas RLS en todas las tablas de la base de datos.

## Nomenclatura de Políticas

```
MIEMBROS {ACCIÓN} {TABLA}
```

| Acción | Comando SQL | Ejemplo |
|--------|-------------|---------|
| VEN | SELECT | `MIEMBROS VEN PROJECTS` |
| CREAN | INSERT | `MIEMBROS CREAN CONTACTS` |
| EDITAN | UPDATE | `MIEMBROS EDITAN CONTACTS` |

> **IMPORTANTE**: No se crean políticas DELETE porque usamos soft delete (`is_deleted = true`).

---

## Funciones Helper Disponibles

| Función | Uso | Retorna |
|---------|-----|---------|
| `can_view_org(org_id, permission_key)` | SELECT | `true` si puede ver |
| `can_mutate_org(org_id, permission_key)` | INSERT/UPDATE | `true` si puede mutar |
| `is_org_member(org_id)` | Verificar membresía | `true` si es miembro activo |
| `is_admin()` | ¿Es admin global? | `true` si está en `admin_users` |
| `is_self(user_id)` | ¿Es el mismo usuario? | `true` si `user_id = current_user_id()` |
| `is_demo_org(org_id)` | ¿Es org demo? | `true` si organización demo |
| `has_permission(org_id, key)` | Verificar permiso específico | `true` si tiene el permiso |

---

## Permisos Existentes

| Key | Descripción | Categoría |
|-----|-------------|-----------|
| `admin.access` | Acceso área admin | admin |
| `billing.view` | Ver facturación | admin |
| `billing.manage` | Gestionar facturación | admin |
| `plans.view` | Ver plan | admin |
| `plans.manage` | Cambiar plan | admin |
| `projects.view` | Ver proyectos | projects |
| `projects.manage` | Gestionar proyectos | projects |
| `general_costs.view` | Ver costos generales | general_costs |
| `general_costs.manage` | Gestionar costos | general_costs |
| `members.view` | Ver miembros | organization |
| `members.manage` | Gestionar miembros | organization |
| `roles.view` | Ver roles | organization |
| `roles.manage` | Gestionar roles | organization |

---

## Tipos de Tablas y sus Políticas

### 1. Tablas con `organization_id` (Caso más común)

```sql
-- SELECT: MIEMBROS VEN {TABLA}
CREATE POLICY "MIEMBROS VEN {TABLA}"
ON public.{tabla}
FOR SELECT
TO public
USING (
  can_view_org(organization_id, '{permiso}.view'::text)
);

-- INSERT: MIEMBROS CREAN {TABLA}
CREATE POLICY "MIEMBROS CREAN {TABLA}"
ON public.{tabla}
FOR INSERT
TO public
WITH CHECK (
  can_mutate_org(organization_id, '{permiso}.manage'::text)
);

-- UPDATE: MIEMBROS EDITAN {TABLA}
CREATE POLICY "MIEMBROS EDITAN {TABLA}"
ON public.{tabla}
FOR UPDATE
TO public
USING (
  can_mutate_org(organization_id, '{permiso}.manage'::text)
);
```

### 2. Tablas Hijas (heredan permiso del padre)

| Tabla Hija | Permiso Heredado |
|------------|------------------|
| `project_clients` | `projects.view/manage` |
| `project_personnel` | `projects.view/manage` |
| `project_data` | `projects.view/manage` |
| `contact_type_links` | `contacts.view/manage` |
| `general_cost_payments` | `general_costs.view/manage` |

### 3. Tablas con `user_id` (datos personales)

```sql
-- SELECT: Solo el propio usuario
CREATE POLICY "USUARIOS VEN SUS {TABLA}"
ON public.{tabla}
FOR SELECT
TO public
USING (
  is_self(user_id)
);

-- INSERT/UPDATE: Solo el propio usuario
CREATE POLICY "USUARIOS EDITAN SUS {TABLA}"
ON public.{tabla}
FOR UPDATE
TO public
USING (
  is_self(user_id)
);
```

Ejemplos: `user_preferences`, `user_data`, `user_acquisition`

### 4. Tablas Globales (sin `organization_id`)

```sql
-- SELECT: Todos pueden ver
CREATE POLICY "TODOS VEN {TABLA}"
ON public.{tabla}
FOR SELECT
TO public
USING (true);

-- INSERT/UPDATE: Solo admins
CREATE POLICY "ADMINS GESTIONAN {TABLA}"
ON public.{tabla}
FOR ALL
TO public
USING (is_admin())
WITH CHECK (is_admin());
```

Ejemplos: `currencies`, `wallets`, `pdf_templates`, `plans`, `permissions`

---

## Checklist para Nueva Tabla

Cuando me pidas RLS para una tabla:

1. [ ] ¿Tiene `organization_id`? → Usar `can_view_org` / `can_mutate_org`
2. [ ] ¿Es tabla hija? → Heredar permiso del padre
3. [ ] ¿Tiene `user_id` sin `organization_id`? → Usar `is_self()`
4. [ ] ¿Es tabla global/sistema? → `true` para SELECT, `is_admin()` para mutaciones
5. [ ] Crear permiso nuevo en `permissions` si no existe
6. [ ] Actualizar `step_assign_org_role_permissions` con el nuevo permiso

---

## Agregar Nuevo Permiso

Si la tabla necesita un permiso nuevo, hay **3 pasos obligatorios**:

### Paso 1: Insertar en `permissions`

```sql
INSERT INTO public.permissions (key, description, category, is_system)
VALUES 
  ('{tabla}.view', 'Ver {descripción}', '{categoria}', true),
  ('{tabla}.manage', 'Gestionar {descripción}', '{categoria}', true);
```

### Paso 2: Actualizar `step_assign_org_role_permissions` (para ORGs nuevas)

Modificar la función en Supabase para que las **organizaciones futuras** tengan el permiso:

```sql
-- ADMIN: ya tiene todos automáticamente (SELECT p.id FROM permissions WHERE is_system = true)

-- EDITOR: agregar si corresponde
WHERE p.key IN (
  -- permisos existentes...
  '{tabla}.view',
  '{tabla}.manage'  -- si Editor puede gestionar
);

-- LECTOR: agregar si corresponde  
WHERE p.key IN (
  -- permisos existentes...
  '{tabla}.view'
);
```

### Paso 3: Migración para ORGs existentes (CRÍTICO)

Ejecutar este script **una sola vez** para que las organizaciones ya creadas tengan el nuevo permiso:

```sql
-- =============================================
-- MIGRACIÓN: Agregar permiso '{tabla}' a orgs existentes
-- =============================================

-- Variables para los IDs de permisos nuevos
DO $$
DECLARE
  v_view_perm_id uuid;
  v_manage_perm_id uuid;
BEGIN
  -- Obtener IDs de los permisos nuevos
  SELECT id INTO v_view_perm_id FROM permissions WHERE key = '{tabla}.view';
  SELECT id INTO v_manage_perm_id FROM permissions WHERE key = '{tabla}.manage';

  -- ADMIN: Agregar ambos permisos a todos los roles "Administrador" de cada org
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_view_perm_id
  FROM roles r
  WHERE r.name = 'Administrador' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_manage_perm_id
  FROM roles r
  WHERE r.name = 'Administrador' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- EDITOR: Agregar view y manage (si aplica)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_view_perm_id
  FROM roles r
  WHERE r.name = 'Editor' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_manage_perm_id
  FROM roles r
  WHERE r.name = 'Editor' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- LECTOR: Solo view
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_view_perm_id
  FROM roles r
  WHERE r.name = 'Lector' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  RAISE NOTICE 'Migración completada para permiso {tabla}';
END $$;
```

> **IMPORTANTE**: El `ON CONFLICT DO NOTHING` evita errores si el permiso ya existe para algún rol.

---

## Ejemplo Completo: Tabla `contacts`

### Permisos necesarios:
```sql
INSERT INTO public.permissions (key, description, category, is_system)
VALUES 
  ('contacts.view', 'Ver contactos', 'contacts', true),
  ('contacts.manage', 'Gestionar contactos', 'contacts', true);
```

### Políticas:
```sql
-- MIEMBROS VEN CONTACTS
CREATE POLICY "MIEMBROS VEN CONTACTS"
ON public.contacts
FOR SELECT
TO public
USING (
  can_view_org(organization_id, 'contacts.view'::text)
);

-- MIEMBROS CREAN CONTACTS
CREATE POLICY "MIEMBROS CREAN CONTACTS"
ON public.contacts
FOR INSERT
TO public
WITH CHECK (
  can_mutate_org(organization_id, 'contacts.manage'::text)
);

-- MIEMBROS EDITAN CONTACTS
CREATE POLICY "MIEMBROS EDITAN CONTACTS"
ON public.contacts
FOR UPDATE
TO public
USING (
  can_mutate_org(organization_id, 'contacts.manage'::text)
);
```

### Tabla hija `contact_type_links`:
```sql
-- MIEMBROS VEN CONTACT_TYPE_LINKS
CREATE POLICY "MIEMBROS VEN CONTACT_TYPE_LINKS"
ON public.contact_type_links
FOR SELECT
TO public
USING (
  can_view_org(organization_id, 'contacts.view'::text)
);

-- MIEMBROS CREAN CONTACT_TYPE_LINKS
CREATE POLICY "MIEMBROS CREAN CONTACT_TYPE_LINKS"
ON public.contact_type_links
FOR INSERT
TO public
WITH CHECK (
  can_mutate_org(organization_id, 'contacts.manage'::text)
);

-- MIEMBROS EDITAN CONTACT_TYPE_LINKS
CREATE POLICY "MIEMBROS EDITAN CONTACT_TYPE_LINKS"
ON public.contact_type_links
FOR UPDATE
TO public
USING (
  can_mutate_org(organization_id, 'contacts.manage'::text)
);
```

---

## Apéndice: Función Maestra de Permisos (Referencia Actualizada)

**Última actualización:** Incluye `kanban` y `clients`.

```sql
CREATE OR REPLACE FUNCTION public.step_assign_org_role_permissions(p_org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_admin_role_id  uuid;
  v_editor_role_id uuid;
  v_viewer_role_id uuid;
BEGIN
  ----------------------------------------------------------------
  -- Obtener roles
  ----------------------------------------------------------------
  SELECT id INTO v_admin_role_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Administrador'
    AND is_system = false;
  SELECT id INTO v_editor_role_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Editor'
    AND is_system = false;
  SELECT id INTO v_viewer_role_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Lector'
    AND is_system = false;

  ----------------------------------------------------------------
  -- ADMIN → todos los permisos system
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions
  WHERE role_id = v_admin_role_id;
  
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_admin_role_id, p.id
  FROM public.permissions p
  WHERE p.is_system = true;

  ----------------------------------------------------------------
  -- EDITOR → Projects, Costs, Members, Contacts, Kanban, Clients, Sitelog, Media
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions
  WHERE role_id = v_editor_role_id;
  
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_editor_role_id, p.id
  FROM public.permissions p
  WHERE p.key IN (
    'projects.view',
    'projects.manage',
    'general_costs.view',
    'general_costs.manage',
    'members.view',
    'contacts.view',
    'contacts.manage',
    'kanban.view',
    'kanban.manage',
    'clients.view',
    'clients.manage',
    'sitelog.view',
    'sitelog.manage',
    'media.view',
    'media.manage'
  );

  ----------------------------------------------------------------
  -- LECTOR → View only versions
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions
  WHERE role_id = v_viewer_role_id;
  
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_viewer_role_id, p.id
  FROM public.permissions p
  WHERE p.key IN (
    'projects.view',
    'general_costs.view',
    'members.view',
    'roles.view',
    'contacts.view',
    'kanban.view',
    'clients.view',
    'sitelog.view',
    'media.view'
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'function',
      'step_assign_org_role_permissions',
      'permissions',
      SQLERRM,
      jsonb_build_object('org_id', p_org_id),
      'critical'
    );
    RAISE;
END;
$function$;
```
