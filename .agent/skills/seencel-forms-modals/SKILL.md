---
name: Seencel Forms & Modals Standard
description: Estándar OBLIGATORIO para crear Formularios y Modales en Seencel V2. Define arquitectura sticky footer, inputs especializados, patrones de borrado y forms semi-autónomos.
---

# Sistema de Formularios y Modales

## Arquitectura de Forms Semi-Autónomos (🚨 NUEVO)

### Concepto Clave

Los forms en Seencel V2 son **semi-autónomos**: manejan su propio ciclo de vida (cerrar modal, refrescar datos) pero **reciben datos como props** porque los modales se renderizan fuera del árbol de providers.

### ¿Por qué Semi-Autónomos?

1. **Los modales usan Portal** - `DialogPrimitive.Portal` monta el contenido en `document.body`, fuera del árbol de React
2. **Sin acceso a Context** - Los providers (`CurrencyProvider`, `OrganizationProvider`) no están disponibles en el Portal
3. **Datos via props** - Los datos (wallets, currencies, etc.) deben pasarse como props desde la View
4. **Callbacks internos** - El form maneja `closeModal()` y `router.refresh()` internamente

### Patrón Correcto

```tsx
// === Form (Semi-Autónomo) ===
import { useModal } from "@/providers/modal-store";
import { useRouter } from "@/i18n/routing";

interface MyFormProps {
    // Datos - pasados como props
    organizationId: string;
    currencies?: Currency[];
    wallets?: Wallet[];
    // Datos opcionales para edición
    initialData?: MyEntity | null;
    // ❌ NO HAY onSuccess ni onCancel
}

export function MyForm({ organizationId, currencies = [], wallets = [], initialData }: MyFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    
    // Callbacks internos - el form controla su propio ciclo de vida
    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };
    
    const handleCancel = () => {
        closeModal();
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await createEntity(data);
            toast.success("Creado correctamente");
            handleSuccess(); // Cerrar y refrescar
        } catch (error) {
            toast.error("Error al crear");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            {/* ... */}
            <FormFooter 
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                onCancel={handleCancel} // Callback interno
            />
        </form>
    );
}
```

### Cómo abrir el Modal desde la View

```tsx
// === View ===
const openMyModal = () => {
    openModal(
        <MyForm
            organizationId={organizationId}
            currencies={currencies}
            wallets={wallets}
        />,
        {
            title: "Crear Item",
            description: "Completá los campos.",
            size: "md"
        }
    );
    // ❌ NO se pasan onSuccess ni onCancel
};
```

### Comparación Antes vs Después

| Antes (Props Callbacks) | Después (Semi-Autónomo) |
|------------------------|-------------------------|
| `<Form onSuccess={() => { closeModal(); router.refresh(); }} onCancel={closeModal} />` | `<Form organizationId={orgId} wallets={wallets} />` |
| 10+ líneas de props | 3-4 líneas de props |
| View controla ciclo de vida | Form controla su ciclo de vida |
| Duplicación de lógica | Sin duplicación |

---

## Uso de Modales

```tsx
import { useModal } from "@/providers/modal-store";

const { openModal, closeModal } = useModal();

openModal(<MyFormComponent organizationId={orgId} />, { 
    title: "Crear Nuevo Item",
    description: "Completá los campos para crear un nuevo item.", // OBLIGATORIO
    size: 'md' // 'sm' | 'md' | 'lg' | 'xl'
});
```

> ⚠️ **OBLIGATORIO**: Siempre incluir `description`. Nunca dejarlo vacío.

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
        onCancel={handleCancel} // Callback interno
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

## Ejemplo Completo (Semi-Autónomo)

```tsx
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/providers/modal-store";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";

interface MyFormProps {
    organizationId: string;
    initialData?: MyEntity | null;
}

export function MyForm({ organizationId, initialData }: MyFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;
    
    // Callbacks internos
    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };
    
    const handleCancel = () => {
        closeModal();
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // ... submit logic
            toast.success(isEditing ? "Guardado" : "Creado correctamente");
            handleSuccess();
        } catch (error) {
            toast.error("Error");
        } finally {
            setIsLoading(false);
        }
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
                onCancel={handleCancel}
            />
        </form>
    );
}
```

---

## Componentes Base

| Componente | Ubicación | Uso |
|------------|-----------|-----|
| `FormFooter` | `@/components/shared/forms/form-footer` | Botones de acción (sticky, maneja `Cmd+Enter`) |
| `FormGroup` | `@/components/ui/form-group` | Wrapper para campos con label |

---

## Form Field Factories (🚨 USAR SIEMPRE - Standard 19.10)

**Los campos de formulario repetidos DEBEN usar Field Factories** para garantizar consistencia visual y funcional en TODOS los formularios.

### Ubicación

