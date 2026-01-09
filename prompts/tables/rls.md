# ISTEMA DE RLS

# TABLAS:

## Tabla ORGANIZATION_MEMBERS:

create table public.organization_members (
  created_at timestamp with time zone not null default now(),
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  is_active boolean not null default true,
  organization_id uuid not null,
  invited_by uuid null,
  joined_at timestamp with time zone null default now(),
  role_id uuid null,
  last_active_at timestamp with time zone null,
  updated_at timestamp with time zone not null default now(),
  is_billable boolean not null default true,
  is_over_limit boolean null default false,
  constraint organization_members_pkey primary key (id),
  constraint organization_members_idd_key unique (id),
  constraint organization_members_invited_by_fkey foreign KEY (invited_by) references organization_members (id) on delete set null,
  constraint organization_members_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint organization_members_role_id_fkey foreign KEY (role_id) references roles (id) on delete set null,
  constraint organization_members_user_id_fkey foreign KEY (user_id) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists organization_members_organization_id_idx on public.organization_members using btree (organization_id) TABLESPACE pg_default;

create index IF not exists organization_members_user_id_idx on public.organization_members using btree (user_id) TABLESPACE pg_default;

create unique INDEX IF not exists unique_user_per_organization on public.organization_members using btree (user_id, organization_id) TABLESPACE pg_default;

create index IF not exists idx_org_members_org_user on public.organization_members using btree (organization_id, user_id) TABLESPACE pg_default;

create index IF not exists org_members_over_limit_idx on public.organization_members using btree (organization_id, is_over_limit) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on organization_members for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trigger_create_contact_on_new_member
after INSERT on organization_members for EACH row
execute FUNCTION handle_new_org_member_contact ();

## Tabla PERMISSIONS:

create table public.permissions (
  id uuid not null default gen_random_uuid (),
  key text not null,
  description text not null,
  category text not null,
  is_system boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint permissions_pkey primary key (id),
  constraint permissions_key_key unique (key)
) TABLESPACE pg_default;

## Tabla ROLES:

create table public.roles (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  type text null,
  organization_id uuid null,
  is_system boolean not null default false,
  constraint roles_pkey primary key (id),
  constraint roles_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create unique INDEX IF not exists roles_unique_name_per_org on public.roles using btree (organization_id, name) TABLESPACE pg_default
where
  (is_system = false);

create index IF not exists idx_roles_organization_id on public.roles using btree (organization_id) TABLESPACE pg_default;

## Tabla ROLE_PERMISSIONS:

create table public.role_permissions (
  id uuid not null default gen_random_uuid (),
  role_id uuid not null,
  permission_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint role_permissions_pkey primary key (id),
  constraint role_permissions_role_id_permission_id_key unique (role_id, permission_id),
  constraint role_permissions_permission_id_fkey foreign KEY (permission_id) references permissions (id) on delete CASCADE,
  constraint role_permissions_role_id_fkey foreign KEY (role_id) references roles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_role_permissions_role_id on public.role_permissions using btree (role_id) TABLESPACE pg_default;

create index IF not exists idx_role_permissions_permission_id on public.role_permissions using btree (permission_id) TABLESPACE pg_default;

# DETALLE DE FUNCIONES EN DB PARA CUANDO SE REGISTRA UN USUARIO:

# Funciones "PADRE":

## Funcion handle_new_user:

declare
  v_user_id uuid;
  v_org_id uuid;
  v_admin_role_id uuid;
  v_avatar_source public.avatar_source_t := 'email';
  v_avatar_url text;
  v_full_name text;
  v_provider text;
begin
  ----------------------------------------------------------------
  -- 🔒 GUARD: evitar doble ejecución del signup
  ----------------------------------------------------------------
  IF EXISTS (
    SELECT 1
    FROM public.users
    WHERE auth_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  ----------------------------------------------------------------
  -- 🧠 Provider real (fuente confiable)
  ----------------------------------------------------------------
  v_provider := coalesce(
    NEW.raw_app_meta_data->>'provider',
    NEW.raw_user_meta_data->>'provider',
    'email'
  );

  ----------------------------------------------------------------
  -- Avatar source
  ----------------------------------------------------------------
  IF v_provider = 'google' THEN
    v_avatar_source := 'google';
  ELSIF v_provider = 'discord' THEN
    v_avatar_source := 'discord';
  ELSE
    v_avatar_source := 'email';
  END IF;

  ----------------------------------------------------------------
  -- Avatar URL (defensivo)
  ----------------------------------------------------------------
  v_avatar_url := coalesce(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  ----------------------------------------------------------------
  -- Full name (defensivo)
  ----------------------------------------------------------------
  v_full_name := coalesce(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  ----------------------------------------------------------------
  -- 1) User
  ----------------------------------------------------------------
  v_user_id := public.step_create_user(
    NEW.id,
    lower(NEW.email),
    v_full_name,
    v_avatar_url,
    v_avatar_source,
    'e6cc68d2-fc28-421b-8bd3-303326ef91b8'
  );

  ----------------------------------------------------------------
  -- 1.1) 📈 User acquisition (idempotente recomendado)
  ----------------------------------------------------------------
  PERFORM public.step_create_user_acquisition(
    v_user_id,
    NEW.raw_user_meta_data
  );

  ----------------------------------------------------------------
  -- 2) User data
  ----------------------------------------------------------------
  PERFORM public.step_create_user_data(v_user_id);

  ----------------------------------------------------------------
  -- 3) Organization
  ----------------------------------------------------------------
  v_org_id := public.step_create_organization(
    v_user_id,
    'Organización de ' || v_full_name,
    '015d8a97-6b6e-4aec-87df-5d1e6b0e4ed2'
  );

  ----------------------------------------------------------------
  -- 4) Organization data
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_data(v_org_id);

  ----------------------------------------------------------------
  -- 5) Organization roles
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_roles(v_org_id);

  ----------------------------------------------------------------
  -- 6) Obtener rol Administrador
  ----------------------------------------------------------------
  SELECT id
  INTO v_admin_role_id
  FROM public.roles
  WHERE organization_id = v_org_id
    AND name = 'Administrador'
    AND is_system = false
  LIMIT 1;

  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role not found for organization %', v_org_id;
  END IF;

  ----------------------------------------------------------------
  -- 7) Organization member (Admin)
  ----------------------------------------------------------------
  PERFORM public.step_add_org_member(
    v_user_id,
    v_org_id,
    v_admin_role_id
  );

  ----------------------------------------------------------------
  -- 8) Permisos
  ----------------------------------------------------------------
  PERFORM public.step_assign_org_role_permissions(v_org_id);

  ----------------------------------------------------------------
  -- 9) Monedas y billeteras
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_currencies(
    v_org_id,
    '58c50aa7-b8b1-4035-b509-58028dd0e33f'
  );

  PERFORM public.step_create_organization_wallets(
    v_org_id,
    '2658c575-0fa8-4cf6-85d7-6430ded7e188'
  );

  ----------------------------------------------------------------
  -- 10) Organization preferences
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_preferences(
    v_org_id,
    '58c50aa7-b8b1-4035-b509-58028dd0e33f',
    '2658c575-0fa8-4cf6-85d7-6430ded7e188',
    'b6266a04-9b03-4f3a-af2d-f6ee6d0a948b'
  );

  ----------------------------------------------------------------
  -- 11) User preferences
  ----------------------------------------------------------------
  PERFORM public.step_create_user_preferences(v_user_id, v_org_id);

  ----------------------------------------------------------------
  -- ✅ MARCAR SIGNUP COMO COMPLETADO (ÚNICA FUENTE DE VERDAD)
  ----------------------------------------------------------------
  UPDATE public.users
  SET
    signup_completed = true,
    updated_at = now()
  WHERE id = v_user_id;

  RETURN NEW;

