-- DIAGNOSTIC & FIX SCRIPT
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    v_public_user_id uuid;
    v_auth_user_id uuid;
    v_org_id uuid;
    v_member_count integer;
    v_org_count integer;
BEGIN
    -- 1. DIAGNOSTICS
    SELECT count(*) INTO v_org_count FROM public.organizations;
    RAISE NOTICE 'Total Organizations found: %', v_org_count;

    -- Get the most recently created user
    SELECT id, auth_id INTO v_public_user_id, v_auth_user_id 
    FROM public.users 
    ORDER BY created_at DESC 
    LIMIT 1;

    RAISE NOTICE 'Latest User Found: ID=%, AuthID=%', v_public_user_id, v_auth_user_id;

    -- 2. ATTEMPT RECOVERY
    
    -- Get the first organization (assuming single tenant for dev)
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;

    IF v_org_id IS NOT NULL THEN
        RAISE NOTICE 'Found existing organization: %', v_org_id;
        
        -- Check if link exists
        SELECT count(*) INTO v_member_count 
        FROM public.organization_members 
        WHERE user_id = v_public_user_id AND organization_id = v_org_id;

        IF v_member_count = 0 THEN
            RAISE NOTICE 'Link missing! Attempting to restore...';
            
            INSERT INTO public.organization_members (organization_id, user_id, role)
            VALUES (v_org_id, v_public_user_id, 'owner');
            
            RAISE NOTICE 'SUCCESS: Restored membership for user % in org %', v_public_user_id, v_org_id;
        ELSE
            RAISE NOTICE 'Link already exists. The issue might be RLS or strict query filters.';
        END IF;

    ELSE
        RAISE NOTICE 'CRITICAL: No organizations found! Data might have been deleted via cascade.';
        RAISE NOTICE 'Creating a new default organization to restore access...';

        INSERT INTO public.organizations (name, slug, created_by)
        VALUES ('Restored Organization', 'restored-org', v_auth_user_id)
        RETURNING id INTO v_org_id;

        INSERT INTO public.organization_members (organization_id, user_id, role)
        VALUES (v_org_id, v_public_user_id, 'owner');

        RAISE NOTICE 'Created new organization and linked user.';
    END IF;

    -- 3. VERIFY PREFERENCES
    -- Ensure the user defaults to this org
    UPDATE public.user_preferences
    SET last_organization_id = v_org_id
    WHERE user_id = v_public_user_id;

END $$;
