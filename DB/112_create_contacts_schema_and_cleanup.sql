-- ============================================================================
-- 112: Create contacts schema + revert project_labor + cleanup
-- ============================================================================
-- Actions:
--   0. Revert project_labor and labor_insurances from construction → projects
--   1. Create schema "contacts"
--   2. Drop dependent views that reference contacts tables
--   3. Drop triggers and RLS from contacts tables in projects
--   4. Move contacts, contact_categories, contact_category_links to contacts schema
--   5. Recreate RLS policies in contacts schema
--   6. Recreate triggers in contacts schema
--   7. Recreate contacts_view and contacts_summary_view in contacts schema
--   8. Recreate projects views that referenced projects.contacts
--   9. Update IAM functions (merge_contacts, protect_linked_contact_delete, ensure_contact_for_user)
--  10. Update audit functions (log_project_labor_activity, log_labor_payment_activity)
--  11. Recreate finance views that reference contacts
--  12. Recreate construction views that reference contacts
--  13. Drop dead projects functions
--  14. Grant permissions
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 0: Revert project_labor and labor_insurances to projects schema
-- (Script 111 moved them to construction, but they are project-level resource
--  assignments analogous to project_clients and should stay in projects)
-- ============================================================================

-- 0.1: Drop views that script 111 created in construction
DROP VIEW IF EXISTS construction.project_labor_view CASCADE;
DROP VIEW IF EXISTS construction.labor_insurance_view CASCADE;

-- 0.2: Drop RLS policies created by script 111 in construction
DROP POLICY IF EXISTS "MIEMBROS CREAN PROJECT_LABOR" ON construction.project_labor;
DROP POLICY IF EXISTS "MIEMBROS EDITAN PROJECT_LABOR" ON construction.project_labor;
DROP POLICY IF EXISTS "MIEMBROS VEN PROJECT_LABOR" ON construction.project_labor;
DROP POLICY IF EXISTS "MIEMBROS VEN LABOR_INSURANCES" ON construction.labor_insurances;
DROP POLICY IF EXISTS "MIEMBROS CREAN LABOR_INSURANCES" ON construction.labor_insurances;
DROP POLICY IF EXISTS "MIEMBROS EDITAN LABOR_INSURANCES" ON construction.labor_insurances;

-- 0.3: Drop triggers before moving
DROP TRIGGER IF EXISTS on_project_labor_audit ON construction.project_labor;
DROP TRIGGER IF EXISTS set_updated_by_project_labor ON construction.project_labor;

-- 0.4: Move tables back to projects
ALTER TABLE construction.project_labor SET SCHEMA projects;
ALTER TABLE construction.labor_insurances SET SCHEMA projects;

-- 0.5: Recreate RLS policies in projects
ALTER TABLE projects.project_labor ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects.labor_insurances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MIEMBROS CREAN PROJECT_LABOR" ON projects.project_labor
    FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'construction.manage'::text));

CREATE POLICY "MIEMBROS EDITAN PROJECT_LABOR" ON projects.project_labor
    FOR UPDATE
    USING (can_mutate_org(organization_id, 'construction.manage'::text));

CREATE POLICY "MIEMBROS VEN PROJECT_LABOR" ON projects.project_labor
    FOR SELECT
    USING (can_view_org(organization_id, 'construction.view'::text));

CREATE POLICY "MIEMBROS VEN LABOR_INSURANCES" ON projects.labor_insurances
    FOR SELECT
    USING (can_view_org(organization_id, 'construction.view'::text));

CREATE POLICY "MIEMBROS CREAN LABOR_INSURANCES" ON projects.labor_insurances
    FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'construction.manage'::text));

CREATE POLICY "MIEMBROS EDITAN LABOR_INSURANCES" ON projects.labor_insurances
    FOR UPDATE
    USING (can_mutate_org(organization_id, 'construction.manage'::text));

-- 0.6: Recreate triggers on projects.project_labor
CREATE TRIGGER on_project_labor_audit
    AFTER INSERT OR UPDATE OR DELETE ON projects.project_labor
    FOR EACH ROW EXECUTE FUNCTION audit.log_project_labor_activity();

CREATE TRIGGER set_updated_by_project_labor
    BEFORE INSERT OR UPDATE ON projects.project_labor
    FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

-- ============================================================================
-- PART 1: Create schema
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS contacts;

-- ============================================================================
-- PART 2: Drop dependent views (projects schema)
-- All these views reference projects.contacts and need to be recreated
-- ============================================================================
DROP VIEW IF EXISTS projects.contacts_view CASCADE;
DROP VIEW IF EXISTS projects.contacts_summary_view CASCADE;
DROP VIEW IF EXISTS projects.project_clients_view CASCADE;
DROP VIEW IF EXISTS projects.project_access_view CASCADE;
DROP VIEW IF EXISTS projects.labor_insurance_view CASCADE;
DROP VIEW IF EXISTS projects.project_labor_view CASCADE;

-- ============================================================================
-- PART 3: Drop triggers and RLS from contacts tables in projects
-- ============================================================================

-- contacts triggers
DROP TRIGGER IF EXISTS on_contact_audit ON projects.contacts;
DROP TRIGGER IF EXISTS set_updated_by_contacts ON projects.contacts;
DROP TRIGGER IF EXISTS trigger_protect_linked_contact_delete ON projects.contacts;

-- contact_categories triggers
DROP TRIGGER IF EXISTS on_contact_category_audit ON projects.contact_categories;
DROP TRIGGER IF EXISTS set_updated_by_contact_categories ON projects.contact_categories;

-- contact_category_links triggers
DROP TRIGGER IF EXISTS trigger_contact_category_links_updated_at ON projects.contact_category_links;

-- contacts RLS policies
DROP POLICY IF EXISTS "MIEMBROS VEN CONTACTS" ON projects.contacts;
DROP POLICY IF EXISTS "MIEMBROS CREAN CONTACTS" ON projects.contacts;
DROP POLICY IF EXISTS "MIEMBROS EDITAN CONTACTS" ON projects.contacts;

-- contact_categories RLS policies
DROP POLICY IF EXISTS "MIEMBROS VEN CONTACT_TYPES" ON projects.contact_categories;
DROP POLICY IF EXISTS "MIEMBROS CREAN CONTACT_TYPES" ON projects.contact_categories;
DROP POLICY IF EXISTS "MIEMBROS EDITAN CONTACT_TYPES" ON projects.contact_categories;

-- contact_category_links RLS policies
DROP POLICY IF EXISTS "MIEMBROS VEN CONTACT_TYPE_LINKS" ON projects.contact_category_links;
DROP POLICY IF EXISTS "MIEMBROS CREAN CONTACT_TYPE_LINKS" ON projects.contact_category_links;
DROP POLICY IF EXISTS "MIEMBROS EDITAN CONTACT_TYPE_LINKS" ON projects.contact_category_links;
DROP POLICY IF EXISTS "MIEMBROS BORRAN CONTACT_TYPE_LINKS" ON projects.contact_category_links;

-- ============================================================================
-- PART 4: Move tables to contacts schema
-- ============================================================================
ALTER TABLE projects.contact_categories SET SCHEMA contacts;
ALTER TABLE projects.contacts SET SCHEMA contacts;
ALTER TABLE projects.contact_category_links SET SCHEMA contacts;