exception
  when others then
    perform public.log_system_error(
      'trigger',
      'handle_new_user',
      'signup',
      sqlerrm,
      jsonb_build_object(
        'auth_id', NEW.id,
        'email', NEW.email
      ),
      'critical'
    );
    raise;
end;


## Funcion handle_new_organization:


DECLARE
  v_org_id uuid;
  v_admin_role_id uuid;

  -- Defaults
  v_plan_free_id uuid := '015d8a97-6b6e-4aec-87df-5d1e6b0e4ed2';
  v_default_currency_id uuid := '58c50aa7-b8b1-4035-b509-58028dd0e33f';
  v_default_wallet_id uuid := '2658c575-0fa8-4cf6-85d7-6430ded7e188';
  v_default_pdf_template_id uuid := 'b6266a04-9b03-4f3a-af2d-f6ee6d0a948b';
BEGIN
  ----------------------------------------------------------------
  -- 1) Crear organización
  ----------------------------------------------------------------
  v_org_id := public.step_create_organization(
    p_user_id,
    p_organization_name,
    v_plan_free_id
  );

  ----------------------------------------------------------------
  -- 2) Organization data
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_data(v_org_id);

  ----------------------------------------------------------------
  -- 3) Roles base de la organización
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_roles(v_org_id);

  ----------------------------------------------------------------
  -- 4) Obtener rol Administrador
  ----------------------------------------------------------------
  SELECT id
  INTO v_admin_role_id
  FROM public.roles
  WHERE organization_id = v_org_id
    AND name = 'Administrador'
    AND is_system = false
  LIMIT 1;

  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role not found for organization %', v_org_id;
  END IF;

  ----------------------------------------------------------------
  -- 5) Agregar usuario como Admin
  ----------------------------------------------------------------
  PERFORM public.step_add_org_member(
    p_user_id,
    v_org_id,
    v_admin_role_id
  );

  ----------------------------------------------------------------
  -- 6) Asignar permisos a roles
  ----------------------------------------------------------------
  PERFORM public.step_assign_org_role_permissions(v_org_id);

  ----------------------------------------------------------------
  -- 7) Monedas
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_currencies(
    v_org_id,
    v_default_currency_id
  );

  ----------------------------------------------------------------
  -- 8) Billeteras
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_wallets(
    v_org_id,
    v_default_wallet_id
  );

  ----------------------------------------------------------------
  -- 9) Organization preferences
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_preferences(
    v_org_id,
    v_default_currency_id,
    v_default_wallet_id,
    v_default_pdf_template_id
  );

  ----------------------------------------------------------------
  -- 10) Setear como organización activa
  ----------------------------------------------------------------
  UPDATE public.user_preferences
  SET
    last_organization_id = v_org_id,
    updated_at = now()
  WHERE user_id = p_user_id;

  ----------------------------------------------------------------
  RETURN v_org_id;

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'function',
      'handle_new_organization',
      'organization',
      SQLERRM,
      jsonb_build_object(
        'user_id', p_user_id,
        'organization_name', p_organization_name
      ),
      'critical'
    );
    RAISE;
