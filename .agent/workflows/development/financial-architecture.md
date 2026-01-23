---
description: Arquitectura financiera completa: monedas, functional amount, dualidad nominal/funcional
---

# Arquitectura Financiera & Escalabilidad

> [!IMPORTANT]
> Este documento es la **Fuente de la Verdad** para toda lógica financiera. Cualquier feature nueva debe adherirse a estos principios.

---

## 1. Conceptos Core

### Tipos de Monedas

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| **Moneda Base** | Moneda operativa principal de la org. NO cambia. | Peso Argentino |
| **Moneda de Referencia** | Opcional, para estandarizar reportes. | Dólar USD |
| **Moneda del Movimiento** | Moneda real de la transacción. | Cualquiera |

### Functional Amount (Monto Funcional)

Valor normalizado para permitir sumas y comparaciones coherentes.

**Lógica de cálculo (`calculate_functional_amount`):**
- Si `Moneda Movimiento` == `Moneda Referencia`: `Functional = Monto`
- Si `Moneda Movimiento` != `Moneda Referencia`: `Functional = Monto / Cotización`
- *Fallback:* Si no hay Moneda de Referencia, usa Moneda Base

---

## 2. Base de Datos & Triggers

**Columna:** `functional_amount` (Numeric 20,2) en toda tabla financiera.

### Arquitectura de Triggers (1 Cerebro, N Ejecutores)

1. **Función Maestra (Cerebro):**
   ```sql
   public.calculate_functional_amount(amount, rate, currency_id, org_id)
   ```

2. **Funciones Wrapper (Ejecutores):**
   - Naming: `set_{table_singular}_functional_amount()`
   - Ejemplo: `set_client_payment_functional_amount()`

3. **Triggers:**
   - Naming: `set_functional_amount_{table_name}`
   - Tipo: `BEFORE INSERT OR UPDATE`

---

## 3. Feature Flags UI (`useFinancialFeatures`)

**Ubicación:** `@/hooks/use-financial-features`

| Flag | Condición | Efecto |
|------|-----------|--------|
| `showCurrencySelector` | `secondary_currencies.length > 0` | Selectores de moneda |
| `showExchangeRate` | `use_currency_exchange === true` | Input de cotización |
| `showFunctionalColumns` | `showExchangeRate && functional_currency_id` | Columnas normalizadas |

```tsx
const { showCurrencySelector, showExchangeRate } = useFinancialFeatures();

{showCurrencySelector && <Select label="Moneda" />}
{showExchangeRate && <Input label="Cotización" />}
```

---

## 4. Obtener Datos Financieros

**NUNCA** consultar `wallets` o `currencies` directamente.

**Usar:** `getOrganizationFinancialData(orgId)`

```tsx
import { getOrganizationFinancialData } from "@/features/finance/queries";

const financialData = await getOrganizationFinancialData(orgId);
// { currencies, wallets, defaultCurrencyId, defaultWalletId }
```

---

## 5. Dashboard & Reporting

### Modos de Visualización

| Modo | Muestra | Uso |
|------|---------|-----|
| **Mix Real** | Valores en monedas originales | `"$ 100.000 + u$s 500"` |
| **Referencia** | Valor único en moneda funcional | `"u$s 600"` |

> [!IMPORTANT]
> **Los Gráficos NO cambian al alternar modos.** Siempre usan valores normalizados.

---

## 6. Dualidad: Nominal vs Functional

### A. Realidad Funcional (Backend)
- **Objetivo:** Valor real, reportes agregados
- **Columna:** `functional_amount`
- **Lógica:** `Pesos / Cotización = Dólares`

### B. Realidad Nominal Histórica (Frontend)
- **Objetivo:** Responder "¿Cuánto debo según contrato?"
- **Lógica:** Reconstruir cuenta corriente con cotizaciones históricas

> [!CRITICAL]
> **`exchange_rate` ES OBLIGATORIO en cada transacción.** Sin él, no podemos calcular ninguna de las dos realidades.

---

## Checklist

- [ ] ¿Tabla tiene columna `functional_amount`?
- [ ] ¿Trigger `set_functional_amount_{tabla}` creado?
- [ ] ¿UI usa flags de `useFinancialFeatures`?
- [ ] ¿Datos obtenidos vía `getOrganizationFinancialData`?
- [ ] ¿Transacciones tienen `exchange_rate`?
