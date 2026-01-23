-- ============================================================================
-- CALENDAR EVENTS SCHEMA
-- ============================================================================
-- Feature: Agenda/Calendar - Events with duration and source linking
-- Date: 2026-01-23
-- ============================================================================

-- ============================================================================
-- 1. PERMISSIONS
-- ============================================================================

INSERT INTO public.permissions (key, description, category, is_system)
VALUES 
  ('calendar.view', 'Ver eventos del calendario', 'calendar', true),
  ('calendar.manage', 'Gestionar eventos del calendario', 'calendar', true)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 2. MAIN TABLE: calendar_events
-- ============================================================================
-- Supports:
-- - Punctual events (start_at only) or with duration (start_at + end_at)
-- - All-day events (is_all_day = true)
-- - Polymorphic linking to sources (kanban_card, payment, sitelog, etc)
-- - Recurrence (optional, for future expansion)
-- - Organization and optional Project scoping

CREATE TABLE IF NOT EXISTS public.calendar_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Event Details
    title text NOT NULL,
    description text,
    location text,
    color text, -- Hex color for display (e.g., '#3b82f6')
    
    -- Timing
    start_at timestamptz NOT NULL,
    end_at timestamptz, -- NULL = punctual event
    is_all_day boolean NOT NULL DEFAULT false,
    timezone text DEFAULT 'America/Argentina/Buenos_Aires',
    
    -- Source Linking (polymorphic)
    -- When an event comes from another entity in the system
    source_type text, -- 'kanban_card', 'payment', 'sitelog', 'quote_milestone', 'task', etc.
    source_id uuid, -- ID of the source record
    
    -- Recurrence (for future - simple pattern)
    recurrence_rule text, -- RRULE format (e.g., 'FREQ=WEEKLY;BYDAY=MO,WE,FR')
    recurrence_end_at timestamptz,
    parent_event_id uuid REFERENCES public.calendar_events(id) ON DELETE CASCADE, -- For recurring instances
    
    -- Status
    status text NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
    
    -- Metadata & Audit
    created_by uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    is_deleted boolean NOT NULL DEFAULT false,
    
    -- Constraints
    CONSTRAINT valid_source CHECK (
        (source_type IS NULL AND source_id IS NULL) OR 
        (source_type IS NOT NULL AND source_id IS NOT NULL)
    ),
    CONSTRAINT valid_recurrence CHECK (
        (recurrence_rule IS NULL AND parent_event_id IS NULL) OR
        (recurrence_rule IS NOT NULL) OR
        (parent_event_id IS NOT NULL)
    )
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_org_id ON public.calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project_id ON public.calendar_events(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_at ON public.calendar_events(start_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_source ON public.calendar_events(source_type, source_id) WHERE source_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON public.calendar_events(status) WHERE is_deleted = false;

-- ============================================================================
-- 3. EVENT ATTENDEES (for future multi-user events)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.calendar_event_attendees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
    member_id uuid NOT NULL REFERENCES public.organization_members(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'tentative'
    created_at timestamptz NOT NULL DEFAULT now(),
    
    UNIQUE(event_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON public.calendar_event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_member_id ON public.calendar_event_attendees(member_id);

-- ============================================================================
-- 4. EVENT REMINDERS (for future notifications)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.calendar_event_reminders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
    remind_at timestamptz NOT NULL, -- When to send the reminder
    reminder_type text NOT NULL DEFAULT 'notification', -- 'notification', 'email'
    is_sent boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_reminders_event_id ON public.calendar_event_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_remind_at ON public.calendar_event_reminders(remind_at) WHERE is_sent = false;

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_event_reminders ENABLE ROW LEVEL SECURITY;

-- calendar_events
CREATE POLICY "MIEMBROS VEN CALENDAR_EVENTS"
ON public.calendar_events
FOR SELECT
TO public
USING (
    can_view_org(organization_id, 'calendar.view'::text)
);

CREATE POLICY "MIEMBROS CREAN CALENDAR_EVENTS"
ON public.calendar_events
FOR INSERT
TO public
WITH CHECK (
    can_mutate_org(organization_id, 'calendar.manage'::text)
);

CREATE POLICY "MIEMBROS EDITAN CALENDAR_EVENTS"
ON public.calendar_events
FOR UPDATE
TO public
USING (
    can_mutate_org(organization_id, 'calendar.manage'::text)
);

-- calendar_event_attendees (inherited from parent event)
CREATE POLICY "MIEMBROS VEN CALENDAR_EVENT_ATTENDEES"
ON public.calendar_event_attendees
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM public.calendar_events e
        WHERE e.id = event_id
        AND can_view_org(e.organization_id, 'calendar.view'::text)
    )
);

CREATE POLICY "MIEMBROS CREAN CALENDAR_EVENT_ATTENDEES"
ON public.calendar_event_attendees
FOR INSERT
TO public
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.calendar_events e
        WHERE e.id = event_id
        AND can_mutate_org(e.organization_id, 'calendar.manage'::text)
    )
);

