-- ============================================================================
-- FIX: Cross-schema references to organization_members
-- ============================================================================
-- organization_members was migrated to `iam` schema.
-- These 18 functions still reference `public.organization_members`.
-- This script updates them to use `iam.organization_members`.
--
-- Affected schemas: public (5), iam (7), ops (1), notifications (1), billing (1), audit (2)
-- Total references fixed: 26
-- ============================================================================

-- ============================================================================
-- 1. PUBLIC SCHEMA FUNCTIONS (5 functions, 5 refs)
-- ============================================================================

-- 1.1 public.merge_contacts
CREATE OR REPLACE FUNCTION public.merge_contacts(p_source_contact_id uuid, p_target_contact_id uuid, p_organization_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
declare
  v_source record;
  v_target record;
  v_updated_count integer := 0;
  v_table_count integer;
begin
  if p_source_contact_id = p_target_contact_id then
    return jsonb_build_object('success', false, 'error', 'SAME_CONTACT', 'message', 'No podés reemplazar un contacto por sí mismo');
  end if;

  select id, organization_id, linked_user_id, full_name into v_source
  from public.contacts where id = p_source_contact_id and organization_id = p_organization_id and is_deleted = false;

  if v_source.id is null then
    return jsonb_build_object('success', false, 'error', 'SOURCE_NOT_FOUND', 'message', 'El contacto a reemplazar no existe');
  end if;

  select id, organization_id, linked_user_id, full_name into v_target
  from public.contacts where id = p_target_contact_id and organization_id = p_organization_id and is_deleted = false;

  if v_target.id is null then
    return jsonb_build_object('success', false, 'error', 'TARGET_NOT_FOUND', 'message', 'El contacto de destino no existe');
  end if;

  if v_source.linked_user_id is not null then
    if exists (
      select 1 from iam.organization_members
      where organization_id = p_organization_id and user_id = v_source.linked_user_id and is_active = true
    ) or exists (
      select 1 from iam.organization_external_actors
      where organization_id = p_organization_id and user_id = v_source.linked_user_id and is_active = true and is_deleted = false
    ) then
      return jsonb_build_object('success', false, 'error', 'SOURCE_IS_LINKED_ACTIVE', 'message', 'No se puede reemplazar un contacto vinculado a un usuario activo');
    end if;
  end if;

  update public.project_clients set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.project_labor set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.subcontracts set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.subcontract_bids set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.movements set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.material_invoices set provider_id = p_target_contact_id, updated_at = now() where provider_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.material_purchase_orders set provider_id = p_target_contact_id, updated_at = now() where provider_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.materials set default_provider_id = p_target_contact_id, updated_at = now() where default_provider_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.task_recipe_external_services set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.media_links set contact_id = p_target_contact_id where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.contact_category_links set contact_id = p_target_contact_id
  where contact_id = p_source_contact_id
    and category_id not in (select category_id from public.contact_category_links where contact_id = p_target_contact_id);
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  delete from public.contact_category_links where contact_id = p_source_contact_id;

  update public.contacts
  set is_deleted = true, deleted_at = now(), updated_at = now(), linked_user_id = null
  where id = p_source_contact_id;

  return jsonb_build_object(
    'success', true, 'source_contact', v_source.full_name, 'target_contact', v_target.full_name,
    'references_moved', v_updated_count,
    'message', 'Contacto "' || v_source.full_name || '" reemplazado por "' || v_target.full_name || '". ' || v_updated_count || ' referencias actualizadas.'
  );

exception
  when others then
    return jsonb_build_object('success', false, 'error', 'UNEXPECTED_ERROR', 'message', SQLERRM);
end;
$function$;


-- 1.2 public.protect_linked_contact_delete
CREATE OR REPLACE FUNCTION public.protect_linked_contact_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
declare
  v_is_active_member boolean;
  v_is_active_actor boolean;
  v_ref_count integer := 0;
  v_ref_tables text[] := '{}';
begin
  if not (old.is_deleted = false and new.is_deleted = true) then
    return new;
  end if;

  if new.linked_user_id is not null then
    select exists (
      select 1 from iam.organization_members om
      where om.organization_id = new.organization_id and om.user_id = new.linked_user_id and om.is_active = true
    ) into v_is_active_member;

    select exists (
      select 1 from iam.organization_external_actors oea
      where oea.organization_id = new.organization_id and oea.user_id = new.linked_user_id
        and oea.is_active = true and oea.is_deleted = false
    ) into v_is_active_actor;

    if v_is_active_member or v_is_active_actor then
      raise exception 'No se puede eliminar un contacto vinculado a un usuario activo de la organización. Primero desvinculá al miembro o colaborador externo.'
        using errcode = 'P0001';
    end if;
  end if;

  if exists (select 1 from public.project_clients where contact_id = old.id and is_deleted = false) then
    v_ref_tables := array_append(v_ref_tables, 'clientes de proyecto');
  end if;
  if exists (select 1 from public.project_labor where contact_id = old.id and is_deleted = false) then
    v_ref_tables := array_append(v_ref_tables, 'mano de obra');
  end if;
  if exists (select 1 from public.subcontracts where contact_id = old.id and coalesce(is_deleted, false) = false) then
    v_ref_tables := array_append(v_ref_tables, 'subcontratos');
  end if;
  if exists (select 1 from public.subcontract_bids where contact_id = old.id) then
    v_ref_tables := array_append(v_ref_tables, 'ofertas de subcontrato');
  end if;
  if exists (select 1 from public.movements where contact_id = old.id) then
    v_ref_tables := array_append(v_ref_tables, 'movimientos financieros');
  end if;
  if exists (select 1 from public.material_invoices where provider_id = old.id) then
    v_ref_tables := array_append(v_ref_tables, 'facturas de materiales');
  end if;
  if exists (select 1 from public.material_purchase_orders where provider_id = old.id and is_deleted = false) then
    v_ref_tables := array_append(v_ref_tables, 'órdenes de compra');
  end if;
  if exists (select 1 from public.materials where default_provider_id = old.id and is_deleted = false) then
    v_ref_tables := array_append(v_ref_tables, 'proveedor default de materiales');
  end if;
  if exists (select 1 from public.task_recipe_external_services where contact_id = old.id and is_deleted = false) then
    v_ref_tables := array_append(v_ref_tables, 'servicios externos de recetas');
  end if;

  if array_length(v_ref_tables, 1) > 0 then
    raise exception 'No se puede eliminar este contacto porque está siendo usado en: %. Primero reemplazalo por otro contacto.',
      array_to_string(v_ref_tables, ', ')
      using errcode = 'P0001';
  end if;

  return new;
end;
$function$;


-- 1.3 public.get_organization_seat_status
CREATE OR REPLACE FUNCTION public.get_organization_seat_status(p_organization_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam', 'billing'
AS $function$
DECLARE
    v_seats_included integer;
    v_max_members integer;
    v_purchased_seats integer;
    v_current_members integer;
    v_pending_invitations integer;
    v_total_capacity integer;
    v_available_seats integer;
    v_plan_price_monthly numeric;
    v_plan_price_annual numeric;
    v_plan_slug text;
    v_billing_period text;
    v_expires_at timestamptz;
    v_days_remaining integer;
    v_prorated_price_monthly numeric;
    v_prorated_price_annual numeric;
    v_can_buy_more boolean;
BEGIN
    SELECT 
        COALESCE((p.features->>'seats_included')::integer, 1),
        COALESCE((p.features->>'max_members')::integer, 999),
        COALESCE(p.monthly_amount, 0),
        COALESCE(p.annual_amount, 0),
        p.slug
    INTO v_seats_included, v_max_members, v_plan_price_monthly, v_plan_price_annual, v_plan_slug
    FROM public.organizations o
    JOIN billing.plans p ON p.id = o.plan_id
    WHERE o.id = p_organization_id;

    SELECT COALESCE(purchased_seats, 0)
    INTO v_purchased_seats
    FROM public.organizations
    WHERE id = p_organization_id;

    SELECT COUNT(*)
    INTO v_current_members
    FROM iam.organization_members
    WHERE organization_id = p_organization_id
      AND is_active = true;

    SELECT COUNT(*)
    INTO v_pending_invitations
    FROM iam.organization_invitations
    WHERE organization_id = p_organization_id
      AND status IN ('pending', 'registered');

    v_total_capacity := v_seats_included + v_purchased_seats;
    v_available_seats := v_total_capacity - (v_current_members + v_pending_invitations);
    v_can_buy_more := (v_total_capacity < v_max_members);

    SELECT 
        s.billing_period,
        s.expires_at
    INTO v_billing_period, v_expires_at
    FROM billing.organization_subscriptions s
    WHERE s.organization_id = p_organization_id
      AND s.status = 'active'
    LIMIT 1;

    IF v_expires_at IS NOT NULL THEN
        v_days_remaining := GREATEST(0, (v_expires_at::date - CURRENT_DATE));
        
        IF v_billing_period = 'monthly' THEN
            v_prorated_price_monthly := ROUND(v_plan_price_monthly * (v_days_remaining::numeric / 30.0), 2);
            v_prorated_price_annual := NULL;
        ELSE
            v_prorated_price_annual := ROUND(v_plan_price_annual * (v_days_remaining::numeric / 365.0), 2);
            v_prorated_price_monthly := NULL;
        END IF;
    ELSE
        v_days_remaining := 0;
        v_prorated_price_monthly := v_plan_price_monthly;
        v_prorated_price_annual := v_plan_price_annual;
    END IF;

    RETURN jsonb_build_object(
        'seats_included', v_seats_included,
        'max_members', v_max_members,
        'purchased', v_purchased_seats,
        'total_capacity', v_total_capacity,
        'used', v_current_members,
        'pending_invitations', v_pending_invitations,
        'available', GREATEST(v_available_seats, 0),
        'can_invite', v_available_seats > 0,
        'can_buy_more', v_can_buy_more,
        'seat_price_monthly', v_plan_price_monthly,
        'seat_price_annual', v_plan_price_annual,
        'plan_slug', v_plan_slug,
        'billing_period', v_billing_period,
        'expires_at', v_expires_at,
        'days_remaining', v_days_remaining,
        'prorated_monthly', v_prorated_price_monthly,
        'prorated_annual', v_prorated_price_annual
    );
END;
$function$;


-- 1.4 public.handle_import_batch_member_id
CREATE OR REPLACE FUNCTION public.handle_import_batch_member_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    current_uid uuid;
    resolved_member_id uuid;
BEGIN
    current_uid := auth.uid();
    IF current_uid IS NULL THEN RETURN NEW; END IF;

    -- Resolver member_id: auth.uid() -> users.auth_id -> users.id -> organization_members.user_id
    SELECT om.id INTO resolved_member_id
    FROM iam.organization_members om
    JOIN public.users u ON u.id = om.user_id
    WHERE u.auth_id = current_uid 
      AND om.organization_id = NEW.organization_id
    LIMIT 1;

    IF resolved_member_id IS NOT NULL THEN
        NEW.member_id := resolved_member_id;
    END IF;
    
    RETURN NEW;
END;
$function$;


-- 1.5 public.handle_updated_by
CREATE OR REPLACE FUNCTION public.handle_updated_by()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    current_uid uuid;
    resolved_member_id uuid;
BEGIN
    current_uid := auth.uid();
    
    -- Si no hay usuario logueado (ej. seeders o sistema), no hacemos nada
    IF current_uid IS NULL THEN
        RETURN NEW;
    END IF;
    -- Buscamos el ID del miembro dentro de la organización
    SELECT om.id INTO resolved_member_id
    FROM iam.organization_members om
    JOIN public.users u ON u.id = om.user_id
    WHERE u.auth_id = current_uid
      AND om.organization_id = NEW.organization_id
    LIMIT 1;
    -- Si encontramos al miembro, sellamos el registro
    IF resolved_member_id IS NOT NULL THEN
        -- Si es INSERT, llenamos el creador
        IF (TG_OP = 'INSERT') THEN
            NEW.created_by := resolved_member_id;
        END IF;
        -- SIEMPRE actualizamos el editor
        NEW.updated_by := resolved_member_id;
    END IF;
    RETURN NEW;
END;
$function$;


-- ============================================================================
-- 2. IAM SCHEMA FUNCTIONS (7 functions, 15 refs)
-- ============================================================================

-- 2.1 iam.accept_organization_invitation (6 refs)
CREATE OR REPLACE FUNCTION iam.accept_organization_invitation(p_token text, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
DECLARE
    v_invitation RECORD;
    v_already_member BOOLEAN;
    v_inactive_member_id UUID;
    v_seat_capacity INT;
    v_current_members INT;
    v_pending_invitations INT;
    v_available INT;
    v_new_member_id UUID;
BEGIN
    -- 1. Buscar invitación por token
    SELECT 
        i.id,
        i.organization_id,
        i.email,
        i.role_id,
        i.status,
        i.expires_at,
        i.invited_by,
        i.invitation_type,
        o.name as org_name
    INTO v_invitation
    FROM iam.organization_invitations i
    JOIN public.organizations o ON o.id = i.organization_id
    WHERE i.token = p_token
    LIMIT 1;

    IF v_invitation.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_not_found',
            'message', 'Invitación no encontrada'
        );
    END IF;

    -- 2. Verificar estado
    IF v_invitation.status != 'registered' AND v_invitation.status != 'pending' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_already_used',
            'message', 'Esta invitación ya fue utilizada'
        );
    END IF;

    -- 3. Verificar expiración
    IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_expired',
            'message', 'Esta invitación ha expirado'
        );
    END IF;

    -- 4. Verificar que el usuario no es ya miembro activo
    SELECT EXISTS (
        SELECT 1 FROM iam.organization_members
        WHERE organization_id = v_invitation.organization_id
          AND user_id = p_user_id
          AND is_active = true
    ) INTO v_already_member;

    IF v_already_member THEN
        UPDATE iam.organization_invitations
        SET status = 'accepted', accepted_at = NOW(), user_id = p_user_id
        WHERE id = v_invitation.id;

        RETURN jsonb_build_object(
            'success', true,
            'already_member', true,
            'organization_id', v_invitation.organization_id,
            'message', 'Ya sos miembro de esta organización'
        );
    END IF;

    -- 4b. Verificar si existe un miembro INACTIVO
    SELECT id INTO v_inactive_member_id
    FROM iam.organization_members
    WHERE organization_id = v_invitation.organization_id
      AND user_id = p_user_id
      AND is_active = false;

    -- 5. Verificar asientos disponibles
    SELECT 
        COALESCE((p.features->>'seats_included')::integer, 1) + COALESCE(org.purchased_seats, 0)
    INTO v_seat_capacity
    FROM public.organizations org
    JOIN public.plans p ON p.id = org.plan_id
    WHERE org.id = v_invitation.organization_id;

    SELECT COUNT(*) INTO v_current_members
    FROM iam.organization_members
    WHERE organization_id = v_invitation.organization_id
      AND is_active = true;

    SELECT COUNT(*) INTO v_pending_invitations
    FROM iam.organization_invitations
    WHERE organization_id = v_invitation.organization_id
      AND status IN ('pending', 'registered')
      AND id != v_invitation.id;

    v_available := v_seat_capacity - v_current_members;

    IF v_available <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'no_seats_available',
            'message', 'No hay asientos disponibles en esta organización'
        );
    END IF;

    -- 6. Crear o reactivar miembro
    IF v_inactive_member_id IS NOT NULL THEN
        UPDATE iam.organization_members
        SET 
            is_active = true,
            is_billable = true,
            role_id = v_invitation.role_id,
            invited_by = v_invitation.invited_by,
            joined_at = NOW(),
            updated_at = NOW(),
            is_over_limit = false
        WHERE id = v_inactive_member_id;

        v_new_member_id := v_inactive_member_id;
    ELSE
        INSERT INTO iam.organization_members (
            organization_id,
            user_id,
            role_id,
            is_active,
            is_billable,
            joined_at,
            invited_by
        ) VALUES (
            v_invitation.organization_id,
            p_user_id,
            v_invitation.role_id,
            true,
            true,
            NOW(),
            v_invitation.invited_by
        )
        RETURNING id INTO v_new_member_id;
    END IF;

    -- 7. Actualizar invitación
    UPDATE iam.organization_invitations
    SET 
        status = 'accepted',
        accepted_at = NOW(),
        user_id = p_user_id
    WHERE id = v_invitation.id;

    -- 8. Registrar evento
    INSERT INTO public.organization_member_events (
        organization_id,
        member_id,
        user_id,
        event_type,
        was_billable,
        is_billable,
        performed_by
    ) VALUES (
        v_invitation.organization_id,
        v_new_member_id,
        p_user_id,
        'invitation_accepted',
        false,
        true,
        p_user_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'organization_id', v_invitation.organization_id,
        'org_name', v_invitation.org_name,
        'member_id', v_new_member_id,
        'message', 'Invitación aceptada correctamente'
    );
