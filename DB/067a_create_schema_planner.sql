-- ============================================================================
-- 067a: Create schema PLANNER + migrate kanban & calendar tables
-- ============================================================================

-- 1. Create schema
CREATE SCHEMA IF NOT EXISTS planner;

-- 2. Grant access
GRANT USAGE ON SCHEMA planner TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA planner TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA planner TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA planner GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA planner GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ============================================================================
-- 3. Move tables using ALTER TABLE SET SCHEMA (preserves FKs, indexes, triggers)
-- ============================================================================

-- 3.1 Kanban tables (order matters for FK dependencies)
-- Parent tables first
ALTER TABLE public.kanban_boards SET SCHEMA planner;
ALTER TABLE public.kanban_labels SET SCHEMA planner;

-- Tables that reference kanban_boards
ALTER TABLE public.kanban_board_permissions SET SCHEMA planner;
ALTER TABLE public.kanban_lists SET SCHEMA planner;

-- Tables that reference kanban_lists and kanban_boards
ALTER TABLE public.kanban_cards SET SCHEMA planner;

-- Tables that reference kanban_cards
ALTER TABLE public.kanban_attachments SET SCHEMA planner;
ALTER TABLE public.kanban_card_labels SET SCHEMA planner;
ALTER TABLE public.kanban_card_watchers SET SCHEMA planner;
ALTER TABLE public.kanban_checklists SET SCHEMA planner;
ALTER TABLE public.kanban_comments SET SCHEMA planner;

-- Tables that reference kanban_checklists
ALTER TABLE public.kanban_checklist_items SET SCHEMA planner;

-- Tables that reference kanban_comments
ALTER TABLE public.kanban_mentions SET SCHEMA planner;

-- 3.2 Calendar tables
ALTER TABLE public.calendar_events SET SCHEMA planner;
ALTER TABLE public.calendar_event_attendees SET SCHEMA planner;
ALTER TABLE public.calendar_event_reminders SET SCHEMA planner;

-- ============================================================================
-- 4. Drop existing views (they reference old schema paths)
-- ============================================================================
DROP VIEW IF EXISTS public.kanban_boards_view;
DROP VIEW IF EXISTS public.kanban_cards_view;

-- ============================================================================
-- 5. Recreate views in planner schema
-- ============================================================================

CREATE OR REPLACE VIEW planner.kanban_boards_view AS
SELECT b.id,
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
    (SELECT count(*) FROM planner.kanban_lists WHERE kanban_lists.board_id = b.id) AS list_count,
    (SELECT count(*) FROM planner.kanban_cards c JOIN planner.kanban_lists l ON l.id = c.list_id
     WHERE l.board_id = b.id AND c.is_archived = false) AS card_count,
    (SELECT count(*) FROM planner.kanban_cards c JOIN planner.kanban_lists l ON l.id = c.list_id
     WHERE l.board_id = b.id AND c.is_completed = true AND c.is_archived = false) AS completed_card_count
FROM planner.kanban_boards b
LEFT JOIN projects.projects p ON p.id = b.project_id
WHERE b.is_deleted = false;

CREATE OR REPLACE VIEW planner.kanban_cards_view AS
SELECT c.id,
    c.title,
    c.description,
    c.priority,
    c.due_date,
    c.start_date,
    c.is_completed,
    c.completed_at,
    c.position,
    c.cover_color,
    c.cover_image_url,
    c.estimated_hours,
    c.actual_hours,
    c.created_at,
    c.updated_at,
    c.list_id,
    c.board_id,
    l.name AS list_name,
    l.position AS list_position,
    b.name AS board_name,
    b.organization_id,
    b.project_id,
    c.assigned_to,
    m.user_id AS assigned_to_user_id,
    (SELECT count(*) FROM planner.kanban_comments WHERE kanban_comments.card_id = c.id) AS comment_count,
    (SELECT count(*) FROM planner.kanban_attachments WHERE kanban_attachments.card_id = c.id) AS attachment_count,
    (SELECT count(*) FROM planner.kanban_checklist_items ci
     JOIN planner.kanban_checklists ch ON ch.id = ci.checklist_id
     WHERE ch.card_id = c.id) AS total_checklist_items,
    (SELECT count(*) FROM planner.kanban_checklist_items ci
     JOIN planner.kanban_checklists ch ON ch.id = ci.checklist_id
     WHERE ch.card_id = c.id AND ci.is_completed = true) AS completed_checklist_items,
    (SELECT array_agg(jsonb_build_object('id', lb.id, 'name', lb.name, 'color', lb.color))
     FROM planner.kanban_card_labels cl
     JOIN planner.kanban_labels lb ON lb.id = cl.label_id
     WHERE cl.card_id = c.id) AS labels
