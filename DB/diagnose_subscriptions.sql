-- ============================================================================
-- DIAGNÓSTICO: ¿Por qué organization_subscriptions está vacía?
-- ============================================================================

-- 1. Verificar si hay suscripciones
SELECT COUNT(*) as total_subscriptions FROM organization_subscriptions;

-- 2. Verificar si hay pagos de tipo subscription
SELECT 
    id, 
    provider, 
    product_type, 
    organization_id,
    amount,
    currency,
    status,
    created_at
FROM payments 
WHERE product_type = 'subscription'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar errores del sistema relacionados con subscriptions
SELECT 
    domain,
    function_name,
    error_message,
    context,
    created_at
FROM system_error_logs 
WHERE domain = 'payment' 
   OR function_name LIKE '%subscription%'
   OR function_name LIKE '%step_%'
ORDER BY created_at DESC 
LIMIT 20;

-- 4. Verificar si la función handle_payment_subscription_success existe
SELECT 
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE 'handle_payment%'
ORDER BY p.proname;

-- 5. Verificar si step_subscription_create_active existe
SELECT 
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE 'step_subscription%'
ORDER BY p.proname;

-- 6. Verificar organizaciones con plan_id (esto se actualiza por step_organization_set_plan)

