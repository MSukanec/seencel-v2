# Form Components

Este directorio contiene componentes compartidos para formularios en Seencel V2.

## Estructura

```
forms/
├── fields/                    # 🆕 Form Field Factories (Standard 19.10)
│   ├── index.ts               # Barrel exports
│   ├── field-wrapper.tsx      # Dev indicator (FactoryLabel)
│   ├── currency-field.tsx     # Selector de moneda
│   ├── wallet-field.tsx       # Selector de billetera
│   ├── project-field.tsx      # Selector de proyecto
│   ├── amount-field.tsx       # Input de monto
│   ├── date-field.tsx         # Selector de fecha
│   ├── notes-field.tsx        # Textarea de notas
│   ├── reference-field.tsx    # Input de referencia
│   └── exchange-rate-field.tsx # Input de tipo de cambio
├── general/                   # Componentes generales de forms
├── detail-field.tsx           # Campo de detalle (solo lectura)
├── feedback-form.tsx          # Form de feedback
├── form-footer.tsx            # Footer sticky con acciones
├── form-shell.tsx             # Shell/wrapper de formulario
└── view-form-footer.tsx       # Footer para vistas
```

---

## Form Field Factories (Standard 19.10)

### ¿Qué son?

Componentes de campo **pre-configurados** que garantizan consistencia visual y funcional en TODOS los formularios de la aplicación.

### ¿Por qué usarlos?

| Problema Anterior | Solución |
|-------------------|----------|
| Cada form tenía su propio formato de moneda | `CurrencyField` siempre muestra `Nombre (Símbolo)` |
| Placeholders inconsistentes | Placeholders predefinidos y consistentes |
| Labels diferentes para mismo campo | Labels por defecto estandarizados |
| Código duplicado en cada form | Un solo import, una línea de código |

### Instalación

Los Field Factories ya están disponibles. Solo importa y usa:

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
```

---

## Uso

### Ejemplo Básico

```tsx
import { CurrencyField, AmountField } from "@/components/shared/forms/fields";

function MyForm({ currencies }) {
    const [currencyId, setCurrencyId] = useState("");
    const [amount, setAmount] = useState("");

    return (
        <form>
            <CurrencyField
                value={currencyId}
                onChange={setCurrencyId}
                currencies={currencies}
            />
            <AmountField
                value={amount}
                onChange={setAmount}
            />
        </form>
    );
}
```

### Ejemplo Completo (Form de Pago)

```tsx
import {
    DateField,
    ProjectField,
    WalletField,
    CurrencyField,
    AmountField,
    ExchangeRateField,
    NotesField,
    ReferenceField,
} from "@/components/shared/forms/fields";

