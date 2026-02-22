# Design Decisions: Plan Subscription

> Por qué se hizo así, alternativas descartadas, edge cases y gotchas.

---

## Decisiones de Diseño

### D1: Orquestación SQL con steps modulares (igual que Course)

**Elegimos**: Función handler (`handle_payment_subscription_success`) que llama a `step_*` functions internas dentro de una transacción.

**Alternativa descartada**: Lógica de fulfillment en el backend Node.js (API route).

**Razón**: Al estar TODO en SQL dentro de una transacción, garantizamos atomicidad. Si falla el set_plan, se revierten el payment y la suscripción. En Node habría riesgo de estados parciales.

**Justificación de mantener steps separados**: Los `step_*` son reutilizados por múltiples consumidores: los handlers SQL, `bank-transfer-actions.ts` (directo via RPC), y `activateFreeSubscription()`.

---

### D2: Unificación de subscription + upgrade en una sola función

**Elegimos**: `handle_payment_subscription_success` con parámetro `p_is_upgrade` (default false).

**Alternativa anterior**: Dos funciones separadas con lógica casi idéntica.

**Razón**: El 95% de la lógica es idéntica. La única diferencia es:
- `product_type`: `'subscription'` vs `'upgrade'`
- Metadata adicional: `previous_plan_id`, `previous_plan_name`
- `handle_payment_upgrade_success` ahora es un wrapper de una línea.

---

### D3: Suscripciones con rotación (expire previous + create new)

**Elegimos**: Al crear una suscripción nueva, la anterior se marca como `expired` y se crea una nueva con `status = 'active'`.

**Alternativa descartada**: UPDATE in-place la suscripción existente.

**Razón**: Mantener historial completo de suscripciones. Cada suscripción es un registro inmutable que captura el plan_id, periodo, monto, y fecha exacta. Facilita auditoría y análisis.

---

### D4: Programa Founders solo para suscripciones anuales

**Elegimos**: `step_apply_founders_program` se ejecuta solo si `billing_period = 'annual'`.

**Alternativa descartada**: Aplicarlo a todos los periodos.

**Razón**: El programa founders es un incentivo para compromisos anuales. Los usuarios mensuales no califican.

---

### D5: Activación gratuita via cupón con provider='coupon'

**Elegimos**: Reutilizar el handler `handle_payment_subscription_success` con `provider='coupon'` y `amount=0`.

**Alternativa descartada**: Crear un handler separado para activaciones gratuitas.

**Razón**: La lógica de negocio es idéntica: crear payment, expirar subs anteriores, crear sub activa, set plan. Al reutilizar el handler, se garantiza consistencia y los triggers automáticos siguen funcionando.

---

### D6: Transferencia bancaria con activación optimista

**Elegimos**: Al subir un comprobante de transferencia, se activa la suscripción INMEDIATAMENTE (optimista). Un admin puede verificar después.

**Alternativa descartada**: Esperar a que el admin apruebe la transferencia antes de activar.

**Razón**: Reducir fricción para el usuario. Si se espera aprobación manual, el usuario puede quedarse esperando horas/días sin acceso. El enfoque "trust first, verify later" prioriza UX, y el admin puede revocar si es fraudulento.

---

### D7: Precio del plan en ARS para MercadoPago

**Elegimos**: El frontend calcula `amount_ARS = plan_price_USD × exchange_rate` y lo envía al API de preferencia.

**Alternativa descartada**: Convertir en el backend.

**Razón**: El tipo de cambio se muestra al usuario en el checkout para transparencia. El mismo valor mostrado es el que se envía a MP, evitando discrepancias.

---

### D8: external_reference con orgId y planId

**Elegimos**: El external_reference de MP incluye `orgId` y `planId` en el formato pipe-delimited.

**Alternativa descartada**: Buscar la org y plan desde la preferencia guardada en DB.

**Razón**: El external_reference es el ÚNICO dato que MP persiste y devuelve en el webhook de forma confiable. Incluir todos los datos necesarios permite que el webhook sea completamente autónomo sin depender de lookups adicionales.

---

## Edge Cases y Gotchas

### E1: Usuario con múltiples organizaciones

**Impacto**: El checkout muestra un selector de organización. Si el usuario tiene 3 orgs, debe elegir a cuál aplicar la suscripción. El `organization_id` se envía en el external_reference.

**Solución actual**: El selector de org está implementado en el checkout view.

---

### E2: Suscripción expirada pero sin renovación

**Impacto**: Si la suscripción expira y el usuario no renueva, el plan NO se downgradeada automáticamente a Starter. La org mantiene el plan anterior hasta que alguien actúe.

**Solución futura**: Cron job o función periódica que verifique suscripciones expiradas y downgrade automático.

---

### E3: Upgrade en medio de un periodo de facturación

**Impacto**: Si Carlos tiene plan Pro (anual, le quedan 6 meses) y quiere Teams, se calcula proración. La función `get_upgrade_proration` calcula el crédito restante del plan actual.

**Solución actual**: El checkout page llama a `getUpgradeProration()` que retorna `credit`, `target_price`, `upgrade_price`, y `days_remaining`.

---

### E4: Webhook de MP duplicado

**Impacto**: MP puede enviar el mismo webhook 2+ veces.

**Solución actual**: `pg_advisory_xact_lock` + `ON CONFLICT DO NOTHING` en `step_payment_insert_idempotent`. Si el payment ya existe, retorna `{ status: 'already_processed' }`.

---

### E5: PayPal ORDER_ALREADY_CAPTURED

**Impacto**: Si el capture se llama dos veces (race condition), PayPal devuelve error.

**Solución actual**: El capture route detecta `ORDER_ALREADY_CAPTURED`, trata como éxito, y obtiene los detalles del pedido para continuar el procesamiento.

---

### E6: Transferencia bancaria fraudulenta

**Impacto**: Con la activación optimista, un usuario podría subir un comprobante falso y tener acceso temporal.

**Solución actual**: Admin puede revisar y revocar manualmente. El registro en `bank_transfer_payments` tiene status separado del payment real.

---

## Relación con otros Flows

| Flow | Conexión |
|------|----------|
| `billing/course-subscription` | Comparte el checkout, payment_events, triggers en payments, coupon system. Diferente handler SQL (`handle_payment_course_success` vs `handle_payment_subscription_success`) |
| `iam/user-registration` | El usuario debe estar registrado para comprar. `users.id` es FK en payments |
| `notifications` | Triggers en `billing.payments` disparan notificaciones push y emails automáticamente |
| `team/seats` | Compra de asientos usa `handle_payment_seat_success` — mismo checkout pero diferente handler |
