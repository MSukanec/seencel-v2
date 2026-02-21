-- =============================================
-- FIX: admin_cleanup_test_purchase
-- Bug: search_path no incluye 'iam', referencias a public.users y public.organizations
-- que fueron migradas a iam.users e iam.organizations
-- =============================================

CREATE OR REPLACE FUNCTION ops.admin_cleanup_test_purchase(p_user_email text, p_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'ops', 'billing', 'academy', 'iam'
AS $function$
DECLARE
    v_user_id UUID;
    v_deleted_items TEXT[] := '{}';
    v_org_id UUID;
    v_affected_count INT;
    v_free_plan_id UUID := '015d8a97-6b6e-4aec-87df-5d1e6b0e4ed2';
    
BEGIN
    v_org_id := p_org_id;
    
    -- ============================================
    -- VALIDACIÓN: Obtener y validar user_id
    -- ============================================
    SELECT COUNT(*) INTO v_affected_count
    FROM iam.users 
    WHERE email = p_user_email;
    
    IF v_affected_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Usuario no encontrado: ' || p_user_email
        );
    END IF;
    
    IF v_affected_count > 1 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', '⛔ SEGURIDAD: Más de un usuario con ese email (esto no debería pasar)'
        );
    END IF;
    
    SELECT id INTO v_user_id 
    FROM iam.users 
    WHERE email = p_user_email;
    
    -- ============================================
    -- OPERACIONES DE LIMPIEZA (con conteo)
    -- ============================================
    
    -- 1. Borrar course_enrollments (academy schema)
    DELETE FROM academy.course_enrollments WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'course_enrollments (' || v_affected_count || ')'); 
    END IF;
    
    -- 2. Borrar suscripciones de la organización (billing schema)
    DELETE FROM billing.organization_subscriptions WHERE organization_id = v_org_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'organization_subscriptions (' || v_affected_count || ')'); 
    END IF;
    
    -- 3. Resetear plan_id de la organización al plan FREE (iam schema)
    UPDATE iam.organizations 
    SET plan_id = v_free_plan_id 
    WHERE id = v_org_id AND plan_id IS DISTINCT FROM v_free_plan_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'organizations.plan_id → FREE'); 
    END IF;

    -- 3b. Resetear is_founder flag
    UPDATE iam.organizations 
    SET settings = COALESCE(settings, '{}'::jsonb) - 'is_founder'
    WHERE id = v_org_id AND (settings->>'is_founder')::boolean = true;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'organizations.settings.is_founder → removed'); 
    END IF;

    -- 3c. Resetear purchased_seats a 0
    UPDATE iam.organizations 
    SET purchased_seats = 0 
    WHERE id = v_org_id AND COALESCE(purchased_seats, 0) > 0;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'organizations.purchased_seats → 0'); 
    END IF;
    
    -- 4. Borrar payments del usuario (billing schema)
    DELETE FROM billing.payments WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'payments (' || v_affected_count || ')'); 
    END IF;
    
    -- 5. Borrar bank_transfer_payments del usuario (billing schema)
    DELETE FROM billing.bank_transfer_payments WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'bank_transfer_payments (' || v_affected_count || ')'); 
    END IF;
    
    -- 6. Borrar mp_preferences del usuario (billing schema)
    DELETE FROM billing.mp_preferences WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'mp_preferences (' || v_affected_count || ')'); 
    END IF;
    
    -- 7. Borrar coupon_redemptions del usuario (billing schema)
    DELETE FROM billing.coupon_redemptions WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'coupon_redemptions (' || v_affected_count || ')'); 
    END IF;
    
    -- 8. Borrar payment_events vinculados a paypal_preferences del usuario
    DELETE FROM billing.payment_events pe
    WHERE EXISTS (
        SELECT 1 FROM billing.paypal_preferences pp 
        WHERE pp.id::text = pe.custom_id 
        AND pp.user_id = v_user_id
    );
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'payment_events (' || v_affected_count || ')'); 
    END IF;

    -- 9. Borrar paypal_preferences del usuario (billing schema)
    DELETE FROM billing.paypal_preferences WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'paypal_preferences (' || v_affected_count || ')'); 
    END IF;
    
    -- ============================================
    -- RESULTADO
    -- ============================================
    IF array_length(v_deleted_items, 1) IS NULL OR array_length(v_deleted_items, 1) = 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', '✅ Usuario ' || p_user_email || ' encontrado pero no tenía datos de compra.',
            'deleted_items', '[]'::jsonb
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', '✅ Limpieza completa para ' || p_user_email,
        'deleted_items', to_jsonb(v_deleted_items),
        'user_id', v_user_id,
        'org_id', v_org_id
    );
END;
$function$;

-- =============================================
-- DROP: admin_cleanup_test_user (no se usa en el frontend)
-- =============================================
DROP FUNCTION IF EXISTS ops.admin_cleanup_test_user(text);

-- =============================================
-- DROP: reset_test_payments_and_subscriptions (legacy, no se usa en frontend)
-- Duplica la lógica de admin_cleanup_test_purchase con referencias public.* rotas
-- =============================================
DROP FUNCTION IF EXISTS ops.reset_test_payments_and_subscriptions(uuid, uuid);
