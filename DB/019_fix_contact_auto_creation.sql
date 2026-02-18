-- =============================================
-- FIX: ensure_contact_for_user
-- =============================================
-- La función original solo leía users.full_name y users.email
-- No copiaba first_name/last_name de user_data ni avatar_url de users
-- Resultado: contacto auto-creado con full_name pero sin first_name,
-- last_name ni image_url → el form de edición los mostraba vacíos.
-- =============================================

CREATE OR REPLACE FUNCTION public.ensure_contact_for_user(p_organization_id uuid, p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user record;
  v_user_data record;
  v_contact_id uuid;
  v_first_name text;
  v_last_name text;
begin
  -- Obtener datos del usuario
  select u.id, u.full_name, u.email, u.avatar_url
  into v_user
  from public.users u
  where u.id = p_user_id
  limit 1;

  -- Si no hay usuario, no hacer nada
  if v_user.id is null then
    return null;
  end if;

  -- Si no hay email, no intentamos vincular
  if v_user.email is null then
    return null;
  end if;

  -- Obtener first_name/last_name de user_data (si existe)
  select ud.first_name, ud.last_name
  into v_user_data
  from public.user_data ud
  where ud.user_id = p_user_id
  limit 1;

  -- Resolver first_name y last_name
  -- Prioridad: user_data > split de full_name
  if v_user_data.first_name is not null then
    v_first_name := v_user_data.first_name;
    v_last_name := coalesce(v_user_data.last_name, '');
  elsif v_user.full_name is not null then
    -- Fallback: split full_name por el primer espacio
    v_first_name := split_part(v_user.full_name, ' ', 1);
    v_last_name := nullif(trim(substring(v_user.full_name from position(' ' in v_user.full_name) + 1)), '');
  end if;

  -- 1) ¿Ya existe un contacto vinculado a este user en esta org?
  select c.id
  into v_contact_id
  from public.contacts c
  where c.organization_id = p_organization_id
    and c.linked_user_id = v_user.id
    and c.is_deleted = false
  limit 1;

  if v_contact_id is not null then
    -- Ya existe: actualizar datos que puedan estar faltando
    update public.contacts c
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

  -- 2) ¿Existe un contacto local (sin linked_user_id) que coincida por email?
  select c.id
  into v_contact_id
  from public.contacts c
  where c.organization_id = p_organization_id
    and c.linked_user_id is null
    and lower(c.email) = lower(v_user.email)
    and c.is_deleted = false
  limit 1;

  if v_contact_id is not null then
    -- Promover contacto local a vinculado
    update public.contacts c
    set
      linked_user_id = v_user.id,
      full_name      = coalesce(v_user.full_name, c.full_name),
      first_name     = coalesce(c.first_name, v_first_name),
      last_name      = coalesce(c.last_name, v_last_name),
      email          = coalesce(v_user.email, c.email),
      image_url      = coalesce(c.image_url, v_user.avatar_url),
      updated_at     = now()
    where c.id = v_contact_id;

    return v_contact_id;
  end if;

  -- 3) Crear nuevo contacto vinculado
  insert into public.contacts (
    organization_id,
    linked_user_id,
    full_name,
    first_name,
    last_name,
    email,
    image_url,
    contact_type,
    created_at,
    updated_at
  )
  values (
    p_organization_id,
    v_user.id,
    v_user.full_name,
    v_first_name,
    v_last_name,
    v_user.email,
    v_user.avatar_url,
    'person',
    now(),
    now()
  )
  returning id into v_contact_id;

  return v_contact_id;
end;
$function$;

-- =============================================
-- PATCH: Actualizar contactos existentes que ya fueron creados
-- sin first_name, last_name ni image_url
-- =============================================
-- Solo toca contactos que tienen linked_user_id (auto-creados)
-- y que les faltan datos
-- =============================================

UPDATE contacts c
SET
  first_name = coalesce(c.first_name, ud.first_name, split_part(u.full_name, ' ', 1)),
  last_name  = coalesce(c.last_name, ud.last_name, nullif(trim(substring(u.full_name from position(' ' in u.full_name) + 1)), '')),
  image_url  = coalesce(c.image_url, u.avatar_url),
  updated_at = now()
FROM users u
LEFT JOIN user_data ud ON ud.user_id = u.id
WHERE c.linked_user_id = u.id
  AND c.is_deleted = false
  AND (c.first_name IS NULL OR c.image_url IS NULL);
