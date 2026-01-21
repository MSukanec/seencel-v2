-- ============================================
-- Quote Approval/Rejection Notification Trigger
-- ============================================
-- Notifica a los admins cuando un cliente aprueba o rechaza un presupuesto
-- Siguiendo el workflow de /add-notification.md

-- 1. Función del Trigger
CREATE OR REPLACE FUNCTION public.trigger_notify_quote_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_project_name TEXT;
    v_client_name TEXT;
    v_quote_name TEXT;
    v_notification_type TEXT;
    v_notification_title TEXT;
    v_notification_body TEXT;
    v_project_id UUID;
BEGIN
    -- Solo procesar si el status cambió a 'approved' o 'rejected'
    IF NEW.status IN ('approved', 'rejected') AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
        
        -- Obtener datos del proyecto y cliente para el mensaje
        SELECT p.name, c.name, NEW.name, p.id
        INTO v_project_name, v_client_name, v_quote_name, v_project_id
        FROM projects p
        LEFT JOIN clients c ON NEW.client_id = c.id
        WHERE p.id = NEW.project_id;
        
        -- Configurar mensaje según el tipo de acción
        IF NEW.status = 'approved' THEN
            v_notification_type := 'success';
            v_notification_title := '✅ Presupuesto Aprobado';
            v_notification_body := COALESCE(v_client_name, 'Un cliente') || ' aprobó el presupuesto "' || COALESCE(v_quote_name, 'Sin nombre') || '" del proyecto ' || COALESCE(v_project_name, 'Sin nombre') || '.';
        ELSE
            v_notification_type := 'warning';
            v_notification_title := '❌ Presupuesto Rechazado';
            v_notification_body := COALESCE(v_client_name, 'Un cliente') || ' rechazó el presupuesto "' || COALESCE(v_quote_name, 'Sin nombre') || '" del proyecto ' || COALESCE(v_project_name, 'Sin nombre') || '.';
            
            -- Agregar motivo de rechazo si existe
            IF NEW.rejection_reason IS NOT NULL AND NEW.rejection_reason != '' THEN
                v_notification_body := v_notification_body || ' Motivo: "' || NEW.rejection_reason || '"';
            END IF;
        END IF;
        
        -- Llamar a la función MAESTRA - notificar a todos los admins
        PERFORM public.send_notification(
            NULL,                              -- 1. Destinatario (NULL = broadcast)
            v_notification_type,               -- 2. Tipo: 'success' o 'warning'
            v_notification_title,              -- 3. Título
            v_notification_body,               -- 4. Cuerpo
            jsonb_build_object(                -- 5. DATA (Deep Linking)
                'quote_id', NEW.id,
                'project_id', v_project_id,
                'client_id', NEW.client_id,
                'status', NEW.status,
                'url', '/project/' || v_project_id || '/quotes'
            ), 
            'admins'                           -- 6. Audiencia: 'admins' para todos los admins
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Activar el Trigger
DROP TRIGGER IF EXISTS trg_notify_quote_status_change ON public.quotes;
CREATE TRIGGER trg_notify_quote_status_change
AFTER UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.trigger_notify_quote_status_change();

-- Verificar que se creó correctamente
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name = 'trg_notify_quote_status_change';
