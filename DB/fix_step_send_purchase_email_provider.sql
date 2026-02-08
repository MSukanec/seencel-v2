-- ============================================================
-- FIX: Agregar p_provider a step_send_purchase_email
-- ============================================================
-- Problema: La función no pasa el provider al email_queue,
-- y el cron tiene "mercadopago" hardcodeado.
-- Solución: Agregar p_provider como parámetro y guardarlo en data.
-- ============================================================
-- IMPORTANTE: Después de ejecutar esto, actualizar TODOS los 
-- callers para pasar p_provider como 7mo argumento:
--   handle_payment_course_success
--   handle_payment_subscription_success  
--   handle_upgrade_subscription_success
--   handle_member_seat_purchase
-- ============================================================

CREATE OR REPLACE FUNCTION public.step_send_purchase_email(
    p_user_id uuid,
    p_product_type text,
    p_product_name text,
    p_amount numeric,
    p_currency text,
    p_payment_id uuid,
    p_provider text DEFAULT 'mercadopago'  -- Nuevo parámetro con default backward-compatible
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_email text;
    v_user_name text;
BEGIN
    -- Obtener datos del usuario
    SELECT email, full_name INTO v_user_email, v_user_name
    FROM public.users
    WHERE id = p_user_id;

    IF v_user_email IS NULL THEN
        RAISE NOTICE 'step_send_purchase_email: Usuario % no encontrado', p_user_id;
        RETURN;
    END IF;

    -- Email al comprador
    INSERT INTO public.email_queue (
        recipient_email,
        recipient_name,
        template_type,
        subject,
        data,
        created_at
    ) VALUES (
        v_user_email,
        COALESCE(v_user_name, 'Usuario'),
        'purchase_confirmation',
        CASE p_product_type
            WHEN 'course' THEN '¡Tu curso está listo!'
            WHEN 'subscription' THEN '¡Bienvenido a SEENCEL ' || p_product_name || '!'
            ELSE 'Confirmación de compra'
        END,
        jsonb_build_object(
            'user_id', p_user_id,
            'user_email', v_user_email,
            'user_name', v_user_name,
            'product_type', p_product_type,
            'product_name', p_product_name,
            'amount', p_amount,
            'currency', p_currency,
            'payment_id', p_payment_id,
            'provider', p_provider  -- ← NUEVO: incluir provider
        ),
        NOW()
    );

    -- También notificar admins
    INSERT INTO public.email_queue (
        recipient_email,
        recipient_name,
        template_type,
        subject,
        data,
        created_at
    ) VALUES (
        'contacto@seencel.com',
        'Admin SEENCEL',
        'admin_sale_notification',
        '💰 Nueva venta: ' || p_product_name,
        jsonb_build_object(
            'buyer_email', v_user_email,
            'buyer_name', v_user_name,
            'product_type', p_product_type,
            'product_name', p_product_name,
            'amount', p_amount,
            'currency', p_currency,
            'payment_id', p_payment_id,
            'provider', p_provider  -- ← NUEVO: incluir provider
        ),
        NOW()
    );

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'step_send_purchase_email error: %', SQLERRM;
END;
$$;
