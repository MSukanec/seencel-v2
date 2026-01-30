# 📧 Personalización de Emails de Supabase Auth

Los emails de autenticación (confirmación de registro, reset de contraseña, etc.) son enviados directamente por **Supabase Auth**, no por nuestro sistema de cola.

## Cómo Personalizar

1. **Ir a Supabase Dashboard**
   - Abre tu proyecto en [app.supabase.com](https://app.supabase.com)
   - Navega a: **Authentication → Email Templates**

2. **Templates Disponibles**

| Template | Cuándo se Envía |
|----------|-----------------|
| Confirm signup | Al registrarse con email |
| Invite user | Al invitar un usuario |
| Magic Link | Login con magic link |
| Change Email Address | Al cambiar email |
| Reset Password | Al solicitar reset de contraseña |

3. **Editar el Template**
   - Click en el template que deseas personalizar
   - Modifica el HTML/texto

## Template Recomendado: Confirm Signup (Español)

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 40px 20px; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; }
        .header { padding: 32px 24px; text-align: center; border-bottom: 1px solid #e5e7eb; }
        .logo { width: 40px; height: 40px; }
        .content { padding: 32px 24px; }
        .title { font-size: 22px; font-weight: 600; color: #18181b; text-align: center; margin: 0 0 20px; }
        .text { font-size: 15px; color: #52525b; line-height: 1.6; margin: 0 0 16px; }
        .cta-container { text-align: center; margin: 28px 0; }
        .cta { display: inline-block; background: #18181b; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px; }
        .small { font-size: 13px; color: #71717a; line-height: 1.5; }
        .footer { padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #a1a1aa; }
        .footer a { color: #71717a; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://seencel.com/logo.png" alt="SEENCEL" class="logo">
        </div>
        <div class="content">
            <h1 class="title">Confirmá tu Cuenta</h1>
            <p class="text">Hola,</p>
            <p class="text">
                Gracias por registrarte en SEENCEL. Para completar tu registro y acceder a tu cuenta, hacé click en el botón de abajo.
            </p>
            <div class="cta-container">
                <a href="{{ .ConfirmationURL }}" class="cta">Confirmar mi Cuenta</a>
            </div>
            <p class="small">
                Si no creaste esta cuenta, podés ignorar este email.
            </p>
        </div>
        <div class="footer">
            <p>© 2026 SEENCEL. Todos los derechos reservados.</p>
            <p>
                <a href="https://seencel.com/privacy">Privacidad</a> • 
                <a href="https://seencel.com/terms">Términos</a>
            </p>
        </div>
    </div>
</body>
</html>
```

## Template: Reset Password (Español)

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 40px 20px; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; }
        .header { padding: 32px 24px; text-align: center; border-bottom: 1px solid #e5e7eb; }
        .logo { width: 40px; height: 40px; }
        .content { padding: 32px 24px; }
        .title { font-size: 22px; font-weight: 600; color: #18181b; text-align: center; margin: 0 0 20px; }
        .text { font-size: 15px; color: #52525b; line-height: 1.6; margin: 0 0 16px; }
        .cta-container { text-align: center; margin: 28px 0; }
        .cta { display: inline-block; background: #18181b; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px; }
        .small { font-size: 13px; color: #71717a; line-height: 1.5; }
        .footer { padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #a1a1aa; }
        .footer a { color: #71717a; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://seencel.com/logo.png" alt="SEENCEL" class="logo">
        </div>
        <div class="content">
            <h1 class="title">Restablecer Contraseña</h1>
            <p class="text">Hola,</p>
            <p class="text">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta. Hacé click en el botón de abajo para crear una nueva contraseña.
            </p>
            <div class="cta-container">
                <a href="{{ .ConfirmationURL }}" class="cta">Restablecer Contraseña</a>
            </div>
            <p class="small">
                Si no solicitaste este cambio, podés ignorar este email. Tu contraseña no cambiará.
            </p>
            <p class="small">
                Este enlace expira en 24 horas.
            </p>
        </div>
        <div class="footer">
            <p>© 2026 SEENCEL. Todos los derechos reservados.</p>
            <p>
                <a href="https://seencel.com/privacy">Privacidad</a> • 
                <a href="https://seencel.com/terms">Términos</a>
            </p>
        </div>
    </div>
</body>
</html>
```

## Variables Disponibles en Supabase

| Variable | Descripción |
|----------|-------------|
| `{{ .ConfirmationURL }}` | URL de confirmación/acción |
| `{{ .Email }}` | Email del usuario |
| `{{ .SiteURL }}` | URL del sitio (configurado en Supabase) |

## Subject Lines Recomendados

| Template | Subject (Español) |
|----------|-------------------|
| Confirm signup | `Confirmá tu cuenta en SEENCEL` |
| Reset Password | `Restablecer tu contraseña - SEENCEL` |
| Magic Link | `Tu enlace de acceso a SEENCEL` |
| Change Email | `Confirmá tu nuevo email - SEENCEL` |

## Multi-Idioma

> ⚠️ **Limitación**: Supabase Auth solo permite **un template por tipo**. 

**Opciones para multi-idioma:**

1. **Keep Spanish as default** (recomendado para LATAM)
   - Mantené el template en español ya que la mayoría de usuarios son hispanohablantes

2. **Custom SMTP + Edge Functions** (complejo)
   - Configurar custom SMTP
   - Usar Supabase Auth Hooks para interceptar y redirigir a tu sistema de emails
   - Esto permitiría usar nuestras plantillas React con locale

3. **Template bilingüe** (alternativa)
   - Mostrar ambos idiomas en el mismo email (no ideal pero funciona)

## Checklist

- [ ] Personalizar "Confirm signup" con el template proporcionado
- [ ] Personalizar "Reset Password" con el template proporcionado
- [ ] Actualizar Subject lines
- [ ] Verificar que el logo sea accesible en `https://seencel.com/logo.png`