CREATE POLICY "MIEMBROS EDITAN CALENDAR_EVENT_ATTENDEES"
ON public.calendar_event_attendees
FOR UPDATE
TO public
USING (
    EXISTS (
        SELECT 1 FROM public.calendar_events e
        WHERE e.id = event_id
        AND can_mutate_org(e.organization_id, 'calendar.manage'::text)
    )
);

-- calendar_event_reminders (inherited from parent event)
CREATE POLICY "MIEMBROS VEN CALENDAR_EVENT_REMINDERS"
ON public.calendar_event_reminders
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM public.calendar_events e
        WHERE e.id = event_id
        AND can_view_org(e.organization_id, 'calendar.view'::text)
    )
);

CREATE POLICY "MIEMBROS CREAN CALENDAR_EVENT_REMINDERS"
ON public.calendar_event_reminders
FOR INSERT
TO public
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.calendar_events e
        WHERE e.id = event_id
        AND can_mutate_org(e.organization_id, 'calendar.manage'::text)
    )
);

-- ============================================================================
-- 6. AUDIT TRIGGERS
-- ============================================================================

-- Auto-populate created_by and updated_by
DROP TRIGGER IF EXISTS set_updated_by_calendar_events ON public.calendar_events;
CREATE TRIGGER set_updated_by_calendar_events
BEFORE INSERT OR UPDATE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- Activity logging
CREATE OR REPLACE FUNCTION public.log_calendar_event_activity()
RETURNS TRIGGER AS $$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_calendar_event';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_calendar_event';
        ELSE
            audit_action := 'update_calendar_event';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_calendar_event';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'title', target_record.title,
        'start_at', target_record.start_at,
        'source_type', target_record.source_type
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id,
            resolved_member_id,
            audit_action,
            target_record.id,
            'calendar_events',
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Silently skip if org/member no longer exists
    END;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_calendar_event_audit ON public.calendar_events;
CREATE TRIGGER on_calendar_event_audit
AFTER INSERT OR UPDATE OR DELETE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION public.log_calendar_event_activity();

-- ============================================================================
-- 7. PERMISSION MIGRATION FOR EXISTING ORGS
-- ============================================================================

DO $$
DECLARE
    v_view_perm_id uuid;
    v_manage_perm_id uuid;
BEGIN
    SELECT id INTO v_view_perm_id FROM permissions WHERE key = 'calendar.view';
    SELECT id INTO v_manage_perm_id FROM permissions WHERE key = 'calendar.manage';

    -- ADMIN: Add both permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, v_view_perm_id
    FROM roles r
    WHERE r.name = 'Administrador' AND r.is_system = false AND r.organization_id IS NOT NULL
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, v_manage_perm_id
    FROM roles r
    WHERE r.name = 'Administrador' AND r.is_system = false AND r.organization_id IS NOT NULL
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- EDITOR: Add view and manage
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, v_view_perm_id
    FROM roles r
    WHERE r.name = 'Editor' AND r.is_system = false AND r.organization_id IS NOT NULL
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, v_manage_perm_id
    FROM roles r
    WHERE r.name = 'Editor' AND r.is_system = false AND r.organization_id IS NOT NULL
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- LECTOR: View only
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, v_view_perm_id
    FROM roles r
    WHERE r.name = 'Lector' AND r.is_system = false AND r.organization_id IS NOT NULL
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    RAISE NOTICE 'Calendar permissions migration completed';
END $$;

-- ============================================================================
-- 8. UPDATE step_assign_org_role_permissions
-- ============================================================================
-- NOTE: You need to manually update the function in Supabase to include:
-- 
-- For EDITOR:
--   'calendar.view',
--   'calendar.manage',
--
-- For LECTOR:
--   'calendar.view',

-- ============================================================================
-- 9. SOURCE TYPES REFERENCE
-- ============================================================================
-- These are the valid source_type values that can link to calendar events:
--
-- | source_type       | Source Table        | Description                     |
-- |-------------------|---------------------|---------------------------------|
-- | 'kanban_card'     | kanban_cards        | Task with due date              |
-- | 'payment'         | client_payments     | Payment due date                |
-- | 'general_payment' | general_cost_payments| Cost payment date              |
-- | 'quote_milestone' | quote_milestones    | Quote milestone date            |
-- | 'sitelog'         | sitelog_entries     | Site log scheduled date         |
-- | 'task'            | tasks               | Project task (future)           |
-- | 'material_order'  | material_purchases  | Material delivery date          |
-- | NULL              | -                   | Standalone event (no source)    |

