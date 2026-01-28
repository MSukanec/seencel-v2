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
├── ENROLLMENT_FUNCTIONS.md      # Funciones SQL de enrollment
├── COUPON_FUNCTIONS.md          # Funciones SQL de cupones
├── views/
│   └── checkout-view.tsx        # Vista principal de checkout
├── components/
│   └── ...                      # Componentes de UI
├── actions/
│   └── ...                      # Server Actions
└── queries/
    └── ...                      # Queries de datos
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
| `payment_events` | Webhooks recibidos (todos los providers) |
| `bank_transfer_payments` | Pagos por transferencia (manual) |

### Gateway Preferences

| Tabla | Propósito |
|-------|-----------|
| `mp_preferences` | Preferencias de checkout MercadoPago |
| `paypal_seat_preferences` | Preferencias PayPal para seats |
| `paypal_upgrade_preferences` | Preferencias PayPal para upgrades |

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
| `roles` / `role_permissions` | Permisos por rol |

---

## 🌐 Gateways de Pago

### ✅ PayPal (IMPLEMENTADO)
- **Región:** Internacional (USD)
- **Tipos:** Cursos, Suscripciones, Seats, Upgrades
- **Modo:** Sandbox + Producción

### ✅ Transferencia Bancaria (IMPLEMENTADO)
- **Región:** Argentina (ARS)
- **Tipos:** Cursos, Suscripciones
- **Modo:** Aprobación manual por admin

### 🔄 MercadoPago (EN PROGRESO)
- **Región:** Argentina (ARS)
- **Tipos:** Cursos, Suscripciones
- **Modo:** Checkout Pro (redirect)

---

## 🎯 Roadmap MercadoPago

### Fase 1: Infraestructura Backend ⏳
- [ ] Instalar SDK `mercadopago`
- [ ] Configurar variables de entorno
- [ ] Crear `src/lib/mercadopago/client.ts`
- [ ] API Route: `/api/mercadopago/preference`
- [ ] API Route: `/api/mercadopago/webhook`

### Fase 2: Integración Frontend ⏳
- [ ] Activar botón MercadoPago en checkout
- [ ] Crear páginas success/pending/failure
- [ ] Manejar redirección post-pago

### Fase 3: Cupones ⏳
- [ ] Pasar precio con descuento a preference
- [ ] Redimir cupón en webhook tras pago

### Fase 4: Verificación ⏳
- [ ] Testing en sandbox
- [ ] Configurar webhook en producción
- [ ] Deploy final

---

## 💰 Flujo de Precios

### USD-Base Model
Los precios se definen en USD en la tabla `plans`:
- `monthly_amount` = precio mensual USD
- `annual_amount` = precio anual USD

### Conversión a ARS
Para checkout argentino:
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

### MercadoPago (Requerido)
```env
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_PUBLIC_KEY=...
MERCADOPAGO_WEBHOOK_SECRET=...
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=...
```

---

## 📖 Funciones SQL Importantes

| Función | Propósito |
|---------|-----------|
| `handle_payment_course_success` | Procesa pago de curso exitoso |
| `handle_payment_subscription_success` | Procesa pago de suscripción exitoso |
| `validate_coupon_universal` | Valida cupón para curso o suscripción |
| `step_create_payment` | Crea registro de pago |
| `step_enroll_student` | Matricula estudiante en curso |
| `step_organization_set_plan` | Actualiza plan de organización |
| `step_apply_founders_program` | Aplica badge de founder |

---

## 🚀 Próximos Pasos

1. **Obtener credenciales de MercadoPago**
   - Access Token (Producción o Sandbox)
   - Public Key
   - Webhook Secret

2. **Configurar webhook URL**
   - Producción: `https://tu-dominio.com/api/mercadopago/webhook`
   - Desarrollo: Usar ngrok o similar

3. **Implementar rutas API**
   - Ver Fase 1 del roadmap

4. **Testing**
   - Probar flujo completo en sandbox
   - Verificar webhooks con logs

---

*Última actualización: Enero 2026*
