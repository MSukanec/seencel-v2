---
description: Patrones de formularios, modales y entradas especializadas
---

# Sistema de Formularios y Modales

## Uso de Modales

```tsx
import { useModal } from "@/providers/modal-store";

const { openModal, closeModal } = useModal();

openModal(<MyFormComponent onSuccess={closeModal} />, { 
    title: "Crear Nuevo Item",
    description: "Completá los campos para crear un nuevo item.", // OBLIGATORIO
    size: 'md' // 'sm' | 'md' | 'lg' | 'xl'
});
```

> ⚠️ **OBLIGATORIO**: Siempre incluir `description`. Nunca dejarlo vacío.

---

## Arquitectura de Formularios

### Componentes Base

| Componente | Ubicación | Uso |
|------------|-----------|-----|
| `FormFooter` | `@/components/shared/form-footer` | Botones de acción (maneja `Cmd+Enter`) |
| `FormGroup` | Shadcn Form | Wrapper para accesibilidad |

### Reglas

1. **FormFooter class**: `className="-mx-4 -mb-4 mt-6"`
2. **Grid Layout**: `grid grid-cols-1 md:grid-cols-2 gap-4`
3. **Agnóstico**: Forms reciben `onSuccess` e `initialData` como props

```tsx
interface MyFormProps {
    initialData?: MyEntity | null;
    onSuccess?: () => void;
}

export function MyForm({ initialData, onSuccess }: MyFormProps) {
    const isEditing = !!initialData;
    
    const handleSubmit = async (data: FormData) => {
        await saveAction(data);
        onSuccess?.();
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormGroup>...</FormGroup>
            </div>
            <FormFooter 
                className="-mx-4 -mb-4 mt-6"
                isSubmitting={isPending}
                submitLabel={isEditing ? "Guardar" : "Crear"}
            />
        </form>
    );
}
```

---

## Inputs Especializados

| Tipo | Componente | NUNCA usar |
|------|------------|------------|
| Teléfono | `PhoneInput` | `<input type="tel">` |
| Fecha | `DatePicker` | `<input type="date">` |
| Moneda | `CurrencyInput` | `<input type="number">` |

---

## Patrones de Eliminación

| Patrón | Caso de Uso | Componente |
|--------|-------------|------------|
| **Soft Delete + Reasignar** | Categorías, Roles (en uso) | `DeleteReplacementModal` |
| **Simple Delete** | Proyectos, Tareas (nodos hoja) | `DeleteDialog` |

> ⛔ **NUNCA** usar `window.confirm()`. Siempre usar `AlertDialog` o `DeleteDialog`.

---

## File Uploads y MIME Types

**CRÍTICO**: Las tablas de BD (como `media_files`) usan ENUMs restringidos para `file_type`.

**SIEMPRE** mapear el MIME type a valor permitido antes de insertar:

| Raw MIME Type | DB Value |
|---------------|----------|
| `image/*` (png, jpeg, etc.) | `'image'` |
| `video/*` (mp4, webm) | `'video'` |
| `application/pdf` | `'pdf'` |
| `application/msword`, etc. | `'doc'` |
| Todo lo demás | `'other'` |

```tsx
// En server action
import { getMediaType } from "@/lib/media-utils";

const fileType = getMediaType(file.type); // 'image' | 'video' | 'pdf' | 'doc' | 'other'
```

> ⛔ **NUNCA** insertar `file.type` (ej. `'image/png'`) directamente en columnas `file_type`.

---

## Checklist

- [ ] ¿Modal tiene `description`?
- [ ] ¿Form usa `FormGroup` y `FormFooter`?
- [ ] ¿Form recibe `onSuccess` e `initialData`?
- [ ] ¿Teléfonos usan `PhoneInput`?
- [ ] ¿MIME types mapeados para BD?
