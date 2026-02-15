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

## 2. Componente FeatureGuard

**Ubicación:** `@/components/ui/feature-guard`

```tsx
import { FeatureGuard } from "@/components/ui/feature-guard";

<FeatureGuard
    isEnabled={canCreateBoard}       // Boolean basado en límites del plan
    featureName="Crear Tablero"
    requiredPlan="PRO"               // "PRO" | "TEAMS"
>
    <Button onClick={handleCreate}>Crear Tablero</Button>
</FeatureGuard>
```

---

## 3. Proceso para Modificar/Agregar Features

1. **Block UI**: Usar `FeatureGuard` envolviendo el botón/sección
2. **Update Database**: SQL para actualizar columna `features` en tabla `plans`
3. **Update Workflow**: Actualizar este archivo con nueva estructura JSON
4. **Update Pricing**: Actualizar `src/components/global/plans-comparison.tsx`

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

- [ ] ¿Usado `FeatureGuard` para bloquear UI?
- [ ] ¿Actualizado JSON en tabla `plans`?
- [ ] ¿Actualizado este workflow con nueva estructura?
- [ ] ¿Actualizada página de pricing?