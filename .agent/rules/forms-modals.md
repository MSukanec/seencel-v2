---
name: Seencel Forms & Modals Rule
description: Regla OBLIGATORIA para crear formularios y modales en Seencel V2.
---

# Forms & Modals

## 0. Lectura Obligatoria (🚨 ANTES DE EMPEZAR)

Antes de crear o modificar cualquier formulario o modal, el agente **DEBE** leer completo:

```
.agent/skills/seencel-forms-modals/SKILL.md
```

No se permite crear forms ni modales sin haber leído ese archivo primero.

---

## 1. Field Factories (🚨 OBLIGATORIO)

**SIEMPRE que exista un Field Factory para el tipo de input, se DEBE usar.** No se crean inputs custom si ya existe uno estándar.

Los Field Factories están en `src/components/shared/forms/fields/` y se importan desde su barrel:

```tsx
import {
    TextField,
    AmountField,
    CurrencyField,
    DateField,
    TimeField,
    ProjectField,
    ContactField,
    WalletField,
    NotesField,
    ReferenceField,
    ColorField,
    SwitchField,
    AssignedToField,
    ExchangeRateField,
    UploadField,
} from "@/components/shared/forms/fields";
```

### Catálogo de Fields

| Field | Uso |
|-------|-----|
| `TextField` | Inputs de texto genéricos, nombres, descripciones |
| `AmountField` | Montos numéricos (con formato) |
| `CurrencyField` | Selector de moneda |
| `DateField` | Selector de fecha |
| `TimeField` | Selector de hora |
| `ProjectField` | Selector de proyecto |
| `ContactField` | Selector de contacto |
| `WalletField` | Selector de billetera |
| `NotesField` | Textarea para notas/observaciones |
| `ReferenceField` | Campos de referencia / código |
| `ColorField` | Selector de color |
| `SwitchField` | Toggle booleano |
| `AssignedToField` | Selector de miembro asignado |
| `ExchangeRateField` | Tasa de cambio entre monedas |
| `UploadField` | Upload de archivos (single-image / multi-file / gallery) |

### Reglas de Uso

- Si el input es un **monto** → `AmountField`, no `<Input type="number" />`
- Si el input es una **fecha** → `DateField`, no un `<Popover>` + `<Calendar>` custom
- Si el input es un **upload** → `UploadField`, no `<MultiFileUpload>` directo
- Si el input es un **selector de proyecto** → `ProjectField`, no un `<Select>` custom
- Si el input es un **textarea** → `NotesField`, no `<Textarea>` directo

> ⛔ **NUNCA** usar componentes UI primitivos (`Input`, `Select`, `Textarea`, `Calendar`) directamente en forms si existe un Field Factory equivalente.
>
> ⛔ **NUNCA** crear un input custom "porque es más simple" cuando existe un Field Factory.
>
> ⛔ **NUNCA** usar `MultiFileUpload` directamente — usar `UploadField` que lo envuelve con el patrón estándar.

---

## 2. Estructura del Form

Todo form debe seguir el patrón semi-autónomo documentado en el SKILL.md:

```tsx
export function MyForm({ organizationId, ...data }: MyFormProps) {
    const { closeModal } = useModal();
    const router = useRouter();

    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                {/* Fields aquí */}
            </div>
            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel="Guardar"
                onCancel={() => closeModal()}
            />
        </form>
    );
}
```

---

## Checklist

- [ ] ¿Se leyó `seencel-forms-modals/SKILL.md` antes de implementar?
- [ ] ¿Se usan Field Factories en vez de componentes primitivos?
- [ ] ¿El form sigue el patrón semi-autónomo (closeModal + refresh internos)?
- [ ] ¿Tiene sticky footer con `FormFooter`?
- [ ] ¿Los datos se pasan como props (no context)?
