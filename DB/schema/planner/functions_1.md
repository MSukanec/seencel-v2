# Database Schema (Auto-generated)
> Generated: 2026-03-01T21:32:52.143Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PLANNER] Functions (chunk 1: auto_complete_item — set_item_board_id)

### `planner.auto_complete_item()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION planner.auto_complete_item()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_auto_complete boolean;
BEGIN
    IF NEW.list_id IS NOT NULL THEN
        SELECT auto_complete INTO v_auto_complete
        FROM planner.lists
        WHERE id = NEW.list_id;
        
        IF v_auto_complete = true AND NEW.is_completed = false THEN
            NEW.is_completed := true;
            NEW.completed_at := now();
            NEW.status := 'done';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$
```
</details>

### `planner.log_board_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION planner.log_board_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'planner'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_planner_board';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_planner_board';
        ELSIF (OLD.is_archived = false AND NEW.is_archived = true) THEN
            audit_action := 'archive_planner_board';
        ELSE
            audit_action := 'update_planner_board';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_planner_board';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('name', target_record.name);

    BEGIN
        INSERT INTO audit.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id,
            resolved_member_id,
            audit_action,
            target_record.id,
            'planner.boards',
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN COALESCE(NEW, OLD);
END;
$function$
```
</details>

### `planner.log_comment_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION planner.log_comment_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'planner'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    v_org_id uuid;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_planner_comment';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_planner_comment';
        resolved_member_id := NEW.author_id;
    ELSE
        target_record := NEW;
        audit_action := 'update_planner_comment';
        resolved_member_id := NEW.updated_by;
    END IF;

    SELECT organization_id INTO v_org_id FROM planner.items WHERE id = target_record.item_id;

    BEGIN
        INSERT INTO audit.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            v_org_id,
            resolved_member_id,
            audit_action,
            target_record.id,
            'planner.comments',
            jsonb_build_object('item_id', target_record.item_id)
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN COALESCE(NEW, OLD);
END;
$function$
```
</details>

### `planner.log_item_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION planner.log_item_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'planner'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_planner_item';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
            audit_action := 'delete_planner_item';
        ELSIF (OLD.is_completed = false AND NEW.is_completed = true) THEN
            audit_action := 'complete_planner_item';
        ELSIF (OLD.is_archived = false AND NEW.is_archived = true) THEN
            audit_action := 'archive_planner_item';
        ELSE
            audit_action := 'update_planner_item';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_planner_item';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'title', target_record.title,
        'item_type', target_record.item_type,
        'status', target_record.status,
        'board_id', target_record.board_id
    );

    BEGIN
        INSERT INTO audit.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id,
            resolved_member_id,
            audit_action,
            target_record.id,
            'planner.items',
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Audit no falla la operación principal
    END;

    RETURN COALESCE(NEW, OLD);
END;
$function$
```
</details>

### `planner.set_item_board_id()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION planner.set_item_board_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.list_id IS NOT NULL AND (NEW.board_id IS NULL OR NEW.list_id IS DISTINCT FROM OLD.list_id) THEN
        SELECT board_id INTO NEW.board_id
        FROM planner.lists
        WHERE id = NEW.list_id;
    END IF;
    RETURN NEW;
END;
$function$
```
</details>
