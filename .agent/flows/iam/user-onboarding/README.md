# Onboarding de Usuario

> **Alcance**: Cubre el flujo desde que un usuario recién registrado es redirigido a `/onboarding` (porque `signup_completed=false`) hasta que completa sus datos personales, pasa por el Hub, y llega a crear/unirse a una organización.
>
> ⚠️ **Este flow NO cubre el onboarding de organización** (crear org, elegir tipo, configurar sidebar). Ese es un flow separado: `.agent/flows/iam/organization-onboarding/`.

## ¿Qué resuelve?

Jorge acaba de crear su cuenta en Seencel con Google. El trigger `iam.handle_new_user()` ya creó su perfil interno, pero tiene `signup_completed=false`. Al intentar entrar al dashboard, el guard del layout lo redirige automáticamente a `/bienvenida`. Ahí ve un form elegante (split-screen con hero) donde ingresa su nombre, apellido, y su país se auto-detecta desde su timezone. Al confirmar, el sistema actualiza 3 tablas (`iam.users`, `iam.user_data`, `iam.user_preferences`), marca `signup_completed=true`, y lo redirige al Hub. Desde el Hub, el sistema lo envía automáticamente a `/configurar-espacio` donde puede crear su primera organización o aceptar una invitación pendiente.

## Conceptos clave

| Concepto | Qué es | Tabla/Archivo |
|----------|--------|---------------|
| signup_completed | Flag boolean que controla si el usuario completó onboarding personal | `iam.users.signup_completed` |
| Onboarding Guard | Redirect automático en dashboard layout si `!signup_completed` | `src/app/[locale]/(dashboard)/layout.tsx` |
| Auto-detección de país | Mapeo timezone→alpha_2→country_id desde el browser | `onboarding-form.tsx` (TIMEZONE_TO_ALPHA2) |
| Auto-detección de timezone | `Intl.DateTimeFormat().resolvedOptions().timeZone` append al submit | `onboarding-form.tsx` |
| AuthLayout | Layout split-screen (hero izquierda + form derecha) | `src/features/auth/components/auth-layout.tsx` |
| workspace-setup | Paso siguiente: crear org o aceptar invitación | `src/app/[locale]/(onboarding)/workspace-setup/` |
| Onboarding Checklist | Widget post-onboarding en Hub (crear proyecto, contacto, movimiento) | `src/features/onboarding/checklist/` |

## Flujo resumido

```
Dashboard Guard (signup_completed=false) → Redirect /onboarding
    ↓
Onboarding Form (nombre, apellido, país auto-detected, timezone auto)
    ↓
submitOnboarding() → 3 updates DB → signup_completed=true → Redirect /hub
    ↓
Hub → Sin org → Redirect /workspace-setup
    ↓
Crear organización o Aceptar invitación → /organization
    ↓
Dashboard con Onboarding Checklist Widget (crear proyecto, contacto, movimiento)
```

## Documentos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| [user-journey.md](./user-journey.md) | Paso a paso del usuario con tablas y archivos |
| [technical-map.md](./technical-map.md) | Referencia técnica exhaustiva |
| [design-decisions.md](./design-decisions.md) | Decisiones de diseño, edge cases y relaciones |
| [roadmap.md](./roadmap.md) | Estado completado y pendientes |
