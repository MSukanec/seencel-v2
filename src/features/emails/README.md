# 📧 Sistema de Emails - SEENCEL

## Arquitectura

El sistema de emails de SEENCEL usa una **arquitectura de cola asíncrona** para garantizar envíos confiables sin bloquear operaciones críticas.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SQL Trigger   │───>│   email_queue   │───>│  Cron Job API   │───> Resend
│  (Supabase)     │    │    (tabla)      │    │   (Next.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Componentes

### 1. Cola de Emails (`email_queue` tabla)
- Los eventos (registro, compra) insertan en `email_queue` vía SQL
- Campos: `recipient_email`, `template_type`, `subject`, `data`, `status`
- Estados: `pending` → `sent` | `failed`

### 2. Procesador de Cola
- **Ruta:** `/api/cron/process-email-queue`
- **Archivo:** `src/app/api/cron/process-email-queue/route.tsx`
- **Frecuencia:** Cada 1 minuto (Vercel Cron)
- Procesa hasta 10 emails por ejecución
- Hasta 3 reintentos por email

### 3. Templates React
- **Ubicación:** `src/features/emails/templates/`
- Basados en componentes React renderizados por Resend

## Templates Disponibles

| Template | `template_type` | Uso |
|----------|-----------------|-----|
| `WelcomeEmail` | `welcome` | Cuando un usuario se registra |
| `PurchaseConfirmationEmail` | `purchase_confirmation` | Cuando compra suscripción/curso |
| `AdminSaleNotificationEmail` | `admin_sale_notification` | Notifica admin de nueva venta |
| `ContactFormEmail` | - | Formulario de contacto |

## Triggers SQL

### Email de Bienvenida
```sql
-- Ejecutar: DB/add_welcome_email_trigger.sql
-- Trigger: on_user_created_send_welcome_email
-- Se dispara: INSERT en public.users
```

### Email de Compra
```sql
-- Parte de: handle_payment_subscription_success / handle_payment_course_success
-- Función: step_send_purchase_email()
-- Se dispara: Pago exitoso en webhook MercadoPago
```

## Variables de Entorno

```env
# Resend (envío de emails)
RESEND_API_KEY=re_xxxxx

# Cron Job Security
CRON_SECRET=tu_secreto_aleatorio

# Cloudflare Turnstile (anti-spam)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=xxxxx
TURNSTILE_SECRET_KEY=xxxxx
```

## Testing

### Local (desarrollo)
```bash
# Disparar manualmente el procesador
curl http://localhost:3001/api/cron/process-email-queue
```

### Producción
- El cron se ejecuta automáticamente vía `vercel.json`
- Verifica en Vercel Dashboard → Cron Jobs

## Seguridad Anti-Spam (Turnstile)

> ⚠️ **ACTUALMENTE DESHABILITADO** - Turnstile está integrado pero en bypass mode.
> Los formularios funcionan sin captcha hasta que configures las keys.

Los formularios públicos tienen protección CAPTCHA preparada:
- `forgot-password/page.tsx` → Turnstile integrado
- `contact-page-view.tsx` → Turnstile + Honeypot

### Para ACTIVAR Turnstile:

1. Ir a [Cloudflare Dashboard](https://dash.cloudflare.com/) → Turnstile
2. Crear sitio con dominio `seencel.com`
3. Agregar variables de entorno:
```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=tu_site_key
TURNSTILE_SECRET_KEY=tu_secret_key
```
4. Deploy - El captcha aparecerá automáticamente

### Componentes
- `src/components/shared/turnstile-captcha.tsx` - Widget cliente (auto-bypass sin keys)
- `src/lib/turnstile.ts` - Verificación server-side

## Agregar Nuevo Template

1. Crear componente en `templates/`:
```tsx
export function MyNewEmail({ prop1, prop2 }: Props) {
    return (
        <div style={emailBaseStyles.container}>
            <EmailHeader />
            <div style={emailBaseStyles.content}>
                {/* Contenido */}
            </div>
            <EmailFooter />
        </div>
    );
}
```

2. Exportar en `templates/index.ts`

3. Agregar case en `route.tsx`:
```tsx
case "my_new_template": {
    return (
        <MyNewEmail
            prop1={String(data.prop1)}
            prop2={String(data.prop2)}
        />
    );
}
```

4. Encolar desde SQL:
```sql
INSERT INTO email_queue (recipient_email, template_type, subject, data)
VALUES ('user@email.com', 'my_new_template', 'Asunto', '{"prop1": "value"}'::jsonb);
```

## Troubleshooting

### Emails no se envían
1. Verificar `RESEND_API_KEY` está configurada
2. Revisar logs del cron en Vercel
3. Consultar `email_queue` tabla por errores

### Captcha no aparece
1. Confirmar `NEXT_PUBLIC_TURNSTILE_SITE_KEY` está seteada
2. En desarrollo, el captcha se bypasea automáticamente

### Email en cola pero status "failed"
1. Revisar columna `last_error` en `email_queue`
2. Verificar template_type coincide con un case en `buildEmailComponent`
