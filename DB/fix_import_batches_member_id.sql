-- ============================================================================
-- TRIGGER PARA AUTO-POPULAR member_id EN import_batches
-- Sigue el patrón de handle_updated_by del skill RLS
-- ============================================================================

-- Crear función que auto-popula member_id basándose en auth.uid()
CREATE OR REPLACE FUNCTION public.handle_import_batch_member_id()
RETURNS TRIGGER AS $$
DECLARE
    current_uid uuid;
    resolved_member_id uuid;
BEGIN
    current_uid := auth.uid();
    IF current_uid IS NULL THEN RETURN NEW; END IF;

    -- Resolver member_id: auth.uid() -> users.auth_id -> users.id -> organization_members.user_id
    SELECT om.id INTO resolved_member_id
    FROM public.organization_members om
    JOIN public.users u ON u.id = om.user_id
    WHERE u.auth_id = current_uid 
      AND om.organization_id = NEW.organization_id
    LIMIT 1;

    IF resolved_member_id IS NOT NULL THEN
        NEW.member_id := resolved_member_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger BEFORE INSERT
DROP TRIGGER IF EXISTS set_import_batch_member_id ON public.import_batches;

CREATE TRIGGER set_import_batch_member_id
BEFORE INSERT ON public.import_batches
FOR EACH ROW EXECUTE FUNCTION public.handle_import_batch_member_id();

-- ============================================================================
-- NOTA: Con este trigger, ya no es necesario pasar member_id desde el código
-- TypeScript. El trigger lo resuelve automáticamente desde auth.uid().
-- 
-- El código en core.ts puede simplificarse quitando la lógica de member_id
-- ya que el trigger lo maneja automáticamente.
-- ============================================================================
