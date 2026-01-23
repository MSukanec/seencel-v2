---
description: Estándares de desarrollo de SEENCEL - Índice principal y checklist
---

# Estándares de Desarrollo SEENCEL

Este es el **índice principal** de estándares de desarrollo. Para detalles específicos, consultar los workflows especializados.

---

## Workflows Especializados

| Workflow | Descripción | Comando |
|----------|-------------|---------|
| [Arquitectura de Carpetas](file:///.agent/workflows/development/file-structure.md) | Feature-first, naming conventions | `/file-structure` |
| [Layout de Páginas](file:///.agent/workflows/development/page-layout.md) | PageWrapper, ContentLayout, Tabs | `/page-layout` |
| [Formularios y Modales](file:///.agent/workflows/development/forms-modals.md) | Forms, modals, inputs especiales | `/forms-modals` |
| [Patrones de Performance](file:///.agent/workflows/development/performance-patterns.md) | Optimistic UI, lazy loading, tabs | `/performance-patterns` |
| [Patrones de UI](file:///.agent/workflows/development/ui-patterns.md) | EmptyState, Toolbar, DataTable | `/ui-patterns` |
| [Backend e i18n](file:///.agent/workflows/development/backend-i18n.md) | Supabase, RLS, internacionalización | `/backend-i18n` |
| [Plan Features](file:///.agent/workflows/development/plan-features.md) | Límites de planes, FeatureGuard | `/plan-features` |

---

## ⭐ Workflows Críticos (Leer Obligatorio)

| Workflow | Descripción | Comando |
|----------|-------------|---------|
| **[Arquitectura Financiera](file:///.agent/workflows/development/financial-architecture.md)** | **Monedas, functional_amount, triggers, dualidad nominal/funcional** | `/financial-architecture` |
| `/RLS-GUIDELINES` | Políticas Row Level Security |
| `/add-notification` | Agregar notificaciones al sistema |

> [!IMPORTANT]
> Para cualquier feature que involucre **pagos, montos o monedas**, leer `/financial-architecture` es **OBLIGATORIO**.

---

## Checklist Rápido (Pre-Commit)

### Arquitectura
- [ ] Componente en carpeta correcta (`features/` vs `components/`)
- [ ] Archivo en kebab-case, componente en PascalCase

### Layout
- [ ] Usado `PageWrapper` + `ContentLayout`
- [ ] Ícono de página coincide con sidebar

### Formularios
- [ ] Modal tiene `description`
- [ ] Form usa `FormGroup`, `FormFooter`
- [ ] Inputs especiales: `PhoneInput`, `DatePicker`
- [ ] MIME types mapeados para BD

### Performance
- [ ] Delete usa `useOptimisticList`
- [ ] Charts usan componentes `Lazy*`
- [ ] Tabs usan estado local, no `router.replace()`

### UI
- [ ] Lista vacía muestra `EmptyState`
- [ ] Toolbar wrap en Card
- [ ] No `window.confirm()` - usar `AlertDialog`

### Backend
- [ ] RLS habilitado en nuevas tablas
- [ ] No strings hardcodeados - usar `next-intl`

### Financiero ⭐
- [ ] Datos vía `getOrganizationFinancialData`
- [ ] Tabla tiene `functional_amount` + trigger
- [ ] UI usa `useFinancialFeatures` para flags
- [ ] Transacciones incluyen `exchange_rate`

---

## Principios Core

1. **Feature-First**: Lógica de negocio en `src/features/`, UI genérica en `src/components/`
2. **Optimistic UI**: El usuario ve el resultado antes de confirmación del servidor
3. **i18n First**: Todos los textos en `messages/es.json`
4. **Performance**: Lazy loading, prefetch, animaciones rápidas (150ms)
5. **Financial Integrity**: `functional_amount` calculado automáticamente, nunca manual
