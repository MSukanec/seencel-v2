# Technical Map: Billing (Courses + Subscriptions + Seats + Upgrades)

> Referencia técnica exhaustiva. Actualizada 2026-02-21.

---

## 1. Tablas involucradas

### `academy.courses`
| Columna | Tipo | FK | Uso |
|---------|------|----|-----|
| id | uuid | PK | Identificador del curso |
| slug | text | UNIQUE | URL-friendly name |
| title | text | — | Nombre visible |
| price | numeric | — | Precio en USD |
| status | text | — | 'available' / 'hidden' |
| is_active | bool | — | Si está publicado |

### `academy.course_enrollments`
| Columna | Tipo | FK | Uso |
|---------|------|----|-----|
| id | uuid | PK | — |
| user_id | uuid | UNIQUE(combo) | Usuario inscrito |
| course_id | uuid | FK → courses | Curso inscrito |
| status | text | — | 'active' / 'expired' |
| expires_at | timestamptz | — | Cuándo vence (1 año) |

### `billing.payments`
| Columna | Tipo | FK | Uso |
|---------|------|----|-----|
| id | uuid | PK | — |
| provider | text | UNIQUE(combo) | 'mercadopago' / 'paypal' / 'coupon' |
| provider_payment_id | text | UNIQUE(combo) | ID del pago en la pasarela |
| user_id | uuid | — | Quién pagó |
| course_id | uuid | — | Curso comprado |
| product_type | text | — | 'course' / 'subscription' / 'upgrade' / 'seat_purchase' |
| amount | numeric | — | Monto cobrado |
| currency | text | — | 'USD' / 'ARS' |
| status | text | — | 'completed' |
| metadata | jsonb | — | Metadata enriquecida (product_name, etc.) |

**Triggers en `billing.payments`** (disparan automáticamente al INSERT con status='completed'):
| Trigger | Función | Qué hace |
|---------|---------|----------|
| `trg_queue_purchase_email` | `notifications.queue_purchase_email()` | Encola emails al comprador + admin |
| `trg_log_payment_activity` | `audit.log_payment_activity()` | Registra en `organization_activity_logs` |
| `trg_notify_admin_payment` | `notifications.notify_admin_on_payment()` | Campanita admin |
| `trg_notify_user_payment` | `notifications.notify_user_payment_completed()` | Campanita usuario |

### `billing.mp_preferences`
| Columna | Tipo | FK | Uso |
|---------|------|----|-----|
| id | varchar(64) | PK | ID de preferencia de MP |
| user_id | uuid | — | Usuario que inicia pago |
| course_id | uuid | — | Curso a comprar |
| product_type | text | — | 'course' / 'subscription' / 'upgrade' / 'seats' |
| amount | numeric | — | Monto |
| status | text | — | 'pending' → 'completed' |
| init_point | text | — | URL de redirección a MP |
| coupon_id | uuid | FK → coupons | Cupón aplicado |
| coupon_code | text | — | Código del cupón (para redemption post-pago) |

### `billing.paypal_preferences`
| Columna | Tipo | FK | Uso |
|---------|------|----|-----|
| id | varchar(50) | PK | ID de preferencia |
| order_id | varchar(100) | — | PayPal Order ID |
| user_id | uuid | — | Usuario que inicia pago |
| course_id | uuid | — | Curso a comprar |
| product_type | text | — | 'course' / 'subscription' / 'upgrade' / 'seats' |
| amount | numeric | — | Monto |
| status | text | — | 'pending' → 'completed' |

### `billing.payment_events`
| Columna | Tipo | Uso |
|---------|------|-----|
| id | uuid | PK |
| provider | text | 'mercadopago' / 'paypal' |
| provider_event_id | text | ID del evento |
| raw_payload | jsonb | Payload completo del webhook |
| status | text | 'RECEIVED' → 'PROCESSED' |

