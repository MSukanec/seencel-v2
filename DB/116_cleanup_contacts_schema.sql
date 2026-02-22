-- =============================================================================
-- 116: CLEANUP CONTACTS SCHEMA
-- =============================================================================
-- Fixes found during contacts schema audit:
-- 1. Drop unused contacts_summary_view (dead code)
-- 2. Move protect_linked_contact_delete from iam → contacts
-- 3. Move update_contact_category_links_updated_at from iam → contacts (rename to generic)
-- 4. Rename RLS policies: CONTACT_TYPES → CONTACT_CATEGORIES
-- 5. Recreate contacts_view as SECURITY DEFINER
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. DROP UNUSED contacts_summary_view
-- ─────────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS contacts.contacts_summary_view;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. MOVE iam.protect_linked_contact_delete → contacts.protect_linked_contact_delete
-- ─────────────────────────────────────────────────────────────────────────────

-- 2a. Create function in contacts schema
CREATE OR REPLACE FUNCTION contacts.protect_linked_contact_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'contacts', 'projects', 'finance', 'catalog'
AS $function$
begin
  if exists (select 1 from projects.project_clients where contact_id = old.id and is_deleted = false) then
    raise exception 'No se puede eliminar este contacto porque tiene proyectos asociados como cliente.';
  end if;
  if exists (select 1 from projects.project_labor where contact_id = old.id and is_deleted = false) then
    raise exception 'No se puede eliminar este contacto porque tiene asignaciones de personal.';
  end if;
  if exists (select 1 from finance.subcontracts where contact_id = old.id and coalesce(is_deleted, false) = false) then
    raise exception 'No se puede eliminar este contacto porque tiene subcontratos asociados.';
  end if;
  if exists (select 1 from finance.subcontract_bids where contact_id = old.id) then
    raise exception 'No se puede eliminar este contacto porque tiene ofertas de subcontratos.';
  end if;
  if exists (select 1 from finance.movements where contact_id = old.id) then
    raise exception 'No se puede eliminar este contacto porque tiene movimientos financieros.';
  end if;
  if exists (select 1 from finance.material_invoices where provider_id = old.id) then
    raise exception 'No se puede eliminar este contacto porque tiene facturas de materiales.';
  end if;
  if exists (select 1 from finance.material_purchase_orders where provider_id = old.id and is_deleted = false) then
    raise exception 'No se puede eliminar este contacto porque tiene órdenes de compra.';
  end if;
  if exists (select 1 from catalog.materials where default_provider_id = old.id and is_deleted = false) then
    raise exception 'No se puede eliminar este contacto porque es proveedor predeterminado de materiales.';
  end if;
  if exists (select 1 from catalog.task_recipe_external_services where contact_id = old.id and is_deleted = false) then
    raise exception 'No se puede eliminar este contacto porque tiene servicios externos asociados.';
  end if;
  return old;
end;
$function$;

-- 2b. Update trigger to use new function
DROP TRIGGER IF EXISTS trigger_protect_linked_contact_delete ON contacts.contacts;
CREATE TRIGGER trigger_protect_linked_contact_delete
  BEFORE UPDATE ON contacts.contacts
  FOR EACH ROW
  WHEN (NEW.is_deleted = true AND OLD.is_deleted = false)
  EXECUTE FUNCTION contacts.protect_linked_contact_delete();

-- 2c. Drop old function from iam
DROP FUNCTION IF EXISTS iam.protect_linked_contact_delete();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. REPOINT trigger to use existing public.set_timestamp()
--    (iam.update_contact_category_links_updated_at was a duplicate)
-- ─────────────────────────────────────────────────────────────────────────────

-- 3a. Replace trigger to use existing generic function
DROP TRIGGER IF EXISTS trigger_contact_category_links_updated_at ON contacts.contact_category_links;
CREATE TRIGGER trigger_contact_category_links_updated_at
  BEFORE UPDATE ON contacts.contact_category_links
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamp();

-- 3b. Drop old duplicated function from iam
DROP FUNCTION IF EXISTS iam.update_contact_category_links_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RENAME RLS POLICIES: CONTACT_TYPES → CONTACT_CATEGORIES
-- ─────────────────────────────────────────────────────────────────────────────

