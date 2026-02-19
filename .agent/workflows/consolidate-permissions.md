---
description: Cómo consolidar permisos granulares en permisos de dominio en Seencel V2
---

# Workflow: Consolidación de Permisos

Este workflow documenta el proceso completo para consolidar múltiples permisos granulares
en un permiso de dominio, como se hizo con `quotes.*` + `clients.*` → `commercial.*`.

---

## 📐 Contexto del Sistema de Permisos

### Cómo funciona el RLS

Todas las políticas de seguridad de fila (RLS) usan dos funciones helpers:

| Función | Uso |
|---------|-----|
| `can_view_org(org_id, 'domain.view')` | Lectura (SELECT) |
| `can_mutate_org(org_id, 'domain.manage')` | Escritura (INSERT, UPDATE, DELETE) |

Estas funciones hacen un lookup en `permissions` → `role_permissions` → `organization_members`.

### Tabla `permissions` (columnas reales)

```
id         uuid       PK
key        text       UNIQUE  ← el identificador que va en el RLS
description text      NOT NULL
category   text       NOT NULL ← agrupa permisos en la UI
is_system  bool       default true
created_at timestamptz
```

> ⚠️ **NO tiene columna `name`**. Solo `key`, `description`, `category`.

### Tabla `role_permissions`

```
id              uuid
role_id         uuid → roles.id
permission_id   uuid → permissions.id
organization_id uuid → organizations.id
```

### Función de asignación de roles

`step_assign_org_role_permissions(p_org_id uuid)` — en `public` schema.
- Se llama al crear una organización nueva.
- Asigna permisos a los roles **Administrador**, **Editor** y **Lector**.
- **Hay que actualizarla** cada vez que se modifica el set de permisos.

---

## 🗺️ Mapa de Permisos Actuales (Feb 2026)

### Estado después de la migration `026_commercial_permissions.sql`

| Dominio | `.view` | `.manage` | Cubre |
|---------|---------|-----------|-------|
| `commercial` | ✅ | ✅ | Presupuestos + Clientes (quotes, quote_items, client_commitments, client_payment_schedule, client_payments, client_portal_settings, client_roles) |
| `contacts` | ✅ | ✅ | Contactos (contacts, contact_categories, contact_category_links) — **pendiente evaluar si va a commercial** |
| `projects` | ✅ | ✅ | Proyectos |
| `general_costs` | ✅ | ✅ | Costos Generales |
| `materials` | ✅ | ✅ | Materiales |
| `labor` | ✅ | ✅ | Mano de Obra |
| `tasks` | ✅ | ✅ | Tareas del catálogo |
| `subcontracts` | ✅ | ✅ | Subcontratos |
| `calendar` | ✅ | ✅ | Calendario |
| `sitelog` | ✅ | ✅ | Bitácora de Obra |
| `media` | ✅ | ✅ | Archivos / Media |
| `kanban` | ✅ | ✅ | Tablero Kanban |
| `members` | ✅ | ✅ | Miembros de la org |
| `roles` | ✅ | ✅ | Roles |
| `admin` | access | — | Solo admins del sistema |
| `organization` | ✅ | ✅ | Config de org |
| `team` | — | ✅ | Gestión del equipo |

### Candidatos a consolidación futura

| Consolidar | En | Decisión |
|------------|-----|----------|
| `contacts.*` | `commercial.*` | Pendiente — puede que contactos sea cross-dominio |
| `materials.* + labor.* + subcontracts.*` | `construction.*` | Pendiente |
| `general_costs.*` | `finance.*` | Pendiente |

---

## 🔄 Proceso Paso a Paso

### 1. Auditar impacto

Antes de hacer nada, identificar **todos los lugares** donde se usan los permisos a consolidar:

```powershell
# Buscar en RLS del schema public
Select-String -Path "DB\schema\public\rls.md" -SimpleMatch "domain." | Sort-Object LineNumber

# Buscar en RLS de otros schemas (ej: construction)
Select-String -Path "DB\schema\construction\rls.md" -SimpleMatch "domain." | Sort-Object LineNumber

# Buscar en funciones
Select-String -Path "DB\schema\public\functions_*.md" -SimpleMatch "domain.view" | Select-Object Filename, LineNumber, Line
```

Esto te da:
- Qué tablas tienen RLS con esos permisos
- En qué schemas están
- La función `step_assign_org_role_permissions` si la toca

### 2. Confirmar estructura de `permissions`

```powershell
Select-String -Path "DB\schema\public\tables_*.md" -SimpleMatch "### ``permissions``" | Select-Object Filename, LineNumber
```

Luego ver las columnas reales antes de escribir el INSERT.

### 3. Crear el archivo SQL

Nombrar `DB/0XX_consolidate_DOMAIN_permissions.sql`.

**Estructura obligatoria (dentro de `BEGIN; ... COMMIT;`):**

