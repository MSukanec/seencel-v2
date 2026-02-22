# Suscripción a Plan (Plan Subscription)

> **Alcance**: Flujo completo de suscripción a un plan de Seencel (Starter, Pro, Teams). Cubre desde la selección del plan en el checkout hasta la activación de la suscripción para una organización. Incluye upgrades de plan y programa founders.

## ¿Qué resuelve?

Carlos tiene una empresa constructora y quiere usar Seencel para gestionar sus obras. Va al checkout, elige el plan Teams anual, paga con MercadoPago, y al confirmar el pago se activa automáticamente la suscripción para su organización: el plan se actualiza, se crea la suscripción con fecha de vencimiento a 1 año, y recibe email de confirmación + notificación push. Si ya tenía un plan anterior, este se marca como "expirado" automáticamente.

## Conceptos clave

| Concepto | Qué es | Tabla |
|----------|--------|-------|
| Plan | Producto de suscripción con features, precios y límites | `billing.plans` |
| Suscripción | Registro activo que vincula una organización a un plan | `billing.organization_subscriptions` |
| Payment | Registro del pago exitoso | `billing.payments` |
| Preference (MP) | Datos de la intención de pago en MercadoPago | `billing.mp_preferences` |
| Preference (PayPal) | Datos de la intención de pago en PayPal | `billing.paypal_preferences` |
| Payment Event | Evento webhook logueado para auditoría | `billing.payment_events` |
| Coupon | Descuento aplicable al plan | `billing.coupons` |
| Coupon Redemption | Registro de uso de un cupón | `billing.coupon_redemptions` |
| Upgrade | Cambio de plan inferior a superior (Pro → Teams) | Usa la misma función con `p_is_upgrade=true` |
| Programa Founders | Beneficio especial para suscripciones anuales | `billing.founders_members` |

## Flujo resumido

```
Checkout (selección de plan) → Elegir Medio de Pago → Pagar
                                    ↓
                         ┌──────────┴──────────┐──────────────┐
                         │                     │              │
                  MercadoPago              PayPal     Cupón 100%
                  (webhook)           (capture API)  (directo)
                         │                     │              │
                         └──────────┬──────────┘──────────────┘
                                    ↓
               handle_payment_subscription_success (SQL)
                                    ↓
                  ┌─────────────────┼─────────────────┐
                  │                 │                  │
       step_payment_    step_subscription_    step_organization_
       insert_          expire_previous +     set_plan
       idempotent       create_active
                  │                 │                  │
                  └─────────────────┼─────────────────┘
                                    ↓
                     step_apply_founders_program (si annual)
                                    ↓
                       TRIGGERS AUTOMÁTICOS en billing.payments:
                       ├── notifications.queue_purchase_email()
                       ├── audit.log_payment_activity()
                       ├── notifications.notify_admin_on_payment
                       └── notifications.notify_user_payment_completed
                                    ↓
                        Redirect → Success Page
```

## Naming Convention (Handlers billing)

Patrón: `handle_payment_{product_type}_success`

| Función | Producto |
|---------|----------|
| `handle_payment_subscription_success` | Suscripción nueva (y upgrade via flag) |
| `handle_payment_upgrade_success` | Wrapper → subscription con `p_is_upgrade=true` |

## Documentos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| `README.md` | Overview, conceptos y flujo resumido |
| `user-journey.md` | Paso a paso desde la perspectiva del usuario |
| `technical-map.md` | Referencia técnica: tablas, funciones, archivos |
| `design-decisions.md` | Decisiones de diseño, edge cases y gotchas |
| `roadmap.md` | Estado actual y pendientes |
