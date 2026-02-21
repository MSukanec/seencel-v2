# Database Schema (Auto-generated)
> Generated: 2026-02-21T13:42:37.043Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [IAM] Functions (chunk 3: step_create_organization — users_normalize_email)

### `iam.step_create_organization(p_owner_id uuid, p_org_name text, p_plan_id uuid)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_create_organization(p_owner_id uuid, p_org_name text, p_plan_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam', 'billing'
AS $function$
DECLARE
  v_org_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.organizations (
    id, name, created_by, owner_id, created_at, updated_at, is_active, plan_id
  )
  VALUES (
    v_org_id, p_org_name, p_owner_id, p_owner_id, now(), now(), true, p_plan_id
  );

  RETURN v_org_id;

EXCEPTION
  WHEN OTHERS THEN
    PERFORM ops.log_system_error(
      'trigger',
      'step_create_organization',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'owner_id', p_owner_id,
        'org_name', p_org_name,
        'plan_id', p_plan_id
      ),
      'critical'
    );
    RAISE;
END;
$function$
```
</details>

### `iam.step_create_organization_currencies(p_org_id uuid, p_currency_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_create_organization_currencies(p_org_id uuid, p_currency_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
BEGIN
  INSERT INTO public.organization_currencies (
    id, organization_id, currency_id, is_active, is_default, created_at
  )
  VALUES (
    gen_random_uuid(), p_org_id, p_currency_id, true, true, now()
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM ops.log_system_error(
      'trigger',
      'step_create_organization_currencies',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'organization_id', p_org_id,
        'currency_id', p_currency_id
      ),
      'critical'
    );
    RAISE;
END;
$function$
```
</details>

### `iam.step_create_organization_data(p_org_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_create_organization_data(p_org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
BEGIN
  INSERT INTO public.organization_data (organization_id)
  VALUES (p_org_id);

EXCEPTION
  WHEN OTHERS THEN
    PERFORM ops.log_system_error(
      'trigger',
      'step_create_organization_data',
      'signup',
      SQLERRM,
      jsonb_build_object('org_id', p_org_id),
      'critical'
    );
    RAISE;
END;
$function$
```
</details>

### `iam.step_create_organization_preferences(p_org_id uuid, p_currency_id uuid, p_wallet_id uuid, p_pdf_template_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_create_organization_preferences(p_org_id uuid, p_currency_id uuid, p_wallet_id uuid, p_pdf_template_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
BEGIN
  INSERT INTO public.organization_preferences (
    organization_id, default_currency_id, default_wallet_id, default_pdf_template_id,
    use_currency_exchange, created_at, updated_at
  )
  VALUES (
    p_org_id, p_currency_id, p_wallet_id, p_pdf_template_id,
    false, now(), now()
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM ops.log_system_error(
      'trigger',
      'step_create_organization_preferences',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'org_id', p_org_id,
        'currency_id', p_currency_id,
        'wallet_id', p_wallet_id,
        'pdf_template_id', p_pdf_template_id
      ),
      'critical'
    );
    RAISE;
END;
$function$
```
</details>

### `iam.step_create_organization_roles(p_org_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_create_organization_roles(p_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$DECLARE
  v_admin_id  uuid;
  v_editor_id uuid;
  v_viewer_id uuid;
BEGIN
  SELECT id INTO v_admin_id
  FROM iam.roles
  WHERE organization_id = p_org_id AND name = 'Administrador' AND is_system = false
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    INSERT INTO iam.roles (name, description, type, organization_id, is_system)
    VALUES ('Administrador', 'Acceso total', 'organization', p_org_id, false)
    RETURNING id INTO v_admin_id;
  END IF;

  SELECT id INTO v_editor_id
  FROM iam.roles
  WHERE organization_id = p_org_id AND name = 'Editor' AND is_system = false
  LIMIT 1;

  IF v_editor_id IS NULL THEN
    INSERT INTO iam.roles (name, description, type, organization_id, is_system)
    VALUES ('Editor', 'Puede editar', 'organization', p_org_id, false)
    RETURNING id INTO v_editor_id;
  END IF;

  SELECT id INTO v_viewer_id
  FROM iam.roles
  WHERE organization_id = p_org_id AND name = 'Lector' AND is_system = false
  LIMIT 1;

  IF v_viewer_id IS NULL THEN
    INSERT INTO iam.roles (name, description, type, organization_id, is_system)
    VALUES ('Lector', 'Solo lectura', 'organization', p_org_id, false)
    RETURNING id INTO v_viewer_id;
  END IF;

  RETURN jsonb_build_object('admin', v_admin_id, 'editor', v_editor_id, 'viewer', v_viewer_id);

EXCEPTION
  WHEN OTHERS THEN
    PERFORM ops.log_system_error(
      'trigger', 'step_create_organization_roles', 'signup',
      SQLERRM, jsonb_build_object('org_id', p_org_id), 'critical'
    );
    RAISE;
END;$function$
```
</details>

### `iam.step_create_organization_wallets(p_org_id uuid, p_wallet_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_create_organization_wallets(p_org_id uuid, p_wallet_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
BEGIN
  INSERT INTO public.organization_wallets (
    id, organization_id, wallet_id, is_active, is_default, created_at
  )
  VALUES (
    gen_random_uuid(), p_org_id, p_wallet_id, true, true, now()
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM ops.log_system_error(
      'trigger',
      'step_create_organization_wallets',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'organization_id', p_org_id,
        'wallet_id', p_wallet_id
      ),
      'critical'
    );
    RAISE;
END;
$function$
```
</details>

### `iam.step_create_user_organization_preferences(p_user_id uuid, p_org_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_create_user_organization_preferences(p_user_id uuid, p_org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
BEGIN
  INSERT INTO iam.user_organization_preferences (id, user_id, organization_id, created_at, updated_at)
  VALUES (gen_random_uuid(), p_user_id, p_org_id, now(), now());
EXCEPTION
  WHEN OTHERS THEN
    PERFORM ops.log_system_error(
      'trigger', 'step_create_user_organization_preferences', 'signup',
      SQLERRM, jsonb_build_object('user_id', p_user_id, 'org_id', p_org_id), 'critical'
    );
    RAISE;
END;
$function$
```
</details>

### `iam.step_organization_increment_seats(p_organization_id uuid, p_seats_to_add integer)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_organization_increment_seats(p_organization_id uuid, p_seats_to_add integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.organizations
    SET 
        purchased_seats = COALESCE(purchased_seats, 0) + p_seats_to_add,
        updated_at = now()
    WHERE id = p_organization_id;
END;
$function$
```
</details>

### `iam.sync_contact_on_user_update()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.sync_contact_on_user_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
begin
  -- Solo si cambian full_name o email
  if (old.full_name is distinct from new.full_name)
     or (old.email is distinct from new.email) then

    update public.contacts c
    set full_name  = coalesce(new.full_name, c.full_name),
        email      = coalesce(new.email, c.email),
        updated_at = now()
    where c.linked_user_id = new.id;
  end if;

  return new;
end;
$function$
```
</details>

### `iam.sync_role_permission_org_id()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.sync_role_permission_org_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'iam'
AS $function$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM iam.roles WHERE id = NEW.role_id;
  END IF;
  RETURN NEW;
END;
$function$
```
</details>

### `iam.tick_home_checklist(p_key text, p_value boolean)` 🔐

- **Returns**: boolean
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.tick_home_checklist(p_key text, p_value boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
declare
  v_user_id uuid;
begin
  v_user_id := iam.current_user_id();
  if v_user_id is null then return false; end if;

  update iam.user_preferences up
  set
    home_checklist = jsonb_set(
      coalesce(up.home_checklist, '{}'::jsonb), array[p_key], to_jsonb(p_value), true
    ),
    updated_at = now()
  where up.user_id = v_user_id;

  return found;
end;
$function$
```
</details>

### `iam.update_contact_category_links_updated_at()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.update_contact_category_links_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
```
</details>

### `iam.users_normalize_email()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.users_normalize_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
begin
  if new.email is not null then
    new.email := lower(new.email);
  end if;

  return new;
end;
$function$
```
</details>
