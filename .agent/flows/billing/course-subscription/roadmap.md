# Roadmap: Billing (Courses + Subscriptions + Seats)

> Estado actual y pendientes del flujo de pagos.

---

## ✅ Completado

| Qué | Detalles |
|-----|----------|
| Checkout unificado | Soporta cursos, planes, seats y upgrades |
| MercadoPago integration | Webhook dual-format (IPN + V2), sandbox/prod |
| PayPal integration | Create order + capture order |
| Enrollment automático | `step_course_enrollment_annual` con upsert |
| Email de confirmación (trigger) | `notifications.queue_purchase_email()` — trigger automático en `billing.payments` |
| Activity log (trigger) | `audit.log_payment_activity()` — trigger automático en `billing.payments` |
| Notificaciones push (trigger) | `notify_admin_on_payment` + `notify_user_payment_completed` — triggers automáticos |
| Cupones | Validación universal (percent/fixed, por usuario, por curso/plan) |
| Coupon redemption universal | `redeem_coupon_universal` se ejecuta para cursos, suscripciones Y upgrades |
| Idempotencia | Advisory lock + ON CONFLICT en payments |
| Payment events audit | Todo webhook se loguea en `payment_events` |
| Transferencia bancaria | Opción manual con review admin |
| Schema migration | Tablas migradas de `public` a `billing` y `academy` |
| RLS completa | 41 policies en billing, cubriendo todas las tablas |
| Indexes | 40 indexes (excluyendo PKs) para performance |
| Naming uniforme | Patrón `handle_payment_{product}_success` para todos los handlers |
| Unificación sub+upgrade | `handle_payment_subscription_success` con flag `p_is_upgrade` |
| Eliminación step_send_purchase_email | Reemplazada por trigger automático |
| Eliminación step_log_seat_purchase_event | Reemplazada por trigger automático |

---

## ⏳ Pendiente: Corto plazo

### P1: 🟡 Agregar soporte de `activateFreeSubscription` para cursos
- **Prioridad**: Media (edge case cuando cupón = 100% en un curso)
- **Descripción**: Hoy `activateFreeSubscription` solo funciona para suscripciones. Si un cupón del 100% se aplica a un curso, el botón de activación gratuita no existe.
- **Archivos a modificar**:
  - `src/features/billing/actions.ts` → crear `activateFreeCourseEnrollment()`
  - `src/features/billing/hooks/use-checkout.ts` → agregar lógica para cursos gratuitos
  - `src/features/billing/components/checkout/billing-checkout-actions.tsx` → mostrar botón

### P2: 🟡 Verificar enrollment en success page
- **Prioridad**: Baja (UX)
- **Descripción**: La success page no verifica que el enrollment se haya creado correctamente. El usuario podría ver "Compra exitosa" sin tener acceso.
- **Archivos a modificar**:
  - `src/app/[locale]/(dashboard)/checkout/success/page.tsx`
  - `src/features/billing/views/billing-checkout-success-view.tsx`

---

## 🔮 Pendiente: Largo plazo

### F1: Duración de enrollment configurable por curso
- Agregar campo `enrollment_duration_months` a `academy.courses`
- Modificar `step_course_enrollment_annual` para usar el valor del curso

### F2: Renovación automática de curso
- Crear sistema de notificación pre-expiración
- Flow de re-compra simplificado con descuento de renovación

### F3: Bundle de cursos
- Paquetes de 2+ cursos con precio combinado
- Enrollment masivo en una sola transacción

### F4: Lifetime access para cursos
- Opción de acceso permanente (sin expires_at)
- Precio diferenciado

### F5: Gift purchases
- Comprar un curso para otra persona
- Enrollment con email del destinatario
