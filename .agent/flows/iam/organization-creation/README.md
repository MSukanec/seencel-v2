# Creación de Organización

> **Alcance**: Flujo completo desde que un usuario presiona "Crear Organización" hasta que aterriza en el dashboard con su nueva org activa — incluyendo tipo de org, nombre, logo, moneda, y toda la cadena SQL de setup.

## ¿Qué resuelve?

**Escenario**: Juan se registra en Seencel. Completa el onboarding personal (nombre, apellido). Ahora necesita crear su espacio de trabajo — su organización — para empezar a gestionar proyectos. Desde el Hub presiona "Espacio de Trabajo" (o desde Profile > Organizaciones presiona "Crear Organización"). Esto lo lleva a una página multi-step donde:

1. Elige el tipo de org (Profesional o Proveedor)
2. Ingresa nombre, logo y **moneda principal**
3. Presiona "Crear y Continuar"

En el backend, un single RPC (`iam.handle_new_organization`) ejecuta 10 pasos atómicos inline (sin step functions externas): crea la org, roles, miembro, permisos, moneda elegida, billeteras, preferencias, tablero Kanban inicial, y activa la org como última. Al finalizar, redirige al dashboard.

## Conceptos clave

| Concepto | Qué es | Tabla |
|----------|--------|-------|
| Organization | Entidad principal, espacio de trabajo | `iam.organizations` |
| Business Mode | Tipo de org: 'professional' o 'supplier' | `iam.organizations.business_mode` |
| Roles | Admin, Editor, Lector — creados por defecto | `iam.roles` |
| Member | Vínculo usuario-organización con rol | `iam.organization_members` |
| Permissions | Permisos granulares asignados a roles | `iam.permissions`, `iam.role_permissions` |
| Default Currency | Moneda elegida por el usuario (fallback: ARS) | `finance.organization_currencies` |
| Organization Wallets | Billetera default (Efectivo) | `finance.organization_wallets` |
| Organization Preferences | Config general de la org | `iam.organization_preferences` |
| Default Kanban Board | Tablero "General" con 3 listas | `planner.kanban_boards`, `planner.kanban_lists` |
| Feature Flag | `org_creation_enabled` — controla si se permite crear orgs | `public.feature_flags` |

## Flujo resumido

```
[Hub/Profile]
    ↓ router.push('/workspace-setup?new=true')
[workspace-setup/page.tsx] (Server)
    ↓ fetch: orgs, isAdmin, pendingInvitation, org_creation_enabled, currencies
[WorkspaceSetupView] (Client — 4 steps)
    ↓ Step 0: "choose"  → Crear org / Aceptar invitación
    ↓ Step 1: "type"    → Profesional / Proveedor
    ↓ Step 2: "name"    → Nombre + Logo + Moneda Principal
    ↓ handleCreateOrg() → 
[createOrganization()] (Server Action)
    ↓ auth.getUser() → iam.users lookup → RPC call (con currency_id)
[iam.handle_new_organization] (SQL — SECURITY DEFINER, todo inline)
    ↓ 10 steps atómicos → Returns org_id
[createOrganization()] continúa
    ↓ upsert user_org_preferences → upload logo → revalidate → redirect('/organization')
```

## Documentos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| [user-journey.md](user-journey.md) | Tutorial paso a paso con cada tabla y archivo |
| [technical-map.md](technical-map.md) | Referencia técnica exhaustiva (tablas, funciones, files) |
| [design-decisions.md](design-decisions.md) | Decisiones, edge cases, gotchas |
| [roadmap.md](roadmap.md) | Estado actual y pendientes accionables |