END;
$function$;


-- 2.2 iam.can_view_client_data (1 ref)
CREATE OR REPLACE FUNCTION iam.can_view_client_data(p_project_id uuid, p_client_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam', 'projects'
AS $function$
    SELECT
        -- Admins ven todo
        is_admin()
        -- Miembros de la org ven todo
        OR EXISTS (
            SELECT 1 FROM projects.projects p
            JOIN iam.organization_members om ON om.organization_id = p.organization_id
            WHERE p.id = p_project_id
                AND om.user_id = current_user_id()
                AND om.is_active = true
        )
        -- Actores con acceso al proyecto:
        -- Si client_id IS NULL → ve todo (director de obra, etc.)
        -- Si client_id = p_client_id → ve los datos de ese cliente
        OR EXISTS (
            SELECT 1 FROM iam.project_access pa
            WHERE pa.project_id = p_project_id
              AND pa.user_id = current_user_id()
              AND pa.is_active = true
              AND pa.is_deleted = false
              AND (pa.client_id IS NULL OR pa.client_id = p_client_id)
        );
$function$;


-- 2.3 iam.can_view_project (1 ref)
CREATE OR REPLACE FUNCTION iam.can_view_project(p_project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam', 'projects'
AS $function$
  SELECT
    iam.is_admin()
    OR EXISTS (
      SELECT 1 FROM projects.projects p
      JOIN iam.organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = p_project_id
        AND om.user_id = iam.current_user_id()
        AND om.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM iam.project_access pa
      WHERE pa.project_id = p_project_id
        AND pa.user_id = iam.current_user_id()
        AND pa.is_active = true
        AND pa.is_deleted = false
    );
$function$;


-- 2.4 iam.get_invitation_by_token (1 ref)
CREATE OR REPLACE FUNCTION iam.get_invitation_by_token(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
DECLARE
    v_invitation RECORD;
BEGIN
    SELECT 
        i.id,
        i.email,
        i.status,
        i.expires_at,
        i.invitation_type,
        i.actor_type,
        o.name AS organization_name,
        r.name AS role_name,
        u.full_name AS inviter_name
    INTO v_invitation
    FROM iam.organization_invitations i
    JOIN public.organizations o ON o.id = i.organization_id
    LEFT JOIN public.roles r ON r.id = i.role_id
    LEFT JOIN iam.organization_members m ON m.id = i.invited_by
    LEFT JOIN public.users u ON u.id = m.user_id
    WHERE i.token = p_token
    LIMIT 1;

    IF v_invitation IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'not_found'
        );
    END IF;

    IF v_invitation.status NOT IN ('pending', 'registered') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_status',
            'status', v_invitation.status
        );
    END IF;

    IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'expired'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'invitation_id', v_invitation.id,
        'email', v_invitation.email,
        'organization_name', v_invitation.organization_name,
        'role_name', v_invitation.role_name,
        'inviter_name', v_invitation.inviter_name,
        'invitation_type', v_invitation.invitation_type,
        'actor_type', v_invitation.actor_type
    );
