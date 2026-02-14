---
name: Skeleton Loading States Obligatorios
description: Toda vista debe mostrar skeletons durante la carga inicial, nunca pantallas en blanco ni spinners genéricos.
severity: critical
---

# ⛔ Obligatorio: Skeletons en TODA carga inicial

## Regla

**TODA vista debe mostrar skeletons durante la carga inicial**, nunca pantallas en blanco ni spinners genéricos.

## Patrón

```tsx
// ✅ CORRECTO: Skeleton específico al contenido
if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
    );
}

// ❌ INCORRECTO: Spinner genérico
if (isLoading) {
    return <LoadingSpinner />;
}

// ❌ INCORRECTO: Pantalla vacía
if (isLoading) {
    return null;
}
```

## Dimensiones de Skeleton

Los skeletons deben **coincidir con las dimensiones del contenido real** para evitar layout shift:

| Componente | Skeleton |
|------------|----------|
| DataTable | `<Skeleton className="h-[500px] w-full rounded-xl" />` |
| Card | `<Skeleton className="h-[200px] w-full rounded-xl" />` |
| Avatar | `<Skeleton className="h-10 w-10 rounded-full" />` |
| Texto | `<Skeleton className="h-4 w-[200px]" />` |

## Prohibiciones

⛔ **NUNCA** usar `<LoadingSpinner />` genérico como loading state.

⛔ **NUNCA** retornar `null` durante carga.

⛔ **NUNCA** crear skeletons con dimensiones que no coinciden con el contenido real.
