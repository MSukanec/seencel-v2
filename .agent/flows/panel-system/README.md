# Command Panel System

## Estado: 🟢 Implementado — Materials migrado como piloto

---

## Modelo Mental

| Superficie | Rol | Ejemplo |
|-----------|-----|---------|
| **Panel** (Primary Interaction Surface) | Crear, editar, ver detalle | Forms, detail views |
| **Modal** (Secondary Interrupt Surface) | Interrumpir para confirmar/alertar | Delete confirm, pickers, alerts |

> Los forms y detalles van en **Panels**. Los modales quedan SOLO para interrupciones.

---

## Arquitectura

### Archivos del Sistema

| Archivo | Ubicación | Rol |
|---------|-----------|-----|
| `panel-store.ts` | `src/stores/` | Zustand store: stack, openPanel, replacePanel, closePanel, setPanelMeta, setSubmitting |
| `panel-registry.ts` | `src/stores/` | Registry con dynamic imports. Cada entry es un form lazy-loaded |
| `panel-url-sync.tsx` | `src/stores/` | URL sync: `?panel=material-form`. Deep linking + browser back |
| `panel-provider.tsx` | `src/providers/` | Renderer: Header (icon + title) + Body (scroll) + Footer (sticky, container-managed) |

### Principios

| Principio | Detalle |
|-----------|---------|
| **Panels 100% agnósticos** | Se abren desde cualquier vista con solo `openPanel(id, datos)` |
| **Forms self-contained** | Definen su propio icon, title, description, footer via `setPanelMeta` |
| **Footer container-managed** | El panel container renderiza el footer. El form usa `<form id={formId}>` |
| **Field Factories obligatorios** | SIEMPRE usar los Fields de `@/components/shared/forms/fields/`. NUNCA usar `<Input>` o `<Select>` raw |
| **Max 2 niveles de stack** | Panel principal + 1 sub-panel. Si necesitás más → `replacePanel()` |
| **Overlay suave** | Semi-transparente, bloquea clicks fuera del panel |

### API

```tsx
const { openPanel, closePanel, replacePanel } = usePanel();

// Abrir — solo panelId + datos. CERO presentación.
openPanel('material-form', { mode: 'create', orgId, units });

// Reemplazar
replacePanel('material-detail', { id: '456' });

// Cerrar
closePanel();
```

---

## Migración Progresiva

### ✅ Completado
- Infraestructura (store, provider, registry, URL sync)
- Materials: material-form, material-payment-form, purchase-order-form, material-type-form, category-form
- Projects: projects-project-form, projects-type-form, projects-modality-form

### 📋 Pendiente (migrar al recorrer cada página)
- Finance: movement-form, exchange-form, general-costs forms
- Tasks: task-form, recipe-form
- Subcontracts: subcontract forms
- Clients: commitment forms, payment forms
- Team: member forms
- SiteLog: entry forms
- Y todos los demás features

### Reglas
- **Nuevo form** → Panel obligatorio
- **Legacy form** → Se migra cuando se recorre la página
- **Confirmaciones** → Siguen siendo modales
- **Campos** → SIEMPRE Field Factories. Si no existe el que se necesita → avisar al usuario, NUNCA crear campo raw como workaround

---

## Skill de Referencia

```
.agent/skills/seencel-panel-forms/SKILL.md
```
