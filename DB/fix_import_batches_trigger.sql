-- ===========================================
-- FIX: Función log_import_activity que usa user_id (ya eliminado)
-- Error: record "new" has no field "user_id"
-- ===========================================

-- Primero, ver la definición actual de la función:
-- SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'log_import_activity';

-- SOLUCIÓN: Reemplazar la función para usar member_id
CREATE OR REPLACE FUNCTION log_import_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO activity_log (
        organization_id,
        member_id,
        entity_type,
        entity_id,
        action,
        metadata,
        created_at
    ) VALUES (
        NEW.organization_id,
        NEW.member_id,  -- Cambiado de NEW.user_id
        'import_batch',
        NEW.id,
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'created'
            WHEN TG_OP = 'UPDATE' THEN 'updated'
            ELSE TG_OP
        END,
        jsonb_build_object(
            'entity_type', NEW.entity_type,
            'record_count', NEW.record_count,
            'status', NEW.status
        ),
        NOW()
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- No bloquear la operación si falla el log
        RETURN NEW;
END;
$$;

-- Verificar que funciona
-- INSERT INTO import_batches (organization_id, entity_type, record_count, member_id)
-- VALUES ('tu-org-id', 'test', 0, 'tu-member-id');
