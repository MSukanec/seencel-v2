-- ============================================================
-- NOTIFICACIÓN: Asignación de Tarjeta Kanban
-- ============================================================
-- Dispara una notificación cuando un miembro es asignado
-- a una tarjeta Kanban (nueva o reasignada).
--
-- No notifica:
--   - Cuando se quita la asignación (assigned_to → NULL)
--   - Cuando el usuario se asigna a sí mismo
--   - Cuando el valor no cambió realmente
-- ============================================================

-- 1. Función del Trigger
CREATE OR REPLACE FUNCTION public.notify_kanban_card_assigned()
RETURNS TRIGGER AS $$
DECLARE
    v_assignee_user_id uuid;
    v_actor_user_id uuid;
    v_actor_name text;
    v_board_id uuid;
BEGIN
    -- Solo actuar si assigned_to cambió a un valor no-null
    IF NEW.assigned_to IS NULL THEN
        RETURN NEW;
    END IF;

    -- En UPDATE, solo actuar si el valor realmente cambió
    IF TG_OP = 'UPDATE' AND OLD.assigned_to IS NOT DISTINCT FROM NEW.assigned_to THEN
        RETURN NEW;
    END IF;

    -- Resolver el user_id del miembro asignado (assigned_to = organization_members.id)
    SELECT om.user_id INTO v_assignee_user_id
    FROM public.organization_members om
    WHERE om.id = NEW.assigned_to;

    IF v_assignee_user_id IS NULL THEN
        RETURN NEW; -- Miembro no encontrado, no notificar
    END IF;

    -- Resolver quién hizo la asignación (el usuario actual)
    SELECT u.id, u.full_name INTO v_actor_user_id, v_actor_name
    FROM public.users u
    WHERE u.auth_id = auth.uid();

    -- No notificar si el usuario se asigna a sí mismo
    IF v_actor_user_id IS NOT NULL AND v_actor_user_id = v_assignee_user_id THEN
        RETURN NEW;
    END IF;

    -- Resolver board_id (puede venir del registro o del list)
    v_board_id := NEW.board_id;

    -- Enviar notificación
    PERFORM public.send_notification(
        v_assignee_user_id,                                     -- Destinatario (users.id)
        'info',                                                  -- Tipo
        'Nueva asignación',                                      -- Título
        COALESCE(v_actor_name, 'Alguien') || 
            ' te asignó a la tarjeta "' || NEW.title || '"',     -- Cuerpo
        jsonb_build_object(                                      -- Data (deep linking)
            'card_id', NEW.id,
            'board_id', v_board_id,
            'url', '/organization/planner?view=kanban&boardId=' || v_board_id::text
        ),
        'direct'                                                 -- Audiencia
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Activar el Trigger
DROP TRIGGER IF EXISTS trg_notify_kanban_card_assigned ON public.kanban_cards;
CREATE TRIGGER trg_notify_kanban_card_assigned
AFTER INSERT OR UPDATE OF assigned_to ON public.kanban_cards
FOR EACH ROW
EXECUTE FUNCTION public.notify_kanban_card_assigned();
