# Technical Map: Plan Subscription

> Referencia técnica exhaustiva. Actualizada 2026-02-22.

---

## 1. Tablas involucradas

### `billing.plans`
| Columna | Tipo | FK | Uso |
|---------|------|----|-----|
| id | uuid | PK | Identificador del plan |
| slug | text | UNIQUE | URL-friendly name (`starter`, `pro`, `teams`) |
| name | text | — | Nombre visible |
| monthly_amount | numeric | — | Precio mensual en USD |
| annual_amount | numeric | — | Precio anual en USD |
| features | jsonb | — | Features del plan (`seats_included`, `max_members`, etc.) |
| is_active | bool | — | Si está visible para compra |

### `billing.organization_subscriptions`
| Columna | Tipo | FK | Uso |
|---------|------|----|-----|
| id | uuid | PK | — |
| organization_id | uuid | FK → iam.organizations | Organización suscrita |
| plan_id | uuid | FK → plans | Plan activo |
| billing_period | text | — | `'monthly'` / `'annual'` |
| payment_id | uuid | FK → payments | Pago que originó la suscripción |
| status | text | — | `'active'` / `'expired'` |
| amount | numeric | — | Monto pagado |
| currency | text | — | `'USD'` / `'ARS'` |
| expires_at | timestamptz | — | Fecha de vencimiento |
| created_at | timestamptz | — | Fecha de creación |

### `billing.payments`
| Columna | Tipo | FK | Uso |
|---------|------|----|-----|
| id | uuid | PK | — |
| provider | text | UNIQUE(combo) | `'mercadopago'` / `'paypal'` / `'coupon'` / `'bank_transfer'` |
| provider_payment_id | text | UNIQUE(combo) | ID del pago en la pasarela |
| user_id | uuid | — | Quién pagó |
| organization_id | uuid | — | Organización beneficiada |
| product_type | text | — | `'subscription'` / `'upgrade'` |
| product_id | uuid | — | `plan_id` del plan comprado |
| amount | numeric | — | Monto cobrado |
| currency | text | — | `'USD'` / `'ARS'` |
| status | text | — | `'completed'` |
| metadata | jsonb | — | Metadata enriquecida (`product_name`, `billing_period`, etc.) |

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
| organization_id | uuid | — | Organización beneficiada |
| plan_id | uuid | — | Plan a suscribir |
| product_type | text | — | `'subscription'` |
| billing_period | text | — | `'monthly'` / `'annual'` |
| amount | numeric | — | Monto en ARS |
| status | text | — | `'pending'` → `'completed'` |
| init_point | text | — | URL de MP |
| coupon_id | uuid | — | Cupón aplicado |
| coupon_code | text | — | Código del cupón (para redemption post-pago) |

### `billing.paypal_preferences`
| Columna | Tipo | FK | Uso |
|---------|------|----|-----|
| id | varchar(50) | PK | ID de preferencia |
| order_id | varchar(100) | — | PayPal Order ID |
| user_id | uuid | — | Usuario que inicia pago |
| organization_id | uuid | — | Organización beneficiada |
| plan_id | uuid | — | Plan a suscribir |
| product_type | text | — | `'subscription'` |
| billing_period | text | — | `'monthly'` / `'annual'` |
| amount | numeric | — | Monto en USD |
| status | text | — | `'pending'` → `'completed'` |

### `billing.bank_transfer_payments`
| Columna | Tipo | FK | Uso |
|---------|------|----|-----|
| id | uuid | PK | — |
| order_id | text | UNIQUE | UUID generado internamente |
| user_id | uuid | — | Quién pagó |
| plan_id | uuid | — | Plan a suscribir |
| organization_id | uuid | — | Organización beneficiada |
| billing_period | text | — | `'monthly'` / `'annual'` |
| amount | numeric | — | Monto pagado |
| currency | text | — | Moneda |
| payer_name | text | — | Nombre del pagador |
| receipt_url | text | — | URL del comprobante |
| status | text | — | `'pending'` / `'approved'` / `'rejected'` |

### `billing.payment_events`
| Columna | Tipo | Uso |
|---------|------|-----|
| id | uuid | PK |
| provider | text | `'mercadopago'` / `'paypal'` |
| provider_event_id | text | ID del evento |
| raw_payload | jsonb | Payload completo del webhook |
| status | text | `'RECEIVED'` → `'PROCESSED'` |

### `billing.coupons`
| Columna | Tipo | Uso |
|---------|------|-----|
| id | uuid | PK |
| code | text | Código único (lower) |
| type | coupon_type_t | `'percent'` / `'fixed'` |
| amount | numeric | Valor del descuento |
| applies_to | text | `'subscriptions'` / `'all'` |

