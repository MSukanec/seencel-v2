# User Journey: Onboarding de Usuario

> Tutorial paso a paso de lo que vive un usuario recién registrado.

## Escenario

Jorge acaba de confirmar su email (o se registró con Google). Su perfil interno existe en `iam.users` con `signup_completed=false`. Es su primera interacción real con el dashboard.

---

## Paso 1: Redirect automático al Onboarding

**Qué pasa**: Jorge intenta acceder a `/hub` (o cualquier ruta del dashboard).

**Guard**: `src/app/[locale]/(dashboard)/layout.tsx` línea 57:
```tsx
if (profile && !profile.signup_completed) {
    return redirect('/onboarding');
}
```

- **Tabla leída**: `iam.users` (`signup_completed`)
- **Archivo**: `src/features/users/queries.ts` → `getUserProfile()`
- **Estado**: ✅ Funciona

> ⚠️ El guard está en el layout del dashboard, NO en middleware. Esto evita una query extra por cada HTTP request.

---

## Paso 2: Página de Onboarding

**Qué ve Jorge**: Pantalla split-screen:
- **Izquierda**: Hero con logo SEENCEL, quote, fondo dark con gradientes
- **Derecha**: Formulario con título "Bienvenido a Seencel"

**Datos que se muestran**:
- Input Nombre (requerido, min 2 chars)
- Input Apellido (requerido, min 2 chars) 
- Country Selector (auto-detectado, opcional)
- Botón "Comenzar a Construir"
- Link "¿No eres tú? Cerrar sesión"

**Server Component** (`page.tsx`): 
- Verifica autenticación (`auth.getUser()`)
- Fetch países: `getCountries()` → `public.countries`
- Renderiza `<OnboardingForm countries={countries} />`

**Archivos**:
| Archivo | Tipo | Qué hace |
|---------|------|----------|
| `src/app/[locale]/(onboarding)/onboarding/page.tsx` | Server | Auth check + fetch countries |
| `src/app/[locale]/(onboarding)/onboarding/onboarding-form.tsx` | Client | Form + auto-detección + submit |
| `src/features/auth/components/auth-layout.tsx` | Client | Layout split-screen (mode=onboarding) |
| `src/features/countries/queries.ts` | Server | `getCountries()` → public.countries |

- **Tabla leída**: `public.countries` (id, name, alpha_2)
- **Estado**: ✅ Funciona

---

## Paso 3: Auto-detección de datos (invisible al usuario)

**Qué pasa**: Jorge no hace nada. El browser detecta automáticamente:

### 3a. País desde timezone
```
Intl.DateTimeFormat().resolvedOptions().timeZone → "America/Argentina/Buenos_Aires"
→ startsWith("America/Argentina") → alpha_2 = "AR"
→ countries.find(c => c.alpha_2 === "AR") → country.id
→ setCountryId(match.id)
```

El selector de país aparece pre-seleccionado con "Argentina".

### 3b. Timezone (al submit)
```
Intl.DateTimeFormat().resolvedOptions().timeZone → "America/Argentina/Buenos_Aires"
→ formData.append("timezone", timezone)
```

Se envía como campo oculto. Jorge nunca lo ve.

**Cobertura del mapa timezone→país**: 24 timezones mapeados (AR, MX, CO, PE, CL, UY, PY, BO, EC, VE, PA, CR, GT, CU, DO, HN, NI, SV, BR, US, ES). Si el timezone no coincide → país vacío, el usuario elige manual.

- **Estado**: ✅ Funciona

---

## Paso 4: Jorge completa el form y hace submit

**Qué ingresa Jorge**: Nombre: "Jorge", Apellido: "Benittest"

**Action**: `submitOnboarding()` en `src/actions/onboarding.ts`

### Validación
```
Zod: { firstName: min(2), lastName: min(2), timezone: optional, countryId: uuid.optional }
```

### Escrituras a DB (3 operaciones secuenciales)

| # | Operación | Tabla | Campos | Notas |
|---|-----------|-------|--------|-------|
| 1 | UPDATE | `iam.users` | `full_name`, `signup_completed=true`, `updated_at` | Marca onboarding como completado |
| 2 | UPSERT | `iam.user_data` | `first_name`, `last_name`, `country` (si existe) | ON CONFLICT user_id |
| 3 | UPDATE | `iam.user_preferences` | `timezone` | Solo si se detectó timezone. Error es non-critical |

### Después del submit
```
revalidatePath("/", "layout") → invalida todo el cache
router.push("/hub") → redirect al Hub
router.refresh() → re-fetch del server
```

- **Estado**: ✅ Funciona

---

## Paso 5: Hub (sin organización)

**Qué ve Jorge**: El Hub personalizado con su nombre. Pero como no tiene organización, el dashboard le muestra opciones.

**Archivo**: `src/app/[locale]/(dashboard)/hub/page.tsx`

Este page NO redirige automáticamente a workspace-setup. El Hub siempre se renderiza, y Jorge ve el contenido del Hub (hero sections, cursos recientes, etc.).

- **Tabla leída**: múltiples (organizations, hero_sections, user_preferences, courses)
- **Estado**: ✅ Funciona

