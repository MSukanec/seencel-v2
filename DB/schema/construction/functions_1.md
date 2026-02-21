# Database Schema (Auto-generated)
> Generated: 2026-02-21T16:30:21.519Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CONSTRUCTION] Functions (chunk 1: approve_quote_and_create_tasks — get_next_change_order_number)

### `construction.approve_quote_and_create_tasks(p_quote_id uuid, p_member_id uuid DEFAULT NULL::uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION construction.approve_quote_and_create_tasks(p_quote_id uuid, p_member_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'construction', 'public'
AS $function$
DECLARE
    v_quote RECORD;
    v_tasks_created INTEGER := 0;
    v_result JSONB;
BEGIN
    -- ========================================
    -- 1. VALIDATE: Quote exists and is valid
    -- ========================================
    SELECT
        q.id,
        q.status,
        q.project_id,
        q.organization_id,
        q.approved_at
    INTO v_quote
    FROM construction.quotes q
    WHERE q.id = p_quote_id
      AND q.is_deleted = false;

    IF v_quote.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'QUOTE_NOT_FOUND',
            'message', 'El presupuesto no existe o fue eliminado'
        );
    END IF;

    IF v_quote.status = 'approved' OR v_quote.approved_at IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'QUOTE_ALREADY_APPROVED',
            'message', 'Este presupuesto ya fue aprobado',
            'approved_at', v_quote.approved_at
        );
    END IF;

    IF v_quote.project_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'QUOTE_NO_PROJECT',
            'message', 'El presupuesto debe estar asociado a un proyecto para generar tareas de construcción'
        );
    END IF;

    -- ========================================
    -- 2. IDEMPOTENCY: Check no tasks already exist
    -- ========================================
    IF EXISTS (
        SELECT 1
        FROM construction.construction_tasks ct
        INNER JOIN construction.quote_items qi ON ct.quote_item_id = qi.id
        WHERE qi.quote_id = p_quote_id
          AND ct.is_deleted = false
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'TASKS_ALREADY_EXIST',
            'message', 'Ya existen tareas de construcción para este presupuesto'
        );
    END IF;

    -- ========================================
    -- 3. CREATE CONSTRUCTION TASKS from quote_items
    -- ========================================
    INSERT INTO construction.construction_tasks (
        project_id,
        organization_id,
        task_id,
        quote_item_id,
        quantity,
        original_quantity,
        description,
        cost_scope,
        markup_pct,
        status,
        progress_percent,
        created_by
    )
    SELECT
        qi.project_id,
        qi.organization_id,
        qi.task_id,
        qi.id AS quote_item_id,
        qi.quantity,
        qi.quantity AS original_quantity,
        qi.description,
        qi.cost_scope,
        qi.markup_pct,
        'pending'::text,
        0,
        p_member_id
    FROM construction.quote_items qi
    WHERE qi.quote_id = p_quote_id;

    GET DIAGNOSTICS v_tasks_created = ROW_COUNT;

    -- ========================================
    -- 4. UPDATE QUOTE STATUS to approved
    -- ========================================
    UPDATE construction.quotes
    SET
        status      = 'approved',
        approved_at = NOW(),
        approved_by = p_member_id,
        updated_at  = NOW(),
        updated_by  = p_member_id
    WHERE id = p_quote_id;

    -- ========================================
    -- 5. RETURN SUCCESS
    -- ========================================
    RETURN jsonb_build_object(
        'success', true,
        'quote_id', p_quote_id,
        'project_id', v_quote.project_id,
        'tasks_created', v_tasks_created,
        'approved_at', NOW(),
        'approved_by', p_member_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'UNEXPECTED_ERROR',
            'message', SQLERRM,
            'detail', SQLSTATE
        );
END;
$function$
```
</details>

### `construction.get_next_change_order_number(p_contract_id uuid)`

- **Returns**: integer
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION construction.get_next_change_order_number(p_contract_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    next_number INT;
BEGIN
    SELECT COALESCE(MAX(change_order_number), 0) + 1
    INTO next_number
    FROM construction.quotes
    WHERE parent_quote_id = p_contract_id
      AND quote_type = 'change_order'
      AND is_deleted = FALSE;

    RETURN next_number;
END;
$function$
```
</details>
