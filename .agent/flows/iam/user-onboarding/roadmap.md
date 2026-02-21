# Roadmap: Onboarding de Usuario

---

## ✅ Completado

| Qué | Detalles |
|-----|----------|
| Form de onboarding | Nombre + apellido (requeridos), país (auto-detect), timezone (hidden auto) |
| Auto-detección timezone→país | Mapa 24 timezones a alpha_2, match con `public.countries` |
| Auto-detección timezone | `Intl.DateTimeFormat().resolvedOptions().timeZone` → `iam.user_preferences.timezone` |
| Server Action submitOnboarding | Zod validation, 3 updates (users, user_data, user_preferences) |
| Dashboard guard | `signup_completed` check en layout (no middleware) |
| AuthLayout mode=onboarding | Split-screen hero+form, max-width 600px |
| Routing i18n | `/onboarding` → `/bienvenida`, `/workspace-setup` → `/configurar-espacio` |
| Workspace Setup | Crear org o aceptar invitación, redirect si ya tiene org |
| Onboarding Checklist Widget | 3 steps computados desde datos reales, dismissable |
| Cerrar sesión desde onboarding | Importación dinámica del cliente, redirect a login |
| Guard anti-repetición | Si `signup_completed=true`, `onboarding/page.tsx` redirige a `/hub` |
| Pre-fill datos del provider | Si viene de Google, `user_data` se pre-llena en el form |
| i18n textos hardcodeados | "Ubicación", "País", placeholder usan `t()` correctamente |
| Fix `sync_contact_on_user_update` | Corregido `public.contacts` → `projects.contacts` (migration 074) |
| RLS INSERT para user_data | Agregada política INSERT para soportar UPSERT (migration 074) |

---

## ⏳ Pendiente: Corto plazo

| # | Descripción | Impacto | Archivos a modificar |
|---|-------------|---------|---------------------|
| 1 | **Merge workspace-setup en onboarding multi-step**: Hacer que la creación de org sea un paso más del onboarding en vez de una página separada | Medio | Refactor mayor |

---

## 🔮 Pendiente: Largo plazo

| # | Descripción |
|---|-------------|
| 1 | **Onboarding progresivo por provider**: Detectar qué datos ya vinieron del provider social (Google: nombre, avatar, email) y skipear campos redundantes |
| 2 | **Paso de industria/rol**: Preguntar "¿A qué te dedicás?" (constructor, arquitecto, diseñador, otro) para personalizar el dashboard initial |
| 3 | **Onboarding analytics**: Trackear tiempo en onboarding, abandono, re-intentos, método de detección de país |
| 4 | **Avatar upload en onboarding**: Permitir subir foto de perfil en el onboarding en vez de esperar al settings |
