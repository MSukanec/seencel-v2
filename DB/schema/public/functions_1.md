# Database Schema (Auto-generated)
> Generated: 2026-03-10T23:31:35.891Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Functions (chunk 1: can_mutate_org — set_timestamp)

### `can_mutate_org(p_organization_id uuid, p_permission_key text)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.can_mutate_org(p_organization_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.can_mutate_org(p_organization_id, p_permission_key);
$function$
```
</details>

### `can_mutate_project(p_project_id uuid, p_permission_key text)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.can_mutate_project(p_project_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.can_mutate_project(p_project_id, p_permission_key);
$function$
```
</details>

### `can_view_client_data(p_project_id uuid, p_client_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.can_view_client_data(p_project_id uuid, p_client_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT iam.can_view_client_data(p_project_id, p_client_id);
$function$
```
</details>

### `can_view_org(p_organization_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.can_view_org(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.can_view_org(p_organization_id);
$function$
```
</details>

### `can_view_org(p_organization_id uuid, p_permission_key text)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.can_view_org(p_organization_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.can_view_org(p_organization_id, p_permission_key);
$function$
```
</details>

### `can_view_project(p_project_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.can_view_project(p_project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.can_view_project(p_project_id);
$function$
```
</details>

### `cleanup_media_file_storage()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.cleanup_media_file_storage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Placeholder intencional:
  -- La eliminación física del archivo se maneja desde el backend (Node / Edge Functions).
  -- Este trigger solo marca el evento de borrado.

  return old;
end;
$function$
```
</details>

### `current_user_id()` 🔐

- **Returns**: uuid
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.current_user_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.current_user_id();
$function$
```
</details>

### `external_has_scope(p_organization_id uuid, p_permission_key text)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.external_has_scope(p_organization_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.external_has_scope(p_organization_id, p_permission_key);
$function$
```
</details>

### `get_user()` 🔐

- **Returns**: json
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.get_user()
 RETURNS json
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.get_user();
$function$
```
</details>

### `handle_import_batch_member_id()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.handle_import_batch_member_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
DECLARE
    current_uid uuid;
    resolved_member_id uuid;
BEGIN
    current_uid := auth.uid();
    IF current_uid IS NULL THEN RETURN NEW; END IF;

    -- Resolver member_id: auth.uid() -> users.auth_id -> users.id -> organization_members.user_id
    SELECT om.id INTO resolved_member_id
    FROM iam.organization_members om
    JOIN iam.users u ON u.id = om.user_id
    WHERE u.auth_id = current_uid 
      AND om.organization_id = NEW.organization_id
    LIMIT 1;

    IF resolved_member_id IS NOT NULL THEN
        NEW.member_id := resolved_member_id;
    END IF;
    
    RETURN NEW;
END;
$function$
```
</details>

### `handle_updated_by()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_by()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
DECLARE
    current_uid uuid;
    resolved_member_id uuid;
BEGIN
    current_uid := auth.uid();
    
    -- Si no hay usuario logueado (ej. seeders o sistema), no hacemos nada
    IF current_uid IS NULL THEN
        RETURN NEW;
    END IF;
    -- Buscamos el ID del miembro dentro de la organización
    SELECT om.id INTO resolved_member_id
    FROM iam.organization_members om
    JOIN iam.users u ON u.id = om.user_id
    WHERE u.auth_id = current_uid
      AND om.organization_id = NEW.organization_id
    LIMIT 1;
    -- Si encontramos al miembro, sellamos el registro
    IF resolved_member_id IS NOT NULL THEN
        -- Si es INSERT, llenamos el creador
        IF (TG_OP = 'INSERT') THEN
            NEW.created_by := resolved_member_id;
        END IF;
        -- SIEMPRE actualizamos el editor
        NEW.updated_by := resolved_member_id;
    END IF;
    RETURN NEW;
END;
$function$
```
</details>

### `has_permission(p_organization_id uuid, p_permission_key text)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.has_permission(p_organization_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.has_permission(p_organization_id, p_permission_key);
$function$
```
</details>

### `is_admin()` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.is_admin();
$function$
```
</details>

### `is_demo_org(p_organization_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.is_demo_org(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.is_demo_org(p_organization_id);
$function$
```
</details>

### `is_external_actor(p_organization_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.is_external_actor(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.is_external_actor(p_organization_id);
$function$
```
</details>

### `is_org_member(p_organization_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.is_org_member(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.is_org_member(p_organization_id);
$function$
```
</details>

### `is_self(p_user_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.is_self(p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.is_self(p_user_id);
$function$
```
</details>

### `is_system_row(p_is_system boolean)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.is_system_row(p_is_system boolean)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.is_system_row(p_is_system);
$function$
```
</details>

### `set_timestamp()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$
```
</details>
