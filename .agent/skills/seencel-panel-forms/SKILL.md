---
name: Seencel Panel Forms Standard
description: Estándar OBLIGATORIO para crear formularios en Seencel V2. Los forms se renderizan en Panels (drawers agnósticos) con footer container-managed. Define arquitectura self-contained, Field Factories y patrones de UI.
---

# Sistema de Formularios y Paneles

> ⛔ **NUNCA** usar `openModal` para formularios. Los modales son SOLO para confirmaciones y alertas.
> Los formularios se abren en **Panels** (drawers) via `openPanel`.

## Arquitectura de Panels Agnósticos

### Principio Fundamental

Los Panels son **100% agnósticos de las vistas**. Se pueden abrir desde cualquier lugar de la app:
- Desde una vista
- Desde un menú contextual (right-click)
- Desde un command palette
- Desde cualquier componente client

### Cómo funciona

```
Vista                         Panel Store                   Form
──────                        ───────────                   ────
openPanel('material-form',    → crea PanelItem              → useEffect:
  { mode, orgId, units })       (id, formId, props)            setPanelMeta({
                                                                 icon, title,
                              → PanelProvider renderiza          description,
                                Body: <Form formId={id}>        size, footer
                                Footer: (vacío al inicio)      })
                                                             → Container re-renders
                                                               con meta del form
```

### API de uso

```tsx
const { openPanel, closePanel } = usePanel();

// Abrir — solo panelId + datos. CERO presentación.
openPanel('material-form', { mode: 'create', orgId, units, categories });

// Reemplazar sin apilar
replacePanel('material-detail', { id: '456' });

// Cerrar
closePanel();
```

> ⛔ **NUNCA** pasar título, descripción, footer ni ícono en `openPanel()`. El form lo define con `setPanelMeta`.

---

## Form Self-Contained (🚨 OBLIGATORIO)

Cada form define su propia presentación via `setPanelMeta`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { usePanel } from "@/stores/panel-store";
import { Package } from "lucide-react";
import { toast } from "sonner";

interface MyFormProps {
    organizationId: string;
    initialData?: MyEntity | null;
    onSuccess?: (entity?: MyEntity) => void;
    formId?: string;  // ← lo pasa el PanelProvider automáticamente
}

export function MyForm({ organizationId, initialData, onSuccess, formId }: MyFormProps) {
    const { closePanel, setPanelMeta } = usePanel();
    const isEditing = !!initialData;

    // 🚨 OBLIGATORIO: Self-describe
    useEffect(() => {
        setPanelMeta({
            icon: Package,
            title: isEditing ? "Editar Item" : "Nuevo Item",
            description: isEditing
                ? "Modifica los datos del item"
                : "Completá los campos para crear un nuevo item",
            size: "md",
            footer: {
                submitLabel: isEditing ? "Guardar Cambios" : "Crear Item"
            }
        });
    }, [isEditing, setPanelMeta]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await createEntity(data);
            toast.success("Creado correctamente");
            onSuccess?.(result);
            closePanel();
        } catch (error) {
            toast.error("Error al crear");
        }
    };

    // 🚨 OBLIGATORIO: <form id={formId}> — conecta con el footer del container
    return (
        <form id={formId} onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fields aquí */}
            </div>
        </form>
    );
}
```

### ¿Cómo funciona el submit?

El botón "Crear" del footer está **fuera** del `<form>` tag, pero usa el atributo HTML `form={formId}` para vincularse:

```
┌─ HEADER ──────────────────────┐  ← icon + título + descripción + X
├─ BODY ────────────────────────┤  ← scrollable, <form id={formId}>
├─ FOOTER ──────────────────────┤  ← sticky, <button form={formId} type="submit">
└───────────────────────────────┘
```

### 3 modos de footer

| Modo | Config | Resultado |
|------|--------|-----------|
| **Standard** | `footer: { submitLabel: "Crear" }` | Cancelar (25%) + Submit (75%) |
| **Multi-action** | `footer: { actions: [...] }` | N botones custom |
| **Custom** | `footer: { customFooter: <JSX> }` | Lo que quieras |

---

## Cómo abrir un Panel desde una View

```tsx
// === View ===
const { openPanel, closePanel } = usePanel();

