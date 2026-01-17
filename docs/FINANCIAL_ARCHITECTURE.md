# Arquitectura Financiera & Escalabilidad

> [!IMPORTANT]
> Este documento es la **Fuente de la Verdad** para toda lógica financiera en la aplicación. Cualquier feature nueva debe adherirse a estos principios.

## 1. Conceptos Core

### Monedas
Existen 3 tipos de monedas en el sistema para una organización:
1.  **Moneda Base (Default Currency):** La moneda operativa principal de la organización (ej. Peso Argentino). Se define al crear la org y **NO cambia**.
2.  **Moneda de Referencia (Functional Currency):** Una moneda opcional utilizada para estandarizar reportes (ej. Dólar USD). Se usa para calcular el `functional_amount`.
3.  **Moneda del Movimiento:** La moneda en la que se realizó una transacción real.

### Functional Amount (Monto Funcional)
Es el valor normalizado de una transacción, calculado automáticamente para permitir sumas y comparaciones coherentes.

**Lógica de Cálculo (`calculate_functional_amount`):**
- Si `Moneda Movimiento` == `Moneda Referencia`: `Monto Funcional` = `Monto`.
- Si `Moneda Movimiento` != `Moneda Referencia`: `Monto Funcional` = `Monto / Cotización`.
- *Fallback:* Si no hay Moneda de Referencia definida, se usa la Moneda Base.

### Base de Datos & Automatización
- **Columna:** `functional_amount` (Numeric(20,2)) en toda tabla financiera (`client_payments`, `client_commitments`, `general_costs_payments`, etc).

#### Arquitectura de Triggers (Standard)
Para mantener la integridad, usamos un modelo de "1 Cerebro, N Ejecutores":

1.  **Función Maestra (El Cerebro):**
    *   `public.calculate_functional_amount(amount, rate, currency_id, org_id)`
    *   Contiene la lógica matemática pura (División/Multiplicación según config).
    *   Devuelve `NUMERIC`.

2.  **Funciones Wrapper (Los Ejecutores):**
    *   Cada tabla tiene su propia función trigger que llama a la Función Maestra.
    *   Naming Convention: `set_{table_singular}_functional_amount`
    *   Ejemplo: `public.set_client_payment_functional_amount()`

3.  **Triggers:**
    *   Cada tabla tiene un trigger `BEFORE INSERT OR UPDATE`.
    *   Naming Convention: `set_functional_amount_{table_name}`
    *   Ejemplo: `set_functional_amount_client_payments`

```sql
-- Ejemplo de Implementación Estándar para nueva tabla
CREATE TRIGGER set_functional_amount_new_table
BEFORE INSERT OR UPDATE ON public.new_table
FOR EACH ROW
EXECUTE FUNCTION public.set_new_table_functional_amount();
```

## 2. Feature Flags & UI Logic (`useFinancialFeatures`)

Para mantener la UI limpia y escalable, usamos un Hook centralizado que determina qué elementos mostrar basándose en la configuración de la organización.

### Hook: `useFinancialFeatures()`

| Flag | Condición | Efecto en UI |
| :--- | :--- | :--- |
| `showCurrencySelector` | `secondary_currencies.length > 0` | Muestra selectores de moneda en Forms y Columnas "Moneda" en tablas. |
| `showExchangeRate` | `use_currency_exchange === true` | Muestra inputs de "Cotización" en Forms. |
| `showFunctionalColumns` | `showExchangeRate && functional_currency_id` | Muestra columnas de valores normalizados (ej. "Monto en USD") en reportes. |

### Implementación en Componentes

```tsx
// Ejemplo de uso en un Formulario
const { showCurrencySelector, showExchangeRate } = useFinancialFeatures();

return (
  <form>
     <Input label="Monto" />
     
     {showCurrencySelector && (
       <Select label="Moneda" ... />
     )}

     {showExchangeRate && (
       <Input label="Cotización" ... />
     )}
  </form>
);
```

## 3. Legacy Migration Guidelines

Para migrar features antiguas a esta arquitectura:
1.  **Eliminar cálculos manuales en el frontend:** No hacer `amount / exchange_rate` en TypeScript.
2.  **Usar `functional_amount`:** Traer el valor ya calculado desde la DB.
3.  **Respetar Flags:** Envolver columnas y campos en los flags del hook `useFinancialFeatures`.

