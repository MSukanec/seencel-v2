# Roadmap: Suscripción a Cursos

> Estado actual y pendientes del flujo de compra de cursos.

---

## ✅ Completado

| Qué | Detalles |
|-----|----------|
| Checkout unificado | Soporta cursos, planes, seats y upgrades |
| MercadoPago integration | Webhook dual-format (IPN + V2), sandbox/prod |
| PayPal integration | Create order + capture order |
| Enrollment automático | `step_course_enrollment_annual` con upsert |
| Email de confirmación | Al comprador + admins via `email_queue` |
| Cupones | Validación universal (percent/fixed, por usuario, por curso) |
| Idempotencia | Advisory lock + ON CONFLICT en payments |
| Payment events audit | Todo webhook se loguea en `payment_events` |
| Transferencia bancaria | Opción manual con review admin |
| Schema migration | Tablas migradas de `public` a `billing` y `academy` |
| RLS completa | 41 policies en billing, cubriendo todas las tablas |
| Indexes | 40 indexes (excluyendo PKs) para performance |
| Triggers | 7 triggers (notificaciones, updated_at, user_id immutable) |

---

## ⏳ Pendiente: Corto plazo

### P1: 🔴 Corregir llamada legacy `redeem_coupon` → `redeem_coupon_universal`
- **Prioridad**: Alta (bug activo, cupones no se registran)
- **Descripción**: El webhook handler de MP y el PayPal capture-order llaman a `redeem_coupon` que NO EXISTE. Deben usar `redeem_coupon_universal`.
- **Archivos a modificar**:
  - `src/lib/mercadopago/webhook-handler.ts` (línea ~109)
  - `src/app/api/paypal/capture-order/route.ts` (línea ~230)
- **Cambio**: Reemplazar `redeem_coupon` por `redeem_coupon_universal` con signature:
  ```ts
  supabase.rpc('redeem_coupon_universal', {
      p_code: couponCode,
      p_product_type: 'course',
      p_product_id: courseId,
      p_price: amount,
      p_currency: currency
  })
  ```

### P2: 🟡 Actualizar funciones SQL para usar schemas calificados
- **Prioridad**: Media (funciona por search_path, pero es deuda técnica)
- **Descripción**: 17+ referencias a `public.*` en funciones de `billing` y `academy` que deberían usar el schema correcto (`billing.*`, `academy.*`, `iam.*`).
- **Acción**: Crear un script SQL (`DB/076_fix_billing_schema_references.sql`) que redeploy todas las funciones con schemas calificados.
- **Ver**: `design-decisions.md` → E5 para lista completa.

### P3: 🟡 Agregar soporte de `activateFreeSubscription` para cursos
- **Prioridad**: Media (edge case cuando cupón = 100% en un curso)
- **Descripción**: Hoy `activateFreeSubscription` solo funciona para suscripciones. Si un cupón del 100% se aplica a un curso, el botón de activación gratuita no existe.
- **Archivos a modificar**:
  - `src/features/billing/actions.ts` → crear `activateFreeCourseEnrollment()`
  - `src/features/billing/hooks/use-checkout.ts` → agregar lógica para cursos gratuitos
  - `src/features/billing/components/checkout/billing-checkout-actions.tsx` → mostrar botón

### P4: 🟡 Verificar enrollment en success page
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