### `billing.founders_members`
| Columna | Tipo | Uso |
|---------|------|-----|
| user_id | uuid | Usuario founder |
| organization_id | uuid | Organización |
> Registra usuarios en el programa founders (solo suscripciones anuales).

---

## 2. Funciones SQL (billing)

### Handler principal

#### `billing.handle_payment_subscription_success`
- **Tipo**: SECURITY DEFINER
- **Parámetros**: `p_provider`, `p_provider_payment_id`, `p_user_id`, `p_organization_id`, `p_plan_id`, `p_billing_period`, `p_amount`, `p_currency`, `p_metadata`, **`p_is_upgrade`** (default `false`)
- **Lógica**:
  1. `pg_advisory_xact_lock` → idempotency
  2. Determina `product_type` ('subscription' o 'upgrade')
  3. Pre-fetch nombre del plan → enriquece metadata con `product_name`
  4. Si upgrade: fetch `previous_plan_id` y `previous_plan_name`
  5. `step_payment_insert_idempotent` → INSERT o SKIP
  6. `step_subscription_expire_previous` → marca subs anteriores como expired
  7. `step_subscription_create_active` → crea suscripción activa
  8. `step_organization_set_plan` → actualiza `iam.organizations.plan_id`
  9. Si annual: `step_apply_founders_program` → registra en founders
- **Error handling**: EXCEPTION → `ops.log_system_error` + retorna `ok_with_warning`

#### `billing.handle_payment_upgrade_success`
- **Tipo**: SECURITY DEFINER (wrapper)
- **Lógica**: Llama a `handle_payment_subscription_success` con `p_is_upgrade = true`

### Steps auxiliares (5 funciones)

#### `billing.step_payment_insert_idempotent`
- **Tipo**: SECURITY INVOKER
- **Lógica**: INSERT INTO payments ON CONFLICT (provider, provider_payment_id) DO NOTHING
- **Retorna**: uuid (payment_id) o NULL si ya existía

#### `billing.step_subscription_expire_previous`
- **Tipo**: SECURITY INVOKER
- **Lógica**: UPDATE `organization_subscriptions` SET status='expired' WHERE org_id y status='active'

#### `billing.step_subscription_create_active`
- **Tipo**: SECURITY INVOKER
- **Lógica**: INSERT suscripción activa con `expires_at` calculado (1 año o 1 mes según `billing_period`)
- **Retorna**: uuid (subscription_id)

#### `billing.step_organization_set_plan`
- **Tipo**: SECURITY INVOKER
- **Lógica**: UPDATE `iam.organizations` SET `plan_id` = nuevo plan

#### `billing.step_apply_founders_program`
- **Tipo**: SECURITY INVOKER
- **Lógica**: INSERT en `founders_members` (solo si annual)

### Cupones (2 funciones)

#### `billing.validate_coupon_universal`
- **Tipo**: SECURITY DEFINER
- **Lógica**: Valida un cupón contra un producto (plan), verificando elegibilidad, límites, y calculando descuento

#### `billing.redeem_coupon_universal`
- **Tipo**: SECURITY DEFINER
- **Lógica**: Valida + registra la redención del cupón
- **Nota**: Llamada universalmente por webhooks MP, PayPal capture, y `activateFreeSubscription`

---

## 3. Archivos Frontend

### Queries
| Archivo | Funciones | Schema |
|---------|-----------|--------|
| `src/features/billing/queries.ts` | `getBillingProfile()` | billing |
| `src/features/billing/queries.ts` | `getExchangeRate()` | public |
| `src/features/billing/queries.ts` | `getUserCountryCode()` | iam |
| `src/features/billing/queries.ts` | `getUpgradeProration()` | billing |
| `src/actions/plans.ts` | `getPlans()` | billing |

### Actions
| Archivo | Funciones | RPC |
|---------|-----------|-----|
| `src/features/billing/actions.ts` | `validateCoupon()` | `validate_coupon_universal` |
| `src/features/billing/actions.ts` | `activateFreeSubscription()` | `redeem_coupon_universal` + `handle_payment_subscription_success` |
| `src/features/billing/actions.ts` | `updateBillingProfile()` | — (direct query) |
| `src/features/billing/payments/actions/bank-transfer-actions.ts` | `createBankTransferPayment()` | `handle_payment_subscription_success` (directo) |
| `src/features/billing/payments/actions/bank-transfer-actions.ts` | `uploadTransferReceipt()` | — (storage) |

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
| `src/features/billing/components/checkout/billing-checkout-product-card.tsx` | Card del producto (plan) |
| `src/features/billing/components/checkout/billing-checkout-payment-methods.tsx` | Selector MP/PayPal/Transfer |
| `src/features/billing/components/checkout/billing-checkout-summary.tsx` | Resumen de compra |
| `src/features/billing/components/checkout/billing-checkout-actions.tsx` | Botones de pago |
| `src/features/billing/components/checkout/billing-checkout-coupon-input.tsx` | Input de cupón |
| `src/features/billing/components/checkout/billing-checkout-invoice-form.tsx` | Datos de facturación |
| `src/features/billing/components/checkout/billing-checkout-terms.tsx` | Términos y condiciones |
| `src/features/billing/components/plans-comparison.tsx` | Tabla comparativa de planes |

