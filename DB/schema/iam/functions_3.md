# Database Schema (Auto-generated)
> Generated: 2026-02-21T03:04:42.923Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [IAM] Functions (chunk 3: step_create_organization_wallets — users_normalize_email)

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
    id,
    organization_id,
    wallet_id,
    is_active,
    is_default,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    p_org_id,
    p_wallet_id,
    true,
    true,
    now()
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
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

### `iam.step_create_user(p_auth_user_id uuid, p_email text, p_full_name text, p_avatar_url text, p_avatar_source avatar_source_t, p_role_id uuid)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_create_user(p_auth_user_id uuid, p_email text, p_full_name text, p_avatar_url text, p_avatar_source avatar_source_t, p_role_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.users (
    id, auth_id, email, full_name, avatar_url, avatar_source, role_id
  )
  VALUES (
    v_user_id, p_auth_user_id, p_email, p_full_name, p_avatar_url, p_avatar_source, p_role_id
  );

  RETURN v_user_id;

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_user',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'auth_user_id', p_auth_user_id,
        'email', p_email,
        'role_id', p_role_id
      ),
      'critical'
    );
    RAISE;
END;
$function$
```
</details>

### `iam.step_create_user_acquisition(p_user_id uuid, p_raw_meta jsonb)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_create_user_acquisition(p_user_id uuid, p_raw_meta jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$declare
  v_source text;
begin
  ----------------------------------------------------------------
  -- Fuente (fallback a direct)
  ----------------------------------------------------------------
  v_source := coalesce(
    p_raw_meta->>'utm_source',
    'direct'
  );

  INSERT INTO public.user_acquisition (
    user_id,
    source,
    medium,
    campaign,
    content,
    landing_page,
    referrer
  )
  VALUES (
    p_user_id,
    v_source,
    p_raw_meta->>'utm_medium',
    p_raw_meta->>'utm_campaign',
    p_raw_meta->>'utm_content',
    p_raw_meta->>'landing_page',
    p_raw_meta->>'referrer'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    source = EXCLUDED.source,
    medium = EXCLUDED.medium,
    campaign = EXCLUDED.campaign,
    content = EXCLUDED.content,
    landing_page = EXCLUDED.landing_page,
    referrer = EXCLUDED.referrer;

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_user_acquisition',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'user_id', p_user_id,
        'raw_meta', p_raw_meta
      ),
      'critical'
    );
    RAISE;
end;$function$
```
</details>

### `iam.step_create_user_data(p_user_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_create_user_data(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_data (id, user_id, created_at)
  VALUES (gen_random_uuid(), p_user_id, now());

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_user_data',
      'signup',
      SQLERRM,
      jsonb_build_object('user_id', p_user_id),
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
    PERFORM public.log_system_error(
      'trigger', 'step_create_user_organization_preferences', 'signup',
      SQLERRM, jsonb_build_object('user_id', p_user_id, 'org_id', p_org_id), 'critical'
    );
    RAISE;
END;
$function$
```
</details>

### `iam.step_create_user_preferences(p_user_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_create_user_preferences(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$BEGIN
  INSERT INTO iam.user_preferences (user_id) VALUES (p_user_id);
EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger', 'step_create_user_preferences', 'signup',
      SQLERRM, jsonb_build_object('user_id', p_user_id), 'critical'
    );
    RAISE;
END;$function$
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
 SET search_path TO 'public', 'iam'
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
