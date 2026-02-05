---
name: Seencel Widget Architecture
description: Arquitectura Enterprise para dashboards modulares y configurables mediante Widgets y Registro central.
---

# Seencel Widget Architecture (Standard 70.0)

Esta arquitectura reemplaza las Vistas Monolíticas por un sistema modular de Widgets autónomos, similar a lo que usan Linear, Datadog o Vercel.

## 1. Conceptos Core

### A. The Data Layer (`FeatureDashboardContext`)
En lugar de prop-drilling, usamos un Contexto por feature que centraliza:
- Datos Raw (ej: movements, tasks).
- Estado Global del Dashboard (filtros de fecha, search).
- Cálculos Derivados (KPIs, tendencias).

### B. The Widget (`autonomous component`)
Componentes pequeños que **se auto-abastecen** usando el hook del contexto.
- ❌ `IncomeWidget({ amount }: Props)` - MAL (Tonto)
- ✅ `IncomeWidget()` - BIEN (Autónomo, usa `useFinanceDashboard()`)

### C. The Registry (`registry.ts`)
Catálogo maestro que mapea IDs a componentes. Permite:
- Configuración vía JSON (guardable en DB).
- Renderizado dinámico (`DashboardWidgetGrid`).
- Lazy loading (futuro).

## 2. Implementación Paso a Paso

### Paso 1: Crear el Contexto
Crear `src/features/[feature]/context/[feature]-dashboard-context.tsx`.

```tsx
export function FinanceDashboardProvider({ children, rawData }: Props) {
    // 1. Centralizar lógica acá
    const kpis = useMemo(() => calculateKpis(rawData), [rawData]);
    
    return <Context.Provider value={{ kpis }}>{children}</Context.Provider>;
}
```

### Paso 2: Definir el Registro
En `src/features/[feature]/components/widgets/registry.tsx`:

```tsx
export const WIDGET_REGISTRY = {
    'income_kpi': {
        id: 'income_kpi',
        name: 'Ingresos',
        component: IncomeWidget,
        defaultSize: 'sm'
    }
};
```

### Paso 3: Crear Widgets
En `src/features/[feature]/components/widgets/core/`:

```tsx
export function IncomeWidget() {
    const { kpis } = useFinanceDashboard(); // Hook al contexto
    return <BentoKpiCard value={kpis.income} />;
}
```

### Paso 4: Usar el Grid
En la vista principal:

```tsx
<FinanceDashboardProvider data={serverData}>
    <DashboardWidgetGrid layout={DEFAULT_LAYOUT} />
</FinanceDashboardProvider>
```

## 3. Beneficios
1. **Vertical Scalability**: Cada widget es un archivo aislado.
2. **User Customization**: El layout es un JSON serializable.
3. **Performance**: Los cálculos pesados se hacen una vez en el Contexto.
4. **Consistency**: Todos los widgets usan los mismos componentes base (Bento).
