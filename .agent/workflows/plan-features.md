---
description: Workflow for managing Plan Features and Limitations
---

# Plan Features & Limitations

Este workflow define cómo gestionar las funcionalidades y límites de los planes (Essential, Pro, Teams).

---

## 1. Estructuras de Planes (JSON)

Almacenados en columna `features` de tabla `plans`.

### FREE (`slug = 'essential'`)

```json
{
  "webhooks": false,
  "api_access": false,
  "export_excel": true,
  "support_level": "community",
  "max_org_boards": 1,
  "max_storage_mb": 1024,
  "seats_included": 1,
  "analytics_level": "basic",
  "custom_dashboard": false,
  "max_file_size_mb": 50,
  "export_pdf_custom": false,
  "can_invite_members": false,
  "max_project_boards": 1,
  "max_active_projects": 2,
  "custom_pdf_templates": false,
  "custom_project_branding": false,
  "custom_insight_thresholds": false
}
```

### PRO (`slug = 'pro'`)

```json
{
  "webhooks": false,
  "api_access": true,
  "export_excel": true,
  "support_level": "priority",
  "max_org_boards": 5,
  "max_storage_mb": 51200,
  "seats_included": 1,
  "analytics_level": "advanced",
  "custom_dashboard": true,
  "max_file_size_mb": 250,
  "export_pdf_custom": true,
  "can_invite_members": false,
  "max_project_boards": 5,
  "max_active_projects": 5,
  "custom_pdf_templates": true,
  "custom_portal_branding": true,
  "custom_insight_thresholds": true
}
```

### TEAMS (`slug = 'teams'`)

```json
{
  "webhooks": true,
  "api_access": true,
  "export_excel": true,
  "support_level": "dedicated",
  "max_org_boards": 999,
  "max_storage_mb": 512000,
  "seats_included": 1,
  "analytics_level": "custom",
  "custom_dashboard": true,
  "max_file_size_mb": 1024,
  "export_pdf_custom": true,
  "can_invite_members": true,
  "max_project_boards": 999,
  "max_active_projects": 15,
  "custom_pdf_templates": true,
  "custom_portal_branding": true,
  "custom_insight_thresholds": true
}
```

---

## 2. Sistema de Bloqueo de Features

### 2.1 Entitlements Engine (`@/hooks/use-entitlements`)

El hook `useEntitlements()` evalúa permisos centralmente. Retorna:
- `isAllowed`: si el usuario tiene acceso
- `isShadowMode`: si el admin puede bypassear (modo shadow)
- `reason`: `'plan'` | `'maintenance'` | `'founders'` | `null`
- `requiredPlan`: plan mínimo requerido

```tsx
const { check } = useEntitlements();
const result = check("custom_project_branding"); // EntitlementKey

// result.isAllowed → false (si el plan no lo permite)
// result.isShadowMode → true (si es admin, puede bypass)
// result.reason → 'plan'
// result.requiredPlan → 'PRO'
```

### 2.2 FeatureGuard (`@/components/ui/feature-guard`)

Componente wrapper que bloquea UI basado en permisos del plan. Incluye:
- **Popover** con info del plan requerido y link a upgrade
- **Admin bypass** (shadow mode): admins ven contenido grisado pero clickeable con toast de advertencia
- **Modo mantenimiento**: ícono de wrench + mensaje sin plan badge
- **Badge overlay**: micro PlanBadge posicionado sobre el elemento bloqueado

```tsx
import { FeatureGuard, FeatureLockBadge } from "@/components/ui/feature-guard";

// Wrapper — bloquea contenido hijo
<FeatureGuard
    entitlement="custom_project_branding"  // Usa EntitlementKey (preferido)
    featureName="Branding del Proyecto"
    requiredPlan="PRO"
>
    <Button onClick={handleBrand}>Personalizar</Button>
</FeatureGuard>

// O con fallback booleano (sin entitlement engine)
<FeatureGuard
    fallbackEnabled={false}
    featureName="Apariencia"
    requiredPlan="PRO"
>
    <div>Contenido bloqueado</div>
</FeatureGuard>

// Badge standalone — solo muestra el badge con popover
<FeatureLockBadge
    featureName="Custom Branding"
    requiredPlan="PRO"
/>
```

**Props principales:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `entitlement` | `EntitlementKey` | — | Key del engine de entitlements |
| `fallbackEnabled` | `boolean` | — | Boolean manual si no se usa entitlement |
| `featureName` | `string` | `"Esta función"` | Nombre para el popover |
| `requiredPlan` | `string` | `"PRO"` | Plan requerido |
| `showBadge` | `boolean` | `true` | Muestra micro PlanBadge overlay |
| `showPopover` | `boolean` | `true` | Muestra HoverCard con info |
| `mode` | `'plan' \| 'maintenance' \| 'founders'` | auto | Modo semántico |
| `customMessage` | `string` | — | Mensaje custom en el popover |

### 2.3 Route Tabs con Guard

Las `routeTabs` soportan un `guard` que integra `FeatureGuard` automáticamente en el header:

```tsx
const routeTabs: RouteTab[] = [
    { value: "general", label: "Perfil", href: "/projects/123" },
    { value: "appearance", label: "Apariencia", href: "/projects/123/appearance", guard: {
        fallbackEnabled: false,
        featureName: "Apariencia del Proyecto",
        requiredPlan: "PRO",
    }},
];
```

**`RouteTabGuard` props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `entitlement` | `EntitlementKey` | Key del engine |
| `fallbackEnabled` | `boolean` | Fallback manual |
| `featureName` | `string` | Nombre para popover |
| `requiredPlan` | `string` | Plan requerido |
| `customMessage` | `string` | Mensaje custom |
| `mode` | `'plan' \| 'maintenance' \| 'founders'` | Modo semántico |

### 2.4 Sidebar con FeatureGuard

El sidebar integra `FeatureGuard` automáticamente via `useSidebarNavigation`. Los items de nav con `featureFlag` que mapean a features deshabilitadas se bloquean con el mismo comportamiento (popover, admin bypass, etc.).

---

## 3. Proceso para Modificar/Agregar Features

1. **Block UI**: Usar `FeatureGuard` envolviendo el botón/sección, o `guard` en `routeTabs`
2. **Update Database**: SQL para actualizar columna `features` en tabla `plans` (archivos en `/DB`)
3. **Update Entitlements**: Si se necesita una nueva key, agregarla en `use-entitlements.ts`
4. **Update Workflow**: Actualizar este archivo con nueva estructura JSON
5. **Update Pricing**: Actualizar `src/components/global/plans-comparison.tsx`

---

## 4. Ejemplo: Limitar Kanban Boards

| Plan | Org Boards | Project Boards |
|------|------------|----------------|
| FREE | 1 | 1 |
| PRO | 5 | 5 |
| TEAMS | ∞ | ∞ |

**Implementación:**
1. SQL actualiza los JSONs con `max_org_boards` y `max_project_boards`
2. Frontend compara `currentBoards.length < plan.features.max_org_boards`
3. `FeatureGuard` bloquea creación si se alcanza límite

---

## Checklist

- [ ] ¿Usado `FeatureGuard` o `routeTab.guard` para bloquear UI?
- [ ] ¿Actualizado JSON en tabla `plans`?
- [ ] ¿Actualizado entitlements si es key nueva?
- [ ] ¿Actualizado este workflow con nueva estructura?
- [ ] ¿Actualizada página de pricing?