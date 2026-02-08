# 📧 Sistema de Emails - SEENCEL

## Arquitectura

El sistema de emails de SEENCEL usa una **arquitectura de cola asíncrona** para envíos confiables sin bloquear operaciones críticas.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SQL Trigger   │───>│   email_queue   │───>│  Cron Job API   │───> Resend
│  (Supabase)     │    │    (tabla)      │    │   (Next.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Dos Mecanismos de Envío

| Mecanismo | Cuándo se usa | Ejemplo |
|-----------|---------------|---------|
| **Cola** (`email_queue` → CRON → Resend) | Emails disparados por triggers SQL o funciones DB | Welcome, Purchase, Admin Sale |
| **Directo** (`sendEmail()` desde server action) | Emails disparados por acciones del usuario en server | Team Invitation |

---

## 📂 Archivos Clave

| Tipo | Archivo / Ubicación | Descripción |
| :--- | :--- | :--- |
| **Estilos Base** | `src/features/emails/lib/email-base.tsx` | Estilos compartidos + componentes `EmailCardRow`, `EmailCardTotal`, `EmailHeader`, `EmailFooter` |
| **Traducciones** | `src/features/emails/lib/email-translations.ts` | Textos i18n compartidos (`es` / `en`) |
| **Tipos** | `src/features/emails/lib/email-types.ts` | Interfaces TypeScript de payloads |
| **Envío** | `src/features/emails/lib/send-email.ts` | Wrapper de Resend para envío directo |
| **Templates** | `src/features/emails/templates/` | Componentes React de cada email |
| **Procesador CRON** | `src/app/api/cron/process-email-queue/route.tsx` | `buildEmailComponent` que mapea `template_type` a componente |
| **Funciones DB** | `src/features/emails/FUNCTIONS.md` | Funciones SQL que insertan en la cola |
| **Esquema DB** | `src/features/emails/TABLES.md` | Tabla `email_queue` |
| **Auth Templates** | `src/features/emails/SUPABASE_AUTH_TEMPLATES.md` | Templates de Supabase Auth (confirm signup, reset password) |

---

## Componentes

### 1. Cola de Emails (`email_queue` tabla)
- Los eventos (registro, compra) insertan en `email_queue` vía SQL
- Campos: `recipient_email`, `template_type`, `subject`, `data`, `status`
- Estados: `pending` → `sent` | `failed`

### 2. Procesador de Cola (CRON)
- **Ruta:** `/api/cron/process-email-queue`
- **Archivo:** `src/app/api/cron/process-email-queue/route.tsx`
- **Frecuencia:** Cada 1 minuto (Vercel Cron)
- Procesa hasta 10 emails por ejecución
- Hasta 3 reintentos por email

### 3. Templates React
- **Ubicación:** `src/features/emails/templates/`
- Basados en componentes React renderizados por Resend

---

## 🏷️ Convenciones de Naming

### Funciones SQL (cola de email)

| Prefijo | Uso | Ejemplo |
| :--- | :--- | :--- |
| `queue_email_*` | Función standalone que inserta en `email_queue` (puede ser trigger) | `queue_email_welcome` |
| `step_*` | Sub-paso dentro de una función `handle_*` transaccional | `step_send_purchase_email` |

> ⚠️ **NO usar** `notify_*` para emails. Ese prefijo es exclusivo de **notificaciones in-app** del sistema.

### Archivos de Template

- **Nombre:** `{descripcion}-email.tsx` (kebab-case, siempre termina en `-email.tsx`)
- **Componente:** `{Descripcion}Email` (PascalCase)
- **Ejemplos:**
  - `welcome-email.tsx` → `WelcomeEmail`
  - `purchase-confirmation-email.tsx` → `PurchaseConfirmationEmail`
  - `bank-transfer-pending-email.tsx` → `BankTransferPendingEmail`

### template_type en email_queue

- Snake_case, sin prefijo `email_`
- Ejemplos: `welcome`, `purchase_confirmation`, `admin_sale_notification`, `team_invitation`

---

## 📋 Templates Existentes

| Template | `template_type` | Archivo | Disparador | Mecanismo |
| :--- | :--- | :--- | :--- | :--- |
| Welcome | `welcome` | `welcome-email.tsx` | Trigger `queue_email_welcome` en INSERT `users` | Cola |
| Purchase Confirmation | `purchase_confirmation` | `purchase-confirmation-email.tsx` | `step_send_purchase_email` en HANDLE functions | Cola |
| Course Purchase | `purchase_confirmation` | `course-purchase-confirmation-email.tsx` | Mismo step, bifurca por `product_type` | Cola |
| Admin Sale | `admin_sale_notification` | `admin-sale-notification-email.tsx` | `step_send_purchase_email` | Cola |
| Bank Transfer Pending | `bank_transfer_pending` | `bank-transfer-pending-email.tsx` | ⚠️ **SIN CONECTAR** — solo preview | — |
| Bank Transfer Verified | `bank_transfer_verified` | `bank-transfer-verified-email.tsx` | ⚠️ **SIN CONECTAR** — solo preview | — |
| Subscription Activated | `subscription_activated` | `subscription-activated-email.tsx` | ⚠️ **SIN CONECTAR** — solo preview | — |
| Subscription Expiring | `subscription_expiring` | `subscription-expiring-email.tsx` | ⚠️ **SIN CONECTAR** — solo preview | — |
| Subscription Expired | `subscription_expired` | `subscription-expired-email.tsx` | ⚠️ **SIN CONECTAR** — solo preview | — |
| Team Invitation | `team_invitation` | `team-invitation-email.tsx` | `sendInvitationAction` / `resendInvitationAction` | Directo |

---

## Triggers SQL

### Email de Bienvenida
```sql
-- Trigger: on_user_created_queue_email_welcome
-- Función: queue_email_welcome()
-- Se dispara: INSERT en public.users
```

### Email de Compra
```sql
-- Parte de: handle_payment_subscription_success / handle_payment_course_success
-- Función: step_send_purchase_email()
-- Se dispara: Pago exitoso en webhook MercadoPago
```

---

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

---

## 🚀 Agregar Nuevo Template (Paso a Paso)

### Paso 1: Crear el Template React

Crear archivo en `src/features/emails/templates/{nombre}-email.tsx`:

```tsx
import * as React from 'react';
import { emailBaseStyles, EmailHeader, EmailFooter, EmailCardRow, EmailCardTotal } from '../lib/email-base';
import { type EmailLocale } from '../lib/email-translations';

interface MiNuevoEmailProps {
    firstName: string;
    // ... props específicas
    locale?: EmailLocale;
}

export function MiNuevoEmail({
    firstName,
    locale = 'es',
}: Readonly<MiNuevoEmailProps>) {
    return (
        <div style={emailBaseStyles.container}>
            <EmailHeader />

            <div style={emailBaseStyles.content}>
                <h1 style={emailBaseStyles.title}>Título del Email</h1>

                <p style={emailBaseStyles.greeting}>Hola {firstName},</p>

                <p style={emailBaseStyles.text}>
                    Cuerpo del mensaje...
                </p>

                {/* Card con detalles (opcional) */}
                <div style={emailBaseStyles.card}>
                    <h3 style={emailBaseStyles.cardTitle}>Detalles</h3>
                    <EmailCardRow label="Campo 1" value="Valor 1" />
                    <EmailCardRow label="Campo 2" value="Valor 2" last />
                    {/* Total solo si aplica */}
                    <EmailCardTotal label="Total" value="USD 100" />
                </div>

                {/* CTA (opcional) */}
                <div style={emailBaseStyles.ctaContainer}>
                    <a href="https://seencel.com/destino" style={emailBaseStyles.cta}>
                        Botón de Acción
                    </a>
                </div>

                <p style={emailBaseStyles.smallText}>
                    Texto pequeño al pie...
                </p>
            </div>

            <EmailFooter locale={locale} />
        </div>
    );
}
```

### Paso 2: Exportar en `templates/index.ts`

```ts
export { MiNuevoEmail } from './mi-nuevo-email';
```

### Paso 3: Registrar en el Procesador CRON

Abrir `src/app/api/cron/process-email-queue/route.tsx` y agregar un nuevo `case` en `buildEmailComponent`:

```tsx
case "mi_nuevo_template": {
    return (
        <MiNuevoEmail
            firstName={String(data.user_name || "Usuario")}
            locale={locale}
        />
    );
}
```

> ⚠️ No olvidar importar el componente al inicio del archivo.

### Paso 4: Encolar desde SQL

Crear un archivo `.sql` en `/DB/` con la función que inserta en `email_queue`.

#### Opción A: Trigger automático (eventos de tabla)

```sql
CREATE OR REPLACE FUNCTION public.queue_email_mi_evento()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.email_queue (
        recipient_email,
        recipient_name,
        template_type,
        subject,
        data,
        created_at
    ) VALUES (
        NEW.email,
        COALESCE(NEW.full_name, 'Usuario'),
        'mi_nuevo_template',            -- Debe coincidir con el case del CRON
        'Asunto del Email',
        jsonb_build_object(
            'user_id', NEW.id,
            'user_name', COALESCE(NEW.full_name, 'Usuario'),
            'user_email', NEW.email
        ),
        NOW()
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'queue_email_mi_evento error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_tabla_queue_email_mi_evento
    AFTER INSERT ON public.mi_tabla
    FOR EACH ROW
    EXECUTE FUNCTION public.queue_email_mi_evento();
```

#### Opción B: Step dentro de función HANDLE (pagos, transacciones)

```sql
-- Dentro de handle_payment_xxx_success:
v_step := 'send_email';
PERFORM public.step_send_mi_email(
    p_user_id,
    p_amount,
    p_currency,
    v_payment_id
);
```

#### Opción C: Directo desde Server Action (sin cola)

```ts
import { sendEmail } from "@/features/emails/lib/send-email";
import { MiNuevoEmail } from "@/features/emails/templates/mi-nuevo-email";

await sendEmail({
    to: userEmail,
    subject: "Asunto del email",
    react: MiNuevoEmail({ firstName, locale: 'es' }),
});
```

### Paso 5: Ejecutar SQL y Documentar

1. Ejecutar el `.sql` en Supabase SQL Editor
2. Actualizar `TABLES.md` del feature correspondiente (si se agregó trigger)
3. Actualizar esta tabla de Templates Existentes en este README

---

## 🎨 Reglas de Diseño de Templates

### Componentes disponibles

| Componente | Uso |
| :--- | :--- |
| `EmailHeader` | Logo SEENCEL centrado (obligatorio) |
| `EmailFooter` | Links legales + copyright (obligatorio, acepta `locale`) |
| `EmailCardRow` | Fila label → valor dentro de un card. Props: `label`, `value`, `last?`, `mono?` |
| `EmailCardTotal` | Fila de total con borde superior. Props: `label`, `value` |

### ⛔ Prohibiciones

- **NUNCA** usar `display: flex` en estilos de email (no soportado por clientes de email)
- **NUNCA** usar `<div style={emailBaseStyles.cardRow}>` con `<span>` — usar siempre `<EmailCardRow>`
- **NUNCA** crear estilos custom para filas de card — usar los componentes provistos
- **NUNCA** usar CSS externo ni clases — todo es inline styles

### Estilos disponibles en `emailBaseStyles`

| Estilo | Descripción |
| :--- | :--- |
| `container` | Wrapper principal (max 520px) |
| `content` | Padding del contenido |
| `title` | Título principal (h1) |
| `greeting` | "Hola {nombre}," |
| `text` | Párrafo normal |
| `smallText` | Texto pequeño (footer del contenido) |
| `card` | Card con borde para detalles |
| `cardTitle` | Título del card (h3) |
| `ctaContainer` | Contenedor del botón CTA |
| `cta` | Botón de acción principal |
| `highlightBox` | Caja destacada (ej: referencia de pago) |
| `noticeBox` | Caja de aviso/warning |

---

## 🔒 Seguridad Anti-Spam (Turnstile)

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

---

## Testing

### Local (desarrollo)
```bash
# Disparar manualmente el procesador
curl http://localhost:3001/api/cron/process-email-queue
```

### Producción
- El cron se ejecuta automáticamente vía `vercel.json`
- Verifica en Vercel Dashboard → Cron Jobs

---

## 🔍 Troubleshooting

| Problema | Solución |
| :--- | :--- |
| Email no se envía | Verificar `RESEND_API_KEY` en env vars |
| Labels y valores pegados | Usar `EmailCardRow` en vez de `<div>` + `<span>` |
| Template no se renderiza | Verificar que el `template_type` en SQL coincida con el `case` en `route.tsx` |
| Email en `failed` | Revisar columna `last_error` en `email_queue` |
| Quiero bilingüe | Agregar prop `locale?: EmailLocale` y crear objeto de labels `es`/`en` |
| Captcha no aparece | Confirmar `NEXT_PUBLIC_TURNSTILE_SITE_KEY` está seteada |
| Email en cola pero status "failed" | Revisar `last_error`, verificar `template_type` tiene case en `buildEmailComponent` |
