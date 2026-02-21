# User Journey: Registro de Usuario

> Tutorial paso a paso del registro de un usuario nuevo.

## Escenario

Laura es una arquitecta que nunca usó Seencel. Llega al sitio desde una búsqueda de Google (UTM: utm_source=google, utm_medium=cpc).

---

## Paso 1: Acceder a la página de Signup

**Qué hace**: Laura navega a `/signup` (o `/es/signup` con i18n).

**Frontend**:
- Page: `src/app/[locale]/(auth)/signup/page.tsx`
- La página renderiza dos opciones: botón de Google y botón de Email con formulario
- Los parámetros UTM se capturan automáticamente de la URL y se almacenan en hidden inputs
- Si el feature flag `auth_registration_enabled` está desactivado, AMBOS métodos se deshabilitan y se muestra una alerta naranja

**Estado**: ✅ Funciona

---

## Paso 2: Completar formulario y submitear (Email)

**Qué hace**: Laura elige email, ingresa su email y una contraseña que cumpla los requisitos (8+ chars, mayúscula, minúscula, número).

**Frontend**:
- Server Action: `src/actions/auth/register.ts` → `registerUser()`
- Validación Zod del schema `registerSchema`
- Anti-bot: delay artificial de 1s + honeypot (`website_url` → si se completa, simula éxito y no hace nada)
- Domain blacklisting: emails `@example.com` rechazados
- Feature flag check: consulta `public.feature_flags` donde `key='auth_registration_enabled'` y `status='active'`

**Tabla(s)**:
- `public.feature_flags` (SELECT) — verifica si el registro está habilitado

**Llamada a Supabase**: `supabase.auth.signUp({ email, password, options: { emailRedirectTo, data: { utm_* } } })`

**Estado**: ✅ Funciona

---

## Paso 2B: Registro con Google (alternativa)

**Qué hace**: Laura elige Google en vez de email. Se redirige a Google OAuth.

**Frontend**:
- Component: `src/features/auth/components/google-auth-button.tsx`
- Llama: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`
- Acepta prop `disabled` para cuando el feature flag está desactivado

**Estado**: ✅ Funciona

---

## Paso 3: Confirmación por email

**Qué hace**: Supabase Auth envía automáticamente un email de confirmación (solo para email signup). Laura lo recibe y hace click en el link. Para Google, este paso se skipea.

**Infraestructura**: Supabase Auth maneja esto — el link contiene un `code` que apunta a `/auth/callback?code=xxx`.

**Estado**: ✅ Funciona (gestionado por Supabase)

---

## Paso 4: Auth Callback — Exchange y redirect

**Qué hace**: El link de confirmación (o Google OAuth) redirige a `/auth/callback?code=xxx`. La route handler intercambia el código por una sesión.

**Frontend**:
- Route Handler: `src/app/auth/callback/route.ts`
- Lógica: `supabase.auth.exchangeCodeForSession(code)` → si OK, redirige a `/${locale}/hub`
- Si falla: redirige a `/${locale}/login?error=auth_callback_error`
- Cookie `NEXT_LOCALE` se usa para el locale (fallback a `es`)

**Tabla(s)**:
- `auth.users` (INSERT automático por Supabase Auth al confirmar email / completar OAuth)

**Estado**: ✅ Funciona

---

## Paso 5: Trigger — Creación automática del perfil

**Qué hace**: Al insertarse el row en `auth.users`, el trigger `on_auth_user_created` ejecuta `iam.handle_new_user()` automáticamente.

**Trigger**: `on_auth_user_created` ON `auth.users` AFTER INSERT → `iam.handle_new_user()`

**Función SQL**: `iam.handle_new_user()` (SECURITY DEFINER, search_path = `iam`)

Secuencia (todo inline en UNA función):
1. **Guard email**: Si `NEW.email` es NULL o vacío → logea error + falla
2. **Guard anti-duplicado**: Si ya existe user con ese `auth_id` → retorna sin hacer nada
3. **Extract provider**: De `raw_app_meta_data` o `raw_user_meta_data` (google/discord/email)
4. **Extract avatar**: URL de `raw_user_meta_data` (avatar_url o picture)
5. **Extract full_name**: De metadata o usa parte del email antes del `@`
6. **INSERT `iam.users`**: auth_id, email (lower), full_name, avatar_url, avatar_source. `role_id` usa DEFAULT de la tabla
7. **INSERT `iam.user_acquisition`**: UTM params extraídos de `raw_user_meta_data`, con ON CONFLICT
8. **INSERT `iam.user_data`**: Solo `user_id` — nombre/apellido vacíos
9. **INSERT `iam.user_preferences`**: Solo `user_id` — defaults de la tabla

**Tabla(s)**:
- `iam.users` (INSERT) — `signup_completed = false` (default)
- `iam.user_acquisition` (INSERT) — tracking UTM
- `iam.user_data` (INSERT) — esqueleto vacío
- `iam.user_preferences` (INSERT) — preferencias por defecto

**Error handling**: Un solo `EXCEPTION` handler con `v_current_step` que indica exactamente qué paso falló. Se logea en `log_system_error` con severity `critical`.

**Estado**: ✅ Funciona

---

## Paso 6: Dashboard Layout Guard — Redirect a Onboarding

**Qué hace**: Laura llega al dashboard (`/hub`). El Server Component del layout chequea `profile.signup_completed`. Como es `false`, la redirige a `/onboarding`.

**Frontend**:
- Layout: `src/app/[locale]/(dashboard)/layout.tsx` (línea ~57)
- Query: `getUserProfile()` desde `src/features/users/queries.ts` — obtiene `signup_completed`
- Si `signup_completed = false` → `redirect('/onboarding')`

**Nota de optimización**: Este check se movió del middleware al layout para evitar 2 queries DB por cada HTTP request. El middleware solo maneja auth básico (sesión activa sí/no).

**Estado**: ✅ Funciona

---

## Paso 7: Onboarding — Completar perfil personal

**Qué hace**: Laura ve un formulario donde ingresa su nombre, apellido, y opcionalmente su país y timezone.

**Frontend**:
- Page: `src/app/[locale]/(onboarding)/onboarding/` (route group)
- Form: `src/app/[locale]/(onboarding)/onboarding/onboarding-form.tsx`
- Server Action: `src/actions/onboarding.ts` → `submitOnboarding()`

**Lógica del action**:
1. Validar con Zod (`firstName` min 2 chars, `lastName` min 2 chars, timezone y countryId opcionales)
2. Obtener auth user → buscar `iam.users` por `auth_id`
3. UPDATE `iam.users`: `full_name = "Nombre Apellido"`, `signup_completed = true`
4. UPSERT `iam.user_data`: `first_name`, `last_name`, `country` (si se proveyó)
5. UPDATE `iam.user_preferences`: `timezone` (si se detectó del browser)

**Tabla(s)**:
- `iam.users` (UPDATE) — `full_name`, `signup_completed = true`
- `iam.user_data` (UPSERT por `user_id`) — `first_name`, `last_name`, `country`
- `iam.user_preferences` (UPDATE) — `timezone`

**Estado**: ✅ Funciona

---

## Paso 8: Acceso al Hub

**Qué hace**: Después del onboarding, Laura es redirigida al Hub. Como no tiene organización, ve el estado vacío con opción de crear una.

> ⚠️ El flujo de creación de organización es un flow separado.

**Estado**: ✅ Funciona

---

## Diagrama completo

```
┌─────────────────┐
│  Landing Page   │
│  (seencel.com)  │
└────────┬────────┘
         │ Click "Registrarse"
         ▼