### `billing.coupons`
| Columna | Tipo | Uso |
|---------|------|-----|
| id | uuid | PK |
| code | text | Código del cupón (unique, lower) |
| type | coupon_type_t | 'percent' / 'fixed' |
| amount | numeric | Valor del descuento |
| applies_to | text | 'courses' / 'subscriptions' / 'all' |
| applies_to_all | bool | Si aplica a todos los cursos |

### `billing.coupon_courses`
| Columna | Tipo | Uso |
|---------|------|-----|
| coupon_id | uuid | FK → coupons |
| course_id | uuid | Curso específico |
> Tabla de relación para cupones que aplican a cursos específicos.

### `billing.coupon_redemptions`
| Columna | Tipo | Uso |
|---------|------|-----|
| coupon_id | uuid | FK → coupons |
| user_id | uuid | Quién usó el cupón |
| course_id | uuid | Curso donde se usó |
| plan_id | uuid | Plan donde se usó |
| amount_saved | numeric | Descuento efectivo |

---

## 2. Funciones SQL (billing: 11 funciones)

### Handlers (4 funciones — patrón `handle_payment_{product}_success`)

#### `billing.handle_payment_course_success`
- **Tipo**: SECURITY DEFINER
- **Parámetros**: p_provider, p_provider_payment_id, p_user_id, p_course_id, p_amount, p_currency, p_metadata
- **Lógica**:
  1. `pg_advisory_xact_lock` → idempotency
  2. Pre-fetch nombre del curso → enriquece metadata
  3. `step_payment_insert_idempotent` → INSERT o SKIP si duplicado
  4. `step_course_enrollment_annual` → INSERT/UPSERT enrollment
  5. ~~`step_send_purchase_email`~~ → **ELIMINADO** (ahora es trigger automático)
- **Error handling**: EXCEPTION → `ops.log_system_error` + retorna `ok_with_warning`

#### `billing.handle_payment_subscription_success`
- **Tipo**: SECURITY DEFINER
- **Parámetros**: p_provider, p_provider_payment_id, p_user_id, p_organization_id, p_plan_id, p_billing_period, p_amount, p_currency, p_metadata, **p_is_upgrade** (bool, default false)
- **Lógica**:
  1. Idempotency lock
  2. Pre-fetch plan name + previous plan (si upgrade)
  3. Enriquece metadata con product_name
  4. `step_payment_insert_idempotent`
  5. `step_subscription_expire_previous`
  6. `step_subscription_create_active`
  7. `step_organization_set_plan`
  8. `step_apply_founders_program` (si annual)
- **Nota**: Función unificada para suscripciones nuevas Y upgrades via flag `p_is_upgrade`

#### `billing.handle_payment_upgrade_success`
- **Tipo**: SECURITY DEFINER (wrapper)
- **Lógica**: Llama a `handle_payment_subscription_success` con `p_is_upgrade = true`

#### `billing.handle_payment_seat_success`
- **Tipo**: SECURITY DEFINER
- **Parámetros**: p_provider, p_provider_payment_id, p_user_id, p_organization_id, p_plan_id, p_seats_purchased, p_amount, p_currency, p_metadata
- **Lógica**:
  1. Idempotency lock
  2. Enriquece metadata
  3. `step_payment_insert_idempotent`
  4. `iam.step_organization_increment_seats`

### Steps (5 funciones auxiliares)

#### `billing.step_payment_insert_idempotent`
- **Tipo**: SECURITY INVOKER
- **Lógica**: INSERT INTO payments ON CONFLICT (provider, provider_payment_id) DO NOTHING
- **Retorna**: uuid (payment_id) o NULL si ya existía
- **Usado por**: Los 4 handlers

#### `billing.step_subscription_create_active`
- **Tipo**: SECURITY INVOKER
- **Lógica**: INSERT suscripción activa con expires_at calculado
- **Usado por**: `handle_payment_subscription_success` + `bank-transfer-actions.ts` (directo)