END;


# Funciones STEP para las funciones "PADRE":

## Funcion step_create_user:

DECLARE
  v_user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.users (
    id, auth_id, email, full_name, avatar_url, avatar_source, role_id
  )
  VALUES (
    v_user_id, p_auth_user_id, p_email, p_full_name, p_avatar_url, p_avatar_source, p_role_id
  );

  RETURN v_user_id;

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_user',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'auth_user_id', p_auth_user_id,
        'email', p_email,
        'role_id', p_role_id
      ),
      'critical'
    );
    RAISE;
END;

## Funcion step_create_user_acquisition:

declare
  v_source text;
begin
  ----------------------------------------------------------------
  -- Fuente (fallback a direct)
  ----------------------------------------------------------------
  v_source := coalesce(
    p_raw_meta->>'utm_source',
    'direct'
  );

  INSERT INTO public.user_acquisition (
    user_id,
    source,
    medium,
    campaign,
    content,
    landing_page,
    referrer
  )
  VALUES (
    p_user_id,
    v_source,
    p_raw_meta->>'utm_medium',
    p_raw_meta->>'utm_campaign',
    p_raw_meta->>'utm_content',
    p_raw_meta->>'landing_page',
    p_raw_meta->>'referrer'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    source = EXCLUDED.source,
    medium = EXCLUDED.medium,
    campaign = EXCLUDED.campaign,
    content = EXCLUDED.content,
    landing_page = EXCLUDED.landing_page,
    referrer = EXCLUDED.referrer;

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_user_acquisition',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'user_id', p_user_id,
        'raw_meta', p_raw_meta
      ),
      'critical'
    );
    RAISE;
