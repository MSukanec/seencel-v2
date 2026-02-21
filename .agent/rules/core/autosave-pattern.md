---
name: Auto-Save Pattern
description: Regla OBLIGATORIA para implementar auto-guardado con debounce en Seencel V2.
---

# Auto-Save Pattern (🚨 OBLIGATORIO)

## Hook Centralizado

**TODAS las vistas o formularios con auto-guardado DEBEN usar `useAutoSave`** de `@/hooks/use-auto-save`.

```tsx
import { useAutoSave } from "@/hooks/use-auto-save";

const { triggerAutoSave } = useAutoSave({
    saveFn: async (data) => {
        const formData = new FormData();
        formData.set("id", entityId);
        formData.set("name", data.name);
        // ...
        await updateEntity(formData);
    },
    validate: (data) => !!data.name.trim(),      // opcional
    successMessage: "¡Cambios guardados!",        // default
    onSuccess: (data) => updateOptimistic(data),  // opcional
});

const handleNameChange = (value: string) => {
    setName(value);
    triggerAutoSave({ name: value, description });
};
```

## Prohibiciones

| ❌ Prohibido | ✅ Correcto |
|-------------|------------|
| `useRef` + `setTimeout` manual para debounce de save | `useAutoSave` |
| `debounceRef.current = setTimeout(...)` | `triggerAutoSave(data)` |
| Toast manual dentro de cada setTimeout | Toast automático por el hook |
| `saveStatus` state ("saving"/"saved"/"idle") | Toast de Sonner (no inline) |
| Indicadores inline "Guardando..."/"Guardado" | Sonner toast automático |

## Cuándo Usar Auto-Save

| Escenario | Patrón |
|-----------|--------|
| **Campos de texto en vista de edición** (nombre, descripción, código) | `useAutoSave` con `triggerAutoSave` en `onChange` |
| **Selects/toggles** que guardan inmediatamente | `saveField()` directo (NO debounce) |
| **Formularios modales** con botón "Guardar" | Submit explícito con `toast` — NO usar autosave |
| **Formularios de creación** (crear entidad nueva) | Submit explícito — NO usar autosave |

## Cuándo NO Usar Auto-Save

- Formularios modales con botón "Guardar"
- Creación de nuevas entidades
- Flujos multi-step (onboarding, wizards)
- Operaciones destructivas (eliminar, archivar)

## Detección Proactiva

> ⚠️ Si durante el trabajo se detecta una vista de edición inline que **debería** usar autosave pero NO lo hace (o usa debounce manual), el agente DEBE avisar al usuario para que decida si se migra.

## Parámetros del Hook

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `saveFn` | `(data: T) => Promise<void>` | **requerido** | Función que persiste los datos |
| `delay` | `number` | `1000` | Delay del debounce en ms |
| `successMessage` | `string` | `"¡Cambios guardados!"` | Toast de éxito |
| `errorMessage` | `string` | `"Error al guardar los cambios."` | Toast de error (fallback) |
| `validate` | `(data: T) => boolean` | — | Validación pre-save |
| `onSuccess` | `(data: T) => void` | — | Callback post-save exitoso |

## Archivos Migrados (Referencia)

- `src/features/users/views/profile-info-view.tsx`
- `src/features/organization/components/forms/organization-details-form.tsx`
- `src/features/projects/views/details/project-profile-view.tsx`
- `src/features/tasks/views/detail/tasks-detail-general-view.tsx`
- `src/features/construction-tasks/views/construction-tasks-settings-view.tsx`