```
src/components/shared/forms/fields/
├── index.ts                 # Barrel exports
├── field-wrapper.tsx        # FactoryLabel (indicador visual)
├── currency-field.tsx       # Selector de moneda
├── wallet-field.tsx         # Selector de billetera
├── project-field.tsx        # Selector de proyecto
├── amount-field.tsx         # Input de monto
├── date-field.tsx           # Selector de fecha
├── notes-field.tsx          # Textarea de notas
├── reference-field.tsx      # Input de referencia
└── exchange-rate-field.tsx  # Input de tipo de cambio
```

> 📖 **Documentación completa**: Ver `src/components/shared/forms/README.md`

### Uso Básico

```tsx
import {
    CurrencyField,
    WalletField,
    ProjectField,
    AmountField,
    DateField,
    NotesField,
    ReferenceField,
    ExchangeRateField,
} from "@/components/shared/forms/fields";

// En tu form:
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <DateField value={date} onChange={setDate} label="Fecha de Pago" />
    <ProjectField value={projectId} onChange={setProjectId} projects={projects} />
    <WalletField value={walletId} onChange={setWalletId} wallets={wallets} />
    <AmountField value={amount} onChange={setAmount} />
    <CurrencyField value={currencyId} onChange={setCurrencyId} currencies={currencies} />
    <ExchangeRateField value={exchangeRate} onChange={setExchangeRate} />
    <NotesField value={notes} onChange={setNotes} className="md:col-span-2" />
    <ReferenceField value={reference} onChange={setReference} />
</div>
```

### Campos Disponibles y Defaults

| Campo | Label Default | Placeholder Default | Formato |
|-------|---------------|---------------------|---------|
| `CurrencyField` | "Moneda" | "Seleccionar moneda" | `Nombre (Símbolo)` |
| `WalletField` | "Billetera" | "Seleccionar billetera" | `wallet_name` |
| `ProjectField` | "Proyecto" | "Seleccionar proyecto" | `name` + empty state |
| `AmountField` | "Monto" | "0.00" | step=0.01, min=0 |
| `DateField` | "Fecha" | "Seleccionar fecha" | "PPP" español |
| `NotesField` | "Notas" | "Agregar notas adicionales..." | 3 rows |
| `ReferenceField` | "Referencia" | "Ej: TRX-12345" | + helpText |
| `ExchangeRateField` | "Tipo de Cambio" | "1.0000" | step=0.0001 |

### Props Comunes

Todos los campos soportan estas props opcionales:

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `label` | string | (ver tabla arriba) | Texto del label |
| `required` | boolean | true/false | Muestra asterisco (*) |
| `disabled` | boolean | false | Desactiva el campo |
| `className` | string | - | Clase CSS adicional |
| `placeholder` | string | (ver tabla arriba) | Texto placeholder |

### Indicador Visual (Solo Desarrollo)

En modo desarrollo (`NODE_ENV === 'development'`), los campos que usan Field Factories muestran un **punto de color primario** delante del label:

```
● Moneda *        ← Usa Field Factory
● Billetera *     ← Usa Field Factory
  Estado *        ← Campo manual (sin punto)
  Cliente *       ← Campo manual (sin punto)
```

Esto ayuda a identificar visualmente qué campos ya están migrados al sistema de factories.

**En producción, el indicador NO se muestra.**

### Beneficios

- ✅ **DRY**: No duplicar código de campos
- ✅ **Consistencia**: Mismo formato en todos los forms
- ✅ **Cambios centralizados**: Un cambio afecta todos los forms
- ✅ **Menos bugs**: Campos probados y validados
- ✅ **Indicador visual**: Fácil identificar campos migrados

### Reglas de Uso

#### ✅ SIEMPRE usar Field Factories para:
- Selectores de moneda, billetera, proyecto
- Inputs de monto, tipo de cambio
- Selectores de fecha
- Textareas de notas
- Inputs de referencia de transacción

#### ❌ NUNCA crear estos campos manualmente:
```tsx
// ❌ INCORRECTO - No hacer esto
<FormGroup label="Moneda" required>
    <Select value={currencyId} onValueChange={setCurrencyId}>
        <SelectTrigger>
            <SelectValue placeholder="Seleccionar moneda" />
        </SelectTrigger>
        <SelectContent>
            {currencies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.symbol})
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
</FormGroup>

// ✅ CORRECTO - Usar Field Factory
<CurrencyField value={currencyId} onChange={setCurrencyId} currencies={currencies} />
```

### Checklist de Migración de Forms

Al refactorizar un form existente:

- [ ] Identificar campos que pueden usar Field Factories
- [ ] Importar campos desde `@/components/shared/forms/fields`
- [ ] Reemplazar código manual con Field Factories
- [ ] Eliminar imports innecesarios (Calendar, Select individual, etc.)
- [ ] Verificar compilación con `npx tsc --noEmit`
- [ ] Verificar indicadores visuales en desarrollo

> ⛔ **NUNCA** crear campos de moneda, billetera, proyecto, fecha o monto manualmente. Usar Field Factories.

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

## Limitaciones Conocidas (🔴 DEUDA TÉCNICA)