function PaymentForm({ projects, wallets, currencies }) {
    const [date, setDate] = useState<Date>(new Date());
    const [projectId, setProjectId] = useState("");
    const [walletId, setWalletId] = useState("");
    const [currencyId, setCurrencyId] = useState("");
    const [amount, setAmount] = useState("");
    const [exchangeRate, setExchangeRate] = useState("");
    const [notes, setNotes] = useState("");
    const [reference, setReference] = useState("");

    return (
        <form className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
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
            </div>
            <FormFooter />
        </form>
    );
}
```

---

## Campos Disponibles

### CurrencyField
Selector de moneda.

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | string | - | ID de moneda seleccionada |
| `onChange` | (value: string) => void | - | Callback de cambio |
| `currencies` | Currency[] | - | Lista de monedas disponibles |
| `label` | string | "Moneda" | Texto del label |
| `required` | boolean | true | ¿Mostrar asterisco? |
| `disabled` | boolean | false | ¿Desactivar campo? |
| `placeholder` | string | "Seleccionar moneda" | Placeholder |

**Formato de salida:** `Nombre (Símbolo)` → "Peso Argentino ($)"

---

### WalletField
Selector de billetera.

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | string | - | ID de billetera seleccionada |
| `onChange` | (value: string) => void | - | Callback de cambio |
| `wallets` | Wallet[] | - | Lista de billeteras |
| `label` | string | "Billetera" | Texto del label |
| `showCurrency` | boolean | false | Mostrar símbolo de moneda |

---

### ProjectField
Selector de proyecto.

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | string | - | ID de proyecto seleccionado |
| `onChange` | (value: string) => void | - | Callback de cambio |
| `projects` | Project[] | - | Lista de proyectos |
| `label` | string | "Proyecto" | Texto del label |

**Nota:** Muestra "No hay proyectos disponibles" si la lista está vacía.

---

### AmountField
Input numérico para montos.

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | string \| number | - | Valor actual |
| `onChange` | (value: string) => void | - | Callback de cambio |
| `label` | string | "Monto" | Texto del label |
| `min` | number | 0 | Valor mínimo |
| `step` | number | 0.01 | Incremento |
| `helpText` | string | - | Texto de ayuda |

---

### DateField
Selector de fecha con calendario.

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | Date \| undefined | - | Fecha seleccionada |
| `onChange` | (value: Date \| undefined) => void | - | Callback de cambio |
| `label` | string | "Fecha" | Texto del label |
| `dateFormat` | string | "PPP" | Formato de fecha |

**Formato de salida:** "4 de febrero de 2026" (locale español)

---

### NotesField
Textarea para notas/descripciones.

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | string | - | Texto actual |
| `onChange` | (value: string) => void | - | Callback de cambio |
| `label` | string | "Notas" | Texto del label |
| `rows` | number | 3 | Filas visibles |
| `required` | boolean | **false** | ¿Mostrar asterisco? |

---

### ReferenceField
Input para referencias de transacción.

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | string | - | Referencia actual |
| `onChange` | (value: string) => void | - | Callback de cambio |
| `label` | string | "Referencia" | Texto del label |
| `helpText` | string | "Nro. de transacción o recibo" | Texto de ayuda |
| `required` | boolean | **false** | ¿Mostrar asterisco? |

---

### ExchangeRateField
Input para tipo de cambio.

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | string \| number | - | Tipo de cambio actual |
| `onChange` | (value: string) => void | - | Callback de cambio |
| `label` | string | "Tipo de Cambio" | Texto del label |
| `step` | number | 0.0001 | Incremento (4 decimales) |
| `required` | boolean | **false** | ¿Mostrar asterisco? |

---

## Indicador Visual (Solo Desarrollo)

En modo desarrollo (`NODE_ENV === 'development'`), los campos que usan Field Factories muestran un **punto de color primario** delante del label:

```
● Moneda *
● Billetera *
● Monto *
  Estado *        ← Sin punto = campo manual
  Cliente *       ← Sin punto = campo manual
```

Esto ayuda a identificar visualmente qué campos ya están migrados al sistema de factories.

En producción, el indicador **no se muestra**.

---

## Reglas de Uso

### ✅ HACER

```tsx
// Importar desde el barrel
import { CurrencyField, WalletField } from "@/components/shared/forms/fields";

// Usar con los datos que ya tienes
<CurrencyField value={currencyId} onChange={setCurrencyId} currencies={currencies} />
```

### ❌ NO HACER

```tsx
// NO crear campos de moneda/billetera manualmente
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
```

---

## Migración de Forms Existentes

Al refactorizar un form existente:

1. **Identificar** campos que pueden usar Field Factories
2. **Importar** los campos necesarios desde `@/components/shared/forms/fields`
3. **Reemplazar** el código manual con el Field Factory
4. **Eliminar** imports innecesarios (FormGroup individual, Calendar, etc.)
5. **Verificar** que el form compile y funcione correctamente

---

## Extensibilidad

Para agregar un nuevo Field Factory:

1. Crear el archivo en `fields/nuevo-field.tsx`
2. Usar `FactoryLabel` para el indicador visual
3. Exportar desde `fields/index.ts`
4. Documentar en este README

```tsx
// Ejemplo: ClientField
import { FormGroup } from "@/components/ui/form-group";
import { Combobox } from "@/components/ui/combobox";
import { FactoryLabel } from "./field-wrapper";

export function ClientField({ value, onChange, clients, label = "Cliente", ...props }) {
    return (
        <FormGroup label={<FactoryLabel label={label} />} {...props}>
            <Combobox
                value={value}
                onValueChange={onChange}
                options={clients.map(c => ({ value: c.id, label: c.name }))}
                placeholder="Seleccionar cliente"
            />
        </FormGroup>
    );
}
```
