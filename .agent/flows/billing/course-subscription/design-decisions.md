# Design Decisions: Billing (Course + Subscription + Seats)

> Por qué se hizo así, alternativas descartadas, edge cases y gotchas.

---

## Decisiones de Diseño

### D1: Orquestación SQL con steps modulares

**Elegimos**: Función handler (`handle_payment_{product}_success`) que llama a `step_*` functions internas.

**Alternativa descartada**: Lógica de fulfillment en el backend Node.js (API route).

**Razón**: Al estar TODO en SQL dentro de una transacción, garantizamos atomicidad. Si falla el enrollment, se revierte el payment. Si se hiciera en Node, habría riesgo de estados parciales (pago registrado pero no enrollado).

**Justificación de mantener steps separados**: Los `step_*` son reutilizados por múltiples consumidores: los handlers SQL Y `bank-transfer-actions.ts` los llama directamente via RPC. Inlinearlos generaría duplicación.

---

### D2: Idempotencia via advisory lock + ON CONFLICT

**Elegimos**: `pg_advisory_xact_lock` + INSERT ON CONFLICT DO NOTHING para payments.

**Alternativa descartada**: Verificar existencia con SELECT antes del INSERT.

**Razón**: El advisory lock previene race conditions de webhooks duplicados (MP puede enviar el mismo evento 2+ veces). El ON CONFLICT es la segunda barrera. Si el payment ya existe, se retorna `already_processed` sin efecto.

---

### D3: Enrollment con duración fija de 1 año

**Elegimos**: `expires_at = now() + interval '1 year'` hardcodeado.

**Alternativa descartada**: Duración configurable por curso.

**Razón**: Simplicidad. Todos los cursos tienen la misma vigencia. Si a futuro se necesitan planes distintos (lifetime, 6 meses), se agregaría un campo `duration` al curso.

---

### D4: Email y Activity Log via triggers automáticos

**Elegimos**: Triggers en `billing.payments` que disparan automáticamente al INSERT con status='completed'.

**Alternativa anterior (descartada)**: Funciones `step_send_purchase_email()` y `step_log_seat_purchase_event()` llamadas manualmente en cada handler.

**Razón del cambio**: 
1. **Consistencia**: Antes se podía olvidar llamar al step en un handler nuevo. Con triggers, SIEMPRE se dispara.
2. **DRY**: La lógica de email/logging estaba duplicada en cada handler.
3. **Alineación con pattern**: Las notificaciones push ya usaban el patrón de triggers (`notify_admin_on_payment`, `notify_user_payment_completed`).
4. **Desacoplamiento**: El handler solo se ocupa del fulfillment de negocio, no de cross-cutting concerns.

**Triggers actuales en `billing.payments`**:
| Trigger | Función | Qué hace |
|---------|---------|----------|
| `trg_queue_purchase_email` | `notifications.queue_purchase_email()` | Encola email comprador + admin |
| `trg_log_payment_activity` | `audit.log_payment_activity()` | Registra en activity_logs |
| `trg_notify_admin_payment` | `notifications.notify_admin_on_payment()` | Campanita admin |
| `trg_notify_user_payment` | `notifications.notify_user_payment_completed()` | Campanita usuario |

---

### D5: external_reference pipe-delimited en MercadoPago

**Elegimos**: String con pipe-separated values (256 chars max).

**Alternativa descartada**: Usar `metadata` de MP.

**Razón**: `external_reference` es el ÚNICO campo que MP persiste y devuelve en el webhook de forma confiable. `metadata` no siempre llega. El formato pipe es compacto y parseable.

---

### D6: Doble gateway (MP + PayPal) con lógica unificada

**Elegimos**: Ambos gateways convergen en la misma RPC (`handle_payment_{product}_success`).

**Alternativa descartada**: Handlers separados para cada gateway.

**Razón**: La lógica de negocio es idéntica independientemente del gateway. Solo cambia cómo se recibe la confirmación (webhook vs. capture API).

---

### D7: Naming uniforme de handlers

**Elegimos**: Patrón `handle_payment_{product_type}_success` para todos los handlers.

**Nombres anteriores (eliminados)**:
- `handle_member_seat_purchase` → `handle_payment_seat_success`
- `handle_upgrade_subscription_success` → `handle_payment_upgrade_success`

**Razón**: Consistencia. Todas las funciones siguen el mismo patrón, facilitando descubrimiento y mantenimiento.

---

### D8: Unificación de subscription + upgrade en una sola función

**Elegimos**: `handle_payment_subscription_success` con parámetro `p_is_upgrade` (default false).

**Alternativa anterior**: Dos funciones separadas (`handle_payment_subscription_success` + `handle_upgrade_subscription_success`) con lógica casi idéntica.

**Razón**: El 95% de la lógica es idéntica. La única diferencia es:
- `product_type`: 'subscription' vs 'upgrade'
- Metadata adicional: `previous_plan_id`, `previous_plan_name`
- `handle_payment_upgrade_success` ahora es un wrapper de una línea.

---

### D9: Coupon redemption universal en webhooks

**Elegimos**: La redención de cupones se ejecuta para TODOS los product types (course, subscription, upgrade) en los webhooks de MP y PayPal.

**Decisión anterior (bug corregido)**: Solo se redimía para cursos. Suscripciones y upgrades con cupón no registraban la redención.

**Impacto del fix**: Ahora `redeem_coupon_universal` se llama universalmente con el `productType` correcto mapeado (`upgrade` → `subscription` para coupon purposes).

---

## Edge Cases y Gotchas

### E1: Usuario paga dos veces el mismo curso

**Impacto**: El payment se registra dos veces (providers distintos = IDs distintos), pero el enrollment hace UPSERT y solo extiende el `expires_at`.

**Solución futura**: Verificar en el checkout si el usuario ya tiene un enrollment activo y mostrar warning.

---

### E2: Webhook de MP llega antes de que termine el redirect

**Impacto**: El usuario puede llegar a la success page sin que el enrollment esté listo si el webhook tarda.

**Solución actual**: La success page no verifica el enrollment, solo muestra confirmación genérica.

**Solución futura**: Polling o realtime en la success page para confirmar enrollment.

---

### ~~E3: Cupón redimido con función legacy `redeem_coupon`~~ ✅ CORREGIDO

**Resolución**: El webhook handler ahora llama a `redeem_coupon_universal` universalmente para cursos, suscripciones y upgrades. Ver D9.

---

### ~~E4: PayPal capture también llama a `redeem_coupon` legacy~~ ✅ CORREGIDO

**Resolución**: Mismo fix que E3. PayPal capture ahora usa `redeem_coupon_universal`.

---

### E5: `activateFreeSubscription` no soporta cursos

**Impacto**: Si un cupón del 100% se aplica a un curso, el flujo de "activación gratuita" no funciona porque solo llama a `handle_payment_subscription_success` (suscripciones).

**Solución futura**: Agregar soporte para cursos en `activateFreeSubscription` o crear `activateFreeCourseEnrollment`.

---

## Relación con otros Flows

| Flow | Conexión |
|------|----------|
| `billing/plan-subscription` | Comparte el checkout, payment_events, y coupon system. Diferente handler SQL (`handle_payment_subscription_success` vs `handle_payment_course_success`) |
| `iam/user-registration` | El usuario debe estar registrado para comprar. `users.id` es FK en todo |
| `notifications` | Triggers en `billing.payments` disparan notificaciones push y emails automáticamente |
