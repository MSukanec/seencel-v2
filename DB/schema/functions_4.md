# Database Schema (Auto-generated)
> Generated: 2026-02-16T18:36:44.978Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## Functions & Procedures (chunk 4: log_client_role_activity — log_labor_price_activity)

### `log_client_role_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_client_role_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid; audit_action text; audit_metadata jsonb; target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN target_record := OLD; audit_action := 'delete_role'; resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN target_record := NEW; 
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN audit_action := 'delete_role'; ELSE audit_action := 'update_role'; END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN target_record := NEW; audit_action := 'create_role'; resolved_member_id := NEW.created_by; END IF;

    -- Ignorar roles de sistema (sin organización)
    IF target_record.organization_id IS NULL THEN RETURN NULL; END IF;

    audit_metadata := jsonb_build_object('name', target_record.name, 'is_system', target_record.is_system);

    BEGIN INSERT INTO public.organization_activity_logs (organization_id, member_id, action, target_id, target_table, metadata)
    VALUES (target_record.organization_id, resolved_member_id, audit_action, target_record.id, 'client_roles', audit_metadata);
    EXCEPTION WHEN OTHERS THEN NULL; END;
    RETURN NULL;
END; $function$
```
</details>

### `log_construction_task_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_construction_task_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
    task_name text;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_construction_task';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_construction_task';
        ELSIF (OLD.status IS DISTINCT FROM NEW.status) THEN
            audit_action := 'update_construction_task_status';
        ELSE
            audit_action := 'update_construction_task';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_construction_task';
        resolved_member_id := NEW.created_by;
    END IF;

    -- Obtener nombre de la tarea (del catálogo o custom)
    IF target_record.task_id IS NOT NULL THEN
        SELECT COALESCE(t.custom_name, t.name) INTO task_name
        FROM tasks t WHERE t.id = target_record.task_id;
    ELSE
        task_name := target_record.custom_name;
    END IF;

    audit_metadata := jsonb_build_object(
        'task_name', task_name,
        'quantity', target_record.quantity,
        'status', target_record.status,
        'progress', target_record.progress_percent
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
            'construction_tasks',
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

### `log_contact_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_contact_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_contact';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        audit_action := 'update_contact';
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_contact';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('name', COALESCE(target_record.full_name, target_record.first_name, 'Contact'));

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'contacts', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_contact_category_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_contact_category_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_contact_type';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        audit_action := 'update_contact_type';
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_contact_type';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('name', target_record.name);

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'contact_types', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_financial_movement_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_financial_movement_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD; 
        audit_action := 'delete_financial_movement';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_financial_movement';
        ELSE
            audit_action := 'update_financial_movement';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW; 
        audit_action := 'create_financial_movement';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'direction', target_record.direction,
        'amount', target_record.amount
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'financial_operation_movements', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_financial_operation_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_financial_operation_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD; 
        audit_action := 'delete_financial_operation';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_financial_operation';
        ELSE
            audit_action := 'update_financial_operation';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW; 
        audit_action := 'create_financial_operation';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'type', target_record.type,
        'description', target_record.description
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'financial_operations', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_general_cost_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_general_cost_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_cost';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_cost';
        ELSE
            audit_action := 'update_cost';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_cost';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('name', target_record.name);

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'general_costs', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL; END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_general_cost_category_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_general_cost_category_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_cost_category';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_cost_category';
        ELSE
            audit_action := 'update_cost_category';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_cost_category';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('name', target_record.name);

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'general_cost_categories', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignorar si la organización ya no existe
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_general_costs_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_general_costs_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_general_cost';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_general_cost'; -- Soft Delete cuenta como delete
        ELSIF (OLD.is_deleted = true AND NEW.is_deleted = false) THEN
            audit_action := 'restore_general_cost';
        ELSE
            audit_action := 'update_general_cost';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_general_cost';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'name', target_record.name,
        'amount', 0 -- Opcional: si la tabla tuviera monto base, aquí iría
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'general_costs', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_general_costs_payments_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_general_costs_payments_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    target_record := NEW;
    
    IF (TG_OP = 'INSERT') THEN
         audit_action := 'create_general_cost_payment';
         resolved_member_id := NEW.created_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Detectar Soft Delete
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_general_cost_payment';
        ELSIF (OLD.is_deleted = true AND NEW.is_deleted = false) THEN
            audit_action := 'restore_general_cost_payment';
        ELSE
            audit_action := 'update_general_cost_payment';
        END IF;
        resolved_member_id := NEW.updated_by;
    END IF;

    -- Metadata enriquecida: guardamos monto y moneda para ver rápido de qué pago hablamos
    -- Nota: Podríamos hacer un JOIN para sacar el símbolo de la moneda, pero para no complicar el trigger
    -- guardamos solo IDs y montos crudos.
    audit_metadata := jsonb_build_object(
        'amount', target_record.amount,
        'payment_date', target_record.payment_date,
        'reference', target_record.reference
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'general_costs_payments', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_import_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_import_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO activity_log (
        organization_id,
        member_id,
        entity_type,
        entity_id,
        action,
        metadata,
        created_at
    ) VALUES (
        NEW.organization_id,
        NEW.member_id,  -- Cambiado de NEW.user_id
        'import_batch',
        NEW.id,
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'created'
            WHEN TG_OP = 'UPDATE' THEN 'updated'
            ELSE TG_OP
        END,
        jsonb_build_object(
            'entity_type', NEW.entity_type,
            'record_count', NEW.record_count,
            'status', NEW.status
        ),
        NOW()
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- No bloquear la operación si falla el log
        RETURN NEW;
END;
$function$
```
</details>

### `log_import_batch_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_import_batch_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_import_batch';
        resolved_member_id := NULL;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        audit_action := 'update_import_batch';
        resolved_member_id := NEW.imported_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_import_batch';
        resolved_member_id := NEW.imported_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'file_name', target_record.file_name,
        'status', target_record.status
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'import_batches', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_kanban_board_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_kanban_board_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_kanban_board';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_kanban_board';
        ELSIF (OLD.is_archived = false AND NEW.is_archived = true) THEN
            audit_action := 'archive_kanban_board';
        ELSIF (OLD.is_archived = true AND NEW.is_archived = false) THEN
            audit_action := 'unarchive_kanban_board';
        ELSE
            audit_action := 'update_kanban_board';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_kanban_board';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'name', target_record.name,
        'project_id', target_record.project_id
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id,
            resolved_member_id,
            audit_action,
            target_record.id,
            'kanban_boards',
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

### `log_kanban_card_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_kanban_card_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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
        audit_action := 'delete_kanban_card';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_archived = false AND NEW.is_archived = true) THEN
            audit_action := 'archive_kanban_card';
        ELSIF (OLD.is_archived = true AND NEW.is_archived = false) THEN
            audit_action := 'unarchive_kanban_card';
        ELSIF (OLD.is_completed = false AND NEW.is_completed = true) THEN
            audit_action := 'complete_kanban_card';
        ELSIF (OLD.list_id IS DISTINCT FROM NEW.list_id) THEN
            audit_action := 'move_kanban_card';
        ELSE
            audit_action := 'update_kanban_card';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_kanban_card';
        resolved_member_id := NEW.created_by;
    END IF;

    -- Get organization_id from the board
    SELECT organization_id INTO org_id
    FROM kanban_boards
    WHERE id = target_record.board_id;

    audit_metadata := jsonb_build_object(
        'title', target_record.title,
        'board_id', target_record.board_id
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            org_id,
            resolved_member_id,
            audit_action,
            target_record.id,
            'kanban_cards',
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

### `log_kanban_child_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_kanban_child_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_org_id uuid;
  v_member_id uuid;
  v_action text;
  v_entity_name text;
  v_metadata jsonb;
  v_target_record RECORD;
  v_record_json jsonb; -- New variable for safe field access
  v_current_uid uuid;
  v_name_or_title text;
BEGIN
  -- 1. Determine Entity Name
  IF TG_TABLE_NAME = 'kanban_lists' THEN
    v_entity_name := 'kanban_list';
  ELSIF TG_TABLE_NAME = 'kanban_cards' THEN
    v_entity_name := 'kanban_card';
  ELSE
    v_entity_name := TG_TABLE_NAME;
  END IF;
  -- 2. Determine Action & Target Record
  IF TG_OP = 'UPDATE' THEN
    v_target_record := NEW;
    v_org_id := NEW.organization_id;
    
    IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
        v_action := 'delete_' || v_entity_name;
    ELSIF (OLD.is_deleted = true AND NEW.is_deleted = false) THEN
        v_action := 'restore_' || v_entity_name;
    ELSE
        v_action := 'update_' || v_entity_name;
    END IF;
    
  ELSIF TG_OP = 'INSERT' THEN
    v_target_record := NEW;
    v_org_id := NEW.organization_id;
    v_action := 'create_' || v_entity_name;
    
  ELSIF TG_OP = 'DELETE' THEN
    v_target_record := OLD;
    v_org_id := OLD.organization_id;
    v_action := 'delete_' || v_entity_name;
  END IF;
  -- 3. Resolve Member ID (Safe field access via JSON or direct if common)
  -- Convert to JSON for safe access to everything
  v_record_json := to_jsonb(v_target_record);
  IF TG_OP = 'INSERT' THEN
     -- Cast from text to uuid safely? Or just trust implicit cast 
     -- (Note: extraction from jsonb returns text, need cast for uuid)
     IF (v_record_json->>'created_by') IS NOT NULL THEN
         v_member_id := (v_record_json->>'created_by')::uuid;
     END IF;
  ELSE
     IF (v_record_json->>'updated_by') IS NOT NULL THEN
         v_member_id := (v_record_json->>'updated_by')::uuid;
     END IF;
  END IF;
  -- Fallback: Resolve from auth.uid()
  IF v_member_id IS NULL THEN
      v_current_uid := auth.uid();
      IF v_current_uid IS NOT NULL AND v_org_id IS NOT NULL THEN
          SELECT om.id INTO v_member_id
          FROM public.organization_members om
          JOIN public.users u ON u.id = om.user_id
          WHERE u.auth_id = v_current_uid
          AND om.organization_id = v_org_id
          LIMIT 1;
      END IF;
  END IF;
  -- 4. Prepare Metadata (Safe Access)
  -- Use COALESCE on JSON fields to find a display name
  v_name_or_title := COALESCE(v_record_json->>'name', v_record_json->>'title', 'Unknown');
  
  v_metadata := jsonb_build_object(
    'name', v_name_or_title
  );
  -- 5. Insert (Safe)
  BEGIN
      INSERT INTO public.organization_activity_logs (
        organization_id,
        member_id,
        action,
        target_table,
        target_id,
        metadata,
        created_at
      ) VALUES (
        v_org_id,
        v_member_id,
        v_action,
        TG_TABLE_NAME,
        (v_record_json->>'id')::uuid, -- Safe extraction
        v_metadata,
        now()
      );
  EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Audit Log Failed: %', SQLERRM;
  END;
  RETURN COALESCE(NEW, OLD);
END;
$function$
```
</details>

### `log_kanban_comment_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_kanban_comment_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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

### `log_kanban_label_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_kanban_label_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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

### `log_labor_category_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_labor_category_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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

### `log_labor_payment_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_labor_payment_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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

### `log_labor_price_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_labor_price_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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
