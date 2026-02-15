-- ============================================================
-- REDISEÑO: handle_new_user — Trigger LIGERO (sin org)
-- ============================================================
-- El trigger ahora SOLO crea lo que es del USUARIO:
--   1. User (users)
--   2. User acquisition (user_acquisitions)
--   3. User data (user_data)
--   4. User preferences (user_preferences) — sin org_id
--
-- La organización se crea DESPUÉS, en el Onboarding 2,
-- usando handle_new_organization() que ya tiene todos los pasos.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$declare
  v_user_id uuid;
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
  -- 2) User acquisition (tracking)
  ----------------------------------------------------------------
  PERFORM public.step_create_user_acquisition(
    v_user_id,
    NEW.raw_user_meta_data
  );

  ----------------------------------------------------------------
  -- 3) User data
  ----------------------------------------------------------------
  PERFORM public.step_create_user_data(v_user_id);

  ----------------------------------------------------------------
  -- 4) User preferences (sin org — se asigna después)
  ----------------------------------------------------------------
  PERFORM public.step_create_user_preferences(v_user_id);

  -- signup_completed queda en FALSE (default)
  -- Se marca TRUE cuando el usuario completa el Onboarding 1

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
end;$function$;


-- ============================================================
-- REDISEÑO: step_create_user_preferences — sin org_id
-- ============================================================
-- Nueva firma: solo recibe p_user_id (ya no p_org_id)
-- last_organization_id queda NULL hasta que el usuario
-- cree o se una a una organización.
-- ============================================================

-- Primero eliminar la función vieja (cambio de firma)
DROP FUNCTION IF EXISTS public.step_create_user_preferences(uuid, uuid);

CREATE OR REPLACE FUNCTION public.step_create_user_preferences(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (p_user_id);

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_user_preferences',
      'signup',
      SQLERRM,
      jsonb_build_object('user_id', p_user_id),
      'critical'
    );
    RAISE;
END;$function$;
