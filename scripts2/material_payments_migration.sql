-- =============================================
-- MIGRATION: material_payments - Add missing columns, triggers, RLS
-- Date: 2026-01-22
-- =============================================

-- =============================================
-- 1. ADD MISSING COLUMNS
-- =============================================

-- Add updated_by for audit logging (CRITICAL)
ALTER TABLE public.material_payments 
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.organization_members(id) ON DELETE SET NULL;

-- Add functional_amount for multi-currency consolidated calculations
ALTER TABLE public.material_payments 
ADD COLUMN IF NOT EXISTS functional_amount numeric(20, 2) NULL;

-- =============================================
-- 2. TRIGGERS - updated_at, updated_by, functional_amount
-- =============================================

-- Trigger: Auto-populate updated_at
DROP TRIGGER IF EXISTS set_material_payments_updated_at ON public.material_payments;
CREATE TRIGGER set_material_payments_updated_at
BEFORE UPDATE ON public.material_payments
FOR EACH ROW EXECUTE FUNCTION set_timestamp();

-- Trigger: Auto-populate created_by and updated_by
DROP TRIGGER IF EXISTS set_audit_material_payments ON public.material_payments;
CREATE TRIGGER set_audit_material_payments
BEFORE INSERT OR UPDATE ON public.material_payments
FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

-- =============================================
-- 3. FUNCTIONAL AMOUNT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.set_material_payment_functional_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.functional_amount := public.calculate_functional_amount(
        NEW.amount,
        NEW.exchange_rate,
        NEW.currency_id,
        NEW.organization_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_functional_amount_material_payments ON public.material_payments;
CREATE TRIGGER set_functional_amount_material_payments
BEFORE INSERT OR UPDATE ON public.material_payments
FOR EACH ROW EXECUTE FUNCTION set_material_payment_functional_amount();

-- =============================================
-- 4. AUDIT LOG TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.log_material_payment_activity()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_material_payment_audit ON public.material_payments;
CREATE TRIGGER on_material_payment_audit
AFTER INSERT OR UPDATE OR DELETE ON public.material_payments
FOR EACH ROW EXECUTE FUNCTION log_material_payment_activity();

-- =============================================
-- 5. PERMISSIONS - Insert into permissions table
-- =============================================

INSERT INTO public.permissions (key, description, category, is_system)
VALUES 
  ('materials.view', 'Ver materiales', 'materials', true),
  ('materials.manage', 'Gestionar materiales', 'materials', true)
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 6. RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.material_payments ENABLE ROW LEVEL SECURITY;

-- SELECT: MIEMBROS VEN MATERIAL_PAYMENTS
DROP POLICY IF EXISTS "MIEMBROS VEN MATERIAL_PAYMENTS" ON public.material_payments;
CREATE POLICY "MIEMBROS VEN MATERIAL_PAYMENTS"
ON public.material_payments
FOR SELECT
TO public
USING (
  can_view_org(organization_id, 'materials.view'::text)
);

-- INSERT: MIEMBROS CREAN MATERIAL_PAYMENTS
DROP POLICY IF EXISTS "MIEMBROS CREAN MATERIAL_PAYMENTS" ON public.material_payments;
CREATE POLICY "MIEMBROS CREAN MATERIAL_PAYMENTS"
ON public.material_payments
FOR INSERT
TO public
WITH CHECK (
  can_mutate_org(organization_id, 'materials.manage'::text)
);

-- UPDATE: MIEMBROS EDITAN MATERIAL_PAYMENTS
DROP POLICY IF EXISTS "MIEMBROS EDITAN MATERIAL_PAYMENTS" ON public.material_payments;
CREATE POLICY "MIEMBROS EDITAN MATERIAL_PAYMENTS"
ON public.material_payments
FOR UPDATE
TO public
USING (
  can_mutate_org(organization_id, 'materials.manage'::text)
);

-- =============================================
-- 7. MIGRATION: Add permissions to existing orgs
-- =============================================

DO $$
DECLARE
  v_view_perm_id uuid;
  v_manage_perm_id uuid;
BEGIN
  -- Get IDs of new permissions
  SELECT id INTO v_view_perm_id FROM permissions WHERE key = 'materials.view';
  SELECT id INTO v_manage_perm_id FROM permissions WHERE key = 'materials.manage';

  -- ADMIN: Add both permissions to all "Administrador" roles
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

  -- LECTOR: Only view
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, v_view_perm_id
  FROM roles r
  WHERE r.name = 'Lector' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  RAISE NOTICE 'Migration completed for materials permissions';
END $$;

-- =============================================
-- 8. UPDATE step_assign_org_role_permissions (for NEW orgs)
-- =============================================

CREATE OR REPLACE FUNCTION public.step_assign_org_role_permissions(p_org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_admin_role_id  uuid;
  v_editor_role_id uuid;
  v_viewer_role_id uuid;
BEGIN
  ----------------------------------------------------------------
  -- Obtener roles de la organización
  ----------------------------------------------------------------
  SELECT id INTO v_admin_role_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Administrador'
    AND is_system = false;
    
  SELECT id INTO v_editor_role_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Editor'
    AND is_system = false;
    
  SELECT id INTO v_viewer_role_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Lector'
    AND is_system = false;

  ----------------------------------------------------------------
  -- ADMIN → todos los permisos system
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions
  WHERE role_id = v_admin_role_id;
  
  INSERT INTO public.role_permissions (role_id, permission_id, organization_id)
  SELECT v_admin_role_id, p.id, p_org_id
  FROM public.permissions p
  WHERE p.is_system = true;

  ----------------------------------------------------------------
  -- EDITOR → Projects, Costs, Members, Roles (view), Contacts, Kanban, Clients, Sitelog, Media, Tasks, Quotes, Materials
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions
  WHERE role_id = v_editor_role_id;
  
  INSERT INTO public.role_permissions (role_id, permission_id, organization_id)
  SELECT v_editor_role_id, p.id, p_org_id
  FROM public.permissions p
  WHERE p.key IN (
    'projects.view',
    'projects.manage',
    'general_costs.view',
    'general_costs.manage',
    'members.view',
    'roles.view',
    'contacts.view',
    'contacts.manage',
    'kanban.view',
    'kanban.manage',
    'clients.view',
    'clients.manage',
    'sitelog.view',
    'sitelog.manage',
    'media.view',
    'media.manage',
    'tasks.view',
    'tasks.manage',
    'quotes.view',
    'quotes.manage',
    'materials.view',   -- ✅ AGREGADO
    'materials.manage'  -- ✅ AGREGADO
  );

  ----------------------------------------------------------------
  -- LECTOR → View only versions
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions
  WHERE role_id = v_viewer_role_id;
  
  INSERT INTO public.role_permissions (role_id, permission_id, organization_id)
  SELECT v_viewer_role_id, p.id, p_org_id
  FROM public.permissions p
  WHERE p.key IN (
    'projects.view',
    'general_costs.view',
    'members.view',
    'roles.view',
    'contacts.view',
    'kanban.view',
    'clients.view',
    'sitelog.view',
    'media.view',
    'tasks.view',
    'quotes.view',
    'materials.view'  -- ✅ AGREGADO
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'function',
      'step_assign_org_role_permissions',
      'permissions',
      SQLERRM,
      jsonb_build_object('org_id', p_org_id),
      'critical'
    );
    RAISE;
END;
$function$;

-- =============================================
-- DONE
-- =============================================