const handleCreate = () => {
    openPanel('material-form', {
        mode: "create",
        organizationId: orgId,
        units,
        categories,
        onSuccess: (newMaterial) => {
            closePanel();
            addItem(newMaterial);
        },
    });
};
```

> ⛔ **NUNCA** pasar title, description, size, footer en el tercer argumento.
> El form lo define con `setPanelMeta`.

---

## Registrar un Panel

Cada form debe registrarse en `src/stores/panel-registry.ts`:

```tsx
export const PANEL_REGISTRY: Record<string, PanelRegistryItem> = {
    'material-form': {
        component: dynamic(() =>
            import('@/features/materials/forms/material-form')
                .then(m => m.MaterialForm)
        ),
    },
    // ... más forms
};
```

---

## Naming Convention & Location (🚨 OBLIGATORIO)

### Ubicación de Forms

> [!CAUTION]
> Los formularios **SIEMPRE** deben ir en la carpeta `forms/` **directamente dentro del feature**, NO dentro de `components/`.

```
src/features/[feature]/
├── actions.ts
├── types.ts
├── forms/                         # ✅ CORRECTO
│   ├── [feature]-[entity]-form.tsx
│   └── [feature]-[other]-form.tsx
├── components/
│   └── ...
└── views/
    └── ...
```

### Naming Pattern

El nombre debe seguir: `[feature]-[entity]-form.tsx`

| ✅ Correcto | ❌ Incorrecto |
|------------|--------------|
| `general-costs-payment-form.tsx` | `payment-form.tsx` |
| `finance-movement-form.tsx` | `movement-form.tsx` |
| `materials-catalog-form.tsx` | `form.tsx` |

---

## Field Factories (🚨 USAR SIEMPRE)

Los campos repetidos **DEBEN** usar Field Factories de `@/components/shared/forms/fields`:

```tsx
import {
    TextField, AmountField, CurrencyField, DateField, TimeField,
    ProjectField, ContactField, WalletField, NotesField,
    ReferenceField, ColorField, SwitchField, AssignedToField,
    ExchangeRateField, UploadField,
} from "@/components/shared/forms/fields";
```

> ⛔ **NUNCA** usar `Input`, `Select`, `Textarea`, `Calendar` directamente si existe un Field Factory.

---

## Chips — Metadata Selectors (🚨 OBLIGATORIO en forms con metadata)

Los forms usan **Chips** (`@/components/shared/chips`) para selectores de metadata compactos, estilo Linear.

```tsx
import {
    ChipRow, DateChip, WalletChip, CurrencyChip,
    StatusChip, SelectChip, PeriodChip, AttachmentChip,
} from "@/components/shared/chips";
```

### Catálogo de Chips

| Chip | Uso | Popover Content |
|------|-----|----------------|
| `DateChip` | Selector de fecha | Calendar built-in |
| `WalletChip` | Selector de billetera | `WalletPopoverContent` (shared) |
| `CurrencyChip` | Selector de moneda | `CurrencyPopoverContent` (shared) |
| `StatusChip` | Selector de estado | Command built-in |
| `SelectChip` | Selector genérico (conceptos, categorías) | Command built-in |
| `PeriodChip` | Selector de período | Calendar range built-in |
| `AttachmentChip` | Adjuntos | Upload built-in |

### Shared Popover Content

Los chips de **billetera y moneda** usan componentes compartidos de `@/components/shared/popovers/`:

- `WalletPopoverContent` → incluye footer "Gestionar billeteras" con navegación a Settings > Finanzas
- `CurrencyPopoverContent` → incluye footer "Gestionar monedas" con navegación a Settings > Finanzas

> ⛔ **NUNCA** hardcodear Command content dentro de un chip si existe Shared Popover Content
> ⛔ **NUNCA** pasar footerAction como prop — vive dentro del componente compartido

### Hybrid Chip Form Pattern

Forms como `general-costs-payment-form.tsx` combinan **Field Factories** para inputs principales con **Chips** para metadata:

```
┌─ HEADER ─────────────────────┐  ← icon + título + descripción
├─ BODY ───────────────────────┤
│  AmountField (grande)        │  ← Input principal
│  NotesField (textarea)       │  ← Descripción
│  ChipRow:                    │  ← Fila de chips (wrap automático)
│    DateChip  SelectChip      │
│    StatusChip  WalletChip    │
│    CurrencyChip              │
├─ FOOTER ─────────────────────┤  ← Cancelar + Submit
└──────────────────────────────┘
```

```tsx
<ChipRow>
    <DateChip value={date} onChange={setDate} />
    <SelectChip value={conceptId} onChange={setConceptId} options={conceptOptions} />
    <StatusChip value={status} onChange={setStatus} options={statusOptions} />
    <WalletChip value={walletId} onChange={setWalletId} options={walletOptions} />
    <CurrencyChip value={currencyId} onChange={setCurrencyId} options={currencyOptions} />
