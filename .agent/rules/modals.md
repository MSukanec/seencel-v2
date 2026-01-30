---
trigger: always_on
---

---
name: Seencel Forms & Modals Standard
description: Estándar OBLIGATORIO para crear Formularios y Modales en Seencel V2. Define arquitectura sticky footer, inputs especializados y patrones de borrado.
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

## Arquitectura de Formularios en Modales

### Componentes Base

| Componente | Ubicación | Uso |
|------------|-----------|-----|
| `FormFooter` | `@/components/shared/form-footer` | Botones de acción (sticky, maneja `Cmd+Enter`) |
| `FormGroup` | `@/components/ui/form-group` | Wrapper para campos con label |

---

## Naming Convention & Location (🚨 OBLIGATORIO)

### Ubicación de Forms

> [!CAUTION]
> Los formularios **SIEMPRE** deben ir en la carpeta `forms/` **directamente dentro del feature**, NO dentro de `components/`.

```
src/features/[feature]/
├── actions.ts
├── types.ts
├── forms/                         # ✅ CORRECTO: forms/ al nivel del feature
│   ├── [feature]-[entity]-form.tsx
│   └── [feature]-[other]-form.tsx
├── components/                    # Solo componentes de UI (tablas, cards, etc.)
│   └── ...
└── views/
    └── ...
```

❌ **INCORRECTO**: `src/features/[feature]/components/forms/`
✅ **CORRECTO**: `src/features/[feature]/forms/`

### Naming Pattern

El nombre del archivo **DEBE** seguir el patrón: `[feature]-[entity]-form.tsx`

| Ejemplo Correcto | Ejemplo Incorrecto |
|------------------|-------------------|
| `general-costs-payment-form.tsx` | `payment-form.tsx` |
| `general-costs-category-form.tsx` | `category-form.tsx` |
| `finance-movement-form.tsx` | `movement-form.tsx` |
| `sitelog-entry-form.tsx` | `entry-form.tsx` |
| `clients-payment-form.tsx` | `form.tsx` |
| `subcontracts-adjustment-form.tsx` | `create-form.tsx` |

> [!IMPORTANT]
> El prefijo del feature es **OBLIGATORIO** para evitar ambigüedad. Un archivo llamado `payment-form.tsx` no indica a qué feature pertenece.
---

## ⚠️ PATRÓN OBLIGATORIO: Footer Sticky en Modales

Para que el footer quede **fijo en la parte inferior** del modal mientras el contenido scrollea, el formulario **DEBE** seguir esta estructura exacta:

```tsx
<form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
    {/* Contenido scrolleable */}
    <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormGroup>...</FormGroup>
        </div>
    </div>
    
    {/* Footer sticky - SIEMPRE fuera del div scrolleable */}
    <FormFooter 
        className="-mx-4 -mb-4 mt-6"
        isLoading={isLoading}
        submitLabel={isEditing ? "Guardar" : "Crear"}
        onCancel={onCancel}
    />
</form>
```

### Clases CSS Obligatorias

| Elemento | Clases | Propósito |
|----------|--------|-----------|
| `<form>` | `flex flex-col h-full min-h-0` | **min-h-0 es CRÍTICO** - permite que flexbox encoja |
| Content wrapper | `flex-1 overflow-y-auto` | Solo este div scrollea |
| `<FormFooter>` | `className="-mx-4 -mb-4 mt-6"` | Contrarresta el padding del modal |

> ⚠️ **SIN `min-h-0`** el footer NO será sticky. Flexbox usa `min-height: auto` por defecto, lo cual impide el scroll.

---

## Ejemplo Completo

```tsx
interface MyFormProps {
    initialData?: MyEntity | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function MyForm({ initialData, onSuccess, onCancel }: MyFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // ... submit logic
        onSuccess?.();
    };
    
    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormGroup label="Campo 1">
                        <Input name="field1" defaultValue={initialData?.field1} />
                    </FormGroup>
                    <FormGroup label="Campo 2">
                        <Input name="field2" defaultValue={initialData?.field2} />
                    </FormGroup>
                </div>
            </div>
            
            <FormFooter 
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar Cambios" : "Crear"}
                onCancel={onCancel}
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
- [ ] ¿Form usa `className="flex flex-col h-full min-h-0"`?
- [ ] ¿Content wrapper usa `flex-1 overflow-y-auto`?
- [ ] ¿`FormFooter` está FUERA del div scrolleable?
- [ ] ¿`FormFooter` usa `className="-mx-4 -mb-4 mt-6"`?
- [ ] ¿Form recibe `onSuccess`, `onCancel` e `initialData`?
- [ ] ¿Teléfonos usan `PhoneInput`?
- [ ] ¿MIME types mapeados para BD?