#### `billing.step_subscription_expire_previous`
- **Tipo**: SECURITY INVOKER
- **Lógica**: UPDATE suscripciones → expired
- **Usado por**: `handle_payment_subscription_success` + `bank-transfer-actions.ts` (directo)

#### `billing.step_organization_set_plan`
- **Tipo**: SECURITY INVOKER
- **Lógica**: UPDATE iam.organizations SET plan_id
- **Usado por**: `handle_payment_subscription_success` + `bank-transfer-actions.ts` (directo)

#### `billing.step_apply_founders_program`
- **Tipo**: SECURITY INVOKER
- **Lógica**: Aplica programa founders
- **Usado por**: `handle_payment_subscription_success` + `bank-transfer-actions.ts` (directo)

### Cupones (2 funciones)

#### `billing.validate_coupon_universal`
- **Tipo**: SECURITY DEFINER
- **Lógica**: Valida un cupón contra un producto (curso o plan)

#### `billing.redeem_coupon_universal`
- **Tipo**: SECURITY DEFINER
- **Lógica**: Valida + registra la redención del cupón
- **Nota**: El webhook de MP y PayPal capture lo llaman UNIVERSALMENTE para cursos, suscripciones y upgrades

### Funciones eliminadas (ya no existen)
| Función eliminada | Reemplazada por |
|-------------------|-----------------|
| `step_send_purchase_email` | Trigger `notifications.queue_purchase_email()` |
| `step_log_seat_purchase_event` | Trigger `audit.log_payment_activity()` |
| `handle_member_seat_purchase` | Renombrada → `handle_payment_seat_success` |
| `handle_upgrade_subscription_success` | Renombrada → `handle_payment_upgrade_success` |

---

## 3. Archivos Frontend

### Queries
| Archivo | Funciones | Schema |
|---------|-----------|--------|
| `src/features/billing/queries.ts` | `getBillingProfile()` | billing |
| `src/features/billing/queries.ts` | `getExchangeRate()` | public |
| `src/features/billing/queries.ts` | `getUserCountryCode()` | iam |

### Actions
| Archivo | Funciones | RPC |
|---------|-----------|-----|
| `src/features/billing/actions.ts` | `validateCoupon()` | `validate_coupon_universal` |
| `src/features/billing/actions.ts` | `activateFreeSubscription()` | `redeem_coupon_universal` + `handle_payment_subscription_success` |
| `src/features/billing/actions.ts` | `updateBillingProfile()` | — (direct query) |

### Views
| Archivo | Qué muestra |
|---------|-------------|
| `src/features/billing/views/billing-checkout-view.tsx` | Checkout principal (grid 2 cols) |
| `src/features/billing/views/billing-checkout-success-view.tsx` | Página de éxito post-pago |
| `src/features/billing/views/billing-checkout-failure-view.tsx` | Página de error de pago |
| `src/features/billing/views/billing-checkout-pending-view.tsx` | Página de pago pendiente |

### Components
| Archivo | Qué hace |
|---------|----------|
| `src/features/billing/components/checkout/billing-checkout-product-card.tsx` | Card del producto (curso/plan) |
| `src/features/billing/components/checkout/billing-checkout-payment-methods.tsx` | Selector MP/PayPal/Transfer |
| `src/features/billing/components/checkout/billing-checkout-summary.tsx` | Resumen de compra |
| `src/features/billing/components/checkout/billing-checkout-actions.tsx` | Botones de pago |
| `src/features/billing/components/checkout/billing-checkout-coupon-input.tsx` | Input de cupón |
| `src/features/billing/components/checkout/billing-checkout-invoice-form.tsx` | Datos de facturación |
| `src/features/billing/components/checkout/billing-checkout-terms.tsx` | Términos y condiciones |

