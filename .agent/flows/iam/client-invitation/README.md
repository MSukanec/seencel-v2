# Invitación y Acceso de Clientes a Proyectos

> **Alcance**: Todo lo necesario para que un **cliente** (persona o empresa externa) sea vinculado a un proyecto, reciba acceso al Portal de Cliente, y pueda ver datos financieros filtrados (scoping por `client_id`).

## ¿Qué resuelve?

Constructora Lenga tiene el proyecto "Colegio Elumar". Matías (dueño de la constructora) quiere que **Mariano Pérez** (socio del colegio) pueda:
- Entrar a Seencel como cliente externo
- Ver el avance de obra de "Colegio Elumar"
- Ver los pagos y compromisos **solo de su cliente** (Colegio Elumar S.A.)
- NO ver materiales, costos internos, subcontratos, ni datos de otros clientes

## Conceptos clave

| Concepto | Qué es | Tabla |
|----------|--------|-------|
| **Contacto** | Registro de CRM (persona o empresa) | `contacts` |
| **Cliente del proyecto** | Contacto vinculado a un proyecto con un rol | `project_clients` |
| **Actor externo** | Usuario de Seencel que pertenece a una org sin ser miembro interno | `organization_external_actors` |
| **Acceso al proyecto** | Permiso explícito para que un usuario vea un proyecto | `project_access` |
| **Invitación** | Registro de invitación con token para aceptar | `organization_invitations` |
| **Portal de cliente** | Vista que ve el usuario externo cuando entra a Seencel | Feature `client-portal` |

## Flujo resumido

```
Admin crea/invita cliente → project_client + (contacto auto) → 
  ├── Si usuario existe en Seencel → project_access directo
  └── Si no existe → organization_invitations (email) → Acepta →
        accept_external_invitation RPC → organization_external_actors + project_access
          → Portal de Cliente (scoped por client_id)
```

## ⚠️ Separación con external-access

Este flow documenta **SOLO** el flujo de **clientes**. NO cubre:
- Colaboradores externos (directores de obra, contadores, etc.)
- Acceso genérico sin scoping por `client_id`

El flow `external-access` mezcla ambos conceptos. Este flow lo reemplaza **para todo lo relacionado con clientes**.

## ⚠️ Regla de Mantenimiento OBLIGATORIA

**Cada vez que se modifique CUALQUIER cosa relacionada con este flow** (tabla, función SQL, archivo frontend, RLS, etc.), se DEBEN actualizar TODOS los archivos de esta carpeta que se vean afectados. No es optativo.

## Documentos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| [user-journey.md](./user-journey.md) | Paso a paso desde la perspectiva del usuario |
| [technical-map.md](./technical-map.md) | Tablas, funciones, archivos, RLS — todo nombrado |
| [design-decisions.md](./design-decisions.md) | Por qué se hizo así, edge cases y gotchas |
| [roadmap.md](./roadmap.md) | Estado actual y pendientes de implementación |
