-- ============================================================================
-- Trigger: Sincronización automática status ↔ progress_percent
-- 
-- Reglas:
--   1. Si progress_percent llega a 100 → status = 'completed'
--   2. Si status cambia a 'completed' → progress_percent = 100
--   3. Si progress_percent baja de 100 y status era 'completed' → status = 'in_progress'
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_task_status_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Caso 1: Progress llega a 100 → marcar como completed
    IF NEW.progress_percent = 100 AND OLD.progress_percent < 100 THEN
        NEW.status := 'completed';
    END IF;

    -- Caso 2: Status cambia a completed → forzar progress a 100
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.progress_percent := 100;
    END IF;

    -- Caso 3: Progress baja de 100 y estaba completed → revertir a in_progress
    IF NEW.progress_percent < 100 AND OLD.status = 'completed' AND NEW.status = 'completed' THEN
        NEW.status := 'in_progress';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger BEFORE UPDATE para poder modificar el NEW row
DROP TRIGGER IF EXISTS trg_sync_task_status_progress ON construction_tasks;

CREATE TRIGGER trg_sync_task_status_progress
    BEFORE UPDATE ON construction_tasks
    FOR EACH ROW
    EXECUTE FUNCTION sync_task_status_progress();