### Hooks
| Archivo | Qué hace |
|---------|----------|
| `src/features/billing/hooks/use-checkout.ts` | Hook central del checkout (estado, computed, actions) |

### Types
| Archivo | Tipos |
|---------|-------|
| `src/features/billing/types/checkout.ts` | ProductType, BillingCycle, CheckoutState, CheckoutViewProps, etc. |

### Pages
| Archivo | Qué fetchea |
|---------|-------------|
| `src/app/[locale]/(dashboard)/checkout/page.tsx` | Curso, planes, billing profile, exchange rate, feature flags |
| `src/app/[locale]/(dashboard)/checkout/success/page.tsx` | Datos de confirmación |
| `src/app/[locale]/(dashboard)/checkout/failure/page.tsx` | Datos de error |
| `src/app/[locale]/(dashboard)/checkout/pending/page.tsx` | Datos de pendiente |

### API Routes (Webhooks & Payment)
| Archivo | Qué hace |
|---------|----------|
| `src/app/api/mercadopago/create-preference/route.ts` | Crea preferencia de pago en MP |
| `src/app/api/mercadopago/webhook/route.ts` | Recibe webhooks de MP |
| `src/lib/mercadopago/webhook-handler.ts` | Procesa pagos aprobados de MP → RPC al handler correcto |
| `src/app/api/paypal/create-order/route.ts` | Crea orden de PayPal |
| `src/app/api/paypal/capture-order/route.ts` | Captura pago de PayPal → RPC al handler correcto |

### Bank Transfers
| Archivo | Qué hace |
|---------|----------|
| `src/features/billing/payments/actions/bank-transfer-actions.ts` | Crea pago bancario con activación optimista |

### Team (Seats)
| Archivo | Qué hace |
|---------|----------|
| `src/features/team/actions.ts` → `purchaseMemberSeats()` | RPC `handle_payment_seat_success` |

---

## 4. Cadena de datos completa

### Curso (MercadoPago)
```
auth.uid()
    ↓
iam.users (auth_id → id)
    ↓ users.id
checkout page.tsx (server fetch)
    ↓
[usuario elige "Comprar" → MP]
    ↓
billing.mp_preferences (INSERT con user_id, course_id, coupon_code)
    ↓
MercadoPago API (externo)
    ↓
MP Webhook POST → /api/mercadopago/webhook
    ↓
handlePaymentEvent() → parsea external_reference
    ↓
RPC: billing.handle_payment_course_success()
    ├── billing.step_payment_insert_idempotent()
    │   └── INSERT billing.payments
    │       └── TRIGGERS AUTOMÁTICOS:
    │           ├── notifications.queue_purchase_email() → email_queue (x2)
    │           ├── audit.log_payment_activity() → activity_logs
    │           ├── notifications.notify_admin_on_payment() → campanita admin
    │           └── notifications.notify_user_payment_completed() → campanita user
    └── academy.step_course_enrollment_annual()
        └── UPSERT academy.course_enrollments
    ↓
[Si hay cupón] → redeem_coupon_universal (universal: cursos + subs + upgrades)
```

### Suscripción / Upgrade (MercadoPago)
```
handlePaymentEvent() → parsea external_reference
    ↓
RPC: billing.handle_payment_subscription_success(p_is_upgrade=false|true)
    ├── billing.step_payment_insert_idempotent() → triggers automáticos
    ├── billing.step_subscription_expire_previous()
    ├── billing.step_subscription_create_active()
    ├── billing.step_organization_set_plan()
    └── billing.step_apply_founders_program() (si annual)
    ↓
[Si hay cupón] → redeem_coupon_universal
```

### Seats (MercadoPago)
```
handlePaymentEvent() → parsea external_reference
    ↓
RPC: billing.handle_payment_seat_success()
    ├── billing.step_payment_insert_idempotent() → triggers automáticos
    └── iam.step_organization_increment_seats()
    ↓
[Si hay cupón] → redeem_coupon_universal
```
