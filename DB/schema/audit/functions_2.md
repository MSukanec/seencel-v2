# Database Schema (Auto-generated)
> Generated: 2026-02-21T19:23:32.061Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [AUDIT] Functions (chunk 2: log_kanban_comment_activity — log_quote_item_activity)

### `audit.log_kanban_comment_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_kanban_comment_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
    org_id uuid;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_kanban_comment';
        resolved_member_id := OLD.author_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        audit_action := 'update_kanban_comment';
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_kanban_comment';
        resolved_member_id := NEW.author_id;
    END IF;

    -- Get organization_id from the card -> board
    SELECT b.organization_id INTO org_id
    FROM kanban_cards c
    JOIN kanban_boards b ON b.id = c.board_id
    WHERE c.id = target_record.card_id;

    audit_metadata := jsonb_build_object(
        'card_id', target_record.card_id
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            org_id,
            resolved_member_id,
            audit_action,
            target_record.id,
            'kanban_comments',
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_kanban_label_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_kanban_label_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_kanban_label';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        audit_action := 'update_kanban_label';
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_kanban_label';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'name', target_record.name,
        'color', target_record.color
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id,
            resolved_member_id,
            audit_action,
            target_record.id,
            'kanban_labels',
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_labor_category_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_labor_category_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    -- Solo auditar registros de organización, NO de sistema
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        IF target_record.is_system = true THEN RETURN NULL; END IF;
        audit_action := 'delete_labor_category';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF target_record.is_system = true THEN RETURN NULL; END IF;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_labor_category';
        ELSE
            audit_action := 'update_labor_category';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        IF target_record.is_system = true THEN RETURN NULL; END IF;
        audit_action := 'create_labor_category';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('name', target_record.name);

    -- CRITICAL: Exception handler for cascade deletes
    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'labor_categories', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_labor_payment_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_labor_payment_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
    v_contact_name text;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_labor_payment';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_labor_payment';
        ELSE
            audit_action := 'update_labor_payment';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_labor_payment';
        resolved_member_id := NEW.created_by;
    END IF;

    -- Obtener nombre del trabajador para metadata
    SELECT COALESCE(c.full_name, c.first_name || ' ' || c.last_name, 'Sin nombre')
    INTO v_contact_name
    FROM public.project_labor pl
    JOIN public.contacts c ON c.id = pl.contact_id
    WHERE pl.id = target_record.labor_id;

    audit_metadata := jsonb_build_object(
        'worker_name', v_contact_name,
        'amount', target_record.amount,
        'status', target_record.status
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, 
            resolved_member_id,
            audit_action, 
            target_record.id, 
            'labor_payments', 
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_labor_price_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_labor_price_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_labor_price';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        audit_action := 'update_labor_price';
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_labor_price';
        resolved_member_id := NEW.created_by;
    END IF;

    -- Metadata con información del precio
    audit_metadata := jsonb_build_object(
        'labor_type_id', target_record.labor_type_id,
        'unit_price', target_record.unit_price,
        'currency_id', target_record.currency_id
    );

    -- Insert con exception handler para evitar errores en cascade deletes
    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, 
            resolved_member_id,
            audit_action, 
            target_record.id, 
            'labor_prices', 
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_material_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_material_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    -- Skip logging for system materials (no organization_id)
    IF (TG_OP = 'DELETE' AND OLD.organization_id IS NULL) OR
       (TG_OP IN ('INSERT', 'UPDATE') AND NEW.organization_id IS NULL) THEN
        RETURN NULL;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_material';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        -- Detect soft delete
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_material';
        ELSE
            audit_action := 'update_material';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_material';
        resolved_member_id := NEW.created_by;
    END IF;

    -- Build metadata with relevant info
    audit_metadata := jsonb_build_object(
        'name', target_record.name,
        'material_type', target_record.material_type,
        'is_system', target_record.is_system
    );

    -- CRITICAL: Wrap in exception handler for cascade deletes
    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id,
            resolved_member_id,
            audit_action,
            target_record.id,
            'materials',
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        -- Silently skip if org/member no longer exists (cascade delete in progress)
        NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_material_payment_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_material_payment_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_material_payment';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_material_payment';
        ELSE
            audit_action := 'update_material_payment';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_material_payment';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'amount', target_record.amount,
        'currency_id', target_record.currency_id,
        'payment_date', target_record.payment_date,
        'reference', target_record.reference
    );

    -- CRITICAL: Wrap in exception handler for cascade deletes
    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id,
            resolved_member_id,
            audit_action,
            target_record.id,
            'material_payments',
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        -- Silently skip if org/member no longer exists (cascade delete in progress)
        NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_media_file_folder_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_media_file_folder_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_media_file_folder';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_media_file_folder';
        ELSE
            audit_action := 'update_media_file_folder';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_media_file_folder';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('name', target_record.name);

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'media_file_folders', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_member_billable_change()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_member_billable_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO organization_member_events (organization_id, member_id, user_id, event_type, is_billable)
    VALUES (NEW.organization_id, NEW.id, NEW.user_id, 'member_added', NEW.is_billable);
  ELSIF TG_OP = 'UPDATE' AND OLD.is_billable IS DISTINCT FROM NEW.is_billable THEN
    INSERT INTO organization_member_events (organization_id, member_id, user_id, event_type, was_billable, is_billable)
    VALUES (NEW.organization_id, NEW.id, NEW.user_id, 'billable_changed', OLD.is_billable, NEW.is_billable);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO organization_member_events (organization_id, member_id, user_id, event_type, was_billable)
    VALUES (OLD.organization_id, OLD.id, OLD.user_id, 'member_removed', OLD.is_billable);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$
```
</details>

### `audit.log_organization_data_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_organization_data_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_organization_data';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        audit_action := 'update_organization_data';
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_organization_data';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'city', target_record.city,
        'country', target_record.country
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'organization_data', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_organizations_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_organizations_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public', 'iam'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_organization';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_organization';
        ELSE
            audit_action := 'update_organization';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_organization';
        BEGIN
            SELECT id INTO resolved_member_id
            FROM iam.organization_members
            WHERE user_id = NEW.created_by AND organization_id = NEW.id
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;

    audit_metadata := jsonb_build_object(
        'name', target_record.name,
        'plan_id', target_record.plan_id
    );

    BEGIN
        IF resolved_member_id IS NOT NULL THEN
            INSERT INTO public.organization_activity_logs (
                organization_id, member_id, action, target_id, target_table, metadata
            ) VALUES (
                target_record.id,
                resolved_member_id,
                audit_action,
                target_record.id,
                'organizations',
                audit_metadata
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_payment_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_payment_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'billing', 'iam', 'public'
AS $function$
DECLARE
    v_member_id uuid;
    v_action text;
BEGIN
    -- Solo pagos completados con organización
    IF NEW.status <> 'completed' OR NEW.organization_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Buscar member_id
    SELECT id INTO v_member_id
    FROM iam.organization_members
    WHERE organization_id = NEW.organization_id
      AND user_id = NEW.user_id
    LIMIT 1;

    -- Construir action name
    v_action := NEW.product_type || '_purchased';

    -- Insertar en activity logs
    INSERT INTO public.organization_activity_logs (
        organization_id, member_id, action,
        target_table, target_id, metadata
    ) VALUES (
        NEW.organization_id,
        v_member_id,
        v_action,
        'payments',
        NEW.id,
        jsonb_build_object(
            'amount', NEW.amount,
            'currency', NEW.currency,
            'product_type', NEW.product_type,
            'provider', COALESCE(NEW.provider, NEW.gateway),
            'user_id', NEW.user_id
        ) || COALESCE(
            -- Incluir metadata extra relevante (seats, billing_period, etc.)
            jsonb_strip_nulls(jsonb_build_object(
                'seats_purchased', NEW.metadata->>'seats_purchased',
                'billing_period', NEW.metadata->>'billing_period',
                'is_upgrade', NEW.metadata->>'upgrade'
            )),
            '{}'::jsonb
        )
    );

    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'log_payment_activity error: %', SQLERRM;
    RETURN NEW;
END;
$function$
```
</details>

### `audit.log_project_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_project_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_project';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        
        -- DETECT SOFT DELETE
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
             audit_action := 'delete_project';
        ELSIF (OLD.is_deleted = true AND NEW.is_deleted = false) THEN
             audit_action := 'restore_project';
        ELSE
             -- NOISE FILTER: ignore updates that only touch last_active_at, updated_at, updated_by
             -- Columnas de color se movieron a project_settings, ya no están en esta tabla
             IF (
                NEW.name = OLD.name AND
                NEW.organization_id = OLD.organization_id AND
                NEW.is_active = OLD.is_active AND
                NEW.status = OLD.status AND
                NEW.color IS NOT DISTINCT FROM OLD.color AND
                NEW.code IS NOT DISTINCT FROM OLD.code AND
                NEW.is_over_limit IS NOT DISTINCT FROM OLD.is_over_limit AND
                NEW.image_url IS NOT DISTINCT FROM OLD.image_url AND
                NEW.image_palette IS NOT DISTINCT FROM OLD.image_palette AND
                NEW.project_type_id IS NOT DISTINCT FROM OLD.project_type_id AND
                NEW.project_modality_id IS NOT DISTINCT FROM OLD.project_modality_id
             ) THEN
                RETURN NULL; -- Squelch the log
             END IF;

             audit_action := 'update_project';
        END IF;

        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_project';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'name', target_record.name,
        'code', target_record.code
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, 
            resolved_member_id,
            audit_action, 
            target_record.id, 
            'projects', 
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN 
        NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_project_client_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_project_client_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid; audit_action text; audit_metadata jsonb; target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN target_record := OLD; audit_action := 'delete_client'; resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN target_record := NEW; 
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN audit_action := 'delete_client'; ELSE audit_action := 'update_client'; END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN target_record := NEW; audit_action := 'create_client'; resolved_member_id := NEW.created_by; END IF;
    audit_metadata := jsonb_build_object('status', target_record.status, 'contact_id', target_record.contact_id);
    BEGIN INSERT INTO public.organization_activity_logs (organization_id, member_id, action, target_id, target_table, metadata)
    VALUES (target_record.organization_id, resolved_member_id, audit_action, target_record.id, 'project_clients', audit_metadata);
    EXCEPTION WHEN OTHERS THEN NULL; END;
    RETURN NULL;
END; $function$
```
</details>

### `audit.log_project_data_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_project_data_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_project_data';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        audit_action := 'update_project_data';
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_project_data';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('project_id', target_record.project_id);

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'project_data', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_project_labor_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_project_labor_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
    v_contact_name text;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_project_labor';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_project_labor';
        ELSE
            audit_action := 'update_project_labor';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_project_labor';
        resolved_member_id := NEW.created_by;
    END IF;

    SELECT COALESCE(full_name, first_name || ' ' || last_name, 'Sin nombre')
    INTO v_contact_name
    FROM public.contacts
    WHERE id = target_record.contact_id;

    audit_metadata := jsonb_build_object(
        'contact_name', v_contact_name,
        'status', target_record.status
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, 
            resolved_member_id,
            audit_action, 
            target_record.id, 
            'project_labor', 
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_project_modality_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_project_modality_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_project_modality';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        audit_action := 'update_project_modality';
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_project_modality';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('name', target_record.name);

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'project_modalities', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_project_type_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_project_type_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_project_type';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        audit_action := 'update_project_type';
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_project_type';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('name', target_record.name);

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'project_types', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_quote_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_quote_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_quote';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        -- Check for soft-delete pattern (if is_deleted column exists)
        -- For quotes, we check status change to detect meaningful changes
        IF (OLD.status <> NEW.status) THEN
            IF (NEW.status = 'approved') THEN
                audit_action := 'approve_quote';
            ELSIF (NEW.status = 'rejected') THEN
                audit_action := 'reject_quote';
            ELSIF (NEW.status = 'sent') THEN
                audit_action := 'send_quote';
            ELSE
                audit_action := 'update_quote';
            END IF;
        ELSE
            audit_action := 'update_quote';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_quote';
        resolved_member_id := NEW.created_by;
    END IF;

    -- Build metadata with useful context
    audit_metadata := jsonb_build_object(
        'name', target_record.name,
        'quote_type', target_record.quote_type,
        'status', target_record.status,
        'version', target_record.version
    );

    -- Add optional fields if they exist
    IF target_record.project_id IS NOT NULL THEN
        audit_metadata := audit_metadata || jsonb_build_object('project_id', target_record.project_id);
    END IF;
    IF target_record.client_id IS NOT NULL THEN
        audit_metadata := audit_metadata || jsonb_build_object('client_id', target_record.client_id);
    END IF;

    -- CRITICAL: Wrap in exception handler for cascade deletes
    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id,
            resolved_member_id,
            audit_action,
            target_record.id,
            'quotes',
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        -- Silently skip if org/member no longer exists (cascade delete in progress)
        NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_quote_item_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_quote_item_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD; audit_action := 'delete_quote_item';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_quote_item';
        ELSE
            audit_action := 'update_quote_item';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW; audit_action := 'create_quote_item';
        resolved_member_id := NEW.created_by;
    END IF;

    -- Store minimal metadata context
    audit_metadata := jsonb_build_object(
        'description', target_record.description, 
        'quote_id', target_record.quote_id
    );

    -- Exception handler for cascade deletes or missing logs table
    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'quote_items', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>