end;


## Funcion step_create_organization


DECLARE
  v_org_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.organizations (
    id, name, created_by, owner_id, created_at, updated_at, is_active, plan_id
  )
  VALUES (
    v_org_id, p_org_name, p_owner_id, p_owner_id, now(), now(), true, p_plan_id
  );

  RETURN v_org_id;

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_organization',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'owner_id', p_owner_id,
        'org_name', p_org_name,
        'plan_id', p_plan_id
      ),
      'critical'
    );
    RAISE;
END;

## Funcion step_create_organization_data


BEGIN
  INSERT INTO public.organization_data (organization_id)
  VALUES (p_org_id);

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_organization_data',
      'signup',
      SQLERRM,
      jsonb_build_object('org_id', p_org_id),
      'critical'
    );
    RAISE;
END;

## Funcion step_create_organization_roles:

DECLARE
  v_admin_id  uuid;
  v_editor_id uuid;
  v_viewer_id uuid;
BEGIN
  ----------------------------------------------------------------
  -- ADMIN
  ----------------------------------------------------------------
  SELECT id
  INTO v_admin_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Administrador'
    AND is_system = false
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    INSERT INTO public.roles (name, description, type, organization_id, is_system)
    VALUES ('Administrador', 'Acceso total', 'organization', p_org_id, false)
    RETURNING id INTO v_admin_id;
  END IF;

  ----------------------------------------------------------------
  -- EDITOR
  ----------------------------------------------------------------
  SELECT id
  INTO v_editor_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Editor'
    AND is_system = false
  LIMIT 1;

  IF v_editor_id IS NULL THEN
    INSERT INTO public.roles (name, description, type, organization_id, is_system)
    VALUES ('Editor', 'Puede editar', 'organization', p_org_id, false)
    RETURNING id INTO v_editor_id;
  END IF;

  ----------------------------------------------------------------
  -- VIEWER
  ----------------------------------------------------------------
  SELECT id
  INTO v_viewer_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Lector'
    AND is_system = false
  LIMIT 1;

  IF v_viewer_id IS NULL THEN
    INSERT INTO public.roles (name, description, type, organization_id, is_system)
    VALUES ('Lector', 'Solo lectura', 'organization', p_org_id, false)
    RETURNING id INTO v_viewer_id;
  END IF;

  ----------------------------------------------------------------
  -- RETURN
  ----------------------------------------------------------------
  RETURN jsonb_build_object(
    'admin',  v_admin_id,
    'editor', v_editor_id,
    'viewer', v_viewer_id
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_organization_roles',
      'signup',
      SQLERRM,
      jsonb_build_object('org_id', p_org_id),
      'critical'
    );
    RAISE;
END;

