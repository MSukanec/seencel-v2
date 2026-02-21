# Decisiones de Diseño: Registro de Usuario

---

## Decisiones de Diseño

### D1: Guard de onboarding en Layout, no en Middleware

- **Elegimos**: Chequear `signup_completed` en `dashboard/layout.tsx` (Server Component)
- **Alternativa descartada**: Chequearlo en `middleware.ts` (como estaba antes)
- **Razón**: El middleware ejecuta en CADA request HTTP (incluyendo assets, API calls, prefetches). Hacer 2 queries DB ahí (getUserProfile + check) degradaba performance para todos los usuarios activos. Moverlo al layout significa que solo se ejecuta 1 vez cuando el Server Component renderiza, y el perfil ya se fetchea ahí para otros propósitos.

### D2: Trigger SECURITY DEFINER para el signup

- **Elegimos**: `iam.handle_new_user()` es SECURITY DEFINER
- **Alternativa descartada**: Usar service_role key o RLS permisiva para el insert
- **Razón**: Durante el trigger, no hay sesión de usuario autenticada (el INSERT en auth.users lo hace Supabase internamente). SECURITY DEFINER permite ejecutar como el owner de la función, bypaseando RLS.

### D3: Función consolidada (sin step functions)

- **Elegimos**: Una sola función `iam.handle_new_user()` con 4 INSERTs inline y tracking de `v_current_step`
- **Alternativa descartada**: 4 step functions separadas (era la implementación anterior)
- **Razón**: Las step functions eran de 1 línea cada una (un INSERT), no se reutilizaban en ningún otro lugar, tenían double error logging (step + parent), y agregaban 4 funciones SECURITY DEFINER innecesarias. La consolidación reduce surface de ataque, elimina overhead de context-switch, y simplifica debugging con un solo error handler + `v_current_step`.

### D4: UTM tracking en raw_user_meta_data

- **Elegimos**: Pasar UTM params como `data` en `supabase.auth.signUp(options.data)`, que se almacena en `auth.users.raw_user_meta_data`
- **Alternativa descartada**: Guardar UTMs en una tabla propia antes del signup
- **Razón**: Supabase Auth ya proporciona el mecanismo de metadata. La función inline lee esos datos y los persiste en `iam.user_acquisition`. No se necesita lógica adicional ni tablas intermedias.

### D5: Feature flag bloquea TODOS los métodos de registro

- **Elegimos**: Consultar `public.feature_flags` con key `auth_registration_enabled` y bloquear email + Google cuando está desactivado
- **Alternativa descartada**: Bloquear solo email (permitir Google como bypass)
- **Razón**: Si se quiere bloquear el registro, se bloquea por completo. Dejar Google abierto como escape no tiene sentido — un spammer podría crear cuentas de Google y registrarse igual.

### D6: Honeypot en vez de CAPTCHA

- **Elegimos**: Campo invisible `website_url` como honeypot
- **Alternativa descartada**: Google reCAPTCHA / hCaptcha
- **Razón**: Menos fricción para usuarios reales. Combinado con el delay de 1s y el domain blacklisting, es suficiente para el volumen actual. Si el spam escala, se puede agregar CAPTCHA en el futuro.

### D7: Signup en dos fases (registro + onboarding separados)

- **Elegimos**: El registro solo crea la cuenta (email/password). El onboarding (nombre/apellido) es un paso separado posterior
- **Alternativa descartada**: Pedir nombre/apellido en la misma página de registro
- **Razón**: Reduce la barrera de entrada: menos campos = más conversiones. El nombre/apellido se piden después, cuando el usuario ya "compró" la decisión de registrarse. Además permite que social auth (Google/Discord) skipee el nombre automáticamente si viene en la metadata.

### D8: role_id usa DEFAULT de la tabla (no hardcodeado)

- **Elegimos**: `handle_new_user` no pasa `role_id` explícitamente — usa el DEFAULT de `iam.users`
- **Alternativa descartada**: Pasar el UUID del rol como parámetro explícito (era la implementación anterior)
- **Razón**: El UUID `e6cc68d2-...` estaba hardcodeado en dos lugares (la tabla Y la función). Si en el futuro cambia el rol default, solo se cambia en un lugar (la tabla).

---

## Edge Cases y Gotchas

### E1: Doble ejecución del trigger

- **Escenario**: En edge cases, Supabase puede disparar el trigger dos veces (ej: retry después de timeout)
- **Impacto**: El guard `IF EXISTS (SELECT 1 FROM iam.users WHERE auth_id = NEW.id)` previene insertar un usuario duplicado
- **Estado**: ✅ Resuelto

### E2: Social auth (Google/Discord) sin email

- **Escenario**: Teóricamente un provider OAuth podría no enviar email
- **Impacto**: `handle_new_user` tiene guard explícito `IF NEW.email IS NULL OR trim(NEW.email) = ''` que logea y falla limpio
- **Estado**: ✅ Resuelto (guard agregado en 070d)

### E3: Usuario confirma email en otro dispositivo/browser

- **Escenario**: Laura se registra desde mobile pero confirma el email desde desktop
- **Impacto**: El callback exchange funciona en el browser que hizo click al link. El mobile no sabe que se confirmó hasta que refresque
- **Estado**: ℹ️ No es un problema — el trigger se ejecuta al confirmar independientemente del browser

### E4: Timezone del browser vs timezone del usuario

- **Escenario**: Laura usa un VPN y su timezone detectado es incorrecto
- **Impacto**: El timezone se guarda en onboarding como preferencia. Se usa para renderizar fechas
- **Estado**: ℹ️ El usuario puede cambiarlo manualmente en Configuración → Preferencias

---

## Relación con otros Flows

| Flow relacionado | Cómo se conecta |
|------------------|-----------------|
| **Creación de Organización** | Después del registro, el usuario crea su primera org desde el Hub. Usa `iam.handle_new_organization()` |
| **Invitaciones** | Un usuario puede registrarse a través de un link de invitación. El flujo de registro es el mismo, pero después de confirmar email se redirige a la aceptación de la invitación |
| **Social Auth (Google/Discord)** | Usa el mismo trigger `on_auth_user_created`, pero con metadata diferente (avatar, full_name pre-llenados) |
| **Telemetría** | Después del login exitoso, `PresenceProvider` comienza a enviar heartbeats con `iam.heartbeat()` |
