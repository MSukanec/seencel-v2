-- ============================================================================
-- PUSH NOTIFICATION TRIGGER
-- Cuando se inserta un user_notification, llama a la API Route de push
-- usando pg_net para enviar la notificación push al dispositivo del usuario.
-- ============================================================================
-- REQUISITO: Extensión pg_net habilitada en Supabase (Dashboard → Extensions)
-- ============================================================================

-- ============================================================================
-- PASO 1: Guardar secrets en Supabase Vault
-- Ir a Supabase Dashboard → Settings → Vault → Add Secret
-- ============================================================================
-- Secret 1: nombre = "app_url",     valor = "https://app.seencel.com"
-- Secret 2: nombre = "push_api_secret", valor = "<tu_secret_seguro>"
-- ============================================================================

-- PASO 2: Crear la función trigger
CREATE OR REPLACE FUNCTION notify_push_on_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_title TEXT;
    v_body TEXT;
    v_data JSONB;
    v_app_url TEXT;
    v_push_api_secret TEXT;
BEGIN
    -- Leer la notificación padre para obtener título, body y data
    SELECT title, body, data
    INTO v_title, v_body, v_data
    FROM notifications
    WHERE id = NEW.notification_id;

    -- Si no encontró la notificación, no hacer nada
    IF v_title IS NULL THEN
        RETURN NEW;
    END IF;

    -- Leer secrets desde Supabase Vault
    SELECT decrypted_secret INTO v_app_url
    FROM vault.decrypted_secrets
    WHERE name = 'app_url'
    LIMIT 1;

    SELECT decrypted_secret INTO v_push_api_secret
    FROM vault.decrypted_secrets
    WHERE name = 'push_api_secret'
    LIMIT 1;

    -- Si no están configurados, no enviar push (fail silently)
    IF v_app_url IS NULL OR v_push_api_secret IS NULL THEN
        RAISE LOG '[Push] Missing vault secrets: app_url or push_api_secret';
        RETURN NEW;
    END IF;

    -- Enviar push via pg_net (HTTP POST asincrono)
    PERFORM net.http_post(
        url := v_app_url || '/api/push/send',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_push_api_secret
        ),
        body := jsonb_build_object(
            'user_id', NEW.user_id,
            'title', v_title,
            'body', COALESCE(v_body, ''),
            'data', COALESCE(v_data, '{}'::jsonb)
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Trigger en user_notifications
DROP TRIGGER IF EXISTS trg_push_on_notification ON user_notifications;
CREATE TRIGGER trg_push_on_notification
    AFTER INSERT ON user_notifications
    FOR EACH ROW
    EXECUTE FUNCTION notify_push_on_notification();