-- contact_categories table
ALTER POLICY "MIEMBROS CREAN CONTACT_TYPES" ON contacts.contact_categories
  RENAME TO "MIEMBROS CREAN CONTACT_CATEGORIES";
ALTER POLICY "MIEMBROS EDITAN CONTACT_TYPES" ON contacts.contact_categories
  RENAME TO "MIEMBROS EDITAN CONTACT_CATEGORIES";
ALTER POLICY "MIEMBROS VEN CONTACT_TYPES" ON contacts.contact_categories
  RENAME TO "MIEMBROS VEN CONTACT_CATEGORIES";

-- contact_category_links table
ALTER POLICY "MIEMBROS BORRAN CONTACT_TYPE_LINKS" ON contacts.contact_category_links
  RENAME TO "MIEMBROS BORRAN CONTACT_CATEGORY_LINKS";
ALTER POLICY "MIEMBROS CREAN CONTACT_TYPE_LINKS" ON contacts.contact_category_links
  RENAME TO "MIEMBROS CREAN CONTACT_CATEGORY_LINKS";
ALTER POLICY "MIEMBROS EDITAN CONTACT_TYPE_LINKS" ON contacts.contact_category_links
  RENAME TO "MIEMBROS EDITAN CONTACT_CATEGORY_LINKS";
ALTER POLICY "MIEMBROS VEN CONTACT_TYPE_LINKS" ON contacts.contact_category_links
  RENAME TO "MIEMBROS VEN CONTACT_CATEGORY_LINKS";

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RECREATE contacts_view AS SECURITY DEFINER
--    (Joins iam.users, iam.organization_members, iam.roles,
--     iam.organization_external_actors — needs SECURITY DEFINER
--     because the caller (authenticated) may not have direct
--     SELECT on those iam tables)
-- ─────────────────────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS contacts.contacts_view;
CREATE VIEW contacts.contacts_view
  WITH (security_invoker = false)
AS
SELECT c.id,
    c.organization_id,
    c.contact_type,
    c.first_name,
    c.last_name,
    c.full_name,
    c.email,
    c.phone,
    c.company_name,
    c.company_id,
    c.location,
    c.notes,
    c.national_id,
    c.image_url,
    c.avatar_updated_at,
    c.is_local,
    c.display_name_override,
    c.linked_user_id,
    c.linked_at,
    c.sync_status,
    c.created_at,
    c.updated_at,
    c.is_deleted,
    c.deleted_at,
    u.avatar_url AS linked_user_avatar_url,
    u.full_name AS linked_user_full_name,
    u.email AS linked_user_email,
    COALESCE(u.avatar_url, c.image_url) AS resolved_avatar_url,
    company.full_name AS linked_company_name,
    COALESCE(company.full_name, c.company_name) AS resolved_company_name,
    COALESCE(( SELECT json_agg(json_build_object('id', cc.id, 'name', cc.name)) AS json_agg
           FROM (contacts.contact_category_links ccl
             JOIN contacts.contact_categories cc ON ((cc.id = ccl.contact_category_id)))
          WHERE ((ccl.contact_id = c.id) AND (cc.is_deleted = false))), '[]'::json) AS contact_categories,
    (EXISTS ( SELECT 1
           FROM iam.organization_members om
          WHERE ((om.user_id = c.linked_user_id) AND (om.organization_id = c.organization_id)))) AS is_organization_member,
    ( SELECT r.name
           FROM (iam.organization_members om
             JOIN iam.roles r ON ((r.id = om.role_id)))
          WHERE ((om.user_id = c.linked_user_id) AND (om.organization_id = c.organization_id) AND (om.is_active = true))
         LIMIT 1) AS member_role_name,
    ( SELECT oea.actor_type
           FROM iam.organization_external_actors oea
          WHERE ((oea.user_id = c.linked_user_id) AND (oea.organization_id = c.organization_id) AND (oea.is_active = true) AND (oea.is_deleted = false))
         LIMIT 1) AS external_actor_type
   FROM ((contacts.contacts c
     LEFT JOIN iam.users u ON ((u.id = c.linked_user_id)))
     LEFT JOIN contacts.contacts company ON (((company.id = c.company_id) AND (company.is_deleted = false))))
  WHERE (c.is_deleted = false);

COMMIT;
