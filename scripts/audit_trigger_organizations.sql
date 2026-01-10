-- ==============================================================================
-- AUDIT LOGGING FOR ORGANIZATIONS (ROOT TABLE)
-- Note: 'organizations' is special because logic differs for ID resolution
-- ==============================================================================

-- 1. Custom function to set updated_by (referencing organization_members)
-- We need a custom one because "organization_id" works differently here (it IS the ID)
CREATE OR REPLACE FUNCTION public.handle_updated_by_organizations()
RETURNS TRIGGER AS $$
DECLARE
    current_uid uuid;
    resolved_member_id uuid;
BEGIN
    current_uid := auth.uid();
    
    IF current_uid IS NULL THEN
        RETURN NEW;
    END IF;

    -- Resolve Member ID
    -- User must be a member of THIS organization (NEW.id)
    SELECT om.id INTO resolved_member_id
    FROM public.organization_members om
    JOIN public.users u ON u.id = om.user_id
    WHERE u.auth_id = current_uid
      AND om.organization_id = NEW.id -- Key difference: generic uses NEW.organization_id
    LIMIT 1;

    IF resolved_member_id IS NOT NULL THEN
        NEW.updated_by := resolved_member_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Apply BEFORE UPDATE trigger
DROP TRIGGER IF EXISTS set_updated_by_organizations ON public.organizations;

CREATE TRIGGER set_updated_by_organizations
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by_organizations();


-- 3. Audit Log Trigger
CREATE OR REPLACE FUNCTION public.log_organizations_activity()
RETURNS TRIGGER AS $$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_organization';
        resolved_member_id := OLD.updated_by; -- This is a member_id
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_organization';
        ELSE
            audit_action := 'update_organization';
        END IF;
        resolved_member_id := NEW.updated_by; -- This is a member_id
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_organization';
        -- PROBLEM: created_by is USER_ID, but log needs MEMBER_ID.
        -- Attempt to resolve member (might fail if member created after org)
        BEGIN
            SELECT id INTO resolved_member_id
            FROM public.organization_members
            WHERE user_id = NEW.created_by AND organization_id = NEW.id
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;

    audit_metadata := jsonb_build_object(
        'name', target_record.name,
        'plan_id', target_record.plan_id
    );

    -- Wrap in exception to prevent blocking if member not found (critical for CREATE)
    BEGIN
        IF resolved_member_id IS NOT NULL THEN
            INSERT INTO public.organization_activity_logs (
                organization_id, member_id, action, target_id, target_table, metadata
            ) VALUES (
                target_record.id, -- matches id
                resolved_member_id,
                audit_action,
                target_record.id,
                'organizations',
                audit_metadata
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply Log Trigger
DROP TRIGGER IF EXISTS on_organizations_audit ON public.organizations;

CREATE TRIGGER on_organizations_audit
AFTER INSERT OR UPDATE OR DELETE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.log_organizations_activity();