---

## Paso 6: Workspace Setup (crear org o aceptar invitación)

**Cuándo llega Jorge**: Cuando navega a `/workspace-setup` (o es redirigido por el sidebar cuando no tiene org).

**Qué ve**: Dos opciones:
1. **Crear nueva organización**: Form con nombre de la org
2. **Aceptar invitación pendiente**: Si alguien lo invitó a una org existente

**Server Component** (`workspace-setup/page.tsx`):
- Verifica auth
- Fetch paralelo: orgs del usuario + es admin + invitaciones pendientes
- Si ya tiene org y NO está creando una nueva → redirect `/organization`

**Archivo**: `src/app/[locale]/(onboarding)/workspace-setup/page.tsx`

- **Tablas leídas**: `iam.organization_members`, invitaciones, `iam.users`
- **Estado**: ✅ Funciona

---

## Paso 7: Onboarding Checklist (post-organización)

**Cuándo aparece**: Cuando Jorge ya tiene una organización y está en el dashboard.

**Qué ve**: Un widget flotante con 3 pasos:
1. ✅/⬜ Crear tu primer proyecto → `/organization/projects`
2. ✅/⬜ Agregar un contacto → `/organization/contacts`
3. ✅/⬜ Registrar un movimiento → `/organization/finance`

**Cómo funciona**: NO guarda estado del checklist. Se **computa desde datos reales**:
```
projects.count > 0 → create_project ✅
contacts.count > 0 → create_contact ✅
movements.count > 0 → create_movement ✅
```

**Dismissal**: Cuando los 3 están ✅ en `user_preferences.home_checklist`, se marca como dismissed y no se muestra más.

**Archivos**:
| Archivo | Qué hace |
|---------|----------|
| `src/features/onboarding/checklist/types.ts` | Steps y defaults |
| `src/features/onboarding/checklist/use-onboarding-progress.ts` | Hook que computa desde DB |
| `src/features/onboarding/checklist/onboarding-checklist.tsx` | UI del checklist |
| `src/features/onboarding/checklist/onboarding-floating-widget.tsx` | Widget flotante |
| `src/features/onboarding/checklist/onboarding-step.tsx` | Step individual |
| `src/features/onboarding/checklist/onboarding-widget-wrapper.tsx` | Wrapper |

- **Tablas leídas**: `projects.projects`, `projects.contacts`, `finance.movements`, `iam.user_preferences`
- **Estado**: ✅ Funciona

---

## Diagrama completo

```
┌────────────────────────────────────────────────────────────┐
│                    REGISTRO (Flow anterior)                │
│  auth.users INSERT → iam.handle_new_user()                │
│  → iam.users (signup_completed=false)                     │
│  → iam.user_data (vacío)                                  │
│  → iam.user_preferences (defaults)                        │
│  → iam.user_acquisition (UTMs)                            │
│  → notifications.notify_admin_on_new_user()               │
│  → notifications.queue_email_welcome()                    │
└───────────────────────┬────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│            DASHBOARD GUARD (layout.tsx L57)                │
│  getUserProfile() → signup_completed=false                 │
│  → redirect("/onboarding")                                │
└───────────────────────┬────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│            ONBOARDING PAGE (/bienvenida)                  │
│                                                            │
│  Server: auth check + getCountries()                      │
│  Client: auto-detect timezone + country                   │
│                                                            │
│  ┌─────────────────────────────────────────┐              │
│  │  Nombre:    [  Jorge    ]               │              │
│  │  Apellido:  [  Benittest]               │              │
│  │  País:      [  Argentina ▼]  ← auto     │              │
│  │  Timezone:  (hidden)  ← auto            │              │
│  │  [     Comenzar a Construir     ]       │              │
│  └─────────────────────────────────────────┘              │
└───────────────────────┬────────────────────────────────────┘
                        │ submitOnboarding()
                        ▼
┌────────────────────────────────────────────────────────────┐
│               SERVER ACTION (3 updates)                    │
│                                                            │
│  1. UPDATE iam.users         → full_name, signup_completed │
│  2. UPSERT iam.user_data    → first_name, last_name, país │
│  3. UPDATE iam.user_preferences → timezone                 │
│                                                            │
│  revalidatePath("/") → router.push("/hub")                │
└───────────────────────┬────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│                     HUB (/hub)                            │
│  Dashboard personalizado. Sin organización aún.           │
│  → sidebar redirige a /workspace-setup                    │
└───────────────────────┬────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│         WORKSPACE SETUP (/configurar-espacio)             │
│                                                            │
│  Opción A: Crear nueva organización                       │
│  Opción B: Aceptar invitación pendiente                   │
│                                                            │
│  → redirect "/organization"                               │
└───────────────────────┬────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│         DASHBOARD + ONBOARDING CHECKLIST WIDGET           │
│                                                            │
│  ⬜ Crear tu primer proyecto                               │
│  ⬜ Agregar un contacto                                    │
│  ⬜ Registrar un movimiento                                │
│                                                            │
│  (Computado desde datos reales, no stored)                │
└────────────────────────────────────────────────────────────┘
```
