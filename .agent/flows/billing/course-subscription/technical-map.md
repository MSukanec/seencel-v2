# Technical Map: Suscripción a Cursos

> Referencia técnica exhaustiva. No tutorial.

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
| product_type | text | — | 'course' |
| amount | numeric | — | Monto cobrado |
| currency | text | — | 'USD' / 'ARS' |
| status | text | — | 'completed' |
| gateway | text | — | Provider (duplicado) |

### `billing.mp_preferences`
| Columna | Tipo | FK | Uso |
|---------|------|----|-----|
| id | varchar(64) | PK | ID de preferencia de MP |
| user_id | uuid | — | Usuario que inicia pago |
| course_id | uuid | — | Curso a comprar |
| product_type | text | — | 'course' |
| amount | numeric | — | Monto |
| status | text | — | 'pending' → 'completed' |
| init_point | text | — | URL de redirección a MP |
| coupon_id | uuid | FK → coupons | Cupón aplicado |

### `billing.paypal_preferences`
| Columna | Tipo | FK | Uso |
|---------|------|----|-----|
| id | varchar(50) | PK | ID de preferencia |
| order_id | varchar(100) | — | PayPal Order ID |
| user_id | uuid | — | Usuario que inicia pago |
| course_id | uuid | — | Curso a comprar |
| product_type | text | — | 'course' |
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
| amount_saved | numeric | Descuento efectivo |

---

## 2. Funciones SQL

### `billing.handle_payment_course_success`
- **Tipo**: SECURITY DEFINER
- **search_path**: billing, academy, public
- **Parámetros**: p_provider, p_provider_payment_id, p_user_id, p_course_id, p_amount, p_currency, p_metadata
- **Lógica**:
  1. `pg_advisory_xact_lock` → idempotency
  2. `step_payment_insert_idempotent` → INSERT o SKIP si duplicado
  3. `step_course_enrollment_annual` → INSERT/UPSERT enrollment
  4. `step_send_purchase_email` → encola emails
- **Error handling**: EXCEPTION → `ops.log_system_error` + retorna `ok_with_warning`

### `billing.step_payment_insert_idempotent`
- **Tipo**: SECURITY INVOKER
- **Lógica**: INSERT INTO payments ON CONFLICT (provider, provider_payment_id) DO NOTHING
- **Retorna**: uuid (payment_id) o NULL si ya existía

### `academy.step_course_enrollment_annual`
- **Tipo**: SECURITY INVOKER
- **search_path**: academy, billing, public
- **Lógica**: INSERT INTO course_enrollments ON CONFLICT (user_id, course_id) DO UPDATE SET expires_at = now() + 1 year
- **⚠️ Referencia**: Todavía usa `public.course_enrollments` en vez de `academy.course_enrollments`

### `billing.step_send_purchase_email`
- **Tipo**: SECURITY DEFINER
- **Lógica**: Inserta 2 emails en `email_queue`:
  1. Para el comprador (`purchase_confirmation`)
  2. Para admin (`admin_sale_notification` → contacto@seencel.com)

### `billing.validate_coupon_universal`
- **Tipo**: SECURITY DEFINER
- **Lógica**: Valida un cupón contra un producto (curso o plan)
- **⚠️ Referencia**: Usa `public.coupons`, `public.coupon_courses`, `public.coupon_redemptions` (deberían ser `billing.*`)

### `billing.redeem_coupon_universal`
- **Tipo**: SECURITY DEFINER
- **Lógica**: Valida + registra la redención del cupón
- **⚠️ Referencia**: Usa `public.coupon_redemptions` (debería ser `billing.*`)

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

### API Routes
| Archivo | Qué hace |
|---------|----------|
| `src/app/api/mercadopago/create-preference/route.ts` | Crea preferencia de pago en MP |
| `src/app/api/mercadopago/webhook/route.ts` | Recibe webhooks de MP |
| `src/lib/mercadopago/webhook-handler.ts` | Procesa pagos aprobados de MP |
| `src/app/api/paypal/create-order/route.ts` | Crea orden de PayPal |
| `src/app/api/paypal/capture-order/route.ts` | Captura pago de PayPal |

---

## 4. SQL Scripts

> Nota: Los scripts de migración al schema `billing` ya fueron ejecutados.

| Archivo | Qué hace | Estado |
|---------|----------|--------|
| Scripts de migración `billing` | Migración de tablas de `public` a `billing` | ✅ Ejecutado |
| Scripts de migración `academy` | Migración de tablas de `public` a `academy` | ✅ Ejecutado |

---

## 5. Cadena de datos completa

```
auth.uid()
    ↓
iam.users (auth_id → id)
    ↓ users.id
checkout page.tsx (server fetch)
    ↓
[usuario elige "Comprar"]
    ↓
billing.mp_preferences (INSERT con user_id, course_id)
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
    ├── academy.step_course_enrollment_annual()
    │   └── UPSERT academy.course_enrollments
    └── billing.step_send_purchase_email()
        └── INSERT email_queue (x2)
```
