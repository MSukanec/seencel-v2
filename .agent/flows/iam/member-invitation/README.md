# Invitación de Miembros a la Organización

> **Alcance**: Todo el flujo para que un administrador invite a una persona como **miembro interno** de la organización, incluyendo validación de asientos, envío de email, aceptación y alta en el equipo.

## ¿Qué resuelve?

Constructora Lenga tiene 3 miembros activos y quiere sumar a **Jorge Méndez** como editor del equipo. Matías (admin) necesita:
- Invitar a Jorge por email
- Que el sistema valide si hay asientos disponibles
- Que Jorge reciba un email, pueda registrarse (si no tiene cuenta) y aceptar la invitación
- Que al aceptar, Jorge sea miembro activo con el rol asignado (Editor)
- Que se actualice el conteo de asientos y se registre el evento de billing

## Conceptos clave

| Concepto | Qué es | Tabla |
|----------|--------|-------|
| **Miembro** | Usuario de Seencel con acceso interno a la organización | `iam.organization_members` |
| **Asiento (seat)** | Capacidad de tener un miembro activo (incluidos en plan + comprados) | `iam.organizations.purchased_seats` + `billing.plans.features` |
| **Invitación** | Registro con token para aceptar por email | `iam.organization_invitations` |
| **Evento de miembros** | Log de cambios de billing (alta, baja, cambio de billable) | `billing.organization_member_events` |
| **Rol** | Perfil de permisos asignado al miembro | `iam.roles` + `iam.role_permissions` |

## Flujo resumido

```
Admin valida asientos → Crea invitación → Envía email →
  ├── Si ya tiene cuenta → Login → Acepta → organization_members + member_events
  └── Si no tiene cuenta → Registro → Login → Acepta → organization_members + member_events
```

## ⚠️ Separación con otros flows

Este flow documenta **SOLO** la invitación de **miembros internos**. NO cubre:
- Clientes → ver `client-invitation`
- Colaboradores externos (directores de obra, contadores) → ver `external-access`

La diferencia clave: los **miembros** ocupan asientos (billing), tienen rol con permisos granulares, y ven todo el dashboard. Los actores externos/clientes **no consumen asientos**.

## ⚠️ Regla de Mantenimiento OBLIGATORIA

**Cada vez que se modifique CUALQUIER cosa relacionada con este flow** (tabla, función SQL, archivo frontend, RLS, etc.), se DEBEN actualizar TODOS los archivos de esta carpeta que se vean afectados. No es optativo.

## Documentos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| [user-journey.md](./user-journey.md) | Paso a paso desde la perspectiva del usuario |
| [technical-map.md](./technical-map.md) | Tablas, funciones, archivos, RLS — todo nombrado |
| [design-decisions.md](./design-decisions.md) | Por qué se hizo así, edge cases y gotchas |
| [roadmap.md](./roadmap.md) | Estado actual y pendientes de implementación |
