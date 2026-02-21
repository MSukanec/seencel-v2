# Design Decisions: Onboarding de Usuario

> Por qué se hizo así.

---

## Decisiones de Diseño

### D1: Guard en layout del dashboard, no en middleware

- **Elegimos**: Chequear `signup_completed` en `(dashboard)/layout.tsx`, no en `middleware.ts`
- **Alternativa descartada**: Middleware check con regex de rutas
- **Razón**: El middleware se ejecuta en CADA request HTTP (incluyendo assets, API routes, etc.). El check en el layout solo se ejecuta cuando el usuario realmente navega al dashboard, evitando una query extra innecesaria en cada request.

### D2: Server Action en vez de API Route

- **Elegimos**: `submitOnboarding()` como Server Action con `useActionState`
- **Alternativa descartada**: API Route POST `/api/onboarding`
- **Razón**: Las Server Actions de Next.js proveen validación Zod integrada, tipado end-to-end, y progressive enhancement. No necesitamos un endpoint REST para un form simple de 3 campos.

### D3: Auto-detección de país desde timezone

- **Elegimos**: Mapa estático `TIMEZONE_TO_ALPHA2` con 24 timezones → alpha_2 codes
- **Alternativa descartada**: API de geolocalización por IP (ipinfo.io, MaxMind)
- **Razón**: Zero dependencias externas, zero latencia, zero costo. La detección es "best effort" — si no matchea, el usuario elige manual. Cubre los principales mercados de Seencel (LATAM, España, USA).

### D4: Timezone como campo implícito (no editable)

- **Elegimos**: Detectar timezone del browser y enviarlo como hidden field
- **Alternativa descartada**: Selector manual de timezone
- **Razón**: El 99% de los usuarios tienen su timezone configurado correctamente en el OS. No queremos complicar el onboarding con un selector técnico. Si el timezone es incorrecto, se puede cambiar después en settings.

### D5: Form mínimo (solo nombre y apellido obligatorios)

- **Elegimos**: Solo 2 campos obligatorios + 1 auto-detectado
- **Alternativa descartada**: Form extendido con teléfono, empresa, industria, etc.
- **Razón**: Minimizar fricción = maximizar conversión. Todo lo demás se puede pedir después (perfil, settings, onboarding org). El objetivo es que el usuario llegue al dashboard lo más rápido posible.

### D6: UPSERT en user_data en vez de UPDATE

- **Elegimos**: `UPSERT ON CONFLICT (user_id)` para user_data
- **Alternativa descartada**: `UPDATE WHERE user_id = x`
- **Razón**: El trigger `handle_new_user` ya crea el row de `user_data` (vacío), pero por robustez usamos UPSERT. Si por alguna race condition el row no existe, el UPSERT lo crea en vez de fallar silenciosamente.

### D7: Onboarding checklist computado desde datos reales

- **Elegimos**: Computar progreso consultando `projects.count > 0`, `contacts.count > 0`, `movements.count > 0`
- **Alternativa descartada**: Guardar checklist como JSON estático en `user_preferences.home_checklist`
- **Razón**: Los datos pueden cambiar (importaciones, otro miembro crea datos). Si el checklist fuera estático, podría desincronizarse. El campo `home_checklist` solo se usa como flag de "dismissed" (cundo las 3 son true).

### D8: Layout de onboarding dentro de route group `(onboarding)`

- **Elegimos**: Route group `(onboarding)` separado de `(dashboard)` y `(auth)`
- **Alternativa descartada**: Renderizar onboarding dentro del dashboard layout
- **Razón**: El onboarding no tiene sidebar, no tiene header, no tiene stores. Necesita su propio layout limpio (que actualmente es un Fragment vacío). Ponerlo dentro del dashboard cargaría toda la infraestructura innecesariamente.

---

## Edge Cases y Gotchas

### E1: Google OAuth — nombre ya viene pre-llenado

- **Impacto**: Cuando el usuario se registra con Google, `handle_new_user` ya extrae `full_name` del provider. En el onboarding, el form aparece vacío y el usuario tiene que re-ingresarlo.
- **Solución futura**: Pre-llenar el form con datos del provider si existen (leer `iam.users.full_name` y `iam.user_data.first_name/last_name` en el page.tsx).

### E2: Timezone indetectable

- **Impacto**: Si `Intl.DateTimeFormat()` falla o retorna un timezone que no está en el mapa, el país queda vacío. El timezone se envía como string raw (ej: "UTC") pero no se guarda en user_preferences si el browser no lo soporta.
- **Solución actual**: El timezone es optional en el schema Zod, y el error de update es "non-critical" (no falla el onboarding).

### E3: Backend duplicado — full_name vs first_name/last_name

- **Impacto**: Los mismos datos se escriben en 2 tablas diferentes con formatos diferentes:
  - `iam.users.full_name` = "Jorge Benittest" (concatenado)
  - `iam.user_data.first_name` = "Jorge", `last_name` = "Benittest" (separados)
- **Solución actual**: No hay deduplicación. Ambas tablas se mantienen en sync por el submit del onboarding. Si el usuario cambia su nombre después, hay que asegurar que ambas se actualicen.

### E4: Country UUID hardcodeado desde alpha_2

- **Impacto**: El country_id que se guarda depende de que el `alpha_2` en la tabla `public.countries` coincida con el mapa `TIMEZONE_TO_ALPHA2`. Si alguien modifica los datos de countries, la auto-detección se rompe silenciosamente.
- **Solución actual**: La tabla de countries es estática y no se modifica.

### E5: Onboarding repetible

- **Impacto**: Si un usuario ya completó el onboarding (`signup_completed=true`) y navega manualmente a `/onboarding`, puede volver a hacer submit. Esto sobrescribiría su nombre/apellido. No hay guard que impida re-acceder.
- **Solución futura**: Agregar un guard en `onboarding/page.tsx` que redirija a `/hub` si `signup_completed=true`.

### E6: Logout desde onboarding

- **Impacto**: El form tiene un botón "¿No eres tú? Cerrar sesión" que importa dinámicamente el cliente de Supabase. Si el usuario cierra sesión, se redirige a `/login`. No hay efecto secundario negativo.
- **Solución actual**: Funciona correctamente.

---

## Relación con otros Flows

| Flow | Cómo se conecta |
|------|-----------------|
| [User Registration](../user-registration/) | El onboarding es el paso inmediato después del registro. El registro crea el user con `signup_completed=false`, el onboarding lo marca como `true` |
| Organization Onboarding | `/workspace-setup` es el paso siguiente. Crea la primera organización o acepta invitación |
| Invitations | Si alguien invitó al usuario antes de que se registrara, la invitación aparece como opción en workspace-setup |
