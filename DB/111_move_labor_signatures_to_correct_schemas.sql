-- ============================================================================
-- MIGRACIÓN: Mover tablas de projects a construction y audit
-- ============================================================================
-- Tablas a mover:
--   projects.project_labor        → construction.project_labor
--   projects.labor_insurances     → construction.labor_insurances
--   projects.personnel_attendees  → construction.personnel_attendees
--   projects.signatures           → audit.signatures
-- ============================================================================
-- IMPORTANTE: Ejecutar en orden. Cada sección es independiente pero las vistas
-- se deben recrear DESPUÉS de mover las tablas.
-- ============================================================================

-- ============================================================================
-- PARTE 1: MOVER LABOR/PERSONNEL → construction
-- ============================================================================

-- 1.1: Eliminar vistas que dependen de las tablas a mover
DROP VIEW IF EXISTS projects.project_labor_view CASCADE;
DROP VIEW IF EXISTS projects.labor_insurance_view CASCADE;

-- 1.2: Eliminar triggers en las tablas a mover
DROP TRIGGER IF EXISTS on_project_labor_audit ON projects.project_labor;
DROP TRIGGER IF EXISTS set_updated_by_project_labor ON projects.project_labor;

-- 1.3: Eliminar RLS policies de project_labor (ya que se recrearán en el nuevo schema)
DROP POLICY IF EXISTS "MIEMBROS CREAN PROJECT_LABOR" ON projects.project_labor;
DROP POLICY IF EXISTS "MIEMBROS EDITAN PROJECT_LABOR" ON projects.project_labor;
DROP POLICY IF EXISTS "MIEMBROS VEN PROJECT_LABOR" ON projects.project_labor;

-- 1.4: Mover tablas a construction
ALTER TABLE projects.project_labor SET SCHEMA construction;
ALTER TABLE projects.labor_insurances SET SCHEMA construction;
ALTER TABLE projects.personnel_attendees SET SCHEMA construction;

-- 1.5: Habilitar RLS en las tablas movidas
ALTER TABLE construction.project_labor ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction.labor_insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction.personnel_attendees ENABLE ROW LEVEL SECURITY;

-- 1.6: Re-crear RLS policies para project_labor en construction
CREATE POLICY "MIEMBROS CREAN PROJECT_LABOR" ON construction.project_labor
    FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'construction.manage'::text));

CREATE POLICY "MIEMBROS EDITAN PROJECT_LABOR" ON construction.project_labor
    FOR UPDATE
    USING (can_mutate_org(organization_id, 'construction.manage'::text));

CREATE POLICY "MIEMBROS VEN PROJECT_LABOR" ON construction.project_labor
    FOR SELECT
    USING (can_view_org(organization_id, 'construction.view'::text));

-- 1.7: RLS para labor_insurances (no tenía antes, se crea ahora)
CREATE POLICY "MIEMBROS VEN LABOR_INSURANCES" ON construction.labor_insurances
    FOR SELECT
    USING (can_view_org(organization_id, 'construction.view'::text));

CREATE POLICY "MIEMBROS CREAN LABOR_INSURANCES" ON construction.labor_insurances
    FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'construction.manage'::text));

CREATE POLICY "MIEMBROS EDITAN LABOR_INSURANCES" ON construction.labor_insurances
    FOR UPDATE
    USING (can_mutate_org(organization_id, 'construction.manage'::text));

-- 1.8: RLS para personnel_attendees (no tenía antes, se crea ahora)
CREATE POLICY "MIEMBROS VEN PERSONNEL_ATTENDEES" ON construction.personnel_attendees
    FOR SELECT
    USING (can_view_org(organization_id, 'construction.view'::text));

CREATE POLICY "MIEMBROS CREAN PERSONNEL_ATTENDEES" ON construction.personnel_attendees
    FOR INSERT
    WITH CHECK (can_mutate_org(organization_id, 'construction.manage'::text));

CREATE POLICY "MIEMBROS EDITAN PERSONNEL_ATTENDEES" ON construction.personnel_attendees
    FOR UPDATE
    USING (can_mutate_org(organization_id, 'construction.manage'::text));

-- 1.9: Re-crear triggers en construction.project_labor
CREATE TRIGGER on_project_labor_audit
    AFTER INSERT OR UPDATE OR DELETE ON construction.project_labor
    FOR EACH ROW EXECUTE FUNCTION audit.log_project_labor_activity();

CREATE TRIGGER set_updated_by_project_labor
    BEFORE INSERT OR UPDATE ON construction.project_labor
    FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

