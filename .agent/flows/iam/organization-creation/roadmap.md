# Roadmap: Creación de Organización

> Estado actual y pendientes accionables.
> **Actualizado**: 2026-02-22

---

## Estado Actual

| Aspecto | Estado | Nota |
|---------|--------|------|
| Flujo de creación completo | ✅ Funciona | Build verificado |
| Business mode "professional" | ✅ Disponible | Default para todos |
| Business mode "supplier" | 🔒 Bloqueado visualmente | Solo admin puede bypass |
| Feature flag org_creation_enabled | ✅ Funciona | Controla acceso desde UI |
| **Selector de moneda** | ✅ Funciona | Tooltip con explicación, fallback ARS |
| Default Kanban board | ✅ "General" + 3 listas | Inline en RPC (step 9) |
| Logo upload durante creación | ✅ Non-blocking | Falla silenciosamente |
| Rate limiting (3/hora) | ✅ Activo | Por usuario |
| SQL consolidado | ✅ DB/088 aplicado | Sin step functions — todo inline |
| Currency param | ✅ DB/089 aplicado | `p_default_currency_id uuid DEFAULT NULL` |

---

## Limpieza Completada ✅

| Item | Qué era | Script |
|------|---------|--------|
| Dead code view | `app/.../workspace-setup-view.tsx` viejo | Borrado manualmente |
| Step functions (x8) | Funciones SQL separadas por paso | DB/088 (drop) |
| `step_create_user_organization_preferences` | Función SQL orphan | DB/088 (drop) |
| `step_create_default_kanban_board` | Función SQL orphan | DB/087 (drop) |
| Overload `step_create_organization` (3 params) | Overload sin uso | DB/087 (drop) |
| Resumen card | Bloque visual en step "name" | Eliminado — reemplazado por currency selector |

---

## Pendientes Funcionales

### 🔵 F1: Activar Business Mode "Supplier"

Cuando esté listo:
1. Remover bloqueo visual en `workspace-setup-view.tsx`
2. Diseñar qué cambia para suppliers (features, permisos, UI)
3. Posiblemente crear lógica específica para suppliers en `handle_new_organization`

### 🔵 F2: user_organization_preferences desde RPC

El RPC no crea `user_organization_preferences`. Lo hace el action en frontend. Evaluar si agregar dentro del RPC para garantizar integridad si se llama desde otro contexto.
