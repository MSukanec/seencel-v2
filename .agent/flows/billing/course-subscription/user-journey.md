# User Journey: Compra de Curso

> Tutorial paso a paso del flujo de compra de un curso en la Academy de Seencel.

## Escenario

María es arquitecta. Quiere comprar el curso "Gestión de Obra" (precio: USD 49.99). Tiene cuenta en Seencel, está logueada, y va a pagar con MercadoPago.

---

## Paso 1: Navegar al Checkout del Curso

**Qué hace**: María navega a la landing del curso y hace clic en "Comprar" o llega al checkout vía link directo.

**URL**: `/checkout?product=course&course=gestion-de-obra`

**Archivos frontend**:
- Página: `src/app/[locale]/(dashboard)/checkout/page.tsx`
- Vista: `src/features/billing/views/billing-checkout-view.tsx`
- Hook: `src/features/billing/hooks/use-checkout.ts`
- Types: `src/features/billing/types/checkout.ts`

**Datos que se cargan en el server** (`page.tsx`):
- Curso (de `academy.courses` + `academy.course_details`)
- Plans (de `billing.plans`) — para mostrar opciones
- Billing profile del usuario (de `billing.billing_profiles`)
- Tipo de cambio USD→ARS (de `exchange_rates`)
- País del usuario (de `iam.users` → `iam.user_data` → `countries`)
- Feature flags: `mp_enabled`, `paypal_enabled`, `course_purchases_enabled`

**Estado**: ✅ Funciona

---

## Paso 2: Seleccionar Medio de Pago

**Qué hace**: María ve el checkout con la tarjeta del curso, precio, y elige entre MercadoPago, PayPal, o Transferencia Bancaria.

**Componentes frontend**:
- `BillingCheckoutProductCard` → muestra info del curso y precio
- `BillingCheckoutPaymentMethods` → selector de medio de pago
- `BillingCheckoutSummary` → resumen con precio final
- `BillingCheckoutCouponInput` → input de cupón (opcional)

**Lógica**:
- Si el usuario es de Argentina (`userCountryCode === "AR"`), se prioriza MercadoPago
- Los medios de pago se habilitan/deshabilitan según feature flags
- Si se aplica un cupón del 100%, se habilita activación gratuita sin pasarela

**Estado**: ✅ Funciona

---

## Paso 3: Aplicar Cupón (Opcional)

**Qué hace**: María ingresa un código de cupón y lo valida.

**Tabla(s)**: `billing.coupons`, `billing.coupon_courses`, `billing.coupon_redemptions`

**Archivos**:
- Frontend: `src/features/billing/components/checkout/billing-checkout-coupon-input.tsx`
- Action: `src/features/billing/actions.ts` → `validateCoupon()`
- SQL: `billing.validate_coupon_universal()` (SECURITY DEFINER)

**Flujo SQL** de `validate_coupon_universal`:
1. Verifica que el usuario esté autenticado
2. Busca el cupón (case-insensitive, activo, vigente, aplica a cursos)
3. Verifica mínimo de compra
4. Verifica alcance (applies_to_all o existe en `coupon_courses`)
5. Verifica límite por usuario
6. Verifica límite global
7. Verifica moneda (para descuentos fijos)
8. Calcula descuento y precio final
9. Retorna `{ ok, coupon_id, discount, final_price, is_free }`

**Estado**: ✅ Funciona

---

## Paso 4a: Pagar con MercadoPago

**Qué hace**: María hace clic en "Pagar con MercadoPago". Se crea una preferencia de pago y es redirigida a la pasarela de MP.

**Tabla(s)**: `billing.mp_preferences`

**Archivos**:
- Frontend: `src/features/billing/components/checkout/billing-checkout-actions.tsx`
- API: `src/app/api/mercadopago/create-preference/route.ts`

**Datos de la preferencia** (columnas de `mp_preferences`):
- `user_id`, `course_id`, `product_type: 'course'`
- `amount`, `currency`, `exchange_rate`
- `coupon_id`, `discount_amount`, `coupon_code` (si aplica)
- `init_point` (URL de redirección a MP)
- `status: 'pending'`

