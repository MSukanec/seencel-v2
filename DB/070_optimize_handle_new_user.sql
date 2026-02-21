-- ============================================================
-- 070: Optimizar handle_new_user — consolidar step functions
-- ============================================================
-- Auditoría senior encontró:
--   1. Double error logging (step + parent)
--   2. billing en search_path sin usarse
--   3. role_id hardcodeado en 2 lugares
--   4. Valores explícitos redundantes con defaults
--   5. Step functions de 1 línea overkill (3 funciones extra)
--   6. coalesce(..., NULL) innecesario
--
-- Cambios:
--   - Inlinear step_create_user, step_create_user_data,
--     step_create_user_preferences en handle_new_user
--   - Mantener step_create_user_acquisition (parsing UTM)
--   - Un solo EXCEPTION handler con v_current_step
--   - search_path limpio: solo 'iam'
--   - role_id usa DEFAULT de la tabla (no hardcodeado)
--   - UUID usa DEFAULT + RETURNING
-- ============================================================

BEGIN;

-- ──────────────────────────────────────────────────────────────
-- 1. Reemplazar handle_new_user (consolidada)
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION iam.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'iam'
AS $function$
DECLARE
  v_user_id      uuid;
  v_avatar_source public.avatar_source_t := 'email';
  v_avatar_url   text;
  v_full_name    text;
  v_provider     text;
  v_current_step text := 'init';
BEGIN
  -- ══════════════════════════════════════════════════════════
  -- GUARD: evitar doble ejecución del signup
  -- ══════════════════════════════════════════════════════════
  IF EXISTS (
    SELECT 1 FROM iam.users WHERE auth_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- EXTRAER METADATA
  -- ══════════════════════════════════════════════════════════

  -- Provider real (raw_app_meta_data es la fuente confiable)
  v_provider := coalesce(
    NEW.raw_app_meta_data->>'provider',
    NEW.raw_user_meta_data->>'provider',
    'email'
  );

  -- Avatar source (enum basado en provider)
  v_avatar_source := CASE v_provider
    WHEN 'google'  THEN 'google'::public.avatar_source_t
    WHEN 'discord' THEN 'discord'::public.avatar_source_t
    ELSE 'email'::public.avatar_source_t
  END;

  -- Avatar URL
  v_avatar_url := coalesce(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- Full name (fallback: parte del email antes del @)
  v_full_name := coalesce(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- ══════════════════════════════════════════════════════════
  -- STEP 1: Crear usuario
  -- ══════════════════════════════════════════════════════════
  v_current_step := 'create_user';

  INSERT INTO iam.users (auth_id, email, full_name, avatar_url, avatar_source)
  VALUES (NEW.id, lower(NEW.email), v_full_name, v_avatar_url, v_avatar_source)
  RETURNING id INTO v_user_id;

  -- ══════════════════════════════════════════════════════════
  -- STEP 2: Tracking de adquisición (UTM)
  -- ══════════════════════════════════════════════════════════
  v_current_step := 'create_user_acquisition';

  PERFORM iam.step_create_user_acquisition(v_user_id, NEW.raw_user_meta_data);

  -- ══════════════════════════════════════════════════════════
  -- STEP 3: User data (perfil extendido — vacío al inicio)
  -- ══════════════════════════════════════════════════════════
  v_current_step := 'create_user_data';

  INSERT INTO iam.user_data (user_id) VALUES (v_user_id);

  -- ══════════════════════════════════════════════════════════
  -- STEP 4: User preferences (con defaults de la tabla)
  -- ══════════════════════════════════════════════════════════
  v_current_step := 'create_user_preferences';

  INSERT INTO iam.user_preferences (user_id) VALUES (v_user_id);

  -- signup_completed queda en FALSE (default de iam.users)
  -- Se marca TRUE cuando el usuario completa el Onboarding

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'handle_new_user',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'step', v_current_step,
        'auth_id', NEW.id,
        'email', NEW.email,
        'user_id', v_user_id
      ),
      'critical'
    );
    RAISE;
END;
$function$;

-- ──────────────────────────────────────────────────────────────
-- 2. Eliminar step functions que ya no se usan
-- ──────────────────────────────────────────────────────────────

-- step_create_user → inlineado como INSERT + RETURNING
DROP FUNCTION IF EXISTS iam.step_create_user(uuid, text, text, text, public.avatar_source_t, uuid);

-- step_create_user_data → inlineado como 1 INSERT
DROP FUNCTION IF EXISTS iam.step_create_user_data(uuid);

-- step_create_user_preferences → inlineado como 1 INSERT
DROP FUNCTION IF EXISTS iam.step_create_user_preferences(uuid);

-- ──────────────────────────────────────────────────────────────
-- ✅ Se MANTIENEN (tienen uso fuera del signup):
--   - iam.step_create_user_acquisition (parsing UTM + reutilizable)
--   - iam.step_create_user_organization_preferences (usada por handle_new_organization)
-- ──────────────────────────────────────────────────────────────

COMMIT;
