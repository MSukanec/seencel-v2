# User Journey: Suscripción a Plan

> Tutorial paso a paso del flujo de suscripción a un plan en Seencel.

## Escenario

Carlos es un ingeniero civil que necesita el plan Teams para su empresa constructora "Obras del Sur". Ya tiene una organización creada con el plan Starter (gratuito). Quiere actualizar al plan Teams anual por USD 288/año. Va a pagar con MercadoPago.

---

## Paso 1: Navegar al Checkout

**Qué hace**: Carlos hace clic en "Cambiar Plan" desde la configuración de la organización, o navega directamente al checkout.

**URL**: `/checkout?product=plan-teams&cycle=annual`

**Archivos frontend**:
- Página: `src/app/[locale]/(dashboard)/checkout/page.tsx`
- Vista: `src/features/billing/views/billing-checkout-view.tsx`
- Hook: `src/features/billing/hooks/use-checkout.ts`
- Types: `src/features/billing/types/checkout.ts`

**Datos que se cargan en el server** (`page.tsx`):
- Plans (de `billing.plans`) — todos los planes disponibles
- Billing profile del usuario (de `billing.billing_profiles`)
- Tipo de cambio USD→ARS (de `exchange_rates`)
- País del usuario (de `iam.users` → `iam.user_data` → `countries`)
- Organizaciones del usuario (de `iam.organizations`)
- Feature flags: `mp_enabled`, `paypal_enabled`

**Estado**: ✅ Funciona

---

## Paso 2: Seleccionar Plan y Ciclo de Facturación

**Qué hace**: Carlos ve los planes disponibles con comparación de features. Selecciona "Teams" y elige el ciclo anual. Ve el selector de organización (si tiene múltiples orgs).

**Componentes frontend**:
- `BillingCheckoutProductCard` → muestra info del plan seleccionado y precio
- `BillingCheckoutPaymentMethods` → selector de medio de pago
- `BillingCheckoutSummary` → resumen con precio final (USD + ARS)
- `BillingCheckoutCouponInput` → input de cupón (opcional)

**Lógica**:
- El checkout detecta `productType = 'plan'` y renderiza la tarjeta del plan
- Si el usuario tiene organizaciones, puede seleccionar a cuál aplicar la suscripción
- El price se calcula según ciclo: `monthly_amount` o `annual_amount` de `billing.plans`
- Se muestra precio en USD y equivalente en ARS según `exchange_rate`

**Estado**: ✅ Funciona

---

## Paso 3: Aplicar Cupón (Opcional)

**Qué hace**: Carlos ingresa un código de cupón y lo valida.

**Tabla(s)**: `billing.coupons`, `billing.coupon_redemptions`

**Archivos**:
- Frontend: `src/features/billing/components/checkout/billing-checkout-coupon-input.tsx`
- Action: `src/features/billing/actions.ts` → `validateCoupon()`
- SQL: `billing.validate_coupon_universal()` (SECURITY DEFINER)

**Flujo SQL** de `validate_coupon_universal`:
1. Verifica que el usuario esté autenticado
2. Busca el cupón (case-insensitive, activo, vigente, `applies_to` = 'subscriptions' o 'all')
3. Verifica mínimo de compra
4. Verifica límite por usuario
5. Verifica límite global
6. Calcula descuento y precio final
7. Retorna `{ ok, coupon_id, discount, final_price, is_free }`

**Caso especial — Cupón 100%**:
Si `is_free = true`, se habilita la activación gratuita sin pasarela (ver Paso 4c).

**Estado**: ✅ Funciona

---

## Paso 4a: Pagar con MercadoPago

**Qué hace**: Carlos hace clic en "Pagar con MercadoPago". Se crea una preferencia de pago y es redirigido a la pasarela de MP.

**Tabla(s)**: `billing.mp_preferences`

**Archivos**:
- Frontend: `src/features/billing/components/checkout/billing-checkout-actions.tsx`
- API: `src/app/api/mercadopago/preference/route.ts`