-- ============================================================================
-- PART 5: Recreate RLS policies in contacts schema
-- ============================================================================

-- contacts RLS
ALTER TABLE contacts.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MIEMBROS VEN CONTACTS" ON contacts.contacts
    FOR SELECT TO public
    USING ((is_deleted = false) AND is_org_member(organization_id));

CREATE POLICY "MIEMBROS CREAN CONTACTS" ON contacts.contacts
    FOR INSERT TO public
    WITH CHECK (is_org_member(organization_id));

CREATE POLICY "MIEMBROS EDITAN CONTACTS" ON contacts.contacts
    FOR UPDATE TO public
    USING (is_org_member(organization_id));

-- contact_categories RLS
ALTER TABLE contacts.contact_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MIEMBROS VEN CONTACT_TYPES" ON contacts.contact_categories
    FOR SELECT TO public
    USING ((organization_id IS NULL) OR is_org_member(organization_id));

CREATE POLICY "MIEMBROS CREAN CONTACT_TYPES" ON contacts.contact_categories
    FOR INSERT TO public
    WITH CHECK (is_org_member(organization_id));

CREATE POLICY "MIEMBROS EDITAN CONTACT_TYPES" ON contacts.contact_categories
    FOR UPDATE TO public
    USING ((organization_id IS NOT NULL) AND is_org_member(organization_id));

-- contact_category_links RLS
ALTER TABLE contacts.contact_category_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MIEMBROS VEN CONTACT_TYPE_LINKS" ON contacts.contact_category_links
    FOR SELECT TO public
    USING (is_org_member(organization_id));

CREATE POLICY "MIEMBROS CREAN CONTACT_TYPE_LINKS" ON contacts.contact_category_links
    FOR INSERT TO public
    WITH CHECK (is_org_member(organization_id));

CREATE POLICY "MIEMBROS EDITAN CONTACT_TYPE_LINKS" ON contacts.contact_category_links
    FOR UPDATE TO public
    USING (is_org_member(organization_id));

CREATE POLICY "MIEMBROS BORRAN CONTACT_TYPE_LINKS" ON contacts.contact_category_links
    FOR DELETE TO public
    USING (is_org_member(organization_id));

-- ============================================================================
-- PART 6: Recreate triggers in contacts schema
-- ============================================================================

-- contacts triggers
CREATE TRIGGER on_contact_audit
    AFTER INSERT OR UPDATE OR DELETE ON contacts.contacts
    FOR EACH ROW EXECUTE FUNCTION audit.log_contact_activity();

CREATE TRIGGER set_updated_by_contacts
    BEFORE INSERT OR UPDATE ON contacts.contacts
    FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

CREATE TRIGGER trigger_protect_linked_contact_delete
    BEFORE UPDATE ON contacts.contacts
    FOR EACH ROW EXECUTE FUNCTION iam.protect_linked_contact_delete();

-- contact_categories triggers
CREATE TRIGGER on_contact_category_audit
    AFTER INSERT OR UPDATE OR DELETE ON contacts.contact_categories
    FOR EACH ROW EXECUTE FUNCTION audit.log_contact_category_activity();

CREATE TRIGGER set_updated_by_contact_categories
    BEFORE UPDATE ON contacts.contact_categories
    FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

-- contact_category_links triggers
CREATE TRIGGER trigger_contact_category_links_updated_at
    BEFORE UPDATE ON contacts.contact_category_links
    FOR EACH ROW EXECUTE FUNCTION iam.update_contact_category_links_updated_at();

-- ============================================================================
-- PART 7: Recreate contacts views in contacts schema
-- ============================================================================

CREATE OR REPLACE VIEW contacts.contacts_summary_view AS
SELECT c.organization_id,
    count(*) AS total_contacts,
    count(c.linked_user_id) AS linked_contacts,
    count(
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM iam.organization_members om
              WHERE ((om.user_id = c.linked_user_id) AND (om.organization_id = c.organization_id)))) THEN 1
            ELSE NULL::integer
        END) AS member_contacts
   FROM contacts.contacts c
  WHERE (c.is_deleted = false)
  GROUP BY c.organization_id;

CREATE OR REPLACE VIEW contacts.contacts_view AS
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

-- ============================================================================
-- PART 8: Recreate projects views that referenced projects.contacts
-- (Now referencing contacts.contacts)
-- ============================================================================

CREATE OR REPLACE VIEW projects.project_clients_view AS
SELECT pc.id,
    pc.project_id,
    pc.organization_id,
    pc.contact_id,
    pc.client_role_id,
    pc.is_primary,
    pc.status,
    pc.notes,
    pc.created_at,
    pc.updated_at,
    pc.is_deleted,
    c.full_name AS contact_full_name,
    c.first_name AS contact_first_name,
    c.last_name AS contact_last_name,
    c.email AS contact_email,
    c.phone AS contact_phone,
    c.company_name AS contact_company_name,
    c.image_url AS contact_image_url,
    c.linked_user_id,
    u.avatar_url AS linked_user_avatar_url,
    COALESCE(u.avatar_url, c.image_url) AS contact_avatar_url,
    cr.name AS role_name,
    ( SELECT inv.status
           FROM iam.organization_invitations inv
          WHERE ((inv.client_id = pc.id) AND (inv.organization_id = pc.organization_id) AND (inv.status = 'pending'::text))
          ORDER BY inv.created_at DESC
         LIMIT 1) AS invitation_status,
    ( SELECT inv.id
           FROM iam.organization_invitations inv
          WHERE ((inv.client_id = pc.id) AND (inv.organization_id = pc.organization_id) AND (inv.status = 'pending'::text))
          ORDER BY inv.created_at DESC
         LIMIT 1) AS invitation_id,
    ( SELECT inv.created_at
           FROM iam.organization_invitations inv
          WHERE ((inv.client_id = pc.id) AND (inv.organization_id = pc.organization_id) AND (inv.status = 'pending'::text))
          ORDER BY inv.created_at DESC
         LIMIT 1) AS invitation_sent_at
   FROM (((projects.project_clients pc
     LEFT JOIN contacts.contacts c ON ((c.id = pc.contact_id)))
     LEFT JOIN iam.users u ON ((u.id = c.linked_user_id)))
     LEFT JOIN projects.client_roles cr ON ((cr.id = pc.client_role_id)))
  WHERE (pc.is_deleted = false);