FROM planner.kanban_cards c
JOIN planner.kanban_lists l ON l.id = c.list_id
JOIN planner.kanban_boards b ON b.id = c.board_id
LEFT JOIN iam.organization_members m ON m.id = c.assigned_to
WHERE c.is_archived = false;

-- ============================================================================
-- 6. Drop old functions CASCADE (auto-drops dependent triggers)
-- ============================================================================
DROP FUNCTION IF EXISTS public.kanban_auto_complete_card() CASCADE;
DROP FUNCTION IF EXISTS public.kanban_set_card_board_id() CASCADE;
DROP FUNCTION IF EXISTS public.kanban_set_updated_at() CASCADE;

-- ============================================================================
-- 8. Recreate functions in planner schema
-- ============================================================================
CREATE OR REPLACE FUNCTION planner.kanban_auto_complete_card()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  list_auto_complete boolean;
BEGIN
  SELECT auto_complete INTO list_auto_complete
  FROM planner.kanban_lists
  WHERE id = NEW.list_id;
  
  IF list_auto_complete = true AND NEW.is_completed = false THEN
    NEW.is_completed := true;
    NEW.completed_at := now();
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION planner.kanban_set_card_board_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.board_id IS NULL AND NEW.list_id IS NOT NULL THEN
    SELECT board_id INTO NEW.board_id
    FROM planner.kanban_lists
    WHERE id = NEW.list_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION planner.kanban_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- 9. Recreate triggers with new function references
-- ============================================================================
CREATE TRIGGER kanban_auto_complete_card
  BEFORE INSERT OR UPDATE OF list_id ON planner.kanban_cards
  FOR EACH ROW
  EXECUTE FUNCTION planner.kanban_auto_complete_card();

CREATE TRIGGER kanban_set_card_board_id
  BEFORE INSERT OR UPDATE OF list_id ON planner.kanban_cards
  FOR EACH ROW
  EXECUTE FUNCTION planner.kanban_set_card_board_id();

CREATE TRIGGER kanban_set_updated_at
  BEFORE UPDATE ON planner.kanban_boards
  FOR EACH ROW
  EXECUTE FUNCTION planner.kanban_set_updated_at();

CREATE TRIGGER kanban_set_updated_at
  BEFORE UPDATE ON planner.kanban_cards
  FOR EACH ROW
  EXECUTE FUNCTION planner.kanban_set_updated_at();

CREATE TRIGGER kanban_set_updated_at
  BEFORE UPDATE ON planner.kanban_lists
  FOR EACH ROW
  EXECUTE FUNCTION planner.kanban_set_updated_at();

-- ============================================================================
-- 8. Update iam.step_create_default_kanban_board to use planner schema
-- ============================================================================
CREATE OR REPLACE FUNCTION iam.step_create_default_kanban_board(p_org_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'planner', 'iam'
AS $function$
DECLARE
  v_board_id uuid := gen_random_uuid();
BEGIN
  -- Deshabilitar triggers temporalmente
  ALTER TABLE planner.kanban_boards DISABLE TRIGGER set_updated_by_kanban_boards;
  
  INSERT INTO planner.kanban_boards (
    id,
    organization_id,
    project_id,
    name,
    description,
    color,
    position,
    is_archived,
    created_at,
    updated_at,
    created_by,
    updated_by
  )
  VALUES (
    v_board_id,
    p_org_id,
    NULL,
    'Mi Panel',
    'Panel de tareas principal',
    '#6366f1',
    0,
    false,
    now(),
    now(),
    NULL,
    NULL
  );
  
  -- Re-habilitar triggers
  ALTER TABLE planner.kanban_boards ENABLE TRIGGER set_updated_by_kanban_boards;

  RETURN v_board_id;
END;
$function$;