### Hooks
| Archivo | Qué hace |
|---------|----------|
| `src/features/billing/hooks/use-checkout.ts` | Hook central del checkout (estado, computed, actions) |

### Types
| Archivo | Tipos |
|---------|-------|
| `src/features/billing/types/checkout.ts` | ProductType, BillingCycle, CheckoutState, CheckoutSeats, CheckoutUpgrade, etc. |

### Pages
| Archivo | Qué fetchea |
|---------|-------------|
| `src/app/[locale]/(dashboard)/checkout/page.tsx` | Planes, billing profile, exchange rate, feature flags, orgs |
| `src/app/[locale]/(dashboard)/checkout/success/page.tsx` | Datos de confirmación |
| `src/app/[locale]/(dashboard)/checkout/failure/page.tsx` | Datos de error |
| `src/app/[locale]/(dashboard)/checkout/pending/page.tsx` | Datos de pendiente |

### API Routes (Webhooks & Payment)
| Archivo | Qué hace |
|---------|----------|
| `src/app/api/mercadopago/preference/route.ts` | Crea preferencia de pago en MP (subscription) |
| `src/app/api/mercadopago/webhook/route.ts` | Recibe webhooks de MP |
| `src/lib/mercadopago/webhook-handler.ts` | Procesa pagos → dispatch al handler correcto |
| `src/app/api/paypal/create-order/route.ts` | Crea orden de PayPal |
| `src/app/api/paypal/capture-order/route.ts` | Captura pago de PayPal → handler correcto |

---

## 4. Cadena de datos completa

### Suscripción Nueva (MercadoPago)
```
auth.uid()
    ↓
iam.users (auth_id → id)
    ↓ users.id
checkout page.tsx (server fetch: plans, billing_profile, exchange_rate)
    ↓
[usuario elige plan + ciclo → "Pagar con MP"]
    ↓
/api/mercadopago/preference (POST)
    ├── Resuelve users.id interno (NO auth_id)
    ├── Construye external_reference: subscription|userId|orgId|planId|annual|couponCode|isTest|x|x
    └── INSERT billing.mp_preferences (status: 'pending')
    ↓
MercadoPago API (externo — redirect a pasarela)
    ↓
MP Webhook POST → /api/mercadopago/webhook
    ↓
handlePaymentEvent() → parsea external_reference → productType='subscription'
    ↓
RPC: billing.handle_payment_subscription_success()
    ├── billing.step_payment_insert_idempotent()
    │   └── INSERT billing.payments (status='completed')
    │       └── TRIGGERS AUTOMÁTICOS:
    │           ├── notifications.queue_purchase_email() → email_queue (x2)
    │           ├── audit.log_payment_activity() → activity_logs
    │           ├── notifications.notify_admin_on_payment() → campanita admin
    │           └── notifications.notify_user_payment_completed() → campanita user
    ├── billing.step_subscription_expire_previous()
    │   └── UPDATE billing.organization_subscriptions SET status='expired'
    ├── billing.step_subscription_create_active()
    │   └── INSERT billing.organization_subscriptions (status='active', expires_at)
    ├── billing.step_organization_set_plan()
    │   └── UPDATE iam.organizations SET plan_id
    └── billing.step_apply_founders_program() (si annual)
        └── INSERT billing.founders_members
    ↓
[Si hay cupón] → redeem_coupon_universal
```

### Upgrade (MercadoPago)
```
handlePaymentEvent() → productType='upgrade'
    ↓
RPC: billing.handle_payment_upgrade_success()
    └── → handle_payment_subscription_success(p_is_upgrade=true)
        ├── Enriquece metadata con previous_plan_id/name
        └── [mismos steps que nueva suscripción]
```

### Activación Gratuita (Cupón 100%)
```
activateFreeSubscription()
    ├── redeem_coupon_universal (marca cupón como usado)
    └── handle_payment_subscription_success(provider='coupon', amount=0)
```

### Transferencia Bancaria
```
createBankTransferPayment()
    ├── INSERT billing.bank_transfer_payments (status='pending')
    ├── handle_payment_subscription_success(provider='bank_transfer') [optimista]
    └── notifications.queue_email_bank_transfer()
```
