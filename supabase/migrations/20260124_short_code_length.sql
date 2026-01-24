-- ============================================================================
-- Migración: Aumentar límite de short_code
-- Fecha: 2026-01-24
-- Descripción: El short_code de 4 caracteres es muy limitante para códigos 
--              como "LCH08" (ladrillo cerámico hueco 08). Se aumenta a 10.
-- ============================================================================

-- Aumentar short_code en task_parameter_options de varchar(4) a varchar(10)
ALTER TABLE task_parameter_options 
    ALTER COLUMN short_code TYPE varchar(10);

-- Para consistencia, también aumentar en task_kind si existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_kind' AND column_name = 'short_code'
    ) THEN
        EXECUTE 'ALTER TABLE task_kind ALTER COLUMN short_code TYPE varchar(10)';
    END IF;
END $$;

COMMENT ON COLUMN task_parameter_options.short_code IS 'Código corto para generar código de tarea (ej: LCH08 = ladrillo cerámico hueco 08)';
