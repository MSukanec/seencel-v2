# User Journey: Capital

> Tutorial paso a paso. Como si nunca usaste Seencel.

## Escenario

**GreenBuild S.A.** es una empresa de construcción con 3 socios: Luis (50%), Ana (30%), Carlos (20%). Quieren registrar cuánto puso cada uno y trackear que nadie retire más de lo que le corresponde.

---

## Paso 1: Agregar Participantes ⚠️ PARCIAL

**Qué hace el usuario**: Va a la página Capital → tab "Participantes" → click "Nuevo Participante"

**Qué debería pasar**: Se abre un formulario para seleccionar un contacto existente, definir el porcentaje de participación, y notas.

**Estado actual**: ⚠️ El botón existe pero solo hace `console.log()`. No hay form ni action.

| Tabla | Columnas clave |
|-------|---------------|
| `finance.capital_participants` | `id`, `contact_id`, `organization_id`, `ownership_percentage`, `status` |

| Archivo | Tipo | Estado |
|---------|------|--------|
| `capital-participants-view.tsx` | View | ⚠️ Solo muestra empty state placeholder |
| *No existe* | Form | 🚧 |
| *No existe* | Action `createCapitalParticipant` | 🚧 |

---

## Paso 2: Registrar Aporte de Capital ⚠️ PARCIAL

**Qué hace el usuario**: Va a tab "Movimientos" → click "Nuevo Movimiento" → llena formulario con: participante, monto, moneda, wallet, fecha, notas.

**Qué debería pasar**: Se inserta en `partner_contributions` → trigger actualiza `partner_capital_balance` automáticamente → el balance del socio aumenta.

**Estado actual**: ⚠️ El botón existe pero solo hace `console.log()`. No hay form ni action.

| Tabla | Columnas clave |
|-------|---------------|
| `finance.partner_contributions` | `id`, `partner_id`, `amount`, `currency_id`, `exchange_rate`, `contribution_date`, `wallet_id`, `status` |
| `finance.partner_capital_balance` | `partner_id`, `balance_amount` (actualizado por trigger) |

| Archivo | Tipo | Estado |
|---------|------|--------|
| `capital-movements-view.tsx` | View | ✅ DataTable con filtros, KPIs, columnas completas |
| *No existe* | Form | 🚧 |
| *No existe* | Action `createPartnerContribution` | 🚧 |

---

## Paso 3: Registrar Retiro de Capital ⚠️ PARCIAL

Mismo flujo que Paso 2 pero inserta en `partner_withdrawals`. El trigger resta del balance.

| Tabla | Columnas clave |
|-------|---------------|
| `finance.partner_withdrawals` | `id`, `partner_id`, `amount`, `currency_id`, `exchange_rate`, `withdrawal_date`, `wallet_id`, `status` |

---

## Paso 4: Registrar Ajuste de Capital 🚧 NO EXISTE

**Qué debería hacer**: Permite correcciones manuales (positivas o negativas) al balance de un socio sin que sea un aporte ni retiro. Ej: "Corrección por error contable".

| Tabla | Columnas clave |
|-------|---------------|
| `finance.capital_adjustments` | `id`, `partner_id`, `amount` (puede ser negativo), `adjustment_date`, `reason`, `status` |

---

## Paso 5: Ver Dashboard de Capital ✅ FUNCIONA

**Qué hace el usuario**: Va a tab "Visión General" → ve KPIs (Capital Neto, Aportes, Retiros, Participantes) y gráficos de evolución.

| Archivo | Tipo | Estado |
|---------|------|--------|
| `capital-overview-view.tsx` | View | ✅ 4 KPIs + Area Chart + Actividad Reciente |
| `page.tsx` de Capital | Page | ✅ Fetch real de `capital_ledger_view` + `capital_participants_summary_view` |

---

## Paso 6: Ver Balances por Socio 🚧 PLACEHOLDER

**Qué debería mostrar**: Tabla con cada participante, su balance actual, % real vs % esperado, desviación, estado (sobre-aportado / bajo-aportado / equilibrado).

| Archivo | Tipo | Estado |
|---------|------|--------|
| `capital-balances-view.tsx` | View | 🚧 Solo muestra empty state |
| `capital_partner_kpi_view` | View SQL | ✅ Existe con todos los cálculos de desviación |

---

## Diagrama completo

```
                    ┌─────────────────────────┐
                    │   capital_participants   │
                    │   (socios con % ownership)│
                    └────────────┬────────────┘
                                 │ partner_id FK
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                   ▼
  ┌───────────────────┐ ┌────────────────────┐ ┌─────────────────┐
  │partner_contributions│ │partner_withdrawals │ │capital_adjustments│
  │   (aportes +)      │ │   (retiros -)      │ │   (ajustes ±)    │
  └─────────┬─────────┘ └────────┬───────────┘ └────────┬────────┘
            │                     │                       │
            └─────────┬──────────┘                       │
                      ▼                                   │
          ┌────────────────────────┐                      │
          │  TRIGGER automático    │◄─────────────────────┘
          │  update_partner_balance│
          └───────────┬───────────┘
                      ▼
          ┌────────────────────────┐
          │ partner_capital_balance │
          │  (saldo materializado) │
          └────────────────────────┘
```
