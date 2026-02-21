# Registro de Usuario

> **Alcance**: Cubre el flujo completo desde que un usuario visita la página de signup hasta que completa el onboarding y accede al dashboard por primera vez.

## ¿Qué resuelve?

Laura visita Seencel por primera vez. Hace click en "Registrarse", ingresa su email y una contraseña segura. Recibe un email de confirmación, lo confirma, y el sistema le crea automáticamente su perfil de usuario (sin organización). Al entrar al dashboard, se la redirige al onboarding donde ingresa su nombre y apellido. Recién después accede al Hub donde puede crear su primera organización.

## Conceptos clave

| Concepto | Qué es | Tabla |
|----------|--------|-------|
| Auth User | Usuario de Supabase Auth (email + password) | `auth.users` |
| Internal User | Perfil público del usuario en el sistema | `iam.users` |
| User Data | Datos personales extendidos (nombre, apellido, teléfono) | `iam.user_data` |
| User Preferences | Preferencias globales (tema, idioma, layout, timezone) | `iam.user_preferences` |
| User Acquisition | Tracking de adquisición (UTM params, landing page, referrer) | `iam.user_acquisition` |
| Signup Completed | Flag que indica si el usuario completó el onboarding personal | `iam.users.signup_completed` |
| Feature Flag | Flag que habilita/deshabilita el registro globalmente | `public.feature_flags` (key: `auth_registration_enabled`) |

## Flujo resumido

```
Landing Page → Signup Page → supabase.auth.signUp()
    ↓
Email de confirmación → Click link → /auth/callback
    ↓
exchangeCodeForSession() → Redirect /hub
    ↓
auth.users INSERT → Trigger on_auth_user_created → iam.handle_new_user()
    ↓
iam.step_create_user()         → iam.users
iam.step_create_user_acquisition() → iam.user_acquisition
iam.step_create_user_data()    → iam.user_data
iam.step_create_user_preferences() → iam.user_preferences (signup_completed=false)
    ↓
Dashboard Layout Guard → signup_completed=false → Redirect /onboarding
    ↓
Onboarding Form → submitOnboarding() → users.signup_completed=true
    ↓
Hub (sin organización) → Puede crear su primera org
```

## Documentos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| [user-journey.md](./user-journey.md) | Paso a paso del usuario con tablas y archivos |
| [technical-map.md](./technical-map.md) | Referencia técnica exhaustiva |
| [design-decisions.md](./design-decisions.md) | Decisiones de diseño, edge cases y relaciones |
| [roadmap.md](./roadmap.md) | Estado completado y pendientes |