**external_reference** (pipe-delimited para el webhook):
```
course|{userId}|x|{courseId}|x|{couponCode}|{isTest}|x|x
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
5. El capture verifica el pago y llama a `handle_payment_course_success`

**Estado**: ✅ Funciona

---

## Paso 4c: Activación Gratuita (Cupón 100%)

**Qué hace**: Si el cupón aplicado da 100% descuento, se bypasea la pasarela.

**Archivos**:
- Action: `src/features/billing/actions.ts` → `activateFreeSubscription()`

**Flujo**: Solo aplica a subscriptions hoy, NO a cursos. Ver roadmap.

**Estado**: ⚠️ Solo funciona para suscripciones, no para cursos con cupón 100%

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
3. Parsea `external_reference` → identifica `productType`
4. Según `productType`:
   - `course` → `handle_payment_course_success` (RPC)
   - `subscription` → `handle_payment_subscription_success` (RPC)
   - `upgrade` → `handle_payment_upgrade_success` (RPC)
   - `seats` → `handle_payment_seat_success` (RPC)
5. Si hay `couponCode` → `redeem_coupon_universal` (universal para cursos + subs + upgrades)

**Estado**: ✅ Funciona (coupon redemption corregida — antes solo se redimía para cursos)

---

## Paso 6: SQL orquesta el fulfillment

**Qué hace**: La función handler ejecuta toda la lógica de negocio dentro de una transacción.

**Función**: `billing.handle_payment_course_success()` (SECURITY DEFINER)

**Pasos internos**:
1. **Idempotency lock**: `pg_advisory_xact_lock` evita procesamiento duplicado
2. **Enriquecer metadata**: Pre-fetch nombre del curso → agrega `product_name` a metadata
3. **Insert payment**: `step_payment_insert_idempotent()` → ON CONFLICT DO NOTHING
4. **Enrollment**: `step_course_enrollment_annual()` → INSERT con ON CONFLICT UPSERT, 1 año de acceso
5. **Email + Activity Log**: ~~`step_send_purchase_email()`~~ → **Ahora son TRIGGERS automáticos** en `billing.payments` (disparan al INSERT)

**Tablas tocadas**:
- `billing.payments` (INSERT) → dispara triggers:
  - `notifications.queue_purchase_email()` → INSERT `email_queue` (x2: comprador + admin)
  - `audit.log_payment_activity()` → INSERT `organization_activity_logs`
  - `notifications.notify_admin_on_payment()` → INSERT notification (campanita admin)
  - `notifications.notify_user_payment_completed()` → INSERT notification (campanita user)
- `academy.course_enrollments` (INSERT/UPSERT)

**Error handling**: EXCEPTION captura errores, los loguea en `ops.log_system_error()`, y retorna `ok_with_warning` en vez de fallar (para que el webhook devuelva 200).

**Estado**: ✅ Funciona

---

## Paso 7: Redirect a página de éxito

**Qué hace**: Después del pago, el usuario es redirigido a la success page.

**URL**: `/checkout/success?product=course&course={slug}`

**Archivos**:
- Page: `src/app/[locale]/(dashboard)/checkout/success/page.tsx`
- View: `src/features/billing/views/billing-checkout-success-view.tsx`

**Estado**: ✅ Funciona

---

## Diagrama completo

```
┌─────────────────────────────────────────────────────────────────┐
│                        CHECKOUT PAGE                            │
│  page.tsx (Server) → BillingCheckoutView (Client)               │
│  ├── BillingCheckoutProductCard (info del curso)                │
│  ├── BillingCheckoutPaymentMethods (MP / PayPal / Transfer)     │
│  ├── BillingCheckoutCouponInput (validación de cupón)           │
│  ├── BillingCheckoutSummary (precio final)                      │
│  └── BillingCheckoutActions (botones de pago)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
             ┌───────────┼───────────┐
             │           │           │
       MercadoPago    PayPal    Transfer
             │           │           │
     /api/mp/webhook  /api/paypal/ billing.bank_
             │        capture     transfer_payments
             │           │
             └─────┬─────┘
                   │
    billing.handle_payment_course_success (SQL)
                   │
         ┌─────────┼─────────┐
         │                   │
    step_payment_       step_course_
    insert_             enrollment_
    idempotent          annual
         │                   │
    billing.           academy.
    payments           course_enrollments
         │
    ┌────┴────────────────────┐
    │   TRIGGERS AUTOMÁTICOS  │
    ├── queue_purchase_email   │ → email_queue (x2)
    ├── log_payment_activity   │ → activity_logs
    ├── notify_admin           │ → campanita
    └── notify_user            │ → campanita
    └─────────────────────────┘
```
