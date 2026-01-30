-- =====================================================
-- DIAGNÓSTICO: Flujo de Suscripción MP
-- Ejecutar después de una compra de plan
-- =====================================================

-- 1. Último pago registrado
SELECT 
    'payments' as tabla,
    id as payment_id,
    provider_payment_id,
    user_id,
    organization_id,
    product_type,
    product_id as plan_id,
    amount,
    currency,
    status,
    created_at
FROM payments 
ORDER BY created_at DESC 
LIMIT 1;

-- 2. Suscripciones para esa organización
SELECT 
    'organization_subscriptions' as tabla,
    id as subscription_id,
    organization_id,
    plan_id,
    payment_id,
    status,
    billing_period,
    started_at,
    expires_at,
    amount,
    currency
FROM organization_subscriptions 
WHERE organization_id = '0d5e28fe-8fe2-4fe4-9835-4fe21b4f2abb'
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Plan actual de la organización
SELECT 
    'organizations' as tabla,
    id as org_id,
    name,
    plan_id,
    updated_at
FROM organizations 
WHERE id = '0d5e28fe-8fe2-4fe4-9835-4fe21b4f2abb';

-- 4. Verificar que el plan existe
SELECT 
    'plans' as tabla,
    id as plan_id,
    slug,
    name,
    is_active
FROM plans 
WHERE id = 'd0de319e-2b8c-40a5-abb9-3ea6bbf1fc08';

-- 5. System errors (por si acaso)
SELECT * FROM system_error_logs 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Verificar que las funciones STEP existen
SELECT 
    proname as function_name,
    pronargs as num_args
FROM pg_proc 
WHERE proname LIKE 'step_%' 
ORDER BY proname;
