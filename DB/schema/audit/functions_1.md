# Database Schema (Auto-generated)
> Generated: 2026-02-25T18:05:07.898Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [AUDIT] Functions (chunk 1: audit_subcontract_payments — log_labor_price_activity)

### `audit.audit_subcontract_payments()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.audit_subcontract_payments()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'finance', 'public'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
    subcontract_name text;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD; audit_action := 'delete_subcontract_payment';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (NEW.status = 'void' AND OLD.status != 'void') THEN
            audit_action := 'void_subcontract_payment';
        ELSE
            audit_action := 'update_subcontract_payment';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW; audit_action := 'create_subcontract_payment';
        resolved_member_id := NEW.created_by;
    END IF;

    -- NUEVO: Obtener nombre del subcontrato relacionado
    SELECT name INTO subcontract_name 
    FROM finance.subcontracts 
    WHERE id = target_record.subcontract_id;

    -- Incluir name en metadata
    audit_metadata := jsonb_build_object(
        'name', COALESCE(subcontract_name, 'Pago'),
        'amount', target_record.amount, 
        'currency', target_record.currency_id
    );

    BEGIN
        INSERT INTO audit.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'subcontract_payments', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_activity(p_organization_id uuid, p_user_id uuid, p_action text, p_target_table text, p_target_id uuid, p_metadata jsonb)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_activity(p_organization_id uuid, p_user_id uuid, p_action text, p_target_table text, p_target_id uuid, p_metadata jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
begin
  insert into audit.organization_activity_logs (
    organization_id,
    user_id,
    action,
    target_table,
    target_id,
    metadata,
    created_at
  )
  values (
    p_organization_id,
    p_user_id,
    p_action,
    p_target_table,
    p_target_id,
    coalesce(p_metadata, '{}'::jsonb),
    now()
  );
end;
$function$
```
</details>

### `audit.log_client_commitment_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_client_commitment_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid; audit_action text; audit_metadata jsonb; target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN target_record := OLD; audit_action := 'delete_commitment'; resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN target_record := NEW; 
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN audit_action := 'delete_commitment'; ELSE audit_action := 'update_commitment'; END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN target_record := NEW; audit_action := 'create_commitment'; resolved_member_id := NEW.created_by; END IF;
    audit_metadata := jsonb_build_object('amount', target_record.amount, 'currency_id', target_record.currency_id);
    BEGIN INSERT INTO audit.organization_activity_logs (organization_id, member_id, action, target_id, target_table, metadata)
    VALUES (target_record.organization_id, resolved_member_id, audit_action, target_record.id, 'client_commitments', audit_metadata);
    EXCEPTION WHEN OTHERS THEN NULL; END;
    RETURN NULL;
END; $function$
```
</details>

### `audit.log_client_payment_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_client_payment_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
AS $function$
DECLARE
    resolved_member_id uuid; audit_action text; audit_metadata jsonb; target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN target_record := OLD; audit_action := 'delete_payment'; resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN target_record := NEW; 
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN audit_action := 'delete_payment'; ELSE audit_action := 'update_payment'; END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN target_record := NEW; audit_action := 'create_payment'; resolved_member_id := NEW.created_by; END IF;
    audit_metadata := jsonb_build_object('amount', target_record.amount, 'date', target_record.payment_date, 'status', target_record.status);
    BEGIN INSERT INTO audit.organization_activity_logs (organization_id, member_id, action, target_id, target_table, metadata)
    VALUES (target_record.organization_id, resolved_member_id, audit_action, target_record.id, 'client_payments', audit_metadata);
    EXCEPTION WHEN OTHERS THEN NULL; END;
    RETURN NULL;
END; $function$
```
</details>

### `audit.log_client_role_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_client_role_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
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

    BEGIN INSERT INTO audit.organization_activity_logs (organization_id, member_id, action, target_id, target_table, metadata)
    VALUES (target_record.organization_id, resolved_member_id, audit_action, target_record.id, 'client_roles', audit_metadata);
    EXCEPTION WHEN OTHERS THEN NULL; END;
    RETURN NULL;
END; $function$
```
</details>

### `audit.log_construction_task_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_construction_task_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'catalog', 'public'
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
        FROM catalog.tasks t WHERE t.id = target_record.task_id;
    ELSE
        task_name := target_record.custom_name;
    END IF;

    audit_metadata := jsonb_build_object(
        'task_name', task_name,
        'quantity', target_record.quantity,
        'status', target_record.status,
        'progress', target_record.progress_percent
    );

    BEGIN
        INSERT INTO audit.organization_activity_logs (
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
        NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_contact_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_contact_activity()
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
        INSERT INTO audit.organization_activity_logs (
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

### `audit.log_contact_category_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_contact_category_activity()
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
        INSERT INTO audit.organization_activity_logs (
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

### `audit.log_external_actor_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_external_actor_activity()
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
        audit_action := 'delete_external_actor';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_external_actor';
        ELSIF (OLD.is_active = false AND NEW.is_active = true) THEN
            audit_action := 'reactivate_external_actor';
        ELSE
            audit_action := 'update_external_actor';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_external_actor';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'actor_type', target_record.actor_type,
        'user_id', target_record.user_id,
        'is_active', target_record.is_active
    );

    BEGIN
        INSERT INTO audit.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'organization_external_actors', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `audit.log_financial_movement_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_financial_movement_activity()
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
        INSERT INTO audit.organization_activity_logs (
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

### `audit.log_financial_operation_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_financial_operation_activity()
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
        INSERT INTO audit.organization_activity_logs (
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

### `audit.log_general_cost_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_general_cost_activity()
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
        INSERT INTO audit.organization_activity_logs (
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

### `audit.log_general_cost_category_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_general_cost_category_activity()
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
        INSERT INTO audit.organization_activity_logs (
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

### `audit.log_general_costs_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_general_costs_activity()
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
        INSERT INTO audit.organization_activity_logs (
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

### `audit.log_general_costs_payments_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_general_costs_payments_activity()
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
        INSERT INTO audit.organization_activity_logs (
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

### `audit.log_import_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_import_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
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

### `audit.log_import_batch_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION audit.log_import_batch_activity()
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
        INSERT INTO audit.organization_activity_logs (
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
        INSERT INTO audit.organization_activity_logs (
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
 SET search_path TO 'audit', 'contacts', 'projects'
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
    FROM projects.project_labor pl
    JOIN contacts.contacts c ON c.id = pl.contact_id
    WHERE pl.id = target_record.labor_id;

    audit_metadata := jsonb_build_object(
        'worker_name', v_contact_name,
        'amount', target_record.amount,
        'status', target_record.status
    );

    BEGIN
        INSERT INTO audit.organization_activity_logs (
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
        INSERT INTO audit.organization_activity_logs (
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
