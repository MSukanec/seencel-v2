/**
 * CLEANUP FUNCTION FOR TEST USERS
 * 
 * Usage:
 * SELECT public.admin_cleanup_test_user('test@example.com');
 * 
 * This function performs a "Deep Clean" of a user and their associated data.
 * It is designed for development and testing environments to prevent "orphan data"
 * when deleting users who created organizations.
 */

CREATE OR REPLACE FUNCTION public.admin_cleanup_test_user(target_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_org_record record;
BEGIN
    -- 1. Find the user ID from auth.users (or public.users)
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = target_email;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User % not found, nothing to clean.', target_email;
        RETURN;
    END IF;

    RAISE NOTICE 'Cleaning up user: % (ID: %)', target_email, v_user_id;

    -- 2. Find Organizations owned by this user
    -- We assume an org is "owned" if this user is a member with 'Administrador' role
    -- OR we can look at the simplified logic: "Orgs where this user is the CREATOR"
    -- If your logic relies on `organization_members`, we should find orgs where 
    -- this user is a member and check if we want to delete it.
    -- SAFE APPROACH: Delete Organization only if this user is the ONLY member.
    
    FOR v_org_record IN 
        SELECT o.id, o.name 
        FROM public.organizations o
        JOIN public.organization_members om ON o.id = om.organization_id
        WHERE om.user_id = (SELECT id FROM public.users WHERE auth_id = v_user_id)
    LOOP
        -- Check if there are OTHER members in this org
        IF (SELECT count(*) FROM public.organization_members WHERE organization_id = v_org_record.id) = 1 THEN
            RAISE NOTICE 'Deleting Organization: % (ID: %)', v_org_record.name, v_org_record.id;
            
            -- Delete the Organization (Cascade should handle the rest usually, but let's be safe)
            -- Note: If you have FKs set to CASCADE, just deleting the org is enough.
            DELETE FROM public.organizations WHERE id = v_org_record.id;
        ELSE
            RAISE NOTICE 'Skipping Organization % because it has other members.', v_org_record.name;
            
            -- Just remove the member, don't kill the org
            DELETE FROM public.organization_members 
            WHERE organization_id = v_org_record.id 
            AND user_id = (SELECT id FROM public.users WHERE auth_id = v_user_id);
        END IF;
    END LOOP;

    -- 3. Finally, delete the User from auth.users
    -- This will cascade to public.users and any remaining direct links
    DELETE FROM auth.users WHERE id = v_user_id;
    
    RAISE NOTICE 'Cleanup complete for %', target_email;
END;
$$;
