-- ============================================================
-- MIGRACIÓN: Agregar envío de email de compra al flujo de cursos
-- 
-- El handle_payment_course_success NO enviaba email de confirmación
-- mientras que handle_payment_subscription_success SÍ lo hacía.
-- Esta migración corrige esa inconsistencia.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_payment_course_success(
    p_provider text,
    p_provider_payment_id text,
    p_user_id uuid,
    p_course_id uuid,
    p_amount numeric,
    p_currency text DEFAULT 'USD',
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment_id uuid;
  v_course_title text;
  v_step text := 'start';
BEGIN
  -- ============================================================
  -- 1) Idempotencia
  -- ============================================================
  v_step := 'idempotency_lock';
  PERFORM pg_advisory_xact_lock(
    hashtext(p_provider || p_provider_payment_id)
  );

  -- ============================================================
  -- 2) Registrar pago
  -- ============================================================
  v_step := 'insert_payment';
  v_payment_id := public.step_payment_insert_idempotent(
    p_provider,
    p_provider_payment_id,
    p_user_id,
    NULL,
    'course',
    NULL,
    p_course_id,
    p_amount,
    p_currency,
    p_metadata
  );

  IF v_payment_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'already_processed'
    );
  END IF;

  -- ============================================================
  -- 3) Enroll anual al curso
  -- ============================================================
  v_step := 'course_enrollment_annual';
  PERFORM public.step_course_enrollment_annual(
    p_user_id,
    p_course_id
  );

  -- ============================================================
  -- 4) NUEVO: Enviar email de confirmación de compra
  -- ============================================================
  v_step := 'send_purchase_email';
  
  -- Obtener título del curso
  SELECT title INTO v_course_title
  FROM public.courses
  WHERE id = p_course_id;
  
  PERFORM public.step_send_purchase_email(
    p_user_id,
    'course',
    COALESCE(v_course_title, 'Curso'),
    p_amount,
    p_currency,
    v_payment_id
  );

  -- ============================================================
  -- DONE
  -- ============================================================
  v_step := 'done';
  RETURN jsonb_build_object(
    'status', 'ok',
    'payment_id', v_payment_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- 🔥 LOGUEAMOS PERO NO ROMPEMOS EL FLUJO
    PERFORM public.log_system_error(
      'payment',
      'course',
      'handle_payment_course_success',
      SQLERRM,
      jsonb_build_object(
        'step', v_step,
        'provider', p_provider,
        'provider_payment_id', p_provider_payment_id,
        'user_id', p_user_id,
        'course_id', p_course_id,
        'amount', p_amount,
        'currency', p_currency
      ),
      'critical'
    );

    -- ⚠️ CLAVE: NO RAISE
    RETURN jsonb_build_object(
      'status', 'ok_with_warning',
      'payment_id', v_payment_id,
      'warning_step', v_step
    );
END;
$$;