## Funcion step_add_org_member:


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
  INSERT INTO public.organization_members (
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

## Funcion step_assign_org_role_permissions:

DECLARE
  v_admin_role_id  uuid;
  v_editor_role_id uuid;
  v_viewer_role_id uuid;
BEGIN
  ----------------------------------------------------------------
  -- Obtener roles
  ----------------------------------------------------------------
  SELECT id INTO v_admin_role_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Administrador'
    AND is_system = false;

  SELECT id INTO v_editor_role_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Editor'
    AND is_system = false;

  SELECT id INTO v_viewer_role_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Lector'
    AND is_system = false;

  ----------------------------------------------------------------
  -- ADMIN → todos los permisos system
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions
  WHERE role_id = v_admin_role_id;

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_admin_role_id, p.id
  FROM public.permissions p
  WHERE p.is_system = true;

  ----------------------------------------------------------------
  -- EDITOR → permisos declarados
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions
  WHERE role_id = v_editor_role_id;

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_editor_role_id, p.id
  FROM public.permissions p
  WHERE p.key IN (
    'projects.view',
    'projects.manage',
    'general_costs.view',
    'general_costs.manage',
    'members.view'
  );

  ----------------------------------------------------------------
  -- LECTOR → permisos declarados
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions
  WHERE role_id = v_viewer_role_id;

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_viewer_role_id, p.id
  FROM public.permissions p
  WHERE p.key IN (
    'projects.view',
    'general_costs.view',
    'members.view',
    'roles.view'
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'function',
      'step_assign_org_role_permissions',
      'permissions',
      SQLERRM,
      jsonb_build_object('org_id', p_org_id),
      'critical'
    );
    RAISE;
END;

## Funcion step_create_organization_currencies:


BEGIN
  INSERT INTO public.organization_currencies (
    id,
    organization_id,
    currency_id,
    is_active,
    is_default,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    p_org_id,
    p_currency_id,
    true,
    true,
    now()
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_organization_currencies',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'organization_id', p_org_id,
        'currency_id', p_currency_id
      ),
      'critical'
    );
    RAISE;
END;

## Funcion step_create_organization_wallets:

BEGIN
  INSERT INTO public.organization_wallets (
    id,
    organization_id,
    wallet_id,
    is_active,
    is_default,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    p_org_id,
    p_wallet_id,
    true,
    true,
    now()
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_organization_wallets',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'organization_id', p_org_id,
        'wallet_id', p_wallet_id
      ),
      'critical'
    );
    RAISE;
END;

## Funcion step_create_organization_preferences:

BEGIN
  INSERT INTO public.organization_preferences (
    organization_id, default_currency_id, default_wallet_id, default_pdf_template_id,
    use_currency_exchange, created_at, updated_at
  )
  VALUES (
    p_org_id, p_currency_id, p_wallet_id, p_pdf_template_id,
    false, now(), now()
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_organization_preferences',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'org_id', p_org_id,
        'currency_id', p_currency_id,
        'wallet_id', p_wallet_id,
        'pdf_template_id', p_pdf_template_id
      ),
      'critical'
    );
    RAISE;
END;

## Funcion step_create_user_preferences:

BEGIN
  INSERT INTO public.user_preferences (
    id, user_id, last_organization_id, theme, onboarding_completed,
    sidebar_docked, layout, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), p_user_id, p_org_id, 'light', false,
    false, 'experimental', now(), now()
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_user_preferences',
      'signup',
      SQLERRM,
      jsonb_build_object('user_id', p_user_id, 'org_id', p_org_id),
      'critical'
    );
    RAISE;
END;

# Funcion can_mutate_org:

  select
    public.is_admin()
    or (
      not public.is_demo_org(p_organization_id)
      and public.is_org_member(p_organization_id)
      and public.has_permission(p_organization_id, p_permission_key)
    );

# Funcion can_view_org:

  select
    public.is_admin()
    or public.is_org_member(p_organization_id)
    or public.is_demo_org(p_organization_id);

# Funcion can_view_org:

select
  is_admin()
  or is_demo_org(p_organization_id)
  or (
    is_org_member(p_organization_id)
    and has_permission(p_organization_id, p_permission_key)
  );

# Funcion is_admin:

  select exists (
    select 1
    from public.admin_users au
    where au.auth_id = auth.uid()
  );

# Funcion is_demo_org:

  select exists (
    select 1
    from public.organizations o
    where o.id = p_organization_id
      and o.is_demo = true
  );

# Funcion is_org_member:

  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = public.current_user_id()
      and m.is_active = true
  );

# Funcion is_self:

  select p_user_id = public.current_user_id();

# Funcion is_system_row:

  select coalesce(p_is_system, false);

# Funcion is_system_row:

























































