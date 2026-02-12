-- ============================================================================
-- ASSERT PROJECT IS ACTIVE
-- ============================================================================
-- Helper function to validate that a project is active before allowing
-- mutations (create tasks, quotes, movements, files, etc.).
--
-- Usage: Call at the beginning of any function that creates/modifies
-- data associated with a project:
--
--   PERFORM assert_project_is_active(p_project_id);
--
-- If the project is not active, raises exception with ERRCODE 'P0001'.
-- ============================================================================

CREATE OR REPLACE FUNCTION assert_project_is_active(p_project_id uuid)
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM projects
        WHERE id = p_project_id
          AND status = 'active'
          AND is_deleted = false
    ) THEN
        RAISE EXCEPTION 'Project is not active. Mutations are blocked.'
            USING ERRCODE = 'P0001';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (called from RLS policies/functions)
GRANT EXECUTE ON FUNCTION assert_project_is_active(uuid) TO authenticated;
