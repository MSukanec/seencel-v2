# Technical Map: Registro de Usuario

> Referencia técnica exhaustiva. Consulta rápida, no tutorial.

---

## 1. Tablas involucradas

### `auth.users` (Supabase Auth — externa)

| Columna | Tipo | Para qué se usa |
|---------|------|-----------------|
| id | uuid | PK. Se guarda como `auth_id` en `iam.users` |
| email | text | Email del usuario |
| raw_user_meta_data | jsonb | UTM params, avatar_url, full_name, provider |
| raw_app_meta_data | jsonb | Provider de auth (google, discord, email) |

### `iam.users`

| Columna | Tipo | Para qué se usa |
|---------|------|-----------------|
| id | uuid | PK. User ID del sistema (todas las FKs usan este) |
| auth_id | uuid | FK → auth.users.id. Único link con Supabase Auth |
| email | text | Email (lowercased) |
| full_name | text | Nombre completo (se actualiza en onboarding) |
| avatar_url | text | URL de avatar (de Google/Discord o null) |
| avatar_source | avatar_source_t | Enum: 'email', 'google', 'discord' |
| role_id | uuid | FK → iam.roles. Default: `e6cc68d2-...` (rol "user") |
| signup_completed | bool | `false` → en onboarding. `true` → puede usar dashboard |
| is_active | bool | Soft delete flag |

### `iam.user_acquisition`

| Columna | Tipo | Para qué se usa |
|---------|------|-----------------|
| user_id | uuid | FK → iam.users.id |
| source | text | UTM source (fallback: 'direct') |
| medium | text | UTM medium |
| campaign | text | UTM campaign |
| content | text | UTM content |
| landing_page | text | Primera página que visitó |
| referrer | text | Referrer HTTP |

### `iam.user_data`

| Columna | Tipo | Para qué se usa |
|---------|------|-----------------|
| user_id | uuid | FK → iam.users.id (UNIQUE) |
| first_name | text | Se llena en onboarding |
| last_name | text | Se llena en onboarding |
| country | uuid | País (opcional, se llena en onboarding) |
| phone_e164 | text | Teléfono (se llena más adelante) |
| birthdate | date | Fecha de nacimiento (se llena más adelante) |

### `iam.user_preferences`

| Columna | Tipo | Para qué se usa |
|---------|------|-----------------|
| user_id | uuid | FK → iam.users.id (UNIQUE) |
| last_organization_id | uuid | Última org activa (null al registrarse) |
| theme | text | Default: 'dark' |
| language | text | Default: 'es' |
| layout | text | Default: 'classic' |
| sidebar_mode | text | Default: 'docked' |
| timezone | text | Se actualiza en onboarding |
| home_checklist | jsonb | Checklist del home (todas false) |
| home_banner_dismissed | bool | Default: false |

### `public.feature_flags`

| Columna | Tipo | Para qué se usa |
|---------|------|-----------------|
| key | text | `auth_registration_enabled` |
| status | text | `active` = registro habilitado |

---

## 2. Funciones SQL

### `iam.handle_new_user()` — Trigger function

- **Tipo**: TRIGGER (AFTER INSERT on auth.users)
- **Security**: SECURITY DEFINER
- **search_path**: `iam, public, billing`
- **Lógica**: Guard anti-dupl → detect provider → extract avatar → extract name → 4 steps
- **Schema**: `DB/schema/iam/functions_2.md`

### `iam.step_create_user(auth_id, email, full_name, avatar_url, avatar_source, role_id)`

- **Tipo**: FUNCTION → uuid
- **Lógica**: INSERT en `iam.users`, retorna `v_user_id`
- **Schema**: `DB/schema/iam/functions_3.md`

### `iam.step_create_user_acquisition(user_id, raw_meta)`

- **Tipo**: FUNCTION → void
- **Lógica**: INSERT/UPSERT en `iam.user_acquisition` extrayendo UTMs de jsonb
- **Schema**: `DB/schema/iam/functions_3.md`

