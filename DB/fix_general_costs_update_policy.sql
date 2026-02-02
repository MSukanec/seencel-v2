-- Fix: Política UPDATE para general_costs
-- El problema era que el WITH CHECK tenía un OR incorrecto con is_deleted

-- Primero dropeamos la política existente
DROP POLICY IF EXISTS "MIEMBROS ACTUALIZAN GENERAL_COSTS" ON public.general_costs;

-- Recreamos la política correcta
CREATE POLICY "MIEMBROS ACTUALIZAN GENERAL_COSTS"
ON public.general_costs
FOR UPDATE
TO public
USING (
    can_mutate_org(organization_id, 'general_costs.manage'::text)
)
WITH CHECK (
    can_mutate_org(organization_id, 'general_costs.manage'::text)
);
