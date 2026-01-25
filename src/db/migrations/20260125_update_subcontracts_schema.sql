-- ============================================
-- Migration: Update Subcontracts Table Schema (Fix Data Violation)
-- Description: Adds missing columns, sanitized data, constraints, and triggers
-- ============================================

-- 1. Alter Table Structure
DO $$
BEGIN
    -- Add functional_amount if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontracts' AND column_name = 'functional_amount') THEN
        ALTER TABLE public.subcontracts ADD COLUMN functional_amount NUMERIC(15, 2);
    END IF;

    -- Add created_by if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontracts' AND column_name = 'created_by') THEN
        ALTER TABLE public.subcontracts ADD COLUMN created_by UUID REFERENCES public.organization_members(id) ON DELETE SET NULL;
    END IF;

    -- Add updated_by if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontracts' AND column_name = 'updated_by') THEN
        ALTER TABLE public.subcontracts ADD COLUMN updated_by UUID REFERENCES public.organization_members(id) ON DELETE SET NULL;
    END IF;

    -- Add is_deleted if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontracts' AND column_name = 'is_deleted') THEN
        ALTER TABLE public.subcontracts ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    END IF;

    -- Ensure organization_id is NOT NULL (Critical)
    -- WARNING: If there are NULL organization_ids, this will fail. We assume data integrity here or user must clean up.
    ALTER TABLE public.subcontracts ALTER COLUMN organization_id SET NOT NULL;

    -- DATA CLEANUP: Sanitize status before adding constraint
    UPDATE public.subcontracts 
    SET status = 'draft' 
    WHERE status IS NULL OR status NOT IN ('draft', 'active', 'completed', 'cancelled');

    -- Update Status Check Constraint (safely)
    BEGIN
        ALTER TABLE public.subcontracts ADD CONSTRAINT check_subcontracts_status 
        CHECK (status IN ('draft', 'active', 'completed', 'cancelled'));
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Constraint already exists
    END;
    
    -- Set default status
    ALTER TABLE public.subcontracts ALTER COLUMN status SET DEFAULT 'draft';

END $$;

-- 2. Indexes (Idempotent)
CREATE INDEX IF NOT EXISTS idx_subcontracts_organization ON public.subcontracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_subcontracts_project ON public.subcontracts(project_id);
CREATE INDEX IF NOT EXISTS idx_subcontracts_status ON public.subcontracts(status);
CREATE INDEX IF NOT EXISTS idx_subcontracts_contact ON public.subcontracts(contact_id);

-- 3. RLS Policies (Drop and Recreate to be safe)
ALTER TABLE public.subcontracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "MIEMBROS VEN SUBCONTRACTS" ON public.subcontracts;
CREATE POLICY "MIEMBROS VEN SUBCONTRACTS" ON public.subcontracts
FOR SELECT TO public
USING (can_view_org(organization_id, 'subcontracts.view'::text));

DROP POLICY IF EXISTS "MIEMBROS CREAN SUBCONTRACTS" ON public.subcontracts;
CREATE POLICY "MIEMBROS CREAN SUBCONTRACTS" ON public.subcontracts
FOR INSERT TO public
WITH CHECK (can_mutate_org(organization_id, 'subcontracts.manage'::text));

DROP POLICY IF EXISTS "MIEMBROS EDITAN SUBCONTRACTS" ON public.subcontracts;
CREATE POLICY "MIEMBROS EDITAN SUBCONTRACTS" ON public.subcontracts
FOR UPDATE TO public
USING (can_mutate_org(organization_id, 'subcontracts.manage'::text));

-- 4. Triggers (Drop and Recreate)

-- 4.1. Updated At
DROP TRIGGER IF EXISTS set_subcontracts_updated_at ON public.subcontracts;
CREATE TRIGGER set_subcontracts_updated_at
  BEFORE UPDATE ON public.subcontracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4.2. Audit Users
DROP TRIGGER IF EXISTS set_updated_by_subcontracts ON public.subcontracts;
CREATE TRIGGER set_updated_by_subcontracts
  BEFORE INSERT OR UPDATE ON public.subcontracts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- 4.3. Functional Amount
CREATE OR REPLACE FUNCTION public.set_subcontract_functional_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.functional_amount := public.calculate_functional_amount(
        NEW.amount_total, NEW.exchange_rate, NEW.currency_id, NEW.organization_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_functional_amount_subcontracts ON public.subcontracts;
CREATE TRIGGER set_functional_amount_subcontracts
  BEFORE INSERT OR UPDATE OF amount_total, exchange_rate, currency_id
  ON public.subcontracts
  FOR EACH ROW EXECUTE FUNCTION public.set_subcontract_functional_amount();

-- 4.4. Audit Logging
CREATE OR REPLACE FUNCTION public.log_subcontract_activity()
RETURNS TRIGGER AS $$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD; audit_action := 'delete_subcontract';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_subcontract';
        ELSE
            audit_action := 'update_subcontract';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW; audit_action := 'create_subcontract';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('title', target_record.title);

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'subcontracts', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_subcontract_audit ON public.subcontracts;
CREATE TRIGGER on_subcontract_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.subcontracts
  FOR EACH ROW EXECUTE FUNCTION public.log_subcontract_activity();

-- 5. Permissions (Idempotent)
DO $$
DECLARE 
  v_view uuid; 
  v_manage uuid;
BEGIN
  -- Insert Permissions
  INSERT INTO public.permissions (key, description, category, is_system)
  VALUES 
    ('subcontracts.view', 'Ver subcontratos', 'subcontracts', true),
    ('subcontracts.manage', 'Gestionar subcontratos', 'subcontracts', true)
  ON CONFLICT (key) DO NOTHING;

  -- Get IDs
  SELECT id INTO v_view FROM permissions WHERE key = 'subcontracts.view';
  SELECT id INTO v_manage FROM permissions WHERE key = 'subcontracts.manage';

  -- Admin
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_view FROM roles r WHERE r.name = 'Administrador' AND r.is_system = false AND r.organization_id IS NOT NULL ON CONFLICT DO NOTHING;
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_manage FROM roles r WHERE r.name = 'Administrador' AND r.is_system = false AND r.organization_id IS NOT NULL ON CONFLICT DO NOTHING;

  -- Editor
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_view FROM roles r WHERE r.name = 'Editor' AND r.is_system = false AND r.organization_id IS NOT NULL ON CONFLICT DO NOTHING;
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_manage FROM roles r WHERE r.name = 'Editor' AND r.is_system = false AND r.organization_id IS NOT NULL ON CONFLICT DO NOTHING;

  -- Lector
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_view FROM roles r WHERE r.name = 'Lector' AND r.is_system = false AND r.organization_id IS NOT NULL ON CONFLICT DO NOTHING;
END $$;
