---
description: Workflow for managing Plan Features and Limitations
---

# Plan Features & Limitations Workflow

Este workflow define cómo gestionar las funcionalidades y límites de los planes (Free, Pro, Teams) en la aplicación.

## 1. Plan Structures (JSON)

Estos son los JSONs actuales almacenados en la columna `features` de la tabla `plans`.

### FREE Plan (`plans` row where `slug = 'free'`)

```json
{
  "webhooks": false,
  "api_access": false,
  "max_members": 1,
  "export_excel": true,
  "max_projects": 4,
  "support_level": "community",
  "max_org_boards": 1,
  "max_storage_mb": 1024,
  "analytics_level": "basic",
  "max_file_size_mb": 50,
  "export_pdf_custom": false,
  "max_project_boards": 1,
  "custom_pdf_templates": false
}
```

### PRO Plan (`plans` row where `slug = 'pro'`)

```json
{
  "webhooks": false,
  "api_access": true,
  "max_members": 1,
  "export_excel": true,
  "max_projects": 50,
  "support_level": "priority",
  "max_org_boards": 5,
  "max_storage_mb": 51200,
  "analytics_level": "advanced",
  "max_file_size_mb": 500,
  "export_pdf_custom": true,
  "max_project_boards": 5,
  "custom_pdf_templates": true
}
```

### TEAMS Plan (`plans` row where `slug = 'teams'`)

```json
{
  "webhooks": true,
  "api_access": true,
  "max_members": 999,
  "export_excel": true,
  "max_projects": 999,
  "support_level": "dedicated",
  "max_org_boards": 999,
  "max_storage_mb": 512000,
  "analytics_level": "custom",
  "max_file_size_mb": 1024,
  "export_pdf_custom": true,
  "max_project_boards": 999,
  "custom_pdf_templates": true
}
```

## 2. Blocking UI Component

Para bloquear funcionalidades en el frontend, usamos el componente **`FeatureGuard`**.

**Path:** `src/components/ui/feature-guard.tsx`

**Uso:**

```tsx
import { FeatureGuard } from "@/components/ui/feature-guard";

// ...

<FeatureGuard
    isEnabled={canCreateBoard} // Boolean logic based on plan limits
    featureName="Crear Tablero"
    requiredPlan="PRO" // Or "TEAMS" based on what unlocks it
>
    <Button onClick={handleCreate}>Crear Tablero</Button>
</FeatureGuard>
```

## 3. Process for Modifying/Adding Features

Cuando se solicite bloquear una funcionalidad o cambiar límites:

1.  **Block UI**: Usar el componente `FeatureGuard` envolviendo el botón o sección a bloquear.
2.  **Update Database**: Generar un SQL para actualizar la columna `features` en la tabla `plans` con la nueva lógica (agregar claves al JSON).
3.  **Update Workflow**: Actualizar **ESTE ARCHIVO** (`.agent/workflows/plan-features.md`) con la nueva estructura JSON.
4.  **Update Pricing Page**: Actualizar la tabla de precios en `src/components/global/plans-comparison.tsx` para reflejar el cambio visualmente.

## 4. Example: Blocking Kanban Boards

**Requisito**:
- **FREE**: 1 Org Board, 1 Project Board.
- **PRO**: 5 Org Boards, 5 Project Boards.
- **TEAMS**: Ilimitados.

**Implementación**:
1.  SQL Update: `migration-plans-features.sql` actualiza los JSONs.
2.  Frontend: `KanbanDashboard` usa `FeatureGuard` comparando `currentBoards.length < plan.features.max_org_boards`.
