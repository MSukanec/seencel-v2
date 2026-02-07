-- ============================================
-- PATCH: Fix step_log_seat_purchase_event
-- 
-- ERROR: relation "public.activity_logs" does not exist
-- CAUSA: La función referencia "activity_logs" pero la tabla real es 
--        "organization_activity_logs" con columnas diferentes.
--
-- Columnas reales (de TABLES.md):
--   organization_id, action, target_table, target_id, metadata, member_id
--
-- NOTA: No tenemos member_id en el contexto de compra de seats (es una
--       operación de billing, no de un miembro específico). Se deja NULL.
-- ============================================

DROP FUNCTION IF EXISTS public.step_log_seat_purchase_event(uuid,uuid,integer,numeric,text,uuid,boolean);

CREATE OR REPLACE FUNCTION public.step_log_seat_purchase_event(
    p_organization_id UUID,
    p_user_id UUID,
    p_seats INT,
    p_amount NUMERIC,
    p_currency TEXT,
    p_payment_id UUID,
    p_prorated BOOLEAN
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
    v_member_id UUID;
BEGIN
    -- Intentar obtener el member_id del usuario en la organización
    SELECT id INTO v_member_id
    FROM public.organization_members
    WHERE organization_id = p_organization_id 
      AND user_id = p_user_id
    LIMIT 1;

    -- Log en organization_activity_logs (tabla real)
    INSERT INTO public.organization_activity_logs (
        organization_id,
        member_id,
        action,
        target_table,
        target_id,
        metadata
    ) VALUES (
        p_organization_id,
        v_member_id,
        'seat_purchased',
        'payments',
        p_payment_id,
        jsonb_build_object(
            'seats', p_seats,
            'amount', p_amount,
            'currency', p_currency,
            'payment_id', p_payment_id,
            'prorated', p_prorated,
            'user_id', p_user_id
        )
    )
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$;