### `iam.step_create_user_data(user_id)`

- **Tipo**: FUNCTION → void
- **Lógica**: INSERT esqueleto vacío en `iam.user_data`
- **Schema**: `DB/schema/iam/functions_3.md`

### `iam.step_create_user_preferences(user_id)`

- **Tipo**: FUNCTION → void
- **Lógica**: INSERT con defaults en `iam.user_preferences`
- **Schema**: `DB/schema/iam/functions_3.md`

---

## 3. Archivos Frontend

### Queries

| Archivo | Función | Qué hace |
|---------|---------|----------|
| `src/features/users/queries.ts` | `getUserProfile()` | Obtiene perfil con `signup_completed` |

### Actions

| Archivo | Función | Qué hace |
|---------|---------|----------|
| `src/actions/auth/register.ts` | `registerUser()` | Valida, chequea feature flag, llama `signUp()` |
| `src/actions/onboarding.ts` | `submitOnboarding()` | Actualiza perfil, marca `signup_completed=true` |

### Forms y Pages

| Archivo | Tipo | Qué hace |
|---------|------|----------|
| `src/app/[locale]/(auth)/signup/page.tsx` | Page | Página de registro con form |
| `src/app/auth/callback/route.ts` | Route Handler | Exchange code → redirect |
| `src/app/[locale]/(onboarding)/onboarding/onboarding-form.tsx` | Form | Form de onboarding (nombre, apellido) |

### Guards

| Archivo | Lógica |
|---------|--------|
| `src/middleware.ts` | Auth básico: sesión activa → redirige de auth pages al dashboard. NO chequea `signup_completed` (optimización) |
| `src/app/[locale]/(dashboard)/layout.tsx` | Chequea `signup_completed`. Si `false` → redirect `/onboarding` |

---

## 4. Cadena de datos completa

```
Browser → registerUser() (Server Action)
  ├─ Zod validation (email, password, UTMs)
  ├─ Feature flag check (public.feature_flags)
  ├─ Honeypot check
  └─ supabase.auth.signUp({ email, password, data: UTMs })
       └─ Supabase Auth → INSERT auth.users → envía email

Email confirmation click → /auth/callback?code=xxx
  └─ exchangeCodeForSession(code) → redirect /hub
       └─ auth.users INSERT → TRIGGER on_auth_user_created
            └─ iam.handle_new_user()
                 ├─ iam.step_create_user()         → iam.users (signup_completed=false)
                 ├─ iam.step_create_user_acquisition() → iam.user_acquisition
                 ├─ iam.step_create_user_data()    → iam.user_data (vacío)
                 └─ iam.step_create_user_preferences() → iam.user_preferences

Dashboard Layout → getUserProfile() → signup_completed=false → redirect /onboarding

Onboarding Form → submitOnboarding() (Server Action)
  ├─ Zod validation (firstName, lastName)
  ├─ auth.getUser() → auth_id
  ├─ SELECT iam.users WHERE auth_id → user_id
  ├─ UPDATE iam.users SET full_name, signup_completed=true
  ├─ UPSERT iam.user_data SET first_name, last_name, country
  └─ UPDATE iam.user_preferences SET timezone

Hub → Usuario listo (sin org)
```

---

## 5. Triggers

| Tabla | Trigger | Evento | Función |
|-------|---------|--------|---------|
| `auth.users` | `on_auth_user_created` | AFTER INSERT | `iam.handle_new_user()` |

> ⚠️ Este trigger está en el schema `auth` de Supabase y no aparece en el introspector automático.

---

## 6. RLS

Las step functions usan `SECURITY DEFINER`, por lo que bypassean RLS durante el signup. Las tablas `iam.users`, `iam.user_data`, `iam.user_preferences` y `iam.user_acquisition` tienen sus propias RLS para operaciones normales post-signup.

El onboarding usa el cliente Supabase normal (anon key + RLS), ya que el usuario ya está autenticado en ese punto. Las RLS de `iam.users` permiten UPDATE donde `iam.is_self(id)` sea true.