</ChipRow>
```

📖 **Referencia estándar:** `features/general-costs/forms/general-costs-payment-form.tsx`

---

## Migración Legacy

### Estado actual
- Los **forms nuevos** deben usar Panels desde el primer momento
- Los **forms legacy** (que usan `openModal`) se migran cuando se recorre la página

### Patrón de migración

```diff
// ANTES: Modal legacy
- import { useModal } from "@/stores/modal-store";
- const { closeModal } = useModal();
- <FormFooter onCancel={handleCancel} submitLabel="Crear" />

// DESPUÉS: Panel self-contained
+ import { usePanel } from "@/stores/panel-store";
+ const { closePanel, setPanelMeta } = usePanel();
+ useEffect(() => { setPanelMeta({ icon, title, footer: { submitLabel } }); }, []);
+ <form id={formId}>...</form>  // Sin FormFooter, el container lo maneja
```

### Checklist de migración por form

- [ ] Cambiar `useModal` → `usePanel`
- [ ] Cambiar `closeModal` → `closePanel`
- [ ] Agregar `formId` como prop
- [ ] Agregar `useEffect` con `setPanelMeta` (icon, title, description, size, footer)
- [ ] Usar `<form id={formId}>` en vez de `<form>`
- [ ] Eliminar `<FormFooter>` — el container lo maneja
- [ ] Eliminar `handleCancel` — el container lo maneja
- [ ] Registrar en `panel-registry.ts`
- [ ] En la view: cambiar `openModal` → `openPanel` con solo datos

### Modales que NO migrar

Estos patrones **siguen siendo modales** (no panels):

| Componente | Razón |
|------------|-------|
| `DeleteDialog` | Confirmación destructiva |
| `AlertDialog` | Alertas críticas |
| `DeleteReplacementModal` | Soft delete con reasignación |
| `BulkImportModal` | Wizard multi-step |

---

## Checklist de Form Nuevo

- [ ] ¿El form usa `setPanelMeta` para definir icon, title, description, size, footer?
- [ ] ¿Usa `<form id={formId}>`?
- [ ] ¿NO tiene `<FormFooter>`? (el container lo maneja)
- [ ] ¿Está registrado en `panel-registry.ts`?
- [ ] ¿Se usan Field Factories en vez de componentes primitivos?
- [ ] ¿Se usan Chips (`DateChip`, `WalletChip`, `CurrencyChip`, etc.) para selectores de metadata?
- [ ] ¿Los chips de wallet/currency usan Shared Popover Content (NO Command hardcodeado)?
- [ ] ¿La view abre con `openPanel(panelId, { datos })` sin presentación?
- [ ] ¿Está en `features/[feature]/forms/[feature]-[entity]-form.tsx`?
