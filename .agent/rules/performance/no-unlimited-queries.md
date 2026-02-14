---
name: No queries sin LIMIT
description: Toda query a Supabase que devuelva una lista DEBE tener .limit() explícito.
severity: high
---

# ⛔ Prohibido: Queries sin LIMIT

## Regla

**TODA** query a Supabase que devuelva una lista de registros **DEBE** tener `.limit()` explícito.

Las únicas excepciones son:
- Queries con `{ count: 'exact', head: true }` (solo cuentan, no devuelven datos)
- Queries con `.single()` o `.maybeSingle()` (devuelven 1 registro)

## Detección

```tsx
// ❌ PROHIBIDO: Sin limit
supabase
    .from('unified_financial_movements_view')
    .select('amount, currency_code')
    .eq('organization_id', orgId);

// ❌ PROHIBIDO: Sin limit
supabase
    .from('media_files')
    .select('file_type, file_size')
    .eq('organization_id', orgId);

// ✅ CORRECTO: Con limit explícito
supabase
    .from('media_files')
    .select('file_type, file_size')
    .eq('organization_id', orgId)
    .limit(100);
```

## Alternativa preferida para agregaciones

Si necesitás sumar o agrupar datos, **NO** traer todos los registros y hacer el cálculo en JS. Crear una función SQL con `SUM()`/`GROUP BY` y llamarla vía `.rpc()`:

```tsx
// ❌ PROHIBIDO: Traer todo y sumar en JS
const { data } = await supabase.from('movements').select('amount').eq('org_id', id);
const total = data.reduce((sum, m) => sum + m.amount, 0);

// ✅ CORRECTO: Sumar en la base de datos
const { data } = await supabase.rpc('get_financial_summary', { p_org_id: id });
```

## Por qué

Queries sin LIMIT escalan linealmente con el crecimiento de datos. Una organización nueva puede tener 10 registros, pero una activa puede tener 10,000+. Sin LIMIT, la query trae todo a memoria, generando:
- Latencia de red creciente
- Consumo de memoria innecesario
- Degradación progresiva de performance