```sql
-- PASO 1: Insertar nuevo permiso
INSERT INTO public.permissions (id, key, description, category, is_system)
VALUES (gen_random_uuid(), 'nuevo.view', 'Descripción', 'nuevo', true)
ON CONFLICT (key) DO NOTHING;

-- PASO 2: Heredar role_permissions existentes
INSERT INTO public.role_permissions (id, role_id, permission_id, organization_id)
SELECT gen_random_uuid(), rp.role_id,
  (SELECT id FROM public.permissions WHERE key = 'nuevo.view'),
  rp.organization_id
FROM public.role_permissions rp
JOIN public.permissions p ON p.id = rp.permission_id
WHERE p.key IN ('viejo1.view', 'viejo2.view')
ON CONFLICT DO NOTHING;

-- PASO 3: DROP + CREATE de cada política RLS
-- (por cada tabla afectada en cada schema)
DROP POLICY IF EXISTS "NOMBRE EXACTO DE LA POLICY" ON schema.tabla;
CREATE POLICY "NOMBRE EXACTO DE LA POLICY"
  ON schema.tabla FOR [SELECT|INSERT|UPDATE|DELETE]
  [USING|WITH CHECK] (can_view_org(organization_id, 'nuevo.view'));

-- PASO 4: Limpiar role_permissions viejos
DELETE FROM public.role_permissions
WHERE permission_id IN (
  SELECT id FROM public.permissions
  WHERE key IN ('viejo1.view', 'viejo1.manage', 'viejo2.view', 'viejo2.manage')
);

-- PASO 5: Eliminar permisos viejos
DELETE FROM public.permissions
WHERE key IN ('viejo1.view', 'viejo1.manage', 'viejo2.view', 'viejo2.manage');

-- PASO 6: Recrear step_assign_org_role_permissions
-- (reemplazando los keys viejos por los nuevos en los arrays)
CREATE OR REPLACE FUNCTION public.step_assign_org_role_permissions(p_org_id uuid) ...

-- VERIFICACIÓN
SELECT key, description, category, is_system FROM public.permissions WHERE key LIKE 'nuevo%';
SELECT key FROM public.permissions WHERE key IN ('viejo1.view', ...); -- debe devolver 0 filas
```

> ⚠️ **El nombre de la política en el DROP debe ser EXACTO** — copiarlo del `rls.md` del schema correspondiente.

### 4. Verificar el SQL antes de ejecutar

Revisar especialmente:
- ¿Hay políticas en **múltiples schemas** (public + construction)? → El DROP/CREATE debe especificar el schema
- ¿La tabla `role_permissions` tiene constraint UNIQUE que pueda colisionar? → Usar `ON CONFLICT DO NOTHING`
- ¿La tabla `permissions` tiene columna `name`? → **NO**. Solo `key`, `description`, `category`

### 5. Ejecutar en Supabase

Pegar y ejecutar en el SQL Editor de Supabase.

Revisar las queries de VERIFICACIÓN al final:
- `commercial.view` y `commercial.manage` deben aparecer
- Los permisos viejos no deben aparecer (0 filas)
- Los roles deben tener asignado el nuevo permiso

### 6. Regenerar el schema

```bash
npm run db:schema
```

Verifica que `DB/schema/` se actualiza correctamente.

### 7. Actualizar la vista de permisos en la UI

Archivo: `src/features/team/views/team-permissions-view.tsx`

Agregar en **`PermissionTranslations`**:
```ts
'nuevo.view': 'Nombre legible',
'nuevo.manage': 'Gestionar X',
```

Agregar en **`CategoryTranslations`**:
```ts
'nuevo': 'Nombre de categoría en español',
```

### 8. Build de verificación

```bash
npm run build
```

Debe terminar con **Exit code: 0**.

---

## ✅ Checklist Completo

- [ ] Auditar permisos con `Select-String` en `rls.md` de todos los schemas
- [ ] Verificar columnas reales de `permissions` en `tables_X.md`
- [ ] Crear `DB/0XX_consolidate_DOMAIN_permissions.sql`
- [ ] Verificar nombres exactos de políticas RLS para el `DROP IF EXISTS`
- [ ] Ejecutar SQL en Supabase
- [ ] Revisar queries de verificación (0 filas en permisos viejos)
- [ ] `npm run db:schema`
- [ ] Actualizar `PermissionTranslations` y `CategoryTranslations` en `team-permissions-view.tsx`
- [ ] `npm run build` — Exit code: 0

---

## 📚 Historial de Migraciones

| Script | Fecha | Qué consolida |
|--------|-------|---------------|
| `DB/026_commercial_permissions.sql` | Feb 2026 | `quotes.view/manage` + `clients.view/manage` → `commercial.view/manage` |
| `DB/027_planner_permissions.sql` | Feb 2026 | `calendar.view/manage` + `kanban.view/manage` → `planner.view/manage` |
