CREATE OR REPLACE FUNCTION public.step_send_purchase_email(
    p_user_id uuid,
    p_product_type text,
    p_product_name text,
    p_amount numeric,
    p_currency text,
    p_payment_id text
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
    SELECT email, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Usuario')
    INTO v_user_email, v_user_name
    FROM auth.users
    WHERE id = p_user_id;

    IF v_user_email IS NULL THEN
        RAISE NOTICE 'step_send_purchase_email: Usuario % no encontrado', p_user_id;
        RETURN;
    END IF;

    -- Insertar email para el USUARIO
    INSERT INTO public.email_queue (
        recipient_email,
        recipient_name,
        template_type,
        subject,
        data,
        status,
        created_at
    ) VALUES (
        v_user_email,
        v_user_name,
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
            'payment_id', p_payment_id
        ),
        'pending',
        NOW()
    );

    -- Insertar email para el ADMIN (CORREGIDO)
    INSERT INTO public.email_queue (
        recipient_email,
        recipient_name,
        template_type,
        subject,
        data,
        status,
        created_at
    ) VALUES (
        'contacto@seencel.com',  -- Admin email CORREGIDO
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
            'payment_id', p_payment_id
        ),
        'pending',
        NOW()
    );

EXCEPTION WHEN OTHERS THEN
    -- Log pero NO romper el flujo principal
    RAISE NOTICE 'step_send_purchase_email error: %', SQLERRM;
END;
$$;
