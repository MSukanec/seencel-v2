# Plan: Migración de Forms/Modals a Autonomía

## Problema

Muchos forms de Seencel están **acoplados a la página que los abre**. Requieren datos auxiliares (como `contactCategories`, `currencies`, `providers`) como props que solo la página padre puede proveer. Esto impide abrir el mismo form desde otro lugar de la app.

**Ejemplo concreto:** `ContactForm` requiere `contactCategories`, `companyContacts` y `onOptimisticSubmit` — no se puede abrir desde la vista de Participantes de un proyecto porque esa página no tiene esos datos.

---

## Auditoría: 3 Patrones Encontrados

### 🟢 Patrón A: Semi-Autónomo via Store
| | |
|---|---|
| **Ejemplo** | `MaterialForm` |
| **Cómo funciona** | Usa `useFormData()` del Zustand store para `currencies` |
| **Ventaja** | Funciona en cualquier modal/portal (Zustand está fuera del React tree) |
| **Limitación** | Solo sirve para datos que ya están en el store |

### 🟡 Patrón B: Semi-Autónomo via useEffect
| | |
|---|---|
| **Ejemplo** | `ClientForm` |
| **Cómo funciona** | Fetchea `contacts` y `projects` en un `useEffect` con Supabase directo |
| **Ventaja** | Funciona desde cualquier parte, no depende del store |
| **Limitación** | Flash de loading momentáneo |

### 🔴 Patrón C: Acoplado al padre (LA MAYORÍA)
| | |
|---|---|
| **Ejemplos** | `ContactForm`, `SubcontractsSubcontractForm`, `FinanceMovementForm` |
| **Cómo funciona** | Recibe TODO como props desde la vista padre |
| **Problema** | No se puede abrir desde otra página |

---

## Estrategia de Migración

Para cada form acoplado, elegir la estrategia según el tipo de datos que necesita:

| Datos que necesita | Estrategia | Razón |
|---|---|---|
| `currencies`, `wallets`, `projects`, `clients` | **Store** (`useFormData()`) | Ya están en el store global |
| Datos específicos del feature (`contactCategories`, `providers`, etc.) | **useEffect** fetch interno | No vale la pena cargarlos en el store global |
| `onOptimisticSubmit` callback | **Eliminar** — el form llama server actions directamente | El form maneja su propio ciclo de vida |

---

## Forms Prioritarios para Migrar

### 1. ✅ `ContactForm` (PRIMERO — bloquea Participantes)
- **Archivo:** `src/features/contact/forms/contact-form.tsx`
- **Props acopladas:** `contactCategories`, `companyContacts`, `onOptimisticSubmit`
- **Cambios:**
  - Agregar `useEffect` para fetchear `contactCategories` y `companyContacts` internamente
  - Eliminar `onOptimisticSubmit` — el form llama `createContact` / `updateContact` directamente
  - Mantener solo: `organizationId`, `initialData?`
  - Agregar `onSuccess?` callback simple (para refresh del padre)

### 2. `FinanceMovementForm`
- **Props acopladas:** `concepts`, `wallets`, `currencies`, `projects`, `clients`, `financialData`
- **Cambios:** Migrar `currencies`, `wallets`, `projects`, `clients` a `useFormData()`. `concepts` y `financialData` via useEffect.

### 3. `SubcontractsSubcontractForm`
- **Props acopladas:** `providers`, `currencies`, `indexTypes`
- **Cambios:** `currencies` via store. `providers`, `indexTypes` via useEffect.

### 4. `SubcontractPaymentForm`
- Similar al anterior.

### 5. `GeneralCostsPaymentForm`
- Similar al anterior.

---

## Regla de Oro (para nuevos forms)

> Un form NUNCA debe recibir datos auxiliares (listas para dropdowns, categorías, etc.) como props.
> Debe obtenerlos del **store** (si son globales) o **fetchearlos internamente** (si son específicos del feature).
> Solo debe recibir como props: `organizationId`, `initialData?`, `onSuccess?`.

---

## Estado

| Form | Estado | Prioridad |
|---|---|---|
| `ContactForm` | 🔲 Pendiente | 🔴 Alta |
| `FinanceMovementForm` | 🔲 Pendiente | 🟡 Media |
| `SubcontractsSubcontractForm` | 🔲 Pendiente | 🟡 Media |
| `SubcontractPaymentForm` | 🔲 Pendiente | 🟢 Baja |
| `GeneralCostsPaymentForm` | 🔲 Pendiente | 🟢 Baja |
| `GeneralCostsCategoryForm` | 🔲 Pendiente | 🟢 Baja |
| `GeneralCostsConceptForm` | 🔲 Pendiente | 🟢 Baja |
