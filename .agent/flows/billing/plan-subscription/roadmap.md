# Roadmap: Plan Subscription

> Estado actual y pendientes del flujo de suscripción a planes.

---

## ✅ Completado

| Qué | Detalles |
|-----|----------|
| Checkout unificado | Soporta planes con ciclo monthly/annual |
| MercadoPago integration | Preference + webhook con external_reference pipe-delimited |
| PayPal integration | Create order + capture order + ORDER_ALREADY_CAPTURED handling |
| Transferencia bancaria | Activación optimista con comprobante |
| Cupón 100% (activación gratuita) | `activateFreeSubscription()` con provider='coupon' |
| Suscripción activa | `step_subscription_create_active` con expires_at calculado |
| Rotación de suscripciones | `step_subscription_expire_previous` marca las anteriores |
| Actualización de plan | `step_organization_set_plan` actualiza `iam.organizations.plan_id` |
| Programa Founders | `step_apply_founders_program` registra founders (solo annual) |
| Upgrades de plan | `handle_payment_upgrade_success` (wrapper → subscription con `p_is_upgrade=true`) |
| Proración de upgrade | `get_upgrade_proration` calcula crédito restante |
| Email de confirmación (trigger) | `notifications.queue_purchase_email()` — trigger automático |
| Activity log (trigger) | `audit.log_payment_activity()` — trigger automático |
| Notificaciones push (trigger) | `notify_admin_on_payment` + `notify_user_payment_completed` — triggers |
| Cupones universales | `validate_coupon_universal` + `redeem_coupon_universal` para subs y upgrades |
| Idempotencia | Advisory lock + ON CONFLICT en payments |
| Payment events audit | Todo webhook/capture se loguea en `payment_events` |
| Schema migration | Tablas en schema `billing`, referencias cross-schema correctas |

---

## ⏳ Pendiente: Corto plazo

### P1: 🟡 Downgrade automático en suscripción expirada
- **Prioridad**: Media (integridad de datos a largo plazo)
- **Descripción**: Cuando una suscripción expira y no se renueva, la organización mantiene el plan anterior indefinidamente. Debería existir un mecanismo que downgrade a Starter.
- **Implementación sugerida**: 
  - Crear función SQL `billing.check_expired_subscriptions()` que busque orgs con subs expiradas y plan != starter
  - Integrar con cron de Supabase (pg_cron) o endpoint periódico
  - Notificar al usuario antes del downgrade (7 días, 1 día)

### P2: 🟢 Notificación pre-expiración de suscripción
- **Prioridad**: Media (UX)
- **Descripción**: Avisar al usuario que su suscripción está por vencer para que pueda renovar.
- **Archivos a modificar**:
  - Crear función SQL que identifique suscripciones próximas a vencer (30, 7, 1 día)
  - Crear notificación push + email de recordatorio
  - Integrar con cron de Supabase

---

## 🔮 Pendiente: Largo plazo

### F1: Renovación automática (recurring payments)
- Integrar con suscripciones recurrentes de MP/PayPal
- Auto-renovar sin intervención del usuario
- Gestión de método de pago guardado

### F2: Downgrade de plan (Teams → Pro)
- Flow inverso al upgrade
- Proración de crédito
- Gestión de seats excedentes

### F3: Cancelación de suscripción con periodo de gracia
- Permitir cancelar pero mantener acceso hasta `expires_at`
- No renovar al vencer
- Ofrecer incentivo para retención

### F4: Facturación formal
- Generación de facturas PDF
- Datos fiscales del comprador
- Integración con sistema de facturación local (AFIP)
