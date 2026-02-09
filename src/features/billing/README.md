# SEENCEL Billing System

Documentación completa del sistema de facturación y pagos de SEENCEL.

---

## 📊 Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CHECKOUT VIEW                                   │
│                    (Cursos + Suscripciones)                             │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
    ┌───────────┐      ┌───────────┐      ┌───────────┐
    │  PayPal   │      │MercadoPago│      │Transferen.│
    │  (USD)    │      │   (ARS)   │      │ Bancaria  │
    └─────┬─────┘      └─────┬─────┘      └─────┬─────┘
          │                  │                  │
          ▼                  ▼                  ▼
    ┌─────────────────────────────────────────────────┐
    │              WEBHOOKS / API ROUTES              │
    └─────────────────────────┬───────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────┐
    │             SQL FUNCTIONS (SUPABASE)            │
    │  • handle_payment_course_success                │
    │  • handle_payment_subscription_success          │
    │  • handle_upgrade_subscription_success          │
    │  • handle_member_seat_purchase                  │
    │  • validate_coupon_universal                    │
    └─────────────────────────┬───────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌───────────┐       ┌───────────┐       ┌───────────┐
    │ payments  │       │enrollment │       │subscription│
    │  (tabla)  │       │  (tabla)  │       │   (tabla)  │
    └───────────┘       └───────────┘       └───────────┘
```

---

## 📁 Estructura del Feature

```
src/features/billing/
├── README.md                    # ← ESTE ARCHIVO
├── TABLES.md                    # Schemas SQL de tablas
├── HANDLE_FUNCTIONS.md          # Funciones SQL de handle_payment_*
├── SUSCRIPTIONS_FUNCTIONS.md    # Funciones SQL de suscripciones
├── ENROLLMENT_FUNCTIONS.md      # Funciones SQL de enrollment
├── COUPON_FUNCTIONS.md          # Funciones SQL de cupones
├── views/
│   └── billing-checkout-*.tsx   # Vistas de checkout (success, pending, failure)
├── components/
│   └── checkout/                # Componentes de checkout UI
├── hooks/
│   └── use-checkout.ts          # Hook principal de checkout
├── actions/
│   └── ...                      # Server Actions
├── queries/
│   └── ...                      # Queries de datos
└── types/
    └── checkout.ts              # Tipos de checkout
```

---

## 🗄️ Tablas de Base de Datos

### Core Tables

| Tabla | Propósito |
|-------|-----------|
| `users` | Usuarios de la plataforma |
| `organizations` | Empresas/cuentas (con `plan_id` y `settings.is_founder`) |
| `organization_members` | Miembros por org (con `is_billable` para seats) |
| `plans` | Planes disponibles (FREE/PRO/TEAMS) |

### Billing Tables

| Tabla | Propósito |
|-------|-----------|
| `organization_subscriptions` | Suscripciones activas |
| `organization_billing_cycles` | Períodos de cobro |
| `organization_member_events` | Auditoría de cambios de seats |

### Payment Tables

| Tabla | Propósito |
|-------|-----------|
| `payments` | Pagos completados |
| `payment_events` | Webhooks recibidos (audit trail de todos los providers) |
| `bank_transfer_payments` | Pagos por transferencia (aprobación manual) |

### Gateway Preferences

| Tabla | Propósito |
|-------|-----------|
| `mp_preferences` | Preferencias de checkout MercadoPago |
| `paypal_preferences` | Preferencias de checkout PayPal |

### Coupon Tables

| Tabla | Propósito |
|-------|-----------|
| `coupons` | Cupones disponibles |
| `coupon_redemptions` | Canjes de cupones |
| `coupon_courses` | Cupones → Cursos específicos |
| `coupon_plans` | Cupones → Planes específicos |

### Support Tables

| Tabla | Propósito |
|-------|-----------|
| `course_enrollments` | Enrollments a cursos |
| `exchange_rates` | Tasas USD→ARS |
| `organization_invitations` | Invitaciones a orgs (Teams) |

---

## 🌐 Gateways de Pago

### ✅ PayPal (IMPLEMENTADO)
- **Región:** Internacional (USD)
- **Tipos:** Cursos, Suscripciones, Seats, Upgrades
- **Modo:** Sandbox + Producción

### ✅ MercadoPago (IMPLEMENTADO)
- **Región:** Argentina (ARS)
- **Tipos:** Cursos, Suscripciones, Seats, Upgrades
- **Modo:** Checkout Pro (redirect) — Sandbox + Producción
- **Credenciales:** Dual mode via feature flag `mp_enabled`

### ✅ Transferencia Bancaria (IMPLEMENTADO)
- **Región:** Argentina (ARS)
- **Tipos:** Cursos, Suscripciones
- **Modo:** Aprobación manual por admin
- **Descuento:** 5% automático

---

## 🔌 Arquitectura MercadoPago

### Archivos involucrados

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/lib/mercadopago/client.ts` | Cliente MP dual (sandbox/prod), validación de firma |
| `src/app/api/mercadopago/preference/route.ts` | Crea preferencia de pago (checkout redirect) |
| `src/app/api/mercadopago/webhook/route.ts` | Recibe notificaciones de pago (IPN + V2) |
| `src/lib/mercadopago/webhook-handler.ts` | Procesa pagos aprobados → despacha a RPCs de DB |
| `src/app/api/mercadopago/payment-status/route.ts` | Polling de estado de pago (para pending) |

