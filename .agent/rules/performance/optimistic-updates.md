---
name: Optimistic Updates Obligatorios
description: Toda operación CRUD debe actualizar la UI inmediatamente antes de que el servidor responda.
severity: critical
---

# ⛔ Obligatorio: Optimistic Updates en TODA mutación

## Regla

**TODA operación CRUD debe actualizar la UI inmediatamente**, antes de que el servidor responda. Cerrar el modal/form al instante y sincronizar con el servidor en background.

## Hook Estándar

```tsx
import { useOptimisticList } from "@/hooks/use-optimistic-action";

const { 
    optimisticItems, 
    addOptimistic, 
    updateOptimistic, 
    removeOptimistic 
} = useOptimisticList({
    items: serverItems,
    getItemId: (item) => item.id,
});
```

## Patrón

```tsx
// ✅ CORRECTO: Update optimista ANTES de llamar al servidor
const handleCreate = async (data: FormData) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticItem = { ...data, id: tempId };
    
    addOptimistic(optimisticItem);
    closeModal();
    
    try {
        const result = await createItemAction(data);
        if (!result.success) {
            removeOptimistic(tempId);
            toast.error(result.error);
        }
    } catch (error) {
        removeOptimistic(tempId);
        toast.error("Error inesperado");
    }
};

// ❌ INCORRECTO: Esperar respuesta del servidor
const handleCreate = async (data: FormData) => {
    setIsLoading(true);
    const result = await createItemAction(data); // UI congelada
    if (result.success) {
        closeModal();
        router.refresh(); // Refresh completo
    }
    setIsLoading(false);
};
```

## Operaciones que DEBEN ser Optimistas

| Operación | Patrón |
|-----------|--------|
| Crear item | `addOptimistic()` → servidor |
| Editar item | `updateOptimistic()` → servidor |
| Eliminar item | `removeOptimistic()` → servidor |
| Mover (drag & drop) | Update posición local → servidor |
| Toggle estado | Update inmediato → servidor |

## Prohibición

⛔ **NUNCA** usar `router.refresh()` como única forma de actualizar la UI después de una mutación.
