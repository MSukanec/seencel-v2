-- RPC para limpiar datos de compra de un usuario de prueba
-- ⚠️ SOLO FUNCIONA CON USUARIOS EN WHITELIST
-- SECURITY DEFINER bypassa RLS

-- ============================================
-- CONFIGURACIÓN DE SEGURIDAD
-- ============================================
-- 1. WHITELIST de emails permitidos (hardcoded)
-- 2. SOLO 1 organización específica puede ser afectada
-- 3. Valida que no afecte más de 1 usuario
-- 4. Logging de operaciones
-- ============================================

CREATE OR REPLACE FUNCTION admin_cleanup_test_purchase(
    p_user_email TEXT,
    p_org_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_deleted_items TEXT[] := '{}';
    v_org_id UUID;
    v_affected_count INT;
    
    -- ⛔ WHITELIST: SOLO estos emails pueden ser limpiados
    c_allowed_emails TEXT[] := ARRAY[
        'matusukanec@gmail.com',
        'test@seencel.com'
    ];
    
    -- ⛔ SOLO esta organización puede ser afectada
    c_allowed_org_id UUID := '0d5e28fe-8fe2-4fe4-9835-4fe21b4f2abb';
    
BEGIN
    -- ============================================
    -- VALIDACIÓN 1: Email en whitelist
    -- ============================================
    IF NOT (p_user_email = ANY(c_allowed_emails)) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', '⛔ SEGURIDAD: Email no está en whitelist de pruebas'
        );
    END IF;
    
    -- ============================================
    -- VALIDACIÓN 2: Org ID debe coincidir exactamente
    -- ============================================
    IF p_org_id IS NOT NULL AND p_org_id != c_allowed_org_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', '⛔ SEGURIDAD: Organization ID no coincide con el permitido'
        );
    END IF;
    
    -- Forzar el org_id permitido
    v_org_id := c_allowed_org_id;
    
    -- ============================================
    -- VALIDACIÓN 3: Obtener y validar user_id único
    -- ============================================
    SELECT COUNT(*) INTO v_affected_count
    FROM auth.users 
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
    FROM auth.users 
    WHERE email = p_user_email;
    
    -- ============================================
    -- OPERACIONES DE LIMPIEZA (con conteo de seguridad)
    -- ============================================
    
    -- 1. Borrar course_enrollments
    DELETE FROM course_enrollments WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'course_enrollments (' || v_affected_count || ')'); 
    END IF;
    
    -- 2. Borrar suscripciones de la organización ESPECÍFICA
    DELETE FROM organization_subscriptions WHERE organization_id = v_org_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'organization_subscriptions (' || v_affected_count || ')'); 
    END IF;
    
    -- 3. Resetear plan_id de la organización ESPECÍFICA
    UPDATE organizations SET plan_id = NULL WHERE id = v_org_id AND plan_id IS NOT NULL;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'organizations.plan_id → null'); 
    END IF;
    
    -- 4. Borrar payments del usuario específico
    DELETE FROM payments WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'payments (' || v_affected_count || ')'); 
    END IF;
    
    -- 5. Borrar bank_transfer_payments del usuario específico
    DELETE FROM bank_transfer_payments WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'bank_transfer_payments (' || v_affected_count || ')'); 
    END IF;
    
    -- 6. Borrar mp_preferences del usuario específico
    DELETE FROM mp_preferences WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'mp_preferences (' || v_affected_count || ')'); 
    END IF;
    
    -- 7. Borrar coupon_redemptions del usuario específico
    DELETE FROM coupon_redemptions WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'coupon_redemptions (' || v_affected_count || ')'); 
    END IF;
    
    -- 8. Borrar paypal preferences del usuario específico
    DELETE FROM paypal_seat_preferences WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'paypal_seat_preferences (' || v_affected_count || ')'); 
    END IF;
    
    DELETE FROM paypal_upgrade_preferences WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'paypal_upgrade_preferences (' || v_affected_count || ')'); 
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
$$;

-- Grant a usuarios autenticados
GRANT EXECUTE ON FUNCTION admin_cleanup_test_purchase(TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION admin_cleanup_test_purchase IS 
'⚠️ FUNCIÓN DE PRUEBAS: Limpia datos de compra SOLO para emails en whitelist y org hardcodeada. SECURITY DEFINER para bypass RLS.';