-- 1.10: Recrear vista project_labor_view en construction
CREATE OR REPLACE VIEW construction.project_labor_view AS
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
   FROM ((((((construction.project_labor pl
     LEFT JOIN projects.contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN catalog.labor_categories lc ON ((lc.id = pl.labor_type_id)))
     LEFT JOIN projects.projects proj ON ((proj.id = pl.project_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = pl.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS total_payments,
            sum(lp.amount) AS total_amount
           FROM finance.labor_payments lp
          WHERE ((lp.labor_id = pl.id) AND ((lp.is_deleted = false) OR (lp.is_deleted IS NULL)) AND (lp.status = 'confirmed'::text))) payment_stats ON (true))
  WHERE (pl.is_deleted = false);

-- 1.11: Recrear vista labor_insurance_view en construction
CREATE OR REPLACE VIEW construction.labor_insurance_view AS
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
   FROM ((((construction.labor_insurances li
     LEFT JOIN construction.project_labor pl ON ((pl.id = li.labor_id)))
     LEFT JOIN projects.contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN catalog.labor_categories lt ON ((lt.id = pl.labor_type_id)))
     LEFT JOIN projects.projects proj ON ((proj.id = li.project_id)));

-- ============================================================================
-- PARTE 2: ACTUALIZAR FUNCIONES CROSS-SCHEMA QUE REFERENCIAN projects.project_labor
-- ============================================================================

-- 2.1: Actualizar audit.log_project_labor_activity (referencia projects.contacts → sigue igual)
CREATE OR REPLACE FUNCTION audit.log_project_labor_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
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
    FROM projects.contacts
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

-- 2.2: Actualizar audit.log_labor_payment_activity (cambiar projects.project_labor → construction.project_labor)
CREATE OR REPLACE FUNCTION audit.log_labor_payment_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public'
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
    FROM construction.project_labor pl
    JOIN projects.contacts c ON c.id = pl.contact_id
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

-- 2.3: Actualizar iam.merge_contacts (cambiar projects.project_labor → construction.project_labor)
CREATE OR REPLACE FUNCTION iam.merge_contacts(p_source_contact_id uuid, p_target_contact_id uuid, p_organization_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'projects', 'finance', 'catalog', 'construction'
AS $function$
declare
  v_source_exists boolean;
  v_target_exists boolean;
  v_merged_references int := 0;
begin
  select exists(
    select 1 from projects.contacts where id = p_source_contact_id and organization_id = p_organization_id and is_deleted = false
  ) into v_source_exists;

  if not v_source_exists then
    return jsonb_build_object('success', false, 'error', 'source_not_found');
  end if;

  select exists(
    select 1 from projects.contacts where id = p_target_contact_id and organization_id = p_organization_id and is_deleted = false
  ) into v_target_exists;

  if not v_target_exists then
    return jsonb_build_object('success', false, 'error', 'target_not_found');
  end if;

  -- Update all references from source to target
  update projects.project_clients set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;

  update construction.project_labor set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;

  update finance.subcontracts set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;

  update finance.subcontract_bids set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;

  update finance.movements set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;

  update finance.material_invoices set provider_id = p_target_contact_id, updated_at = now() where provider_id = p_source_contact_id;

  update finance.material_purchase_orders set provider_id = p_target_contact_id, updated_at = now() where provider_id = p_source_contact_id;

  update catalog.materials set default_provider_id = p_target_contact_id, updated_at = now() where default_provider_id = p_source_contact_id;

  update catalog.task_recipe_external_services set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;

  -- Merge category links (avoid duplicates)
  update projects.contact_category_links set contact_id = p_target_contact_id
  where contact_id = p_source_contact_id
    and category_id not in (select category_id from projects.contact_category_links where contact_id = p_target_contact_id);

  delete from projects.contact_category_links where contact_id = p_source_contact_id;

  update projects.contacts
  set is_deleted = true, deleted_at = now(), updated_at = now()
  where id = p_source_contact_id;

  return jsonb_build_object('success', true, 'source_id', p_source_contact_id, 'target_id', p_target_contact_id);
end;
$function$;

-- 2.4: Actualizar iam.protect_linked_contact_delete (cambiar projects.project_labor → construction.project_labor)
CREATE OR REPLACE FUNCTION iam.protect_linked_contact_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'projects', 'finance', 'catalog', 'construction'
AS $function$
begin
  if exists (select 1 from projects.project_clients where contact_id = old.id and is_deleted = false) then
    raise exception 'No se puede eliminar este contacto porque tiene proyectos asociados como cliente.';
  end if;
  if exists (select 1 from construction.project_labor where contact_id = old.id and is_deleted = false) then
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

-- 2.5: Recrear finance.labor_by_type_view (cambiar projects.project_labor → construction.project_labor)
CREATE OR REPLACE VIEW finance.labor_by_type_view AS
SELECT lp.organization_id,
    lp.project_id,
    date_trunc('month'::text, (lp.payment_date)::timestamp with time zone) AS payment_month,
    pl.labor_type_id,
    lt.name AS labor_type_name,
    sum((lp.amount * lp.exchange_rate)) AS total_functional_amount,
    count(*) AS payments_count
   FROM ((finance.labor_payments lp
     LEFT JOIN construction.project_labor pl ON ((pl.id = lp.labor_id)))
     LEFT JOIN catalog.labor_categories lt ON ((lt.id = pl.labor_type_id)))
  WHERE ((lp.status = 'confirmed'::text) AND ((lp.is_deleted IS NULL) OR (lp.is_deleted = false)))
  GROUP BY lp.organization_id, lp.project_id, (date_trunc('month'::text, (lp.payment_date)::timestamp with time zone)), pl.labor_type_id, lt.name;

-- 2.6: Recrear finance.labor_payments_view (cambiar projects.project_labor → construction.project_labor)
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
     LEFT JOIN construction.project_labor pl ON ((pl.id = lp.labor_id)))
     LEFT JOIN projects.contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN catalog.labor_categories lc ON ((lc.id = pl.labor_type_id)))
     LEFT JOIN projects.projects proj ON ((proj.id = lp.project_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = lp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((lp.is_deleted = false) OR (lp.is_deleted IS NULL));

-- 2.7: Recrear finance.unified_financial_movements_view completa
-- (único cambio: projects.project_labor → construction.project_labor en sección labor_payment)
DROP VIEW IF EXISTS finance.unified_financial_movements_view;

CREATE OR REPLACE VIEW finance.unified_financial_movements_view AS
-- GENERAL COSTS
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
-- MATERIAL PAYMENTS
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
     LEFT JOIN projects.contacts prov ON ((prov.id = mi.provider_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = mp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((mp.is_deleted = false) OR (mp.is_deleted IS NULL))
UNION ALL
-- LABOR PAYMENTS (← AQUÍ EL CAMBIO: construction.project_labor en vez de projects.project_labor)
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
     LEFT JOIN construction.project_labor pl ON ((pl.id = lp.labor_id)))
     LEFT JOIN projects.contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN catalog.labor_categories lc ON ((lc.id = pl.labor_type_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = lp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((lp.is_deleted = false) OR (lp.is_deleted IS NULL))
UNION ALL
-- SUBCONTRACT PAYMENTS
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
     LEFT JOIN projects.contacts ct ON ((ct.id = s.contact_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = sp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((sp.is_deleted = false) OR (sp.is_deleted IS NULL))
UNION ALL
-- CLIENT PAYMENTS
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
     LEFT JOIN projects.contacts ct ON ((ct.id = pc.contact_id)))
     LEFT JOIN finance.client_commitments cc ON ((cc.id = cp.commitment_id)))
     LEFT JOIN iam.organization_members om_created ON ((om_created.id = cp.created_by)))
     LEFT JOIN iam.users u_created ON ((u_created.id = om_created.user_id)))
  WHERE ((cp.is_deleted = false) OR (cp.is_deleted IS NULL))
UNION ALL
-- CURRENCY EXCHANGES
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
-- WALLET TRANSFERS
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
-- PARTE 3: MOVER SIGNATURES → audit
-- ============================================================================

-- 3.1: Mover tabla
ALTER TABLE projects.signatures SET SCHEMA audit;

-- 3.2: Habilitar RLS
ALTER TABLE audit.signatures ENABLE ROW LEVEL SECURITY;

-- 3.3: Crear RLS policies para signatures en audit
CREATE POLICY "MIEMBROS VEN SIGNATURES" ON audit.signatures
    FOR SELECT
    USING (is_org_member(organization_id));

CREATE POLICY "MIEMBROS CREAN SIGNATURES" ON audit.signatures
    FOR INSERT
    WITH CHECK (is_org_member(organization_id));

-- ============================================================================
-- PARTE 4: GRANT permisos a los roles necesarios
-- ============================================================================

-- Grants para construction (tablas movidas)
GRANT ALL ON construction.project_labor TO authenticated;
GRANT ALL ON construction.labor_insurances TO authenticated;
GRANT ALL ON construction.personnel_attendees TO authenticated;
GRANT SELECT ON construction.project_labor_view TO authenticated;
GRANT SELECT ON construction.labor_insurance_view TO authenticated;

-- Grants para audit.signatures
GRANT ALL ON audit.signatures TO authenticated;

-- ============================================================================
-- NOTA FINAL:
-- Después de ejecutar este script:
-- 1. Verificar que todo funciona correctamente
-- 2. Ejecutar el introspector para regenerar DB/schema/*
-- 3. Recrear finance.unified_financial_movements_view si fue dropeada
--    (copiar definición del schema y reemplazar projects.project_labor → construction.project_labor)
-- ============================================================================