END;
$function$;


-- 2.5 iam.get_user (2 refs)
CREATE OR REPLACE FUNCTION iam.get_user()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam', 'billing'
AS $function$
declare
  current_user_auth_id uuid;
  current_user_internal_id uuid;
  result json;
begin
  current_user_auth_id := auth.uid();
  if current_user_auth_id is null then return null; end if;

  select u.id into current_user_internal_id
  from public.users u where u.auth_id = current_user_auth_id limit 1;

  if current_user_internal_id is null then return null; end if;

  with
  active_org as (
    select
      o.id, o.name, o.is_active, o.is_system, o.created_by, o.created_at, o.updated_at,
      o.owner_id,
      p.id as plan_id, p.name as plan_name, p.slug as plan_slug, p.features as plan_features,
      p.monthly_amount as plan_monthly_amount,
      p.annual_amount as plan_annual_amount,
      p.billing_type as plan_billing_type,
      op.default_currency_id,
      op.default_wallet_id,
      op.default_pdf_template_id,
      op.use_currency_exchange,
      op.created_at as op_created_at,
      op.updated_at as op_updated_at,
      uop.last_project_id,
      om.role_id
    from iam.user_preferences up
    join public.organizations o on o.id = up.last_organization_id
    left join billing.plans p on p.id = o.plan_id
    left join public.organization_preferences op on op.organization_id = o.id
    left join iam.user_organization_preferences uop
      on uop.user_id = up.user_id and uop.organization_id = o.id
    join iam.organization_members om
      on om.organization_id = o.id and om.user_id = up.user_id and om.is_active = true
    where up.user_id = current_user_internal_id
  ),

  active_role_permissions as (
    select
      r.id as role_id, r.name as role_name,
      json_agg(
        json_build_object('id', perm.id, 'key', perm.key, 'description', perm.description, 'category', perm.category)
      ) filter (where perm.id is not null) as permissions
    from active_org ao
    join iam.roles r on r.id = ao.role_id
    left join iam.role_permissions rp on rp.role_id = r.id
    left join iam.permissions perm on perm.id = rp.permission_id
    group by r.id, r.name
  ),

  user_memberships as (
    select json_agg(
      json_build_object(
        'organization_id', om.organization_id,
        'organization_name', org.name,
        'is_active', om.is_active,
        'joined_at', om.joined_at,
        'last_active_at', om.last_active_at,
        'role', json_build_object('id', r.id, 'name', r.name)
      )
    ) as memberships
    from iam.organization_members om
    join public.organizations org on org.id = om.organization_id
    join iam.roles r on r.id = om.role_id
    where om.user_id = current_user_internal_id and om.is_active = true
  ),

  user_pref as (
    select up.theme, up.home_checklist, up.home_banner_dismissed,
           up.layout, up.language, up.sidebar_mode, up.timezone
    from iam.user_preferences up where up.user_id = current_user_internal_id
  )

  select json_build_object(
    'id', u.id,
    'full_name', u.full_name,
    'email', u.email,
    'avatar_url', u.avatar_url,
    'avatar_source', u.avatar_source,
    'role_id', u.role_id,
    'created_at', u.created_at,
    'updated_at', u.updated_at,
    'organization', (
      select json_build_object(
        'id', ao.id, 'name', ao.name, 'is_active', ao.is_active,
        'is_system', ao.is_system, 'created_by', ao.created_by,
        'created_at', ao.created_at, 'updated_at', ao.updated_at,
        'owner_id', ao.owner_id,
        'plan_id', ao.plan_id, 'plan_name', ao.plan_name,
        'plan_slug', ao.plan_slug, 'plan_features', ao.plan_features,
        'plan_monthly_amount', ao.plan_monthly_amount,
        'plan_annual_amount', ao.plan_annual_amount,
        'plan_billing_type', ao.plan_billing_type,
        'default_currency_id', ao.default_currency_id,
        'default_wallet_id', ao.default_wallet_id,
        'default_pdf_template_id', ao.default_pdf_template_id,
        'use_currency_exchange', ao.use_currency_exchange,
        'preferences_created_at', ao.op_created_at,
        'preferences_updated_at', ao.op_updated_at,
        'last_project_id', ao.last_project_id,
        'role', (
          select json_build_object('id', arp.role_id, 'name', arp.role_name, 'permissions', coalesce(arp.permissions, '[]'::json))
          from active_role_permissions arp limit 1
        )
      ) from active_org ao limit 1
    ),
    'memberships', (select memberships from user_memberships),
    'preferences', (
      select json_build_object(
        'theme', up.theme,
        'home_checklist', up.home_checklist,
        'home_banner_dismissed', up.home_banner_dismissed,
        'layout', up.layout,
        'language', up.language,
        'sidebar_mode', up.sidebar_mode,
        'timezone', up.timezone
      ) from user_pref up limit 1
    )
  ) into result
  from public.users u
  where u.id = current_user_internal_id;

  return result;