CREATE OR REPLACE VIEW projects.project_access_view AS
SELECT pa.id,
    pa.project_id,
    pa.organization_id,
    pa.user_id,
    pa.access_type,
    pa.access_level,
    pa.granted_by,
    pa.client_id,
    pa.is_active,
    pa.created_at,
    pa.updated_at,
    pa.is_deleted,
    u.full_name AS user_full_name,
    u.email AS user_email,
    u.avatar_url AS user_avatar_url,
    c.id AS contact_id,
    c.full_name AS contact_full_name,
    c.email AS contact_email,
    c.phone AS contact_phone,
    c.company_name AS contact_company_name,
    c.image_url AS contact_image_url,
    COALESCE(u.avatar_url, c.image_url) AS resolved_avatar_url,
    gm_u.full_name AS granted_by_name,
    pc_c.full_name AS client_name
   FROM ((((((iam.project_access pa
     LEFT JOIN iam.users u ON ((u.id = pa.user_id)))
     LEFT JOIN contacts.contacts c ON (((c.linked_user_id = pa.user_id) AND (c.organization_id = pa.organization_id) AND (c.is_deleted = false))))
     LEFT JOIN iam.organization_members gm ON ((gm.id = pa.granted_by)))
     LEFT JOIN iam.users gm_u ON ((gm_u.id = gm.user_id)))
     LEFT JOIN projects.project_clients pc ON ((pc.id = pa.client_id)))
     LEFT JOIN contacts.contacts pc_c ON ((pc_c.id = pc.contact_id)))
  WHERE (pa.is_deleted = false);

