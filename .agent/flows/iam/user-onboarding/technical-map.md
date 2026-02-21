# Technical Map: Onboarding de Usuario

> Referencia técnica exhaustiva. Consulta rápida, no tutorial.

---

## 1. Tablas involucradas

### `iam.users`

| Columna | Tipo | Para qué se usa |
|---------|------|-----------------|
| id | uuid | PK. Se busca por auth_id para obtener el user_id interno |
| auth_id | uuid | FK → auth.users.id. Se usa para resolver la identidad |
| full_name | text | Se ACTUALIZA con `firstName lastName` |
| signup_completed | bool | Se ACTUALIZA a `true` al completar onboarding |
| updated_at | timestamptz | Se ACTUALIZA con timestamp del submit |

### `iam.user_data`

| Columna | Tipo | Para qué se usa |
|---------|------|-----------------|
| user_id | uuid | FK → iam.users.id (UNIQUE). Clave del UPSERT |
| first_name | text | Se UPSERT con el nombre ingresado |
| last_name | text | Se UPSERT con el apellido ingresado |
| country | uuid | Se UPSERT con el country_id (auto-detectado o manual). FK → public.countries.id |

### `iam.user_preferences`

| Columna | Tipo | Para qué se usa |
|---------|------|-----------------|
| user_id | uuid | FK → iam.users.id. Filtro del UPDATE |
| timezone | text | Se ACTUALIZA con timezone auto-detectado del browser |
| home_checklist | jsonb | Usado por el onboarding checklist widget (post-onboarding) |

### `public.countries`

| Columna | Tipo | Para qué se usa |
|---------|------|-----------------|
| id | uuid | PK. Se usa como FK para user_data.country |
| name | text | Se muestra en el selector de países |
| alpha_2 | text | Se usa para match timezone→país (ej: "AR") |

---

## 2. Funciones SQL

No hay funciones SQL específicas para el onboarding. Toda la lógica se ejecuta desde Server Actions con queries directas a Supabase.

El onboarding usa el cliente Supabase normal (anon key + RLS), ya que el usuario está autenticado.

---

## 3. Archivos Frontend

### Pages

| Archivo | Tipo | Qué hace |
|---------|------|----------|
| `src/app/[locale]/(onboarding)/layout.tsx` | Server | Layout minimal (Fragment) |
| `src/app/[locale]/(onboarding)/onboarding/page.tsx` | Server | Auth check + fetch countries → render form |
| `src/app/[locale]/(onboarding)/workspace-setup/page.tsx` | Server | Chequea orgs/invitaciones → render setup view |

### Forms y Components

| Archivo | Tipo | Qué hace |
|---------|------|----------|
| `src/app/[locale]/(onboarding)/onboarding/onboarding-form.tsx` | Client | Form con auto-detect timezone→country, submit → /hub |
| `src/features/auth/components/auth-layout.tsx` | Client | Layout split-screen hero+form (mode: login/register/onboarding) |
| `src/components/ui/country-selector.tsx` | Client | Selector de países con búsqueda |

### Actions

| Archivo | Función | Qué hace |
|---------|---------|----------|
| `src/actions/onboarding.ts` | `submitOnboarding()` | Valida Zod, 3 updates DB, revalidate, return success |

### Queries

| Archivo | Función | Qué hace |
|---------|---------|----------|
| `src/features/countries/queries.ts` | `getCountries()` | SELECT public.countries ORDER BY name |
| `src/features/users/queries.ts` | `getUserProfile()` | Obtiene perfil con `signup_completed` |

### Guards

| Archivo | Lógica |
|---------|--------|
| `src/app/[locale]/(dashboard)/layout.tsx` | L57: `!profile.signup_completed` → redirect `/onboarding` |

### Onboarding Checklist (post-onboarding)

| Archivo | Qué hace |
|---------|----------|
| `src/features/onboarding/checklist/types.ts` | Define steps: create_project, create_contact, create_movement |
| `src/features/onboarding/checklist/use-onboarding-progress.ts` | Hook que computa progreso desde datos reales (no stored) |
| `src/features/onboarding/checklist/onboarding-checklist.tsx` | UI del checklist |
| `src/features/onboarding/checklist/onboarding-floating-widget.tsx` | Widget flotante en dashboard |
| `src/features/onboarding/checklist/onboarding-step.tsx` | Step individual |
| `src/features/onboarding/checklist/onboarding-widget-wrapper.tsx` | Wrapper del widget |

---

## 4. Routing (i18n)

| Ruta | Español | Inglés |
|------|---------|--------|
| `/onboarding` | `/bienvenida` | `/onboarding` |
| `/workspace-setup` | `/configurar-espacio` | `/workspace-setup` |

Definidas en `src/i18n/routing.ts`.

---

## 5. Cadena de datos completa

```
Dashboard Layout Guard
  └─ getUserProfile(authUser.id) → iam.users.signup_completed = false
       └─ redirect("/onboarding")

Onboarding Page (Server)
  ├─ auth.getUser() → verificar autenticación
  └─ getCountries() → SELECT public.countries

Onboarding Form (Client)
  ├─ useEffect → detectCountryFromTimezone()
  │    └─ Intl.DateTimeFormat().resolvedOptions().timeZone
  │         └─ TIMEZONE_TO_ALPHA2[tz] → alpha_2
  │              └─ countries.find(c => c.alpha_2 === alpha2) → setCountryId
  └─ handleSubmit(formData)
       ├─ formData.append("timezone", tz)
       ├─ formData.append("countryId", countryId)
       └─ submitOnboarding(null, formData)

submitOnboarding() (Server Action)
  ├─ Zod validate: { firstName: min(2), lastName: min(2), timezone?, countryId? }
  ├─ auth.getUser() → auth_id
  ├─ SELECT iam.users WHERE auth_id → internalUser.id
  ├─ UPDATE iam.users SET full_name, signup_completed=true, updated_at
  ├─ UPSERT iam.user_data ON CONFLICT (user_id) → first_name, last_name, country
  ├─ UPDATE iam.user_preferences SET timezone (non-critical)
  └─ revalidatePath("/", "layout")

Client → router.push("/hub") → router.refresh()
```

---

## 6. Datos recopilados

### Del usuario (explícitos)

| Dato | Campo | Obligatorio |
|------|-------|-------------|
| Nombre | firstName | ✅ Sí (min 2 chars) |
| Apellido | lastName | ✅ Sí (min 2 chars) |
| País | countryId | ❌ No (pero auto-detectado) |

### Del browser (implícitos/automáticos)

| Dato | Cómo se obtiene | Dónde se guarda |
|------|-----------------|-----------------|
| Timezone | `Intl.DateTimeFormat().resolvedOptions().timeZone` | `iam.user_preferences.timezone` |
| País (alpha_2) | Mapeado desde timezone → TIMEZONE_TO_ALPHA2 | `iam.user_data.country` (via countryId) |

### Del registro previo (ya existen en DB)

| Dato | Tabla | Se usa en onboarding |
|------|-------|---------------------|
| Email | `iam.users.email` | No se muestra ni edita |
| Avatar URL | `iam.users.avatar_url` | No se muestra |
| UTM params | `iam.user_acquisition` | No se toca |
