-- ==============================================================================
-- SCRIPT DE AUDITORÍA Y CORRECCIÓN MASIVA: CLIENT COMMITMENTS
-- ==============================================================================
-- Objetivo: Asegurar que CADA fila de client_commitments tenga el functional_amount
-- correcto, calculado con la lógica actual (DIVISIÓN) de calculate_functional_amount.
-- Esto corrige cualquier dato insertado antes de que existiera el trigger.

DO $$
DECLARE
    row_count integer;
BEGIN
    -- 1. Ejecutar actualización masiva
    -- Se recalculan TODOS los registros activos, sin importar si ya tenían valor,
    -- para asegurar que la lógica aplicada sea la ÚLTIMA versión (División).
    UPDATE public.client_commitments
    SET functional_amount = public.calculate_functional_amount(
        amount, 
        exchange_rate, 
        currency_id, 
        organization_id
    )
    WHERE is_deleted = false; -- Solo registros activos

    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE 'Se han recalculado y corregido % compromisos.', row_count;
    
    -- 2. Verificación de Integridad (Opcional: puedes comentarlo si no quieres logs)
    -- Muestra ejemplos que podrían seguir siendo cero si falta configuración
    IF EXISTS (
        SELECT 1 FROM public.client_commitments 
        WHERE functional_amount = 0 AND amount > 0 AND is_deleted = false
    ) THEN
        RAISE WARNING 'Atención: Existen compromisos con functional_amount = 0. Verifique si falta configurar la Moneda Funcional en organization_preferences o si el exchange_rate es 0.';
    END IF;

END $$;