### Flujo completo de un pago

```
1. Usuario elige MercadoPago en checkout
       │
       ▼
2. Frontend → POST /api/mercadopago/preference
   - Autenticación del usuario
   - Resolución de users.id interno (⚠️ NUNCA auth_id)
   - Construcción del external_reference (pipe-delimited)
   - Creación de preferencia en MP API
   - Guardado en mp_preferences (audit)
   - Retorna init_point (URL de checkout MP)
       │
       ▼
3. Usuario redirigido a MercadoPago → Paga
       │
       ▼
4. MP envía webhook → POST /api/mercadopago/webhook
   - Detección de formato (IPN vs V2)
   - Log raw en payment_events (audit)
   - Validación de firma (x-signature HMAC)
   - Despacho a handlePaymentEvent()
       │
       ▼
5. webhook-handler.ts procesa el pago
   - Fetch del pago desde MP API
   - Solo procesa status === 'approved'
   - Parsea external_reference → userId, productType, etc.
   - Despacha al RPC SQL correspondiente
       │
       ▼
6. SQL function ejecuta la lógica de negocio
   - Idempotencia (advisory lock)
   - Registro de pago
   - Enrollment/Suscripción/Upgrade/Seats
   - Email de confirmación
```

### `external_reference` — Formato de datos

MercadoPago **NO persiste metadata** de la preferencia al pago. Los datos se transportan
via `external_reference` (string, máximo 256 caracteres, pipe-delimited):

```
productType|userId|orgId|productId|billingPeriod|couponCode|isTest|seatsQty|prorationCredit
    [0]      [1]    [2]    [3]        [4]          [5]      [6]     [7]          [8]
```

| Índice | Campo | Valores posibles |
|--------|-------|-----------------|
| `[0]` | productType | `subscription`, `course`, `seats`, `upgrade` |
| `[1]` | userId | `users.id` (UUID interno, **NUNCA auth_id**) |
| `[2]` | orgId | UUID de organización o `x` |
| `[3]` | productId | `plan_id` o `course_id` o `x` |
| `[4]` | billingPeriod | `monthly`, `annual` o `x` |
| `[5]` | couponCode | Código de cupón o `x` |
| `[6]` | isTest | `1` (sandbox) o `0` (producción) |
| `[7]` | seatsQty | Cantidad de seats o `x` |
| `[8]` | prorationCredit | Crédito de prorrateo o `x` |

> ⚠️ **REGLA CRÍTICA**: El campo `userId` SIEMPRE es `users.id` (interno).
> NUNCA se usa `auth_id` en ningún dato que salga del sistema.
> La resolución `auth_id → users.id` se hace una sola vez al crear la preferencia.

### Webhook: Dual Format (IPN + V2)

MercadoPago envía notificaciones en dos formatos:

| Formato | Detección | Origen |
|---------|-----------|--------|
| **IPN** (legacy) | Query params: `?id=X&topic=payment` | Pagos reales de producción |
| **V2** (nuevo) | JSON body: `{ type: "payment", data: { id: "X" } }` | Simulaciones y algunos eventos |

El webhook handler soporta ambos formatos automáticamente.

### Validación de firma

La firma se valida con HMAC-SHA256 usando el webhook secret:

```
manifest = "id:{dataId};request-id:{xRequestId};ts:{timestamp};"
hmac = HMAC-SHA256(secret, manifest)
valid = (hmac === v1 from x-signature header)
```

El webhook secret es diferente para sandbox y producción.

### RPCs SQL despacho

| productType | RPC SQL |
|-------------|---------|
| `course` | `handle_payment_course_success` |
| `subscription` | `handle_payment_subscription_success` |
| `upgrade` | `handle_upgrade_subscription_success` |
| `seats` | `handle_member_seat_purchase` |

