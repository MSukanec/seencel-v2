# Plan: Migración de Forms a Panel System

## Estado: En progreso

> ⚠️ Este plan originalmente era "Forms Autónomos en Modales". Ahora se migra al **Panel System** (drawers agnósticos).

---

## Estrategia

Todo form que hoy usa `openModal()` debe migrarse al Panel System cuando se recorra la página correspondiente.

### Pasos por form

1. Cambiar `useModal` → `usePanel`
2. Agregar `setPanelMeta` (icon, title, description, size, footer)
3. Usar `<form id={formId}>` y eliminar `<FormFooter>`
4. **OBLIGATORIO: usar Field Factories** (ver sección abajo)
5. Registrar en `panel-registry.ts`
6. En la view: `openPanel(panelId, { datos })` sin presentación

### Datos auxiliares

| Datos que necesita | Estrategia |
|---|---|
| `currencies`, `wallets`, `projects`, `clients` | **Store** (`useFormData()`) |
| Datos específicos del feature | Props desde la view o useEffect interno |
| `onOptimisticSubmit` callback | Props `onSuccess` |

---

## ⚠️ Field Factories: USO OBLIGATORIO

**TODOS los campos en forms (nuevos o migrados) DEBEN usar los Field Factories de `@/components/shared/forms/fields/`.**

> ⛔ **NUNCA** usar `<Input>` + `<FormGroup>` raw. SIEMPRE usar el Field Factory correspondiente.
>
> ⛔ **NUNCA** usar `<Select>` + `<FormGroup>` raw. SIEMPRE usar `<SelectField>`.

### Campos disponibles

| Campo | Factory |
|---|---|
| Texto | `TextField` |
| Select (dropdown) | `SelectField` |
| Moneda | `CurrencyField` (smart) |
| Billetera | `WalletField` (smart) |
| Proyecto | `ProjectField` (smart) |
| Contacto | `ContactField` (smart) |
| Monto / número | `AmountField` |
| Fecha | `DateField` |
| Hora | `TimeField` |
| Notas / textarea | `NotesField` |
| Referencia | `ReferenceField` |
| Tipo de cambio | `ExchangeRateField` |
| Switch | `SwitchField` |
| Color picker | `ColorField` |
| Upload | `UploadField` |
| Asignado a | `AssignedToField` |
| Segmented | `SegmentedField` |
| Teléfono | `PhoneField` |
| Unidad | `UnitField` |
| Tarea | `TaskField` |

### Cuándo avisar al usuario

Si un campo requerido **no tiene Field Factory**, el agente DEBE:
1. **Avisar al usuario** describiendo qué campo se necesita
2. **NO crear un campo raw** como workaround
3. Esperar decisión: crear un nuevo Field Factory o usar uno existente con adaptaciones

---

## Estado de Migración

| Feature | Estado | Forms |
|---|---|---|
| **Materials** | ✅ Completo | material-form, material-payment-form, purchase-order-form, material-type-form, category-form |
| **Projects** | ✅ Completo | projects-project-form, projects-type-form, projects-modality-form |
| **Finance** | 🔲 Pendiente | movement-form, exchange-form, general-costs forms |
| **Tasks** | 🔲 Pendiente | task-form, recipe-form |
| **Subcontracts** | 🔲 Pendiente | subcontract-form, payment-form |
| **Clients** | 🔲 Pendiente | client-form, commitment-form, payment-form |
| **Contacts** | 🔲 Pendiente | contact-form |
| **Team** | 🔲 Pendiente | member-form |
| **SiteLog** | 🔲 Pendiente | entry-form, type-form |
| **Capital** | 🔲 Pendiente | contribution-form |
| **Planner** | 🔲 Pendiente | board-form, item-form |

---

## Skill de Referencia

```
.agent/skills/seencel-panel-forms/SKILL.md
```