---
## 4. Dashboard & Reporting UX

### Componente Unificado: `UnifiedFinancialSummary`
Para reportes de alto nivel (Dashboards), utilizamos un componente unificado que reemplaza múltiples tarjetas individuales.

#### Modos de Visualización (`View Modes`)
Este componente maneja dos modos de visualización controlados por el usuario, que afectan **puramente la presentación** y no la integridad de los datos de los gráficos:

1.  **Mix Real (Default):**
    *   Muestra los valores desglosados en sus monedas originales.
    *   Ejemplo: `"$ 100.000 + u$s 500"`
    *   Uso: Permite al usuario ver la composición real de su caja o deuda sin conversiones forzadas.

2.  **Referencia (Ref):**
    *   Muestra un único valor estandarizado en la Moneda de Referencia (Functional).
    *   Ejemplo: `"u$s 600"` (asumiendo 1 USD = 1000 ARS).
    *   Uso: Permite tener una magnitud total unificada.

### Regla de Estabilidad de Gráficos
> [!IMPORTANT]
> **Los Gráficos y Porcentajes NO deben cambiar al alternar entre "Mix Real" y "Referencia".**

Para garantizar esto:
- Los gráficos **SIEMPRE** se renderizan utilizando los valores normalizados en la Moneda de Referencia (contexto 'secondary' o 'functional').
- El selector "Mix Real" del Dashboard es un estado **LOCAL** del componente de resumen y no debe alterar el contexto global de moneda que alimenta a los gráficos, para evitar que las curvas se deformen o recalculen erróneamente.

---

## 5. Dualidad Financiera: Nominal vs Functional (NEW)

En economías bimonetarias, existen dos realidades válidas que el sistema debe soportar simultáneamente. Aquí explicamos cómo resolvemos el conflicto entre "Valor Real / Moneda Dura" y "Valor Nominal / Moneda Contrato".

### A. La Realidad Funcional (Backend / DB Source of Truth)
*   **Objetivo:** Preservar el valor real de los activos y permitir reportes agregados globales.
*   **Estrategia:** Normalización a Dólar (o Ref Currency) en Base de Datos.
*   **Implementación:** Columna `functional_amount`.
*   **Caso de Uso:** Dashboard General, Reporte de Ganancias, Valuación de Cartera.
*   **Lógica:** `Pesos / Cotización Día = Dólares`.

### B. La Realidad Nominal Histórica (Frontend / Operational View)
*   **Objetivo:** Responder a la pregunta operativa del cliente: *"¿Cuántos Pesos te debo según mi contrato en Pesos?"*.
*   **Problema:** Si el usuario tiene un contrato en Pesos pero realiza pagos parciales en Dólares, el saldo no puede calcularse simplemente restando valores actuales, ya que el peso se devalúa.
*   **Estrategia:** Reconstrucción de Cuenta Corriente Histórica ("Nominal Histórico").
*   **Implementación:** Cálculo en Runtime (Frontend) iterando sobre la lista de pagos individuales.
*   **Lógica de Reconstrucción:**
    1.  Se parte del **Total del Compromiso** en su moneda original (ej. Pesos).
    2.  Se restan los **Pagos en la misma moneda** (Pesos).
    3.  Se restan los **Pagos en moneda extranjera (Dólares) convertidos a Pesos** utilizando la **Cotización Histórica** de ese pago específico.
    *   `DeudaPendiente = DeudaTotal - (PagoUSD * CotizaciónDiaPago)`.

### El Mandamiento de la Cotización
> [!CRITICAL]
> Para que ambas realidades puedan coexistir, **EL CAMPO `exchange_rate` ES OBLIGATORIO EN CADA TRANSACCIÓN**.

*   Sin `exchange_rate`, no podemos calcular el `functional_amount` (Hacia el Dólar).
*   Sin `exchange_rate`, no podemos reconstruir el `Nominal Histórico` (Hacia el Peso).
*   **Regla:** Si un usuario quiere registrar un pago cruzado (Paga Dólares deuda Pesos), debe proveer la cotización de ese momento.

---
**Ultima Actualización:** 2026-01-17
