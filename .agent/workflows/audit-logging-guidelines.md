---
description: Standards for implementing Activity Logs via DB Triggers
---

# Activity Logging Guidelines

SEENCEL V2 uses a **Trigger-based** architecture for all audit trails. We do NOT log activities manually from the frontend or server actions to ensure data integrity and full coverage.

---

## 1. Modules Already Refactored ✅

The following tables have been fully configured with audit logging:

| Table                  | `updated_by` | `handle_updated_by` Trigger | Log Trigger                    | UI Badge |
|------------------------|:------------:|:---------------------------:|--------------------------------|:--------:|
| `projects`             | ✅           | ✅                          | `log_project_activity`         | ✅       |
| `project_data`         | ✅           | ✅                          | `log_project_data_activity`    | ✅       |
| `project_types`        | ✅           | ✅                          | `log_project_type_activity`    | ✅       |
| `project_modalities`   | ✅           | ✅                          | `log_project_modality_activity`| ✅       |
| `contacts`             | ✅           | ✅                          | `log_contact_activity`         | ✅       |
| `contact_types`        | ✅           | ✅                          | `log_contact_type_activity`    | ✅       |
| `organization_data`    | ✅           | ✅                          | `log_organization_data_activity`| ✅       |
| `kanban_boards`        | ✅           | ✅                          | `log_kanban_board_activity`    | ✅       |
| `kanban_cards`         | ✅           | ✅                          | `log_kanban_card_activity`     | ✅       |
| `kanban_labels`        | ✅           | ✅                          | `log_kanban_label_activity`    | ✅       |
| `kanban_comments`      | ✅           | ✅                          | `log_kanban_comment_activity`  | ✅       |

### Pending (TODO):
- [ ] `tasks`
- [ ] `design_documents`
- [ ] `financial_movements`
- [ ] `organization_members`

---

## 2. Schema Reference

The `organization_activity_logs` table is the single source of truth.

| Column            | Type   | Description                                       |
|-------------------|--------|---------------------------------------------------|
| `organization_id` | UUID   | FK -> `organizations` (NOT Null)                  |
| `member_id`       | UUID   | FK -> `organization_members` (NOT Null)           |
| `action`          | TEXT   | `snake_case` verb (e.g., `create_project`)        |
| `target_table`    | TEXT   | Name of table affected (e.g., `projects`)         |
| `target_id`       | UUID   | UUID of the specific record affected              |
| `metadata`        | JSONB  | Flat JSON with relevant context                   |

---

## 3. Key Schema Relationships (CRITICAL)

```
auth.uid()  -->  public.users.auth_id  -->  public.users.id  -->  organization_members.user_id
```

> [!IMPORTANT]
> `auth.uid()` returns the **Supabase Auth ID**, NOT the internal `users.id`.
> `organization_members.user_id` references `public.users.id`, NOT `auth.uid()`.
> Always JOIN through `public.users` when resolving `member_id` from `auth.uid()`.

---

## 4. Checklist: Auditing a New Feature

When you need to add audit logging to a new table/feature:

- [ ] **Add `updated_by` column** to the target table (FK -> `organization_members.id`).
- [ ] **Create `BEFORE UPDATE` trigger** using `handle_updated_by()` to auto-populate `updated_by`.
- [ ] **Create `AFTER INSERT/UPDATE/DELETE` trigger** to log to `organization_activity_logs`.
- [ ] **Add UI badge** in `activity-logs-data-table.tsx` (module + action configs).
- [ ] **Test** create, update, and soft-delete operations.
- [ ] **Update this file** to mark the module as completed.

---

## 5. SQL Templates

### A. Add `updated_by` Column

```sql
ALTER TABLE public.[TABLE_NAME] 
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.organization_members(id);
```

### B. Auto-Populate `updated_by` (Reusable Function)

This function works for ANY table with `organization_id` and `updated_by` columns.

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_by()
RETURNS TRIGGER AS $$
DECLARE
    current_uid uuid;
    resolved_member_id uuid;
BEGIN
    current_uid := auth.uid();
    
    IF current_uid IS NULL THEN
        RETURN NEW;
    END IF;

    -- CORRECT JOIN: auth.uid -> users.auth_id -> users.id -> organization_members.user_id
    SELECT om.id INTO resolved_member_id
    FROM public.organization_members om
    JOIN public.users u ON u.id = om.user_id
    WHERE u.auth_id = current_uid
      AND om.organization_id = NEW.organization_id
    LIMIT 1;

    IF resolved_member_id IS NOT NULL THEN
        NEW.updated_by := resolved_member_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### C. Apply Trigger to a Table

```sql
DROP TRIGGER IF EXISTS set_updated_by_[TABLE_NAME] ON public.[TABLE_NAME];

CREATE TRIGGER set_updated_by_[TABLE_NAME]
BEFORE UPDATE ON public.[TABLE_NAME]
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();
```

### D. Audit Log Trigger Template

```sql
CREATE OR REPLACE FUNCTION public.log_[ENTITY]_activity()
RETURNS TRIGGER AS $$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_[ENTITY]';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_[ENTITY]';
        ELSE
            audit_action := 'update_[ENTITY]';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_[ENTITY]';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'name', target_record.name
    );

    INSERT INTO public.organization_activity_logs (
        organization_id, member_id, action, target_id, target_table, metadata
    ) VALUES (
        target_record.organization_id,
        resolved_member_id,
        audit_action,
        target_record.id,
        '[TABLE_NAME]',
        audit_metadata
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_[ENTITY]_audit ON public.[TABLE_NAME];
CREATE TRIGGER on_[ENTITY]_audit
AFTER INSERT OR UPDATE OR DELETE ON public.[TABLE_NAME]
FOR EACH ROW EXECUTE FUNCTION public.log_[ENTITY]_activity();
```

