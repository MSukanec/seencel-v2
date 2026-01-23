---
description: Estándares de arquitectura de carpetas y estructura de proyecto
---

# Arquitectura del Proyecto (Feature-First)

## Estructura de Directorios

### `src/components` (UI Agnóstico)

Reservado **EXCLUSIVAMENTE** para componentes genéricos:

| Carpeta | Propósito |
|---------|-----------|
| `ui/` | Primitivos atómicos (Button, Input, Select). Componentes Shadcn. |
| `layout/` | Estructura visual (Header, Sidebar, Footer, PageWrapper). |
| `shared/` | Componentes reusables complejos (DeleteModal, FormFooter, DataTable). |
| `charts/` | Componentes de gráficos (BaseBarChart, BasePieChart, etc.). |
| `dashboard/` | Componentes de dashboard (DashboardCard, DashboardKpiCard). |

> ⛔ **PROHIBIDO**: Crear carpetas de negocio aquí (ej. `src/components/users`).
> ⛔ **PROHIBIDO**: Usar `src/components/global`. Usar `shared` en su lugar.

---

### `src/features` (Dominio y Negocio)

Toda la lógica específica de features vive aquí:

```
src/features/
├── auth/
│   └── components/
├── finance/
│   ├── components/
│   ├── actions.ts
│   └── queries.ts
├── projects/
├── kanban/
├── organization/
└── clients/
```

**Regla**: Si un componente importa lógica de negocio (actions, queries) → pertenece a Features.

---

## Convenciones de Nombrado

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Archivos/Dirs | ✅ kebab-case | `delete-confirmation-modal.tsx` |
| Componentes | ✅ PascalCase | `export function UserProfile()` |
| ❌ Incorrecto | PascalCase en archivos | `DeleteConfirmationModal.tsx` |

---

## Checklist

- [ ] ¿Componente en carpeta correcta (`features/` o `components/`)?
- [ ] ¿Archivo en kebab-case?
- [ ] ¿Componente en PascalCase?