end;
$function$;


-- 2.6 iam.handle_updated_by_organizations (1 ref)
CREATE OR REPLACE FUNCTION iam.handle_updated_by_organizations()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
DECLARE
    current_uid uuid;
    resolved_member_id uuid;
BEGIN
    current_uid := auth.uid();
    
    IF current_uid IS NULL THEN
        RETURN NEW;
    END IF;

    -- Resolve Member ID
    -- User must be a member of THIS organization (NEW.id)
    SELECT om.id INTO resolved_member_id
    FROM iam.organization_members om
    JOIN public.users u ON u.id = om.user_id
    WHERE u.auth_id = current_uid
      AND om.organization_id = NEW.id -- Key difference: generic uses NEW.organization_id
    LIMIT 1;

    IF resolved_member_id IS NOT NULL THEN
        NEW.updated_by := resolved_member_id;
    END IF;

    RETURN NEW;
END;
$function$;


-- 2.7 iam.has_permission (1 ref)
CREATE OR REPLACE FUNCTION iam.has_permission(p_organization_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  select exists (
    select 1
    from iam.organization_members om
    join iam.roles r
      on r.id = om.role_id
    join iam.role_permissions rp
      on rp.role_id = r.id
    join iam.permissions p
      on p.id = rp.permission_id
    where om.organization_id = p_organization_id
      and om.user_id = iam.current_user_id()
      and om.is_active = true
      and p.key = p_permission_key
  );
$function$;


-- 2.8 iam.is_org_member (1 ref)
CREATE OR REPLACE FUNCTION iam.is_org_member(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  select exists (
    select 1
    from iam.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = iam.current_user_id()
      and m.is_active = true
  );
$function$;


-- 2.9 iam.step_add_org_member (1 ref)
CREATE OR REPLACE FUNCTION iam.step_add_org_member(p_user_id uuid, p_org_id uuid, p_role_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- LOG: función llamada
  insert into public.debug_signup_log(step, payload)
  values (
    'step_add_org_member_called',
    jsonb_build_object(
      'user_id', p_user_id,
      'org_id', p_org_id,
      'role_id', p_role_id
    )
  );

  -- VALIDACIONES DURAS
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id IS NULL';
  END IF;

  IF p_org_id IS NULL THEN
    RAISE EXCEPTION 'p_org_id IS NULL';
  END IF;

  IF p_role_id IS NULL THEN
    RAISE EXCEPTION 'p_role_id IS NULL';
  END IF;

  -- INSERT
  INSERT INTO iam.organization_members (
    user_id,
    organization_id,
    role_id,
    is_active,
    created_at,
    joined_at
  )
  VALUES (
    p_user_id,
    p_org_id,
    p_role_id,
    true,
    now(),
    now()
  );

  -- LOG: insert ok
  insert into public.debug_signup_log(step, payload)
  values (
    'step_add_org_member_inserted',
    jsonb_build_object(
      'user_id', p_user_id,
      'org_id', p_org_id,
      'role_id', p_role_id
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    insert into public.debug_signup_log(step, payload)
    values (
      'step_add_org_member_error',
      jsonb_build_object(
        'error', sqlerrm,
        'user_id', p_user_id,
        'org_id', p_org_id,
        'role_id', p_role_id
      )
    );
    RAISE;
END;
$function$;


-- ============================================================================
-- 3. OPS SCHEMA FUNCTIONS (1 function, 3 refs)
-- ============================================================================

-- 3.1 ops.admin_cleanup_test_user (3 refs)
CREATE OR REPLACE FUNCTION ops.admin_cleanup_test_user(target_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'public', 'iam'
AS $function$
DECLARE
    v_user_id uuid;
    v_org_record record;
BEGIN
    -- 1. Find the user ID from auth.users (or public.users)
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = target_email;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User % not found, nothing to clean.', target_email;
        RETURN;
    END IF;

    RAISE NOTICE 'Cleaning up user: % (ID: %)', target_email, v_user_id;

    -- 2. Find Organizations owned by this user
    FOR v_org_record IN 
        SELECT o.id, o.name 
        FROM public.organizations o
        JOIN iam.organization_members om ON o.id = om.organization_id
        WHERE om.user_id = (SELECT id FROM public.users WHERE auth_id = v_user_id)
    LOOP
        -- Check if there are OTHER members in this org
        IF (SELECT count(*) FROM iam.organization_members WHERE organization_id = v_org_record.id) = 1 THEN
            RAISE NOTICE 'Deleting Organization: % (ID: %)', v_org_record.name, v_org_record.id;
            
            DELETE FROM public.organizations WHERE id = v_org_record.id;
        ELSE
            RAISE NOTICE 'Skipping Organization % because it has other members.', v_org_record.name;
            
            -- Just remove the member, don't kill the org
            DELETE FROM iam.organization_members 
            WHERE organization_id = v_org_record.id 
            AND user_id = (SELECT id FROM public.users WHERE auth_id = v_user_id);
        END IF;
    END LOOP;

    -- 3. Finally, delete the User from auth.users
    DELETE FROM auth.users WHERE id = v_user_id;
    
    RAISE NOTICE 'Cleanup complete for %', target_email;
END;
$function$;


-- ============================================================================
-- 4. NOTIFICATIONS SCHEMA FUNCTIONS (1 function, 1 ref)
-- ============================================================================

-- 4.1 notifications.notify_kanban_card_assigned (1 ref)
CREATE OR REPLACE FUNCTION notifications.notify_kanban_card_assigned()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'notifications', 'public', 'iam'
AS $function$
DECLARE
    v_assignee_user_id uuid;
    v_actor_user_id uuid;
    v_actor_name text;
    v_board_id uuid;
BEGIN
    IF NEW.assigned_to IS NULL THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.assigned_to IS NOT DISTINCT FROM NEW.assigned_to THEN
        RETURN NEW;
    END IF;

    SELECT om.user_id INTO v_assignee_user_id
    FROM iam.organization_members om
    WHERE om.id = NEW.assigned_to;

    IF v_assignee_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT u.id, u.full_name INTO v_actor_user_id, v_actor_name
    FROM public.users u
    WHERE u.auth_id = auth.uid();

    IF v_actor_user_id IS NOT NULL AND v_actor_user_id = v_assignee_user_id THEN
        RETURN NEW;
    END IF;

    v_board_id := NEW.board_id;

    PERFORM notifications.send_notification(
        v_assignee_user_id,
        'info',
        'Nueva asignación',
        COALESCE(v_actor_name, 'Alguien') ||
            ' te asignó a la tarjeta "' || NEW.title || '"',
        jsonb_build_object(
            'card_id', NEW.id,
            'board_id', v_board_id,
            'url', '/organization/planner?view=kanban&boardId=' || v_board_id::text
        ),
        'direct'
    );

    RETURN NEW;
END;
$function$;


-- ============================================================================
-- 5. BILLING SCHEMA FUNCTIONS (1 function, 1 ref)
-- ============================================================================

-- 5.1 billing.step_log_seat_purchase_event (1 ref)
CREATE OR REPLACE FUNCTION billing.step_log_seat_purchase_event(p_organization_id uuid, p_user_id uuid, p_seats integer, p_amount numeric, p_currency text, p_payment_id uuid, p_prorated boolean)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'public', 'iam'
AS $function$
DECLARE
    v_event_id UUID;
    v_member_id UUID;
BEGIN
    -- Intentar obtener el member_id del usuario en la organización
    SELECT id INTO v_member_id
    FROM iam.organization_members
    WHERE organization_id = p_organization_id 
      AND user_id = p_user_id
    LIMIT 1;

    -- Log en organization_activity_logs (tabla real)
    INSERT INTO public.organization_activity_logs (
        organization_id,
        member_id,
        action,
        target_table,
        target_id,
        metadata
    ) VALUES (
        p_organization_id,
        v_member_id,
        'seat_purchased',
        'payments',
        p_payment_id,
        jsonb_build_object(
            'seats', p_seats,
            'amount', p_amount,
            'currency', p_currency,
            'payment_id', p_payment_id,
            'prorated', p_prorated,
            'user_id', p_user_id
        )
    )
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$function$;


-- ============================================================================
-- 6. AUDIT SCHEMA FUNCTIONS (2 functions, 2 refs)
-- ============================================================================

-- 6.1 audit.log_organizations_activity (1 ref)
CREATE OR REPLACE FUNCTION audit.log_organizations_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public', 'iam'
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_organization';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_organization';
        ELSE
            audit_action := 'update_organization';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_organization';
        BEGIN
            SELECT id INTO resolved_member_id
            FROM iam.organization_members
            WHERE user_id = NEW.created_by AND organization_id = NEW.id
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;

    audit_metadata := jsonb_build_object(
        'name', target_record.name,
        'plan_id', target_record.plan_id
    );

    BEGIN
        IF resolved_member_id IS NOT NULL THEN
            INSERT INTO public.organization_activity_logs (
                organization_id, member_id, action, target_id, target_table, metadata
            ) VALUES (
                target_record.id,
                resolved_member_id,
                audit_action,
                target_record.id,
                'organizations',
                audit_metadata
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$;


-- 6.2 audit.log_kanban_child_activity (1 ref)
CREATE OR REPLACE FUNCTION audit.log_kanban_child_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'audit', 'public', 'iam'
AS $function$
DECLARE
  v_org_id uuid;
  v_member_id uuid;
  v_action text;
  v_entity_name text;
  v_metadata jsonb;
  v_target_record RECORD;
  v_record_json jsonb;
  v_current_uid uuid;
  v_name_or_title text;
BEGIN
  -- 1. Determine Entity Name
  IF TG_TABLE_NAME = 'kanban_lists' THEN
    v_entity_name := 'kanban_list';
  ELSIF TG_TABLE_NAME = 'kanban_cards' THEN
    v_entity_name := 'kanban_card';
  ELSE
    v_entity_name := TG_TABLE_NAME;
  END IF;
  -- 2. Determine Action & Target Record
  IF TG_OP = 'UPDATE' THEN
    v_target_record := NEW;
    v_org_id := NEW.organization_id;
    
    IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
        v_action := 'delete_' || v_entity_name;
    ELSIF (OLD.is_deleted = true AND NEW.is_deleted = false) THEN
        v_action := 'restore_' || v_entity_name;
    ELSE
        v_action := 'update_' || v_entity_name;
    END IF;
    
  ELSIF TG_OP = 'INSERT' THEN
    v_target_record := NEW;
    v_org_id := NEW.organization_id;
    v_action := 'create_' || v_entity_name;
    
  ELSIF TG_OP = 'DELETE' THEN
    v_target_record := OLD;
    v_org_id := OLD.organization_id;
    v_action := 'delete_' || v_entity_name;
  END IF;
  -- 3. Resolve Member ID
  v_record_json := to_jsonb(v_target_record);
  IF TG_OP = 'INSERT' THEN
     IF (v_record_json->>'created_by') IS NOT NULL THEN
         v_member_id := (v_record_json->>'created_by')::uuid;
     END IF;
  ELSE
     IF (v_record_json->>'updated_by') IS NOT NULL THEN
         v_member_id := (v_record_json->>'updated_by')::uuid;
     END IF;
  END IF;
  -- Fallback: Resolve from auth.uid()
  IF v_member_id IS NULL THEN
      v_current_uid := auth.uid();
      IF v_current_uid IS NOT NULL AND v_org_id IS NOT NULL THEN
          SELECT om.id INTO v_member_id
          FROM iam.organization_members om
          JOIN public.users u ON u.id = om.user_id
          WHERE u.auth_id = v_current_uid
          AND om.organization_id = v_org_id
          LIMIT 1;
      END IF;
  END IF;
  -- 4. Prepare Metadata
  v_name_or_title := COALESCE(v_record_json->>'name', v_record_json->>'title', 'Unknown');
  
  v_metadata := jsonb_build_object(
    'name', v_name_or_title
  );
  -- 5. Insert (Safe)
  BEGIN
      INSERT INTO public.organization_activity_logs (
        organization_id,
        member_id,
        action,
        target_table,
        target_id,
        metadata,
        created_at
      ) VALUES (
        v_org_id,
        v_member_id,
        v_action,
        TG_TABLE_NAME,
        (v_record_json->>'id')::uuid,
        v_metadata,
        now()
      );
  EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Audit Log Failed: %', SQLERRM;
  END;
  RETURN COALESCE(NEW, OLD);
END;
$function$;


-- ============================================================================
-- CLEANUP: Drop proxy view if it was created previously
-- ============================================================================
DROP VIEW IF EXISTS public.organization_members;
