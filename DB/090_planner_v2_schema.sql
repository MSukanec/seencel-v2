-- ============================================================================
-- PLANNER V2: Complete Schema Rebuild
-- ============================================================================
-- Fecha: 2026-02-22
-- Descripción: Sistema unificado de planificación. Tasks y Events son la misma
--              entidad (planner.items). Kanban y Calendar son vistas de la misma data.
-- 
-- NOTA: Este script NO borra las tablas viejas (kanban_*, calendar_*).
--       Se ejecuta primero este script, luego se migra el frontend, y recién
--       después se ejecuta un script separado para DROP de tablas legacy.
--
-- IMPORTANTE: Después de ejecutar este script, hay que ejecutar 091 para
--             actualizar handle_new_organization (default board/lists).
-- ============================================================================

-- ============================================================================
-- 1. TABLAS CORE
-- ============================================================================

-- 1.1 Boards (tableros Kanban)
CREATE TABLE IF NOT EXISTS planner.boards (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    project_id      uuid,
    name            text NOT NULL,
    description     text,
    color           text,
    icon            text,
    default_list_id uuid,                               -- Se setea después de crear lists
    is_template     boolean NOT NULL DEFAULT false,
    template_id     uuid REFERENCES planner.boards(id),
    settings        jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_archived     boolean NOT NULL DEFAULT false,
    is_deleted      boolean NOT NULL DEFAULT false,
    deleted_at      timestamptz,
    created_by      uuid,
    updated_by      uuid,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 1.2 Lists (columnas del Kanban)
CREATE TABLE IF NOT EXISTS planner.lists (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id        uuid NOT NULL REFERENCES planner.boards(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL,
    name            text NOT NULL,
    position        int NOT NULL DEFAULT 0,
    color           text,
    limit_wip       int,
    auto_complete   boolean NOT NULL DEFAULT false,
    is_collapsed    boolean NOT NULL DEFAULT false,
    is_deleted      boolean NOT NULL DEFAULT false,
    deleted_at      timestamptz,
    created_by      uuid,
    updated_by      uuid,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 1.3 Items (TABLA NÚCLEO — tasks y events unificados)
CREATE TABLE IF NOT EXISTS planner.items (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    project_id      uuid,

    -- Tipo
    item_type       text NOT NULL DEFAULT 'task',
    
    -- Contenido
    title           text NOT NULL,
    description     text,
    color           text,
    
    -- Tiempo
    start_at        timestamptz,                        -- Inicio (nullable para tasks sin fecha)
    due_at          timestamptz,                        -- Deadline (tasks)
    end_at          timestamptz,                        -- Fin de evento (events)
    is_all_day      boolean NOT NULL DEFAULT true,
    timezone        text DEFAULT 'America/Argentina/Buenos_Aires',
    
    -- Estado (tasks)
    status          text NOT NULL DEFAULT 'todo',
    priority        text NOT NULL DEFAULT 'none',
    is_completed    boolean NOT NULL DEFAULT false,
    completed_at    timestamptz,
    
    -- Esfuerzo (tasks)
    estimated_hours numeric,
    actual_hours    numeric,
    
    -- Asignación
    assigned_to     uuid,                               -- member_id
    
    -- Evento específico
    location        text,
    recurrence_rule text,                               -- iCal RRULE string
    recurrence_end_at timestamptz,
    parent_item_id  uuid REFERENCES planner.items(id),  -- Para instancias de recurrencia
    
    -- Vinculación con otras entidades Seencel
    source_type     text,                               -- 'payment', 'quote_milestone', 'sitelog', etc.
    source_id       uuid,
    
    -- Visual (kanban cards)
    cover_image_url text,
    cover_color     text,
    
    -- Kanban posicionamiento (directo en items, sin tabla aparte)
    board_id        uuid REFERENCES planner.boards(id),
    list_id         uuid REFERENCES planner.lists(id),
    position        int NOT NULL DEFAULT 0,
    
    -- Soft delete + archive
    is_archived     boolean NOT NULL DEFAULT false,
    archived_at     timestamptz,
    is_deleted      boolean NOT NULL DEFAULT false,
    deleted_at      timestamptz,
    
    -- Auditoría
    created_by      uuid,
    updated_by      uuid,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT items_valid_type CHECK (item_type IN ('task', 'event')),
    CONSTRAINT items_valid_status CHECK (status IN ('todo', 'doing', 'done', 'blocked', 'cancelled')),
    CONSTRAINT items_valid_priority CHECK (priority IN ('none', 'low', 'medium', 'high', 'urgent'))
);

-- ============================================================================
-- 2. TABLAS DE EXTENSIÓN (funcionan para tasks Y events)
-- ============================================================================

-- 2.1 Labels (etiquetas por organización)
CREATE TABLE IF NOT EXISTS planner.labels (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    name            text NOT NULL,
    color           text NOT NULL DEFAULT '#6366f1',
    description     text,
    position        int NOT NULL DEFAULT 0,
    is_default      boolean NOT NULL DEFAULT false,
    created_by      uuid,
    updated_by      uuid,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, name)
);

-- 2.2 Item-Label (M2M)
CREATE TABLE IF NOT EXISTS planner.item_labels (
    item_id     uuid NOT NULL REFERENCES planner.items(id) ON DELETE CASCADE,
    label_id    uuid NOT NULL REFERENCES planner.labels(id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    created_by  uuid,
    PRIMARY KEY (item_id, label_id)
);

-- 2.3 Checklists
CREATE TABLE IF NOT EXISTS planner.checklists (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id     uuid NOT NULL REFERENCES planner.items(id) ON DELETE CASCADE,
    title       text NOT NULL DEFAULT 'Checklist',
    position    int NOT NULL DEFAULT 0,
    created_by  uuid,
    updated_by  uuid,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2.4 Checklist Items
CREATE TABLE IF NOT EXISTS planner.checklist_items (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id    uuid NOT NULL REFERENCES planner.checklists(id) ON DELETE CASCADE,
    content         text NOT NULL,
    is_completed    boolean NOT NULL DEFAULT false,
    completed_at    timestamptz,
    completed_by    uuid,
    position        int NOT NULL DEFAULT 0,
    due_date        date,
    assigned_to     uuid,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    updated_by      uuid
);

-- 2.5 Comments
CREATE TABLE IF NOT EXISTS planner.comments (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id     uuid NOT NULL REFERENCES planner.items(id) ON DELETE CASCADE,
    author_id   uuid,
    content     text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz,
    updated_by  uuid
);

-- 2.6 Mentions
CREATE TABLE IF NOT EXISTS planner.mentions (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id          uuid NOT NULL REFERENCES planner.comments(id) ON DELETE CASCADE,
    mentioned_member_id uuid NOT NULL,
    is_read             boolean NOT NULL DEFAULT false,
    read_at             timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now()
);

-- 2.7 Attachments
CREATE TABLE IF NOT EXISTS planner.attachments (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id     uuid NOT NULL REFERENCES planner.items(id) ON DELETE CASCADE,
    file_url    text NOT NULL,
    file_name   text,
    uploaded_by uuid,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz,
    updated_by  uuid
);

-- 2.8 Item Watchers (M2M)
CREATE TABLE IF NOT EXISTS planner.item_watchers (
    item_id     uuid NOT NULL REFERENCES planner.items(id) ON DELETE CASCADE,
    member_id   uuid NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (item_id, member_id)
);

-- 2.9 Attendees (para events/reuniones)
CREATE TABLE IF NOT EXISTS planner.attendees (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id     uuid NOT NULL REFERENCES planner.items(id) ON DELETE CASCADE,
    member_id   uuid NOT NULL,
    status      text NOT NULL DEFAULT 'pending',
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (item_id, member_id),
    CONSTRAINT attendees_valid_status CHECK (status IN ('pending', 'accepted', 'declined', 'tentative'))
);

-- 2.10 Reminders (tasks + events)
CREATE TABLE IF NOT EXISTS planner.reminders (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id         uuid NOT NULL REFERENCES planner.items(id) ON DELETE CASCADE,
    remind_at       timestamptz NOT NULL,
    reminder_type   text NOT NULL DEFAULT 'notification',
    is_sent         boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- 2.11 Board Permissions
CREATE TABLE IF NOT EXISTS planner.board_permissions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id        uuid NOT NULL REFERENCES planner.boards(id) ON DELETE CASCADE,
    member_id       uuid,
    role_id         uuid,
    permission_level text NOT NULL DEFAULT 'view',
    created_by      uuid,
    created_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT board_perms_valid_level CHECK (permission_level IN ('view', 'edit', 'admin'))
);

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- 5.1 Auto updated_at (usa función global existente set_timestamp())
CREATE TRIGGER items_set_updated_at BEFORE UPDATE ON planner.items
    FOR EACH ROW EXECUTE FUNCTION set_timestamp();

CREATE TRIGGER boards_set_updated_at BEFORE UPDATE ON planner.boards
    FOR EACH ROW EXECUTE FUNCTION set_timestamp();

CREATE TRIGGER lists_set_updated_at BEFORE UPDATE ON planner.lists
    FOR EACH ROW EXECUTE FUNCTION set_timestamp();

CREATE TRIGGER checklists_set_updated_at BEFORE UPDATE ON planner.checklists
    FOR EACH ROW EXECUTE FUNCTION set_timestamp();

CREATE TRIGGER checklist_items_set_updated_at BEFORE UPDATE ON planner.checklist_items
    FOR EACH ROW EXECUTE FUNCTION set_timestamp();

CREATE TRIGGER labels_set_updated_at BEFORE UPDATE ON planner.labels
    FOR EACH ROW EXECUTE FUNCTION set_timestamp();

CREATE TRIGGER attachments_set_updated_at BEFORE UPDATE ON planner.attachments
    FOR EACH ROW EXECUTE FUNCTION set_timestamp();

-- 5.2 Auto updated_by (usa función global existente handle_updated_by())
CREATE TRIGGER set_updated_by_items BEFORE INSERT OR UPDATE ON planner.items
    FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

CREATE TRIGGER set_updated_by_boards BEFORE INSERT OR UPDATE ON planner.boards
    FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

CREATE TRIGGER set_updated_by_lists BEFORE INSERT OR UPDATE ON planner.lists
    FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

CREATE TRIGGER set_updated_by_checklists BEFORE UPDATE ON planner.checklists
    FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

CREATE TRIGGER set_updated_by_checklist_items BEFORE UPDATE ON planner.checklist_items
    FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

CREATE TRIGGER set_updated_by_labels BEFORE UPDATE ON planner.labels
    FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

CREATE TRIGGER set_updated_by_comments BEFORE INSERT OR UPDATE ON planner.comments
    FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

CREATE TRIGGER set_updated_by_attachments BEFORE UPDATE ON planner.attachments
    FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

-- 5.3 Auto-complete: mover item a lista con auto_complete → marcar como completado
CREATE OR REPLACE FUNCTION planner.auto_complete_item()
RETURNS trigger
LANGUAGE plpgsql
AS $$
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
$$;

CREATE TRIGGER trg_auto_complete_item BEFORE INSERT OR UPDATE OF list_id ON planner.items
    FOR EACH ROW EXECUTE FUNCTION planner.auto_complete_item();

-- 5.4 Set board_id automáticamente desde list_id
CREATE OR REPLACE FUNCTION planner.set_item_board_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.list_id IS NOT NULL AND (NEW.board_id IS NULL OR NEW.list_id IS DISTINCT FROM OLD.list_id) THEN
        SELECT board_id INTO NEW.board_id
        FROM planner.lists
        WHERE id = NEW.list_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_item_board_id BEFORE INSERT OR UPDATE OF list_id ON planner.items
    FOR EACH ROW EXECUTE FUNCTION planner.set_item_board_id();

-- 5.5 Audit: log item activity
CREATE OR REPLACE FUNCTION planner.log_item_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'audit', 'planner'
AS $$
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
$$;

CREATE TRIGGER trg_audit_items AFTER INSERT OR UPDATE OR DELETE ON planner.items
    FOR EACH ROW EXECUTE FUNCTION planner.log_item_activity();

-- 5.6 Audit: log board activity
CREATE OR REPLACE FUNCTION planner.log_board_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'audit', 'planner'
AS $$
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
$$;

CREATE TRIGGER trg_audit_boards AFTER INSERT OR UPDATE OR DELETE ON planner.boards
    FOR EACH ROW EXECUTE FUNCTION planner.log_board_activity();

-- 5.7 Audit: log comment activity
CREATE OR REPLACE FUNCTION planner.log_comment_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'audit', 'planner'
AS $$
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
$$;

CREATE TRIGGER trg_audit_comments AFTER INSERT OR UPDATE OR DELETE ON planner.comments
    FOR EACH ROW EXECUTE FUNCTION planner.log_comment_activity();

-- ============================================================================
-- 6. INDEXES
-- ============================================================================

-- Calendar: items con fechas en un rango temporal
CREATE INDEX idx_items_calendar ON planner.items (organization_id, start_at)
    WHERE is_deleted = false AND (start_at IS NOT NULL OR due_at IS NOT NULL);

-- Kanban: items de un board/list, ordenados por posición
CREATE INDEX idx_items_board_list ON planner.items (board_id, list_id, position)
    WHERE is_deleted = false AND item_type = 'task';

-- My Tasks: items asignados a un miembro con deadline
CREATE INDEX idx_items_assigned ON planner.items (assigned_to, due_at)
    WHERE is_deleted = false AND is_completed = false;

-- Proyecto: items de un proyecto específico
CREATE INDEX idx_items_project ON planner.items (project_id, item_type)
    WHERE is_deleted = false;

-- Source linking: buscar items vinculados a otras entidades
CREATE INDEX idx_items_source ON planner.items (source_type, source_id)
    WHERE source_type IS NOT NULL;

-- Org-level: items por organización y tipo
CREATE INDEX idx_items_org_type ON planner.items (organization_id, item_type)
    WHERE is_deleted = false;

-- Boards por org
CREATE INDEX idx_boards_org ON planner.boards (organization_id)
    WHERE is_deleted = false;

-- Lists por board
CREATE INDEX idx_lists_board ON planner.lists (board_id, position)
    WHERE is_deleted = false;

-- Labels por org
CREATE INDEX idx_labels_org ON planner.labels (organization_id);

-- Comments por item
CREATE INDEX idx_comments_item ON planner.comments (item_id, created_at);

-- Checklists por item
CREATE INDEX idx_checklists_item ON planner.checklists (item_id);

-- Checklist items por checklist
CREATE INDEX idx_checklist_items_checklist ON planner.checklist_items (checklist_id, position);

-- Attachments por item
CREATE INDEX idx_attachments_item ON planner.attachments (item_id);

-- Reminders pendientes (para job de envío)
CREATE INDEX idx_reminders_pending ON planner.reminders (remind_at)
    WHERE is_sent = false;

-- ============================================================================
-- 7. VIEWS
-- ============================================================================

-- 7.1 Vista enriquecida de boards
CREATE OR REPLACE VIEW planner.boards_view AS
SELECT
    b.id,
    b.name,
    b.description,
    b.color,
    b.icon,
    b.organization_id,
    b.project_id,
    b.is_template,
    b.is_archived,
    b.created_at,
    b.updated_at,
    b.created_by,
    p.name AS project_name,
    (SELECT count(*) FROM planner.lists WHERE board_id = b.id AND is_deleted = false) AS list_count,
    (SELECT count(*) FROM planner.items WHERE board_id = b.id AND is_deleted = false AND is_archived = false) AS item_count,
    (SELECT count(*) FROM planner.items WHERE board_id = b.id AND is_completed = true AND is_deleted = false AND is_archived = false) AS completed_item_count
FROM planner.boards b
LEFT JOIN projects.projects p ON p.id = b.project_id
WHERE b.is_deleted = false;

-- 7.2 Vista enriquecida de items (para Kanban board rendering)
CREATE OR REPLACE VIEW planner.items_view AS
SELECT
    i.id,
    i.title,
    i.description,
    i.item_type,
    i.color,
    i.priority,
    i.status,
    i.start_at,
    i.due_at,
    i.end_at,
    i.is_all_day,
    i.is_completed,
    i.completed_at,
    i.position,
    i.cover_color,
    i.cover_image_url,
    i.estimated_hours,
    i.actual_hours,
    i.location,
    i.recurrence_rule,
    i.source_type,
    i.source_id,
    i.created_at,
    i.updated_at,
    i.list_id,
    i.board_id,
    i.organization_id,
    i.project_id,
    i.assigned_to,
    i.is_archived,
    l.name AS list_name,
    l.position AS list_position,
    brd.name AS board_name,
    m.user_id AS assigned_to_user_id,
    -- Computed aggregates
    (SELECT count(*) FROM planner.comments WHERE item_id = i.id) AS comment_count,
    (SELECT count(*) FROM planner.attachments WHERE item_id = i.id) AS attachment_count,
    (SELECT count(*) FROM planner.checklist_items ci
     JOIN planner.checklists ch ON ch.id = ci.checklist_id
     WHERE ch.item_id = i.id) AS total_checklist_items,
    (SELECT count(*) FROM planner.checklist_items ci
     JOIN planner.checklists ch ON ch.id = ci.checklist_id
     WHERE ch.item_id = i.id AND ci.is_completed = true) AS completed_checklist_items,
    (SELECT array_agg(jsonb_build_object('id', lb.id, 'name', lb.name, 'color', lb.color))
     FROM planner.item_labels il
     JOIN planner.labels lb ON lb.id = il.label_id
     WHERE il.item_id = i.id) AS labels
FROM planner.items i
LEFT JOIN planner.lists l ON l.id = i.list_id
LEFT JOIN planner.boards brd ON brd.id = i.board_id
LEFT JOIN iam.organization_members m ON m.id = i.assigned_to
WHERE i.is_deleted = false AND i.is_archived = false;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
-- Siguiente paso: ejecutar 091_update_handle_new_org_for_planner_v2.sql
-- para actualizar la función handle_new_organization con las nuevas tablas.
-- ============================================================================
