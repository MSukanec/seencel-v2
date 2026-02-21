# Design Decisions: Suscripción a Cursos

> Por qué se hizo así, alternativas descartadas, edge cases y gotchas.

---

## Decisiones de Diseño

### D1: Orquestación SQL con steps modulares

**Elegimos**: Función orquestadora (`handle_payment_course_success`) que llama a `step_*` functions internas.

**Alternativa descartada**: Lógica de fulfillment en el backend Node.js (API route).

**Razón**: Al estar TODO en SQL dentro de una transacción, garantizamos atomicidad. Si falla el enrollment, se revierte el payment. Si se hiciera en Node, habría riesgo de estados parciales (pago registrado pero no enrollado).

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

### D4: Email via cola (email_queue) en vez de envío síncrono

**Elegimos**: INSERT en `email_queue` dentro de la transacción SQL.

**Alternativa descartada**: Llamar a un servicio de email desde el API route.

**Razón**: El email no debe bloquear ni fallar el fulfillment. Al encolar, se procesa de forma asíncrona. Si el email falla, el enrollment sigue vigente.

---

### D5: external_reference pipe-delimited en MercadoPago

**Elegimos**: String con pipe-separated values (256 chars max).

**Alternativa descartada**: Usar `metadata` de MP.

**Razón**: `external_reference` es el ÚNICO campo que MP persiste y devuelve en el webhook de forma confiable. `metadata` no siempre llega. El formato pipe es compacto y parseable.

---

### D6: Doble gateway (MP + PayPal) con lógica unificada

**Elegimos**: Ambos gateways convergen en la misma RPC (`handle_payment_course_success`).

**Alternativa descartada**: Handlers separados para cada gateway.

**Razón**: La lógica de negocio (payment + enrollment + email) es idéntica independientemente del gateway. Solo cambia cómo se recibe la confirmación (webhook vs. capture API).

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

### E3: Cupón redimido con función legacy `redeem_coupon`

**Impacto**: ⚠️ **BUG ACTIVO**. El webhook handler de MP llama a `redeem_coupon` que NO EXISTE como función en la DB (solo existe `redeem_coupon_universal`). Esto significa que la redención de cupones NO se registra cuando el pago viene por MercadoPago.

**Archivos afectados**: `src/lib/mercadopago/webhook-handler.ts` línea ~109

**Solución**: Cambiar a `redeem_coupon_universal` con los parámetros correctos.

---

### E4: PayPal capture también llama a `redeem_coupon` legacy

**Impacto**: ⚠️ **BUG ACTIVO** (mismo que E3). El handler de PayPal capture en `route.ts` línea ~230 llama a `redeem_coupon` con parámetros de la versión vieja.

**Archivos afectados**: `src/app/api/paypal/capture-order/route.ts` línea ~230

**Solución**: Migrar a `redeem_coupon_universal`.

---

### E5: Funciones SQL referencian tablas con schema `public.*` en vez de `billing.*` o `academy.*`

**Impacto**: ⚠️ **Deuda técnica post-migración**. Las funciones funcionan porque el `search_path` incluye `public`, `billing` y `academy`. Pero es confuso e inconsistente. Si se cambiara el search_path o se reorganizara, se romperían.

**Funciones afectadas**:
| Función | Referencia incorrecta | Debería ser |
|---------|----------------------|-------------|
| `validate_coupon_universal` | `public.coupons` | `billing.coupons` |
| `validate_coupon_universal` | `public.coupon_courses` | `billing.coupon_courses` |
| `validate_coupon_universal` | `public.coupon_plans` | `billing.coupon_plans` |
| `validate_coupon_universal` | `public.coupon_redemptions` | `billing.coupon_redemptions` |
| `redeem_coupon_universal` | `public.coupon_redemptions` | `billing.coupon_redemptions` |
| `step_payment_insert_idempotent` | `public.payments` | `billing.payments` |
| `step_subscription_create_active` | `public.organization_subscriptions` | `billing.organization_subscriptions` |
| `step_subscription_expire_previous` | `public.organization_subscriptions` | `billing.organization_subscriptions` |
| `step_course_enrollment_annual` | `public.course_enrollments` | `academy.course_enrollments` |
| `step_send_purchase_email` | `public.users` | `iam.users` |
| `step_send_purchase_email` | `public.email_queue` | ¿schema? |
| `step_apply_founders_program` | `public.organizations` | `iam.organizations` |
| `step_organization_set_plan` | `public.organizations` | `iam.organizations` |
| `handle_payment_subscription_success` | `public.plans` | `billing.plans` |
| `handle_upgrade_subscription_success` | `public.organizations` | `iam.organizations` |
| `handle_upgrade_subscription_success` | `public.plans` | `billing.plans` |
| `fill_progress_user_id_from_auth` | `public.users` | `iam.users` |

**Solución**: Crear script SQL que actualice todas las funciones para usar schemas calificados.

---

### E6: `activateFreeSubscription` no soporta cursos

**Impacto**: Si un cupón del 100% se aplica a un curso, el flujo de "activación gratuita" no funciona porque solo llama a `handle_payment_subscription_success` (suscripciones).

**Solución futura**: Agregar soporte para cursos en `activateFreeSubscription` o crear `activateFreeCourseEnrollment`.

---

## Relación con otros Flows

| Flow | Conexión |
|------|----------|
| `billing/plan-subscription` | Comparte el checkout, payment_events, y coupon system. Diferente handler SQL (`handle_payment_subscription_success` vs `handle_payment_course_success`) |
| `iam/user-registration` | El usuario debe estar registrado para comprar. `users.id` es FK en todo |
| `notifications` | Los triggers en `billing.payments` disparan notificaciones push |