Todas las RPCs reciben `p_user_id` como `users.id` interno y ejecutan:
1. Idempotencia (advisory lock por provider + payment_id)
2. Registro en tabla `payments`
3. Lógica de negocio específica
4. Email de confirmación

---

## 💰 Flujo de Precios

### USD-Base Model
Los precios se definen en USD en la tabla `plans`:
- `monthly_amount` = precio mensual USD
- `annual_amount` = precio anual USD

### Conversión a ARS
Para checkout argentino (MercadoPago / Transferencia):
```
precio_ars = precio_usd × exchange_rate
```
La tasa se obtiene de `exchange_rates` (USD→ARS).

### Descuento por Transferencia
Las transferencias tienen 5% de descuento:
```
precio_final = precio_ars × 0.95
```

---

## 🎟️ Sistema de Cupones

### Tipos de Cupón
- `percentage`: Descuento porcentual (ej: 20%)
- `fixed`: Monto fijo (ej: $10 USD)

### Aplicación
- `courses`: Solo para cursos
- `subscriptions`: Solo para suscripciones
- `all`: Ambos

### Validación
La función `validate_coupon_universal` verifica:
- Código existe y está activo
- No expirado
- Límite de usos no alcanzado
- Límite por usuario no alcanzado
- Aplica al producto correcto

---

## 👥 Billing por Seats (Plan Teams)

### Campos Clave
- `organization_members.is_billable` → Si el miembro cuenta como seat
- `organization_members.is_over_limit` → Si excede el límite del plan
- `organization_billing_cycles.seats` → Cantidad de seats en el período

### Eventos de Miembros
La tabla `organization_member_events` registra:
- `member_added` → Se agregó un miembro
- `member_removed` → Se removió un miembro
- `billable_changed` → Cambió el estado de facturación

---

## 🏆 Programa Founders

### Criterio
Usuarios que pagan **plan anual** obtienen badge de Founder.

### Implementación
En `organizations.settings`:
```json
{
  "is_founder": true,
  "founder_since": "2025-12-02T19:32:12.242Z"
}
```

---

## 🔐 Variables de Entorno

### PayPal
```env
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
```

### MercadoPago
```env
# Producción
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_PUBLIC_KEY=...
MERCADOPAGO_WEBHOOK_SECRET=...
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=...

# Sandbox (opcional, para testing)
MERCADOPAGO_ACCESS_TOKEN_SANDBOX=...
MERCADOPAGO_WEBHOOK_SECRET_SANDBOX=...
```

### Feature Flags
```
mp_enabled = true   → Usa credenciales de PRODUCCIÓN
mp_enabled = false  → Usa credenciales de SANDBOX
```

---

## 📖 Funciones SQL Importantes

| Función | Propósito |
|---------|-----------|
| `handle_payment_course_success` | Procesa pago de curso exitoso |
| `handle_payment_subscription_success` | Procesa pago de suscripción exitoso |
| `handle_upgrade_subscription_success` | Procesa upgrade de plan |
| `handle_member_seat_purchase` | Procesa compra de seats adicionales |
| `validate_coupon_universal` | Valida cupón para curso o suscripción |
| `redeem_coupon` | Redime cupón tras pago exitoso |
| `step_payment_insert_idempotent` | Crea registro de pago (con idempotencia) |
| `step_course_enrollment_annual` | Matricula estudiante en curso |
| `step_subscription_create_active` | Crea suscripción activa |
| `step_subscription_expire_previous` | Expira suscripción anterior |
| `step_organization_set_plan` | Actualiza plan de organización |
| `step_apply_founders_program` | Aplica badge de founder (solo anual) |
| `step_send_purchase_email` | Encola email de confirmación de compra |

---

## � Historial de Issues Resueltos

### Feb 2026: Desacople metadata vs external_reference (CRÍTICO)

**Síntoma:** Webhook MP logueaba `"Missing user_id in metadata"` y `"Processing unknown for user undefined"`.

**Causa raíz (3 bugs):**
1. `webhook-handler.ts` buscaba `metadata.user_id` pero MP **no persiste metadata** de la preferencia al pago
2. `preference/route.ts` usaba `auth_id` (Supabase Auth) en el `external_reference` en vez de `users.id` interno — violación de Regla 6
3. `payment-status/route.ts` parseaba índice `[1]` como product_type cuando está en `[0]`

**Fix aplicado:**
- `webhook-handler.ts`: Nuevo helper `parseExternalReference()` que parsea el formato pipe-delimited
- `preference/route.ts`: Resolución de `users.id` movida antes del `external_reference`, eliminada query redundante
- `payment-status/route.ts`: Índice corregido a `[0]`

---

*Última actualización: Febrero 2026*