┌─────────────────────────────┐
│  Signup Page                │  ← UTM params capturados de URL
│  (auth)/signup              │  ← Feature flag bloquea AMBOS métodos
│                             │
│  ┌──────────────────────┐   │
│  │ Google OAuth Button  │   │  ← disabled si flag apagado
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ Email + Password     │   │  ← Honeypot, Zod, blacklist
│  └──────────────────────┘   │
└────────┬────────────────────┘
         │ Submit (email) / OAuth redirect (Google)
         ▼
┌─────────────────────────┐
│  registerUser()         │  ← Server Action (solo email)
│  1. Feature flag check  │
│  2. Zod validation      │
│  3. Honeypot check      │
│  4. supabase.auth.signUp│  ← Con UTM en metadata
└────────┬────────────────┘
         │ Email enviado / Google redirect
         ▼
┌─────────────────────────┐
│  Auth Callback          │  ← route.ts
│  exchangeCodeForSession │
│  Redirect → /hub        │
└────────┬────────────────┘
         │
         ▼ (simultáneo con la confirmación)
┌──────────────────────────────────────────┐
│  DB TRIGGER: on_auth_user_created        │
│  auth.users INSERT → iam.handle_new_user │
│                                          │
│  [Todo inline, v_current_step tracking]  │
│  1. Guard email NOT NULL                 │
│  2. Guard auth_id duplicado              │
│  3. INSERT iam.users                     │
│  4. INSERT iam.user_acquisition          │
│  5. INSERT iam.user_data                 │
│  6. INSERT iam.user_preferences          │
└──────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Dashboard Layout Guard │
│  signup_completed=false  │
│  → Redirect /onboarding │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Onboarding Page            │
│  submitOnboarding()         │
│                             │
│  1. UPDATE iam.users        │  ← full_name, signup_completed=true
│  2. UPSERT iam.user_data   │  ← first_name, last_name, country
│  3. UPDATE iam.user_prefs  │  ← timezone
└────────┬────────────────────┘
         │
         ▼
┌─────────────────┐
│  Hub (vacío)    │  ← Sin organización, puede crear una
└─────────────────┘
```
