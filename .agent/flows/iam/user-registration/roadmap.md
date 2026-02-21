# Roadmap: Registro de Usuario

---

## ✅ Completado

| Qué | Detalles |
|-----|----------|
| Signup con email/password | Validación Zod, honeypot, feature flag, domain blacklist |
| Signup con Google OAuth | `GoogleAuthButton` con prop `disabled` para feature flag |
| Trigger `on_auth_user_created` | `iam.handle_new_user()` consolidada (070/070b/070d) |
| Función consolidada (sin steps) | 4 INSERTs inline con `v_current_step` tracking |
| UTM acquisition tracking | Captura desde frontend → metadata → `iam.user_acquisition` inline |
| Auth callback | `exchangeCodeForSession` → redirect con locale |
| Dashboard guard | `signup_completed` check en layout (no middleware) |
| Onboarding form | Nombre, apellido, timezone auto-detect, país opcional |
| Social auth (Google/Discord) | Avatar y nombre auto-extraídos del provider |
| Guard anti-duplicados | `IF EXISTS` en `handle_new_user` previene doble ejecución |
| Guard email NOT NULL | Handle falla limpio si proveedor no envía email |
| Feature flag bloquea AMBOS métodos | `auth_registration_enabled` desactiva email + Google |
| Feature flag UI admin | Switch toggle (no dropdown) para registro |
| Limpieza debug_signup_log | INSERTs eliminados de `step_add_org_member`, tabla truncada |
| search_path limpio | Solo `iam` (eliminado `public`, `billing`) |
| role_id usa DEFAULT | No se pasa UUID hardcodeado, usa DEFAULT de la tabla |
| FK Cascades | `ON DELETE CASCADE` en tablas que referencian `iam.users.id` (069) |
| Error logging migrado a ops | `handle_new_user` y 15 funciones más usan `ops.log_system_error()` (071) |
| Notifications migradas | `notify_admin_on_new_user`, `queue_email_welcome` y 15 funciones más corregidas a `notifications.*` (072) |
| Registro exitoso verificado | Signup end-to-end funcionando post-migraciones (21-Feb-2026) |

---

## 🔧 Pendiente: Corto plazo

| # | Descripción | Impacto |
|---|-------------|---------|
| 1 | **`step_add_org_member` aún usa `public.log_system_error`** (que ya no existe). Solo impacta si el INSERT falla (exception handler). Cambiar a `ops.log_system_error` | Bajo (solo se ejecuta en error) |

---

## 🔮 Pendiente: Largo plazo

| # | Descripción |
|---|-------------|
| 1 | **CAPTCHA condicional**: Si el spam escala, agregar hCaptcha/Turnstile solo cuando se detecte actividad sospechosa |
| 2 | **Email verification con magic link**: Ofrecer signup sin password con magic link como alternativa |
| 3 | **Rate limiting avanzado**: El rate limit actual es solo 1s delay + feature flag. Implementar rate limiting real por IP en edge (Vercel Edge Config o similar) |
| 4 | **Onboarding progresivo**: En vez de pedir toda la info en un paso, detectar qué datos ya vinieron del provider social y skipear campos |
| 5 | **Audit trail del signup**: Registrar el journey completo (dispositivo, IP, tiempo entre pasos) en `audit.activity_log` |
| 6 | **Migrar `feature_flags` a schema dedicado**: La tabla sigue en `public` |