**Datos de la preferencia** (columnas de `mp_preferences`):
- `user_id`, `organization_id`, `plan_id`, `product_type: 'subscription'`
- `billing_period: 'annual'`
- `amount`, `currency: 'ARS'`
- `coupon_id`, `discount_amount`, `coupon_code` (si aplica)
- `init_point` (URL de redirección a MP)
- `status: 'pending'`

**external_reference** (pipe-delimited para el webhook):
```
subscription|{userId}|{orgId}|{planId}|annual|{couponCode}|{isTest}|x|x
```

**Estado**: ✅ Funciona

---

## Paso 4b: Pagar con PayPal

**Qué hace**: Alternativa a MP. Se crea una order de PayPal.

**Tabla(s)**: `billing.paypal_preferences`

**Archivos**:
- Frontend: `src/features/billing/components/checkout/billing-checkout-actions.tsx`
- API Create: `src/app/api/paypal/create-order/route.ts`
- API Capture: `src/app/api/paypal/capture-order/route.ts`

**Flujo PayPal**:
1. Frontend llama a `/api/paypal/create-order` → crea orden en PayPal
2. Se guarda en `paypal_preferences` (status: 'pending')
3. El widget de PayPal se muestra en el checkout (PayPal SDK)
4. Cuando el usuario aprueba, se llama a `/api/paypal/capture-order`
5. El capture verifica el pago y llama a `handle_payment_subscription_success`

**Estado**: ✅ Funciona

---

## Paso 4c: Activación Gratuita (Cupón 100%)

**Qué hace**: Si el cupón aplicado da 100% descuento, se bypasea la pasarela y se activa directamente.

**Archivos**:
- Action: `src/features/billing/actions.ts` → `activateFreeSubscription()`

**Flujo**:
1. `activateFreeSubscription()` verifica autenticación
2. Llama a `redeem_coupon_universal` para marcar el cupón como usado
3. Llama a `handle_payment_subscription_success` con:
   - `provider: 'coupon'`
   - `amount: 0`
   - `metadata: { coupon_id, coupon_code, is_gift: true, activated_via: 'free_coupon' }`
4. La suscripción se activa igual que si hubiera pagado

**Estado**: ✅ Funciona

---

## Paso 4d: Pagar con Transferencia Bancaria

**Qué hace**: Carlos sube un comprobante de transferencia y se activa optimistamente.

**Tabla(s)**: `billing.bank_transfer_payments`

**Archivos**:
- Action: `src/features/billing/payments/actions/bank-transfer-actions.ts` → `createBankTransferPayment()`
- Upload: `uploadTransferReceipt()` en el mismo archivo

**Flujo**:
1. Carlos sube comprobante de transferencia
2. Se crea registro en `bank_transfer_payments` (status: 'pending')
3. **Activación optimista**: se llama a `handle_payment_subscription_success` inmediatamente
4. Un admin puede verificar después y revocar si es fraudulento
5. Se envía email de confirmación via `notifications.queue_email_bank_transfer`

**Estado**: ✅ Funciona

---

## Paso 5: Webhook de MercadoPago confirma el pago

**Qué hace**: MP envía un webhook POST a `/api/mercadopago/webhook` cuando el pago se aprueba.

**Tabla(s)**: `billing.payment_events`

**Archivos**:
- Route: `src/app/api/mercadopago/webhook/route.ts`
- Handler: `src/lib/mercadopago/webhook-handler.ts`

**Flujo del webhook handler** (`handlePaymentEvent`):
1. Fetch datos del pago desde API de MP
2. Solo procesa pagos `status === 'approved'`
3. Parsea `external_reference` → identifica `productType = 'subscription'`
4. Llama a `handle_payment_subscription_success` con:
   - `p_provider: 'mercadopago'`
   - `p_user_id`, `p_organization_id`, `p_plan_id`, `p_billing_period`
   - `p_amount: transaction_amount`, `p_currency: currency_id`