CREATE OR REPLACE VIEW projects.labor_insurance_view AS
SELECT li.id,
    li.organization_id,
    li.project_id,
    li.labor_id,
    pl.contact_id,
    li.insurance_type,
    li.policy_number,
    li.provider,
    li.coverage_start,
    li.coverage_end,
    li.reminder_days,
    li.certificate_attachment_id,
    li.notes,
    li.created_by,
    li.created_at,
    li.updated_at,
    (li.coverage_end - CURRENT_DATE) AS days_to_expiry,
        CASE
            WHEN (CURRENT_DATE > li.coverage_end) THEN 'vencido'::text
            WHEN ((li.coverage_end - CURRENT_DATE) <= 30) THEN 'por_vencer'::text
            ELSE 'vigente'::text
        END AS status,
    ct.first_name AS contact_first_name,
    ct.last_name AS contact_last_name,
    COALESCE(ct.display_name_override, ct.full_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_display_name,
    lt.name AS labor_type_name,
    proj.name AS project_name
   FROM ((((projects.labor_insurances li
     LEFT JOIN projects.project_labor pl ON ((pl.id = li.labor_id)))
     LEFT JOIN contacts.contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN catalog.labor_categories lt ON ((lt.id = pl.labor_type_id)))
     LEFT JOIN projects.projects proj ON ((proj.id = li.project_id)));

CREATE OR REPLACE VIEW projects.project_labor_view AS
SELECT pl.id,
    pl.project_id,
    pl.organization_id,
    pl.contact_id,
    pl.labor_type_id,
    pl.status,
    pl.notes,
    pl.start_date,
    pl.end_date,
    pl.created_at,
    pl.updated_at,
    pl.created_by,
    pl.updated_by,
    pl.is_deleted,
    pl.deleted_at,
    ct.first_name AS contact_first_name,
    ct.last_name AS contact_last_name,
    ct.full_name AS contact_full_name,
    COALESCE(ct.display_name_override, ct.full_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_display_name,
    ct.national_id AS contact_national_id,
    ct.phone AS contact_phone,
    ct.email AS contact_email,
    ct.image_url AS contact_image_url,
    lc.name AS labor_type_name,
    lc.description AS labor_type_description,
    proj.name AS project_name,
    om_created.id AS creator_member_id,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.contact_id = ct.id))) AS contact_has_attachments,
    COALESCE(payment_stats.total_payments, 0) AS total_payments_count,
    COALESCE(payment_stats.total_amount, (0)::numeric) AS total_amount_paid
   FROM ((((((projects.project_labor pl
     LEFT JOIN contacts.contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN catalog.labor_categories lc ON ((lc.id = pl.labor_type_id)))
     LEFT JOIN projects.projects proj ON ((proj.id = pl.project_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = pl.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS total_payments,
            sum(lp.amount) AS total_amount
           FROM finance.labor_payments lp
          WHERE ((lp.labor_id = pl.id) AND ((lp.is_deleted = false) OR (lp.is_deleted IS NULL)) AND (lp.status = 'confirmed'::text))) payment_stats ON (true))
  WHERE (pl.is_deleted = false);

-- ============================================================================
-- PART 9: Update IAM functions
-- ============================================================================

-- 9a. iam.merge_contacts — references projects.contacts and projects.contact_category_links
CREATE OR REPLACE FUNCTION iam.merge_contacts(p_source_contact_id uuid, p_target_contact_id uuid, p_organization_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'contacts', 'projects', 'finance', 'catalog'
AS $function$
declare
  v_source_exists boolean;
  v_target_exists boolean;
  v_merged_references int := 0;
begin
  select exists(
    select 1 from contacts.contacts where id = p_source_contact_id and organization_id = p_organization_id and is_deleted = false
  ) into v_source_exists;

  if not v_source_exists then
    return jsonb_build_object('success', false, 'error', 'source_not_found');
  end if;

  select exists(
    select 1 from contacts.contacts where id = p_target_contact_id and organization_id = p_organization_id and is_deleted = false
  ) into v_target_exists;

  if not v_target_exists then
    return jsonb_build_object('success', false, 'error', 'target_not_found');
  end if;

  -- Update all references from source to target
  update projects.project_clients set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;

  update projects.project_labor set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;

  update finance.subcontracts set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;

  update finance.subcontract_bids set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;

  update finance.movements set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;

  update finance.material_invoices set provider_id = p_target_contact_id, updated_at = now() where provider_id = p_source_contact_id;

  update finance.material_purchase_orders set provider_id = p_target_contact_id, updated_at = now() where provider_id = p_source_contact_id;

  update catalog.materials set default_provider_id = p_target_contact_id, updated_at = now() where default_provider_id = p_source_contact_id;

  update catalog.task_recipe_external_services set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;

  -- Merge category links (avoid duplicates)
  update contacts.contact_category_links set contact_id = p_target_contact_id
  where contact_id = p_source_contact_id
    and category_id not in (select category_id from contacts.contact_category_links where contact_id = p_target_contact_id);

  delete from contacts.contact_category_links where contact_id = p_source_contact_id;

  update contacts.contacts
  set is_deleted = true, deleted_at = now(), updated_at = now()
  where id = p_source_contact_id;

  return jsonb_build_object('success', true, 'source_id', p_source_contact_id, 'target_id', p_target_contact_id);
end;
$function$;

-- 9b. iam.protect_linked_contact_delete — references projects.project_labor
CREATE OR REPLACE FUNCTION iam.protect_linked_contact_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'contacts', 'projects', 'finance', 'catalog'
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

-- 9c. iam.ensure_contact_for_user — references projects.contacts (5 times)
CREATE OR REPLACE FUNCTION iam.ensure_contact_for_user(p_organization_id uuid, p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'contacts'
AS $function$
declare
  v_user record;
  v_user_data record;
  v_contact_id uuid;
  v_first_name text;
  v_last_name text;
begin
  select u.id, u.full_name, u.email, u.avatar_url
  into v_user
  from iam.users u
  where u.id = p_user_id
  limit 1;

  if v_user.id is null then
    return null;
  end if;

  if v_user.email is null then
    return null;
  end if;

  select ud.first_name, ud.last_name
  into v_user_data
  from iam.user_data ud
  where ud.user_id = p_user_id
  limit 1;

  if v_user_data.first_name is not null then
    v_first_name := v_user_data.first_name;
    v_last_name := coalesce(v_user_data.last_name, '');
  elsif v_user.full_name is not null then
    v_first_name := split_part(v_user.full_name, ' ', 1);
    v_last_name := nullif(trim(substring(v_user.full_name from position(' ' in v_user.full_name) + 1)), '');
  end if;

  select c.id
  into v_contact_id
  from contacts.contacts c
  where c.organization_id = p_organization_id
    and c.linked_user_id = v_user.id
    and c.is_deleted = false
  limit 1;

  if v_contact_id is not null then
    update contacts.contacts c
    set
      first_name = coalesce(c.first_name, v_first_name),
      last_name  = coalesce(c.last_name, v_last_name),
      image_url  = coalesce(c.image_url, v_user.avatar_url),
      full_name  = coalesce(v_user.full_name, c.full_name),
      email      = coalesce(v_user.email, c.email),
      updated_at = now()
    where c.id = v_contact_id
      and (c.first_name is null or c.image_url is null);

    return v_contact_id;
  end if;

  select c.id
  into v_contact_id
  from contacts.contacts c
  where c.organization_id = p_organization_id
    and c.email = v_user.email
    and c.linked_user_id is null
    and c.is_deleted = false
  limit 1;

  if v_contact_id is not null then
    update contacts.contacts c
    set
      linked_user_id = v_user.id,
      first_name = coalesce(c.first_name, v_first_name),
      last_name  = coalesce(c.last_name, v_last_name),
      image_url  = coalesce(c.image_url, v_user.avatar_url),
      full_name  = coalesce(v_user.full_name, c.full_name),
      updated_at = now()
    where c.id = v_contact_id;

    return v_contact_id;
  end if;

  insert into contacts.contacts (
    organization_id, linked_user_id, first_name, last_name,
    full_name, email, image_url, created_at, updated_at
  )
  values (
    p_organization_id, v_user.id, v_first_name, v_last_name,
    v_user.full_name, v_user.email, v_user.avatar_url, now(), now()
  )
  returning id into v_contact_id;

  return v_contact_id;
end;
$function$;

-- ============================================================================
-- PART 10: Update audit functions
-- ============================================================================

-- 10a. audit.log_project_labor_activity — references projects.contacts
CREATE OR REPLACE FUNCTION audit.log_project_labor_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'contacts'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
    v_contact_name text;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_project_labor';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_project_labor';
        ELSE
            audit_action := 'update_project_labor';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_project_labor';
        resolved_member_id := NEW.created_by;
    END IF;

    SELECT COALESCE(full_name, first_name || ' ' || last_name, 'Sin nombre')
    INTO v_contact_name
    FROM contacts.contacts
    WHERE id = target_record.contact_id;

    audit_metadata := jsonb_build_object(
        'contact_name', v_contact_name,
        'status', target_record.status
    );

    BEGIN
        INSERT INTO audit.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, 
            resolved_member_id,
            audit_action, 
            target_record.id, 
            'project_labor', 
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$;

-- 10b. audit.log_labor_payment_activity — references projects.project_labor + projects.contacts
CREATE OR REPLACE FUNCTION audit.log_labor_payment_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'contacts', 'projects'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
    v_contact_name text;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_labor_payment';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_labor_payment';
        ELSE
            audit_action := 'update_labor_payment';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_labor_payment';
        resolved_member_id := NEW.created_by;
    END IF;

    -- Obtener nombre del trabajador para metadata
    SELECT COALESCE(c.full_name, c.first_name || ' ' || c.last_name, 'Sin nombre')
    INTO v_contact_name
    FROM projects.project_labor pl
    JOIN contacts.contacts c ON c.id = pl.contact_id
    WHERE pl.id = target_record.labor_id;

    audit_metadata := jsonb_build_object(
        'worker_name', v_contact_name,
        'amount', target_record.amount,
        'status', target_record.status
    );

    BEGIN
        INSERT INTO audit.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, 
            resolved_member_id,
            audit_action, 
            target_record.id, 
            'labor_payments', 
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$;

-- ============================================================================
-- PART 11: Recreate finance views that reference contacts
-- These are DROP + CREATE since they have multiple joins
-- ============================================================================

-- 11a. finance.labor_payments_view
DROP VIEW IF EXISTS finance.labor_payments_view CASCADE;
CREATE OR REPLACE VIEW finance.labor_payments_view AS
SELECT lp.id,
    lp.organization_id,
    lp.project_id,
    lp.labor_id,
    lp.payment_date,
    date_trunc('month'::text, (lp.payment_date)::timestamp with time zone) AS payment_month,
    lp.amount,
    lp.currency_id,
    lp.exchange_rate,
    lp.status,
    lp.wallet_id,
    lp.notes,
    lp.reference,
    lp.created_at,
    lp.updated_at,
    lp.created_by,
    lp.updated_by,
    lp.is_deleted,
    lp.deleted_at,
    lp.import_batch_id,
    (lp.amount * lp.exchange_rate) AS functional_amount,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    cur.name AS currency_name,
    ow.id AS org_wallet_id,
    w.name AS wallet_name,
    pl.contact_id,
    pl.labor_type_id,
    pl.status AS labor_status,
    ct.first_name AS contact_first_name,
    ct.last_name AS contact_last_name,
    COALESCE(ct.display_name_override, ct.full_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_display_name,
    ct.national_id AS contact_national_id,
    ct.phone AS contact_phone,
    ct.email AS contact_email,
    ct.image_url AS contact_image_url,
    lc.name AS labor_type_name,
    proj.name AS project_name,
    om_created.id AS creator_member_id,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.labor_payment_id = lp.id))) AS has_attachments
   FROM (((((((((finance.labor_payments lp
     LEFT JOIN finance.currencies cur ON ((cur.id = lp.currency_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = lp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN projects.project_labor pl ON ((pl.id = lp.labor_id)))
     LEFT JOIN contacts.contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN catalog.labor_categories lc ON ((lc.id = pl.labor_type_id)))
     LEFT JOIN projects.projects proj ON ((proj.id = lp.project_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = lp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((lp.is_deleted = false) OR (lp.is_deleted IS NULL));

-- 11b. finance.labor_by_type_view
DROP VIEW IF EXISTS finance.labor_by_type_view CASCADE;
CREATE OR REPLACE VIEW finance.labor_by_type_view AS
SELECT lp.organization_id,
    lp.project_id,
    date_trunc('month'::text, (lp.payment_date)::timestamp with time zone) AS payment_month,
    pl.labor_type_id,
    lt.name AS labor_type_name,
    sum((lp.amount * lp.exchange_rate)) AS total_functional_amount,
    count(*) AS payments_count
   FROM ((finance.labor_payments lp
     LEFT JOIN projects.project_labor pl ON ((pl.id = lp.labor_id)))
     LEFT JOIN catalog.labor_categories lt ON ((lt.id = pl.labor_type_id)))
  WHERE ((lp.status = 'confirmed'::text) AND ((lp.is_deleted IS NULL) OR (lp.is_deleted = false)))
  GROUP BY lp.organization_id, lp.project_id, (date_trunc('month'::text, (lp.payment_date)::timestamp with time zone)), pl.labor_type_id, lt.name;

-- 11c. finance.subcontracts_view
DROP VIEW IF EXISTS finance.subcontracts_view CASCADE;
CREATE OR REPLACE VIEW finance.subcontracts_view AS
SELECT s.id,
    s.organization_id,
    s.project_id,
    s.title,
    s.amount_total,
    s.currency_id,
    c.code AS currency_code,
    c.symbol AS currency_symbol,
    s.exchange_rate,
    s.date,
    s.status,
    s.notes,
    ct.id AS provider_id,
    COALESCE(ct.full_name, ct.company_name) AS provider_name,
    ct.image_url AS provider_image,
    s.created_at,
    s.updated_at,
    s.is_deleted,
    s.adjustment_index_type_id,
    s.base_period_year,
    s.base_period_month,
    s.base_index_value
   FROM ((finance.subcontracts s
     LEFT JOIN contacts.contacts ct ON ((s.contact_id = ct.id)))
     LEFT JOIN finance.currencies c ON ((s.currency_id = c.id)))
  WHERE (s.is_deleted = false);

-- 11d. finance.subcontract_payments_view
DROP VIEW IF EXISTS finance.subcontract_payments_view CASCADE;
CREATE OR REPLACE VIEW finance.subcontract_payments_view AS
SELECT sp.id,
    sp.organization_id,
    sp.project_id,
    sp.subcontract_id,
    sp.amount,
    sp.currency_id,
    sp.exchange_rate,
    sp.payment_date,
    sp.status,
    sp.wallet_id,
    sp.reference,
    sp.notes,
    sp.created_at,
    sp.created_by,
    sp.import_batch_id,
    date_trunc('month'::text, (sp.payment_date)::timestamp with time zone) AS payment_month,
    s.title AS subcontract_title,
    s.code AS subcontract_code,
    s.status AS subcontract_status,
    s.amount_total AS subcontract_amount_total,
    c.id AS provider_id,
    c.full_name AS provider_name,
    c.first_name AS provider_first_name,
    c.last_name AS provider_last_name,
    c.company_name AS provider_company_name,
    c.email AS provider_email,
    c.phone AS provider_phone,
    c.image_url AS provider_image_url,
    c.linked_user_id AS provider_linked_user_id,
    COALESCE(u.avatar_url, c.image_url) AS provider_avatar_url,
    w.name AS wallet_name,
    cur.symbol AS currency_symbol,
    cur.code AS currency_code,
    cur.name AS currency_name
   FROM ((((((finance.subcontract_payments sp
     LEFT JOIN finance.subcontracts s ON ((s.id = sp.subcontract_id)))
     LEFT JOIN contacts.contacts c ON ((c.id = s.contact_id)))
     LEFT JOIN iam.users u ON ((u.id = c.linked_user_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = sp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN finance.currencies cur ON ((cur.id = sp.currency_id)))
  WHERE (sp.is_deleted = false);

-- 11e. finance.material_invoices_view
DROP VIEW IF EXISTS finance.material_invoices_view CASCADE;
CREATE OR REPLACE VIEW finance.material_invoices_view AS
SELECT inv.id,
    inv.organization_id,
    inv.project_id,
    inv.purchase_order_id,
    inv.invoice_number,
    inv.document_type,
    inv.purchase_date,
    inv.subtotal,
    inv.tax_amount,
    inv.total_amount,
    inv.currency_id,
    c.symbol AS currency_symbol,
    c.code AS currency_code,
    inv.exchange_rate,
    inv.status,
    inv.notes,
    inv.provider_id,
    COALESCE(prov.company_name, ((prov.first_name || ' '::text) || prov.last_name)) AS provider_name,
    p.name AS project_name,
    po.order_number AS po_number,
    inv.created_at,
    inv.updated_at,
    inv.created_by,
    COALESCE(items.item_count, (0)::bigint) AS item_count
   FROM (((((finance.material_invoices inv
     LEFT JOIN finance.currencies c ON ((c.id = inv.currency_id)))
     LEFT JOIN contacts.contacts prov ON ((prov.id = inv.provider_id)))
     LEFT JOIN projects.projects p ON ((p.id = inv.project_id)))
     LEFT JOIN finance.material_purchase_orders po ON ((po.id = inv.purchase_order_id)))
     LEFT JOIN LATERAL ( SELECT count(*) AS item_count
           FROM finance.material_invoice_items ii
          WHERE (ii.invoice_id = inv.id)) items ON (true));

-- 11f. finance.material_payments_view
DROP VIEW IF EXISTS finance.material_payments_view CASCADE;
CREATE OR REPLACE VIEW finance.material_payments_view AS
SELECT mp.id,
    mp.organization_id,
    mp.project_id,
    mp.payment_date,
    date_trunc('month'::text, (mp.payment_date)::timestamp with time zone) AS payment_month,
    mp.amount,
    mp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(mp.exchange_rate, (1)::numeric) AS exchange_rate,
    mp.status,
    mp.wallet_id,
    w.name AS wallet_name,
    mp.notes,
    mp.reference,
    mp.purchase_id,
    mi.invoice_number,
    mi.provider_id,
    COALESCE(prov.company_name, ((prov.first_name || ' '::text) || prov.last_name)) AS provider_name,
    p.name AS project_name,
    mp.material_type_id,
    mt.name AS material_type_name,
    mp.created_by,
    u.full_name AS creator_full_name,
    u.avatar_url AS creator_avatar_url,
    mp.created_at,
    mp.updated_at,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.material_payment_id = mp.id))) AS has_attachments
   FROM (((((((((finance.material_payments mp
     LEFT JOIN finance.material_invoices mi ON ((mi.id = mp.purchase_id)))
     LEFT JOIN contacts.contacts prov ON ((prov.id = mi.provider_id)))
     LEFT JOIN projects.projects p ON ((p.id = mp.project_id)))
     LEFT JOIN iam.organization_members om ON ((om.id = mp.created_by)))
     LEFT JOIN iam.users u ON ((u.id = om.user_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = mp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN finance.currencies cur ON ((cur.id = mp.currency_id)))
     LEFT JOIN catalog.material_types mt ON ((mt.id = mp.material_type_id)))
  WHERE ((mp.is_deleted = false) OR (mp.is_deleted IS NULL));

-- 11g. finance.material_purchase_orders_view
DROP VIEW IF EXISTS finance.material_purchase_orders_view CASCADE;
CREATE OR REPLACE VIEW finance.material_purchase_orders_view AS
SELECT po.id,
    po.organization_id,
    po.project_id,
    po.order_number,
    po.order_date,
    po.expected_delivery_date,
    po.status,
    po.notes,
    po.subtotal,
    po.tax_amount,
    (po.subtotal + po.tax_amount) AS total,
    po.currency_id,
    c.symbol AS currency_symbol,
    c.code AS currency_code,
    po.provider_id,
    COALESCE(prov.company_name, ((prov.first_name || ' '::text) || prov.last_name)) AS provider_name,
    p.name AS project_name,
    po.created_at,
    po.updated_at,
    po.is_deleted,
    COALESCE(items.item_count, (0)::bigint) AS item_count
   FROM ((((finance.material_purchase_orders po
     LEFT JOIN finance.currencies c ON ((c.id = po.currency_id)))
     LEFT JOIN contacts.contacts prov ON ((prov.id = po.provider_id)))
     LEFT JOIN projects.projects p ON ((p.id = po.project_id)))
     LEFT JOIN LATERAL ( SELECT count(*) AS item_count
           FROM finance.material_purchase_order_items poi
          WHERE (poi.purchase_order_id = po.id)) items ON (true))
  WHERE (po.is_deleted = false);

-- 11h. finance.client_payments_view
DROP VIEW IF EXISTS finance.client_payments_view CASCADE;
CREATE OR REPLACE VIEW finance.client_payments_view AS
SELECT cp.id,
    cp.organization_id,
    cp.project_id,
    cp.client_id,
    cp.commitment_id,
    cp.amount,
    cp.currency_id,
    cp.exchange_rate,
    cp.payment_date,
    cp.status,
    cp.wallet_id,
    cp.reference,
    cp.notes,
    cp.created_at,
    cp.created_by,
    cp.schedule_id,
    cp.updated_at,
    cp.is_deleted,
    date_trunc('month'::text, (cp.payment_date)::timestamp with time zone) AS payment_month,
    c.full_name AS client_name,
    c.first_name AS client_first_name,
    c.last_name AS client_last_name,
    c.company_name AS client_company_name,
    c.email AS client_email,
    c.phone AS client_phone,
    cr.name AS client_role_name,
    c.image_url AS client_image_url,
    u_client.avatar_url AS client_linked_user_avatar_url,
    COALESCE(u_client.avatar_url, c.image_url) AS client_avatar_url,
    w.name AS wallet_name,
    cur.symbol AS currency_symbol,
    cur.code AS currency_code,
    cc.concept AS commitment_concept,
    cps.notes AS schedule_notes,
    u_creator.full_name AS creator_full_name,
    u_creator.avatar_url AS creator_avatar_url,
    p.name AS project_name,
    p.image_url AS project_image_url,
    p.color AS project_color
   FROM ((((((((((((finance.client_payments cp
     LEFT JOIN projects.project_clients pc ON ((pc.id = cp.client_id)))
     LEFT JOIN contacts.contacts c ON ((c.id = pc.contact_id)))
     LEFT JOIN iam.users u_client ON ((u_client.id = c.linked_user_id)))
     LEFT JOIN projects.client_roles cr ON ((cr.id = pc.client_role_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = cp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN finance.currencies cur ON ((cur.id = cp.currency_id)))
     LEFT JOIN finance.client_commitments cc ON ((cc.id = cp.commitment_id)))
     LEFT JOIN finance.client_payment_schedule cps ON ((cps.id = cp.schedule_id)))
     LEFT JOIN iam.organization_members om ON ((om.id = cp.created_by)))
     LEFT JOIN iam.users u_creator ON ((u_creator.id = om.user_id)))
     LEFT JOIN projects.projects p ON ((p.id = cp.project_id)))
  WHERE (cp.is_deleted = false);

-- 11i. finance.unified_financial_movements_view (MASSIVE - 7 UNION ALL blocks)
DROP VIEW IF EXISTS finance.unified_financial_movements_view CASCADE;
CREATE OR REPLACE VIEW finance.unified_financial_movements_view AS
-- Block 1: general_cost
SELECT gcp.id,
    'general_cost'::text AS movement_type,
    gcp.organization_id,
    NULL::uuid AS project_id,
    gcp.payment_date,
    date_trunc('month'::text, (gcp.payment_date)::timestamp with time zone) AS payment_month,
    gcp.amount,
    gcp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(gcp.exchange_rate, (1)::numeric) AS exchange_rate,
    (gcp.amount * COALESCE(gcp.exchange_rate, (1)::numeric)) AS functional_amount,
    '-1'::integer AS amount_sign,
    gcp.status,
    gcp.wallet_id,
    w.name AS wallet_name,
    gc.name AS concept_name,
    gcc.name AS category_name,
    NULL::text AS contact_name,
    gcp.notes,
    gcp.reference,
    gcp.created_at,
    gcp.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.general_cost_payment_id = gcp.id))) AS has_attachments,
    NULL::numeric AS to_amount,
    NULL::text AS to_currency_code,
    NULL::text AS to_currency_symbol,
    NULL::text AS to_wallet_name
   FROM (((((((finance.general_costs_payments gcp
     LEFT JOIN finance.currencies cur ON ((cur.id = gcp.currency_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = gcp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN finance.general_costs gc ON ((gc.id = gcp.general_cost_id)))
     LEFT JOIN finance.general_cost_categories gcc ON ((gcc.id = gc.category_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = gcp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE (gcp.is_deleted = false)
UNION ALL
-- Block 2: material_payment
 SELECT mp.id,
    'material_payment'::text AS movement_type,
    mp.organization_id,
    mp.project_id,
    mp.payment_date,
    date_trunc('month'::text, (mp.payment_date)::timestamp with time zone) AS payment_month,
    mp.amount,
    mp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(mp.exchange_rate, (1)::numeric) AS exchange_rate,
    (mp.amount * COALESCE(mp.exchange_rate, (1)::numeric)) AS functional_amount,
    '-1'::integer AS amount_sign,
    mp.status,
    mp.wallet_id,
    w.name AS wallet_name,
    mt.name AS concept_name,
    NULL::text AS category_name,
    COALESCE(prov.company_name, ((prov.first_name || ' '::text) || prov.last_name)) AS contact_name,
    mp.notes,
    mp.reference,
    mp.created_at,
    mp.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.material_payment_id = mp.id))) AS has_attachments,
    NULL::numeric AS to_amount,
    NULL::text AS to_currency_code,
    NULL::text AS to_currency_symbol,
    NULL::text AS to_wallet_name
   FROM ((((((((finance.material_payments mp
     LEFT JOIN finance.currencies cur ON ((cur.id = mp.currency_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = mp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN catalog.material_types mt ON ((mt.id = mp.material_type_id)))
     LEFT JOIN finance.material_invoices mi ON ((mi.id = mp.purchase_id)))
     LEFT JOIN contacts.contacts prov ON ((prov.id = mi.provider_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = mp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((mp.is_deleted = false) OR (mp.is_deleted IS NULL))
UNION ALL
-- Block 3: labor_payment
 SELECT lp.id,
    'labor_payment'::text AS movement_type,
    lp.organization_id,
    lp.project_id,
    lp.payment_date,
    date_trunc('month'::text, (lp.payment_date)::timestamp with time zone) AS payment_month,
    lp.amount,
    lp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(lp.exchange_rate, (1)::numeric) AS exchange_rate,
    (lp.amount * COALESCE(lp.exchange_rate, (1)::numeric)) AS functional_amount,
    '-1'::integer AS amount_sign,
    lp.status,
    lp.wallet_id,
    w.name AS wallet_name,
    lc.name AS concept_name,
    NULL::text AS category_name,
    COALESCE(ct.display_name_override, ct.full_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_name,
    lp.notes,
    lp.reference,
    lp.created_at,
    lp.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.labor_payment_id = lp.id))) AS has_attachments,
    NULL::numeric AS to_amount,
    NULL::text AS to_currency_code,
    NULL::text AS to_currency_symbol,
    NULL::text AS to_wallet_name
   FROM ((((((((finance.labor_payments lp
     LEFT JOIN finance.currencies cur ON ((cur.id = lp.currency_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = lp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN projects.project_labor pl ON ((pl.id = lp.labor_id)))
     LEFT JOIN contacts.contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN catalog.labor_categories lc ON ((lc.id = pl.labor_type_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = lp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((lp.is_deleted = false) OR (lp.is_deleted IS NULL))
UNION ALL
-- Block 4: subcontract_payment
 SELECT sp.id,
    'subcontract_payment'::text AS movement_type,
    sp.organization_id,
    sp.project_id,
    sp.payment_date,
    date_trunc('month'::text, (sp.payment_date)::timestamp with time zone) AS payment_month,
    sp.amount,
    sp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(sp.exchange_rate, (1)::numeric) AS exchange_rate,
    (sp.amount * COALESCE(sp.exchange_rate, (1)::numeric)) AS functional_amount,
    '-1'::integer AS amount_sign,
    sp.status,
    sp.wallet_id,
    w.name AS wallet_name,
    s.title AS concept_name,
    NULL::text AS category_name,
    COALESCE(ct.full_name, ct.company_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_name,
    sp.notes,
    sp.reference,
    sp.created_at,
    sp.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.subcontract_payment_id = sp.id))) AS has_attachments,
    NULL::numeric AS to_amount,
    NULL::text AS to_currency_code,
    NULL::text AS to_currency_symbol,
    NULL::text AS to_wallet_name
   FROM (((((((finance.subcontract_payments sp
     LEFT JOIN finance.currencies cur ON ((cur.id = sp.currency_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = sp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN finance.subcontracts s ON ((s.id = sp.subcontract_id)))
     LEFT JOIN contacts.contacts ct ON ((ct.id = s.contact_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = sp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((sp.is_deleted = false) OR (sp.is_deleted IS NULL))
UNION ALL
-- Block 5: client_payment
 SELECT cp.id,
    'client_payment'::text AS movement_type,
    cp.organization_id,
    cp.project_id,
    cp.payment_date,
    date_trunc('month'::text, (cp.payment_date)::timestamp with time zone) AS payment_month,
    cp.amount,
    cp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(cp.exchange_rate, (1)::numeric) AS exchange_rate,
    (cp.amount * COALESCE(cp.exchange_rate, (1)::numeric)) AS functional_amount,
    1 AS amount_sign,
    cp.status,
    cp.wallet_id,
    w.name AS wallet_name,
    cc.concept AS concept_name,
    NULL::text AS category_name,
    COALESCE(ct.full_name, ct.company_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_name,
    cp.notes,
    cp.reference,
    cp.created_at,
    cp.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    (EXISTS ( SELECT 1
           FROM media_links ml
          WHERE (ml.client_payment_id = cp.id))) AS has_attachments,
    NULL::numeric AS to_amount,
    NULL::text AS to_currency_code,
    NULL::text AS to_currency_symbol,
    NULL::text AS to_wallet_name
   FROM ((((((((finance.client_payments cp
     LEFT JOIN finance.currencies cur ON ((cur.id = cp.currency_id)))
     LEFT JOIN finance.organization_wallets ow ON ((ow.id = cp.wallet_id)))
     LEFT JOIN finance.wallets w ON ((w.id = ow.wallet_id)))
     LEFT JOIN projects.project_clients pc ON ((pc.id = cp.client_id)))
     LEFT JOIN contacts.contacts ct ON ((ct.id = pc.contact_id)))
     LEFT JOIN finance.client_commitments cc ON ((cc.id = cp.commitment_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = cp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((cp.is_deleted = false) OR (cp.is_deleted IS NULL))
UNION ALL
-- Block 6: currency_exchange
 SELECT fo.id,
    'currency_exchange'::text AS movement_type,
    fo.organization_id,
    fo.project_id,
    fo.operation_date AS payment_date,
    date_trunc('month'::text, (fo.operation_date)::timestamp with time zone) AS payment_month,
    fom_out.amount,
    fom_out.currency_id,
    cur_out.code AS currency_code,
    cur_out.symbol AS currency_symbol,
    COALESCE(fom_out.exchange_rate, (1)::numeric) AS exchange_rate,
    (fom_out.amount * COALESCE(fom_out.exchange_rate, (1)::numeric)) AS functional_amount,
    0 AS amount_sign,
    'confirmed'::text AS status,
    fom_out.wallet_id,
    w_out.name AS wallet_name,
    concat(w_out.name, ' → ', w_in.name) AS concept_name,
    NULL::text AS category_name,
    NULL::text AS contact_name,
    fo.description AS notes,
    NULL::text AS reference,
    fo.created_at,
    fo.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    false AS has_attachments,
    fom_in.amount AS to_amount,
    cur_in.code AS to_currency_code,
    cur_in.symbol AS to_currency_symbol,
    w_in.name AS to_wallet_name
   FROM ((((((((((finance.financial_operations fo
     LEFT JOIN finance.financial_operation_movements fom_out ON (((fom_out.financial_operation_id = fo.id) AND (fom_out.direction = 'out'::text) AND ((fom_out.is_deleted = false) OR (fom_out.is_deleted IS NULL)))))
     LEFT JOIN finance.financial_operation_movements fom_in ON (((fom_in.financial_operation_id = fo.id) AND (fom_in.direction = 'in'::text) AND ((fom_in.is_deleted = false) OR (fom_in.is_deleted IS NULL)))))
     LEFT JOIN finance.currencies cur_out ON ((cur_out.id = fom_out.currency_id)))
     LEFT JOIN finance.currencies cur_in ON ((cur_in.id = fom_in.currency_id)))
     LEFT JOIN finance.organization_wallets ow_out ON ((ow_out.id = fom_out.wallet_id)))
     LEFT JOIN finance.wallets w_out ON ((w_out.id = ow_out.wallet_id)))
     LEFT JOIN finance.organization_wallets ow_in ON ((ow_in.id = fom_in.wallet_id)))
     LEFT JOIN finance.wallets w_in ON ((w_in.id = ow_in.wallet_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = fo.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((fo.type = 'currency_exchange'::text) AND (fo.is_deleted = false))
UNION ALL
-- Block 7: wallet_transfer
 SELECT fo.id,
    'wallet_transfer'::text AS movement_type,
    fo.organization_id,
    fo.project_id,
    fo.operation_date AS payment_date,
    date_trunc('month'::text, (fo.operation_date)::timestamp with time zone) AS payment_month,
    fom_out.amount,
    fom_out.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(fom_out.exchange_rate, (1)::numeric) AS exchange_rate,
    (fom_out.amount * COALESCE(fom_out.exchange_rate, (1)::numeric)) AS functional_amount,
    0 AS amount_sign,
    'confirmed'::text AS status,
    fom_out.wallet_id,
    w_out.name AS wallet_name,
    concat(w_out.name, ' → ', w_in.name) AS concept_name,
    NULL::text AS category_name,
    NULL::text AS contact_name,
    fo.description AS notes,
    NULL::text AS reference,
    fo.created_at,
    fo.created_by,
    u_created.full_name AS creator_name,
    u_created.avatar_url AS creator_avatar_url,
    false AS has_attachments,
    fom_in.amount AS to_amount,
    cur.code AS to_currency_code,
    cur.symbol AS to_currency_symbol,
    w_in.name AS to_wallet_name
   FROM (((((((((finance.financial_operations fo
     LEFT JOIN finance.financial_operation_movements fom_out ON (((fom_out.financial_operation_id = fo.id) AND (fom_out.direction = 'out'::text) AND ((fom_out.is_deleted = false) OR (fom_out.is_deleted IS NULL)))))
     LEFT JOIN finance.financial_operation_movements fom_in ON (((fom_in.financial_operation_id = fo.id) AND (fom_in.direction = 'in'::text) AND ((fom_in.is_deleted = false) OR (fom_in.is_deleted IS NULL)))))
     LEFT JOIN finance.currencies cur ON ((cur.id = fom_out.currency_id)))
     LEFT JOIN finance.organization_wallets ow_out ON ((ow_out.id = fom_out.wallet_id)))
     LEFT JOIN finance.wallets w_out ON ((w_out.id = ow_out.wallet_id)))
     LEFT JOIN finance.organization_wallets ow_in ON ((ow_in.id = fom_in.wallet_id)))
     LEFT JOIN finance.wallets w_in ON ((w_in.id = ow_in.wallet_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = fo.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((fo.type = 'wallet_transfer'::text) AND (fo.is_deleted = false));



-- ============================================================================
-- PART 12: Recreate construction views that reference contacts
-- ============================================================================

-- construction.quotes_view
DROP VIEW IF EXISTS construction.quotes_view CASCADE;
-- NOTE: contract_summary_view depends on quotes_view, so it gets cascaded
CREATE OR REPLACE VIEW construction.quotes_view AS
SELECT q.id,
    q.organization_id,
    q.project_id,
    q.client_id,
    q.name,
    q.description,
    q.status,
    q.quote_type,
    q.version,
    q.currency_id,
    q.exchange_rate,
    q.tax_pct,
    q.tax_label,
    q.discount_pct,
    q.quote_date,
    q.valid_until,
    q.approved_at,
    q.approved_by,
    q.created_at,
    q.updated_at,
    q.created_by,
    q.is_deleted,
    q.deleted_at,
    q.updated_by,
    q.parent_quote_id,
    q.original_contract_value,
    q.change_order_number,
    c.name AS currency_name,
    c.symbol AS currency_symbol,
    p.name AS project_name,
    concat_ws(' '::text, cl.first_name, cl.last_name) AS client_name,
    parent.name AS parent_contract_name,
    COALESCE(stats.item_count, (0)::bigint) AS item_count,
    COALESCE(stats.subtotal, (0)::numeric) AS subtotal,
    COALESCE(stats.subtotal_with_markup, (0)::numeric) AS subtotal_with_markup,
    round((COALESCE(stats.subtotal_with_markup, (0)::numeric) * ((1)::numeric - (COALESCE(q.discount_pct, (0)::numeric) / 100.0))), 2) AS total_after_discount,
    round(((COALESCE(stats.subtotal_with_markup, (0)::numeric) * ((1)::numeric - (COALESCE(q.discount_pct, (0)::numeric) / 100.0))) * ((1)::numeric + (COALESCE(q.tax_pct, (0)::numeric) / 100.0))), 2) AS total_with_tax
   FROM (((((finance.quotes q
     LEFT JOIN finance.currencies c ON ((q.currency_id = c.id)))
     LEFT JOIN projects.projects p ON ((q.project_id = p.id)))
     LEFT JOIN contacts.contacts cl ON ((q.client_id = cl.id)))
     LEFT JOIN finance.quotes parent ON ((q.parent_quote_id = parent.id)))
     LEFT JOIN ( SELECT qi.quote_id,
            count(*) AS item_count,
            sum((qi.quantity * qi.unit_price)) AS subtotal,
            sum(((qi.quantity * qi.unit_price) * ((1)::numeric + (COALESCE(qi.markup_pct, (0)::numeric) / 100.0)))) AS subtotal_with_markup
           FROM finance.quote_items qi
          WHERE (qi.is_deleted = false)
          GROUP BY qi.quote_id) stats ON ((q.id = stats.quote_id)))
  WHERE (q.is_deleted = false);

-- Recreate contract_summary_view (depends on quotes_view, was cascaded)
CREATE OR REPLACE VIEW construction.contract_summary_view AS
SELECT c.id,
    c.name,
    c.project_id,
    c.organization_id,
    c.client_id,
    c.status,
    c.currency_id,
    c.original_contract_value,
    c.created_at,
    c.updated_at,
    COALESCE(co_stats.total_cos, (0)::bigint) AS change_order_count,
    COALESCE(co_stats.approved_cos, (0)::bigint) AS approved_change_order_count,
    COALESCE(co_stats.pending_cos, (0)::bigint) AS pending_change_order_count,
    COALESCE(co_stats.approved_changes_value, (0)::numeric) AS approved_changes_value,
    COALESCE(co_stats.pending_changes_value, (0)::numeric) AS pending_changes_value,
    (COALESCE(c.original_contract_value, (0)::numeric) + COALESCE(co_stats.approved_changes_value, (0)::numeric)) AS revised_contract_value,
    ((COALESCE(c.original_contract_value, (0)::numeric) + COALESCE(co_stats.approved_changes_value, (0)::numeric)) + COALESCE(co_stats.pending_changes_value, (0)::numeric)) AS potential_contract_value
   FROM (finance.quotes c
     LEFT JOIN ( SELECT co.parent_quote_id,
            count(*) AS total_cos,
            count(*) FILTER (WHERE (co.status = 'approved'::text)) AS approved_cos,
            count(*) FILTER (WHERE (co.status = ANY (ARRAY['draft'::text, 'sent'::text]))) AS pending_cos,
            COALESCE(sum(qv.total_with_tax) FILTER (WHERE (co.status = 'approved'::text)), (0)::numeric) AS approved_changes_value,
            COALESCE(sum(qv.total_with_tax) FILTER (WHERE (co.status = ANY (ARRAY['draft'::text, 'sent'::text]))), (0)::numeric) AS pending_changes_value
           FROM (finance.quotes co
             JOIN construction.quotes_view qv ON ((qv.id = co.id)))
          WHERE ((co.quote_type = 'change_order'::text) AND (co.is_deleted = false))
          GROUP BY co.parent_quote_id) co_stats ON ((co_stats.parent_quote_id = c.id)))
  WHERE ((c.quote_type = 'contract'::text) AND (c.is_deleted = false));

-- ============================================================================
-- PART 13: Drop dead projects functions
-- ============================================================================
DROP FUNCTION IF EXISTS projects.assert_project_is_active(uuid);
DROP FUNCTION IF EXISTS projects.documents_validate_project_org();

-- ============================================================================
-- PART 14: Grant permissions
-- ============================================================================
GRANT USAGE ON SCHEMA contacts TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA contacts TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA contacts TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA contacts TO anon;

COMMIT;
