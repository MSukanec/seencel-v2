# Roadmap: Registro de Usuario

---

## ✅ Completado

| Qué | Detalles |
|-----|----------|
| Signup con email/password | Validación Zod, honeypot, feature flag, domain blacklist |
| Trigger `on_auth_user_created` | Migrado a `iam.handle_new_user()` (068b) |
| 4 step functions en IAM | `step_create_user`, `step_create_user_acquisition`, `step_create_user_data`, `step_create_user_preferences` |
| UTM acquisition tracking | Captura desde frontend → metadata → `iam.user_acquisition` |
| Auth callback | `exchangeCodeForSession` → redirect con locale |
| Dashboard guard | `signup_completed` check en layout (no middleware) |
| Onboarding form | Nombre, apellido, timezone auto-detect, país opcional |
| Social auth (Google/Discord) | Avatar y nombre auto-extraídos del provider |
| Guard anti-duplicados | `IF EXISTS` en `handle_new_user` previene doble ejecución |

---

## ⏳ Pendiente: Corto plazo

| # | Prioridad | Descripción | Archivos a modificar |
|---|-----------|-------------|---------------------|
| 1 | 🟡 Media | Limpiar `debug_signup_log` de step functions de producción | `DB/schema/iam/functions_2.md` (step_add_org_member), crear script SQL |
| 2 | 🟡 Media | Validar `NEW.email IS NOT NULL` en `handle_new_user` antes de proceder | `iam.handle_new_user()` en DB |
| 3 | 🟢 Baja | Feature flag `auth_registration_enabled` todavía se lee de `public.feature_flags` (no migrada) | `src/actions/auth/register.ts` |

---

## 🔮 Pendiente: Largo plazo

| # | Descripción |
|---|-------------|
| 1 | **CAPTCHA condicional**: Si el spam escala, agregar hCaptcha/Turnstile solo cuando se detecte actividad sospechosa |
| 2 | **Email verification con magic link**: Ofrecer signup sin password con magic link como alternativa |
| 3 | **Rate limiting avanzado**: El rate limit actual es solo 1s delay + feature flag. Implementar rate limiting real por IP en edge (Vercel Edge Config o similar) |
| 4 | **Onboarding progresivo**: En vez de pedir toda la info en un paso, detectar qué datos ya vinieron del provider social y skipear campos |
| 5 | **Audit trail del signup**: Registrar el journey completo (dispositivo, IP, tiempo entre pasos) en `audit.activity_log` |
