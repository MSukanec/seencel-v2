# Funciones en DB para EMAILS:

## Función queue_email_welcome:

BEGIN
    -- Solo procesar si es un INSERT (nuevo usuario)
    IF TG_OP = 'INSERT' THEN
        -- Insertar en cola de emails
        INSERT INTO public.email_queue (
            recipient_email,
            recipient_name,
            template_type,
            subject,
            data,
            created_at
        ) VALUES (
            NEW.email,
            COALESCE(NEW.full_name, 'Usuario'),
            'welcome',
            '¡Bienvenido a SEENCEL!',
            jsonb_build_object(
                'user_id', NEW.id,
                'user_email', NEW.email,
                'user_name', COALESCE(NEW.full_name, 'Usuario'),
                'created_at', NEW.created_at
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error pero no romper el flujo de registro
    RAISE NOTICE 'trigger_send_welcome_email error: %', SQLERRM;
    RETURN NEW;
END;

# Función step_send_purchase_email:

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

    -- Llamar a Edge Function via pg_net (si está habilitado)
    -- O insertar en una cola de emails para procesamiento async
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
            'payment_id', p_payment_id
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
        'seencel@seencel.com',  -- Admin email
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
        NOW()
    );

EXCEPTION WHEN OTHERS THEN
    -- Log pero NO romper el flujo principal
    RAISE NOTICE 'step_send_purchase_email error: %', SQLERRM;
END;







