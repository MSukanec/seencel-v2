-- SEGUN RLS GUIDELINES: can_view_org DEBE recibir permission_key.
-- La versión simple (solo org_id) es redundante o insegura si se usa para control granular.

-- 1. Borrar la versión sobrecargada simple (si existe)
DROP FUNCTION IF EXISTS public.can_view_org(uuid);

-- 2. Asegurar la definición de la versión COMPLETA (Correcta)
CREATE OR REPLACE FUNCTION public.can_view_org(p_organization_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  select
    public.is_admin()
    or public.is_demo_org(p_organization_id)
    or (
      public.is_org_member(p_organization_id)
      and public.has_permission(p_organization_id, p_permission_key)
    );
$function$;