---

## 6. UI Badge Configuration

Located in: `src/components/organization/settings/activity-logs-data-table.tsx`

### Module Badges (moduleConfigs)

| `target_table`       | Label              | Icon          | Color   |
|----------------------|--------------------|---------------|---------|
| `projects`           | Proyectos          | FolderKanban  | Violet  |
| `project_types`      | Tipos de Proyecto  | Tag           | Violet  |
| `project_modalities` | Modalidades        | Layers        | Violet  |
| `contacts`           | Contactos          | Users         | Blue    |
| `organization_members`| Miembros          | Users         | Amber   |
| `tasks`              | Tareas             | CheckSquare   | Emerald |
| `design_documents`   | Documentos         | FileText      | Rose    |
| `financial_movements`| Movimientos        | Wallet        | Cyan    |
| `import_batches`     | Importaciones      | Upload        | Orange  |

### Action Badges (actionConfigs)

| Action Verb | Label     | Icon       | Color   |
|-------------|-----------|------------|---------|
| `create`    | Creó      | Plus       | Green   |
| `add`       | Agregó    | Plus       | Green   |
| `update`    | Actualizó | Pencil     | Blue    |
| `delete`    | Eliminó   | Trash2     | Red     |
| `archive`   | Archivó   | Archive    | Gray    |
| `restore`   | Restauró  | RotateCcw  | Emerald |
| `unarchive` | Desarchivó| RotateCcw  | Teal    |
| `import`    | Importó   | Upload     | Purple  |

> [!TIP]
> When adding a new module, add its config to `moduleConfigs`. When adding a new action verb, add it to `actionConfigs`.

---

## 7. Naming Conventions

| Item             | Pattern                          | Example                        |
|------------------|----------------------------------|--------------------------------|
| Function (auto)  | `handle_updated_by`              | `handle_updated_by()`          |
| Trigger (auto)   | `set_updated_by_[TABLE]`         | `set_updated_by_projects`      |
| Function (log)   | `log_[ENTITY]_activity`          | `log_project_activity()`       |
| Trigger (log)    | `on_[ENTITY]_audit`              | `on_project_audit`             |

---

## 8. Common Pitfalls

1. **Wrong ID comparison**: Never compare `auth.uid()` directly with `organization_members.user_id`. Always go through `public.users`.
2. **Missing `updated_by`**: Without this column, you cannot attribute UPDATE/DELETE actions to a user.
3. **SECURITY DEFINER**: All trigger functions should use `SECURITY DEFINER` to ensure they can write to the log table regardless of RLS.
4. **Missing UI Badge**: If you add a new module but forget the badge config, it will show as raw text in the UI.

---

## 9. CRITICAL: Foreign Key Constraints

> [!CAUTION]
> **ALL `updated_by` and `created_by` columns MUST use `ON DELETE SET NULL`.**
> Without this, deleting a user will fail with FK violation errors.

### Correct FK Definition

```sql
-- CORRECT ✅
ALTER TABLE public.[TABLE_NAME] 
ADD COLUMN updated_by uuid REFERENCES public.organization_members(id) ON DELETE SET NULL;

ALTER TABLE public.[TABLE_NAME] 
ADD COLUMN created_by uuid REFERENCES public.organization_members(id) ON DELETE SET NULL;

-- WRONG ❌ (will block user deletion)
ALTER TABLE public.[TABLE_NAME] 
ADD COLUMN updated_by uuid REFERENCES public.organization_members(id);
```

### Why This Matters

When a user is deleted:
1. `auth.users` → cascades to `public.users`
2. `public.users` → cascades to `organization_members`
3. If `updated_by`/`created_by` references `organization_members` without `ON DELETE SET NULL`, the delete **FAILS**.

---

## 10. CRITICAL: Exception Handling in Triggers

> [!CAUTION]
> **ALL audit log triggers MUST wrap INSERTs in exception handlers.**
> Without this, cascade deletes will fail when the trigger tries to log but the org/member no longer exists.

### Correct Trigger Template

```sql
CREATE OR REPLACE FUNCTION public.log_[ENTITY]_activity()
RETURNS TRIGGER AS $$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_[ENTITY]';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        audit_action := 'update_[ENTITY]';
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_[ENTITY]';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('name', target_record.name);

    -- CRITICAL: Wrap in exception handler for cascade deletes
    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, '[TABLE_NAME]', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        -- Silently skip if org/member no longer exists (cascade delete in progress)
        NULL;
    END;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Key Differences from Old Template

| Old (WRONG ❌) | New (CORRECT ✅) |
|--------------|-----------------|
| Direct `INSERT INTO organization_activity_logs` | Wrapped in `BEGIN ... EXCEPTION WHEN OTHERS THEN NULL; END;` |
| FK without `ON DELETE SET NULL` | FK with `ON DELETE SET NULL` |

---

## 11. Checklist Update (REVISED)

When adding audit logging to a new table:

- [ ] **Add `updated_by` column** with `ON DELETE SET NULL`
- [ ] **Add `created_by` column** with `ON DELETE SET NULL`
- [ ] **Create `BEFORE UPDATE` trigger** using `handle_updated_by()`.
- [ ] **Create `AFTER INSERT/UPDATE/DELETE` trigger** with `EXCEPTION WHEN OTHERS` wrapper.
- [ ] **Add UI badge** in both:
  - `src/components/organization/settings/activity-logs-data-table.tsx`
  - `src/components/admin/admin-activity-logs-data-table.tsx`
- [ ] **Test** create, update, soft-delete, AND user deletion operations.
- [ ] **Update this file** to mark the module as completed.