5. Si hay `couponCode` → `redeem_coupon_universal`

**Estado**: ✅ Funciona

---

## Paso 6: SQL orquesta el fulfillment

**Qué hace**: La función handler ejecuta toda la lógica de negocio dentro de una transacción.

**Función**: `billing.handle_payment_subscription_success()` (SECURITY DEFINER)

**Pasos internos**:
1. **Idempotency lock**: `pg_advisory_xact_lock` evita procesamiento duplicado
2. **Determinar product_type**: `'upgrade'` si `p_is_upgrade=true`, sino `'subscription'`
3. **Pre-fetch plan name**: Busca nombre del plan para enriquecer metadata
4. **Enriquecer metadata**: Agrega `billing_period`, `product_name`. Si upgrade: agrega `previous_plan_id`, `previous_plan_name`
5. **`step_payment_insert_idempotent`**: INSERT payment o SKIP si duplicado → TRIGGERS automáticos
6. **`step_subscription_expire_previous`**: Marca suscripciones anteriores como `expired`
7. **`step_subscription_create_active`**: Crea suscripción activa con `expires_at` (12 meses o 1 mes)
8. **`step_organization_set_plan`**: UPDATE `iam.organizations` SET `plan_id` al nuevo plan
9. **`step_apply_founders_program`**: Solo si `billing_period = 'annual'`

**Tablas tocadas**:
- `billing.payments` (INSERT) → dispara triggers automáticos
- `billing.organization_subscriptions` (UPDATE expired + INSERT active)
- `iam.organizations` (UPDATE plan_id)
- `billing.founders_members` (INSERT si annual)

**Error handling**: EXCEPTION captura errores, los loguea en `ops.log_system_error()`, y retorna `ok_with_warning`.

**Estado**: ✅ Funciona

---

## Paso 7: Redirect a página de éxito

**Qué hace**: Después del pago, el usuario es redirigido a la success page.

**URL**: `/checkout/success?source=mercadopago&product_type=subscription&org_id={orgId}`

**Archivos**:
- Page: `src/app/[locale]/(dashboard)/checkout/success/page.tsx`
- View: `src/features/billing/views/billing-checkout-success-view.tsx`

**Estado**: ✅ Funciona

---

## Diagrama completo

```
┌──────────────────────────────────────────────────────────────────┐
│                        CHECKOUT PAGE                              │
│  page.tsx (Server) → BillingCheckoutView (Client)                 │
│  ├── BillingCheckoutProductCard (info del plan + precio)          │
│  ├── BillingCheckoutPaymentMethods (MP / PayPal / Transfer)       │
│  ├── BillingCheckoutCouponInput (validación de cupón)             │
│  ├── BillingCheckoutSummary (precio final USD/ARS)                │
│  └── BillingCheckoutActions (botones de pago)                     │
└───────────────────────────┬──────────────────────────────────────┘
                            │
             ┌──────────────┼──────────────┬───────────┐
             │              │              │           │
       MercadoPago       PayPal      Transfer    Cupón 100%
             │              │              │           │
     /api/mp/webhook   /api/paypal/   bank_transfer  activateFree
             │         capture        _actions.ts    Subscription
             │              │              │           │
             └──────┬───────┘──────────────┘───────────┘
                    │
   billing.handle_payment_subscription_success (SQL)
                    │
    ┌───────────────┼───────────────┬────────────────┐
    │               │               │                │
 step_payment_ step_sub_      step_sub_      step_org_
 insert_       expire_        create_        set_plan
 idempotent    previous       active
    │               │               │                │
 billing.      billing.org_   billing.org_    iam.
 payments      subscriptions  subscriptions   organizations
    │
    ├── TRIGGERS AUTOMÁTICOS
    ├── queue_purchase_email  → email_queue (x2)
    ├── log_payment_activity  → activity_logs
    ├── notify_admin          → campanita
    └── notify_user           → campanita
                    │
      step_apply_founders_program (si annual)
                    │
            billing.founders_members
```
