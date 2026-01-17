-- NO BORRAMOS NADA (para no romper las Policies existentes).
-- En su lugar, REDEFINIMOS ambas funciones para que sean consistentes y seguras.

-- 1. Versión Simple (1 argumento): Equivalente a "Es Miembro" (sin check de permiso específico)
CREATE OR REPLACE FUNCTION public.can_view_org(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT
    public.is_admin()
    OR public.is_demo_org(p_organization_id)
    OR public.is_org_member(p_organization_id);
$function$;

-- 2. Versión Estricta (2 argumentos): Equivalente a "Es Miembro Y Tiene Permiso"
-- Esta es la que usan las políticas granulares.
CREATE OR REPLACE FUNCTION public.can_view_org(p_organization_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT
    public.is_admin()
    OR public.is_demo_org(p_organization_id)
    OR (
      public.is_org_member(p_organization_id)
      AND public.has_permission(p_organization_id, p_permission_key)
    );
$function$;

-- Con esto, ambas funciones son válidas, seguras y usan la misma lógica base.
-- No necesitas borrar ninguna.
