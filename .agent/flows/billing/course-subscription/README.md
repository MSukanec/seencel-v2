# Suscripción a Cursos (Course Purchase)

> **Alcance**: Flujo completo de compra y acceso a cursos de la Academia Seencel. Cubre desde la selección del curso hasta la matriculación del usuario.

## ¿Qué resuelve?

María, una arquitecta, quiere tomar el curso "Gestión de Obra" en la Academy de Seencel. Desde la landing del curso, hace clic en "Comprar", completa el checkout eligiendo MercadoPago como medio de pago, y es redirigida a la pasarela. Una vez que el pago se confirma, automáticamente recibe acceso al curso por 1 año, un email de confirmación, y puede empezar a ver las lecciones inmediatamente.

## Conceptos clave

| Concepto | Qué es | Tabla |
|----------|--------|-------|
| Curso | Producto educativo con módulos y lecciones | `academy.courses` |
| Enrollment (Matrícula) | Registro que le da acceso al usuario al curso | `academy.course_enrollments` |
| Payment | Registro del pago exitoso | `billing.payments` |
| Preference (MP) | Datos de la intención de pago en MP | `billing.mp_preferences` |
| Preference (PayPal) | Datos de la intención de pago en PayPal | `billing.paypal_preferences` |
| Payment Event | Evento webhook logueado para auditoría | `billing.payment_events` |
| Coupon | Descuento aplicable al curso | `billing.coupons` |
| Coupon Redemption | Registro de uso de un cupón | `billing.coupon_redemptions` |

## Flujo resumido

```
Landing Curso → Checkout → Elegir Medio de Pago → Pagar
                                ↓
                     ┌──────────┴──────────┐
                     │                     │
              MercadoPago              PayPal
              (webhook)           (capture API)
                     │                     │
                     └──────────┬──────────┘
                                ↓
               handle_payment_course_success (SQL)
                                ↓
                   ┌────────────┴────────────┐
                   │                         │
          step_payment_insert    step_course_enrollment_annual
             (idempotente)          (upsert 1 año)
                   │                         │
                   └────────────┬────────────┘
                                ↓
                   step_send_purchase_email
                                ↓
                    Redirect → Success Page
```

## Documentos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| `README.md` | Overview, conceptos y flujo resumido |
| `user-journey.md` | Paso a paso desde la perspectiva del usuario |
| `technical-map.md` | Referencia técnica: tablas, funciones, archivos |
| `design-decisions.md` | Decisiones de diseño, edge cases y gotchas |
| `roadmap.md` | Estado actual y pendientes |