### Los Modales no tienen acceso a Context Providers

#### El Problema

Debido a que `DialogPrimitive.Portal` (de Radix) monta el contenido del modal **directamente en `document.body`**, los modales quedan fuera del árbol de React y pierden acceso a los Context Providers.

```
┌─────────────────────────────────────────────────────────────┐
│  [locale]/layout.tsx                                         │
│  ├── ThemeProvider                                           │
│  ├── ModalProvider ← Renderiza modales aquí via PORTAL      │
│  │                                                           │
│  └── (dashboard)/layout.tsx                                  │
│      ├── OrganizationProvider ← wallets, projects, clients   │
│      ├── CurrencyProvider ← currencies                       │
│      └── {children} ← Tus páginas                            │
└─────────────────────────────────────────────────────────────┘

Cuando abrís un modal, Radix lo monta así:
┌───────────────────────────────────────────────────────────────┐
│ document.body                                                  │
│ ├── <div id="__next">                                         │
│ │   └── (todo tu árbol React con providers)                   │
│ │                                                              │
│ └── <div data-radix-portal>  ← AQUÍ se monta el modal         │
│     └── <FinanceMovementForm />  ❌ SIN ACCESO A PROVIDERS    │
└───────────────────────────────────────────────────────────────┘
```

#### Consecuencias

```tsx
// ❌ ESTO FALLA dentro de un modal
export function MyForm() {
    const { allCurrencies } = useCurrency(); 
    // 💥 Error: "useCurrency must be used within a CurrencyProvider"
    
    const { wallets } = useOrganization();
    // 💥 Error: "useOrganization must be used within OrganizationProvider"
}
```

#### Archivos Involucrados

| Archivo | Rol |
|---------|-----|
| `src/providers/modal-provider.tsx` | Renderiza modales, usa `DialogPrimitive.Portal` |
| `src/app/[locale]/layout.tsx` | Contiene `<ModalProvider />` |
| `src/app/[locale]/(dashboard)/layout.tsx` | Contiene `<OrganizationProvider>` y `<CurrencyProvider>` |

#### Solución Actual (Workaround)

Pasar los datos como **props** desde la View que abre el modal:

```tsx
// La View tiene acceso a los datos del server
openModal(
    <MyForm 
        organizationId={organizationId}
        currencies={currencies}
        wallets={wallets}
    />
);
```

---

### Posibles Soluciones Futuras

#### Opción 1: Mover ModalProvider dentro del dashboard layout

```tsx
// src/app/[locale]/(dashboard)/layout.tsx
<OrganizationProvider>
    <CurrencyProvider>
        <ModalProvider>  {/* ← Moverlo aquí */}
            {children}
        </ModalProvider>
    </CurrencyProvider>
</OrganizationProvider>
```

**Problema**: Los modales en páginas públicas (landing, auth) dejarían de funcionar.

**Solución**: Crear `DashboardModalProvider` separado del `GlobalModalProvider`.

#### Opción 2: Usar `container` prop de Radix Portal

Radix soporta especificar dónde montar el Portal:

```tsx
<DialogPrimitive.Portal container={containerRef.current}>
```

**Problema**: Requiere refactorizar todo el sistema de modales para usar un container dentro del árbol.

#### Opción 3: Envolver el modal content con Providers

En `modal-provider.tsx`, envolver `modal.view` con los providers:

```tsx
<OrganizationProviderClient value={orgContext}>
    <CurrencyProviderClient value={currencyContext}>
        {modal.view}
    </CurrencyProviderClient>
</OrganizationProviderClient>
```

**Problema**: Necesitarías pasar los valores del context de alguna forma al ModalProvider.

#### Opción 4: Zustand para estado global

Migrar de Context API a Zustand para estado que necesitan los modales:

```tsx
// store/organization-store.ts
export const useOrganizationStore = create((set) => ({
    wallets: [],
    projects: [],
    setFinancialData: (data) => set(data),
}));
```

**Beneficio**: Zustand no depende del árbol de React, funciona en cualquier lugar.

---

## Checklist

- [ ] ¿Form usa callbacks internos (`handleSuccess`, `handleCancel`)?
- [ ] ¿Form NO recibe `onSuccess` ni `onCancel` como props?
- [ ] ¿Form recibe datos necesarios como props (organizationId, currencies, etc.)?
- [ ] ¿Modal tiene `description`?
- [ ] ¿Form usa `className="flex flex-col h-full min-h-0"`?
- [ ] ¿Content wrapper usa `flex-1 overflow-y-auto`?
- [ ] ¿`FormFooter` está FUERA del div scrolleable?
- [ ] ¿`FormFooter` usa `className="-mx-4 -mb-4 mt-6"`?
- [ ] ¿Campos de moneda/billetera/proyecto/fecha/monto usan **Field Factories**?
- [ ] ¿Teléfonos usan `PhoneInput`?
- [ ] ¿MIME types mapeados para BD?


