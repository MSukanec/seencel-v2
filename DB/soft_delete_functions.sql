-- =====================================================
-- FIX: Soft Delete Functions with SECURITY DEFINER
-- =====================================================
-- Problem: RLS policies that filter by is_deleted = false
-- block UPDATE operations that set is_deleted = true,
-- because PostgreSQL validates the USING clause against
-- the NEW row after the update.
-- 
-- Solution: Create functions with SECURITY DEFINER that
-- bypass RLS to perform soft deletes. These functions
-- still check permissions manually to ensure security.
-- =====================================================

-- Function to soft delete a general_cost
-- Bypasses RLS but manually verifies the user has permission
CREATE OR REPLACE FUNCTION public.soft_delete_general_cost(p_cost_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id uuid;
    v_can_mutate boolean;
BEGIN
    -- 1. Get the organization_id of the cost
    SELECT organization_id INTO v_org_id
    FROM general_costs
    WHERE id = p_cost_id AND is_deleted = false;
    
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'General cost not found or already deleted';
    END IF;
    
    -- 2. Check if user can mutate this organization
    SELECT can_mutate_org(v_org_id, 'general_costs.manage'::text) INTO v_can_mutate;
    
    IF NOT v_can_mutate THEN
        RAISE EXCEPTION 'Permission denied: cannot delete general cost';
    END IF;
    
    -- 3. Perform the soft delete (RLS bypassed due to SECURITY DEFINER)
    UPDATE general_costs
    SET is_deleted = true,
        deleted_at = NOW()
    WHERE id = p_cost_id;
    
    RETURN true;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.soft_delete_general_cost(uuid) TO authenticated;

-- Optional: Same pattern for general_costs_payments if needed
CREATE OR REPLACE FUNCTION public.soft_delete_general_cost_payment(p_payment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id uuid;
    v_can_mutate boolean;
BEGIN
    -- 1. Get the organization_id of the payment
    SELECT organization_id INTO v_org_id
    FROM general_costs_payments
    WHERE id = p_payment_id AND is_deleted = false;
    
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Payment not found or already deleted';
    END IF;
    
    -- 2. Check if user can mutate this organization
    SELECT can_mutate_org(v_org_id, 'general_costs.manage'::text) INTO v_can_mutate;
    
    IF NOT v_can_mutate THEN
        RAISE EXCEPTION 'Permission denied: cannot delete payment';
    END IF;
    
    -- 3. Perform the soft delete
    UPDATE general_costs_payments
    SET is_deleted = true,
        deleted_at = NOW()
    WHERE id = p_payment_id;
    
    RETURN true;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.soft_delete_general_cost_payment(uuid) TO authenticated;
