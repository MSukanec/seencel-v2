---
trigger: always_on
---

---
name: Seencel Performance Standard
description: Estándar OBLIGATORIO para optimizaciones de rendimiento y velocidad percibida en Seencel V2.
---

# Performance & Optimistic UI Standard

Esta regla define los patrones **OBLIGATORIOS** para garantizar máxima velocidad percibida en todas las interacciones del usuario.

---

## 1. Optimistic Updates (🚨 OBLIGATORIO)

**TODA operación CRUD debe actualizar la UI inmediatamente**, antes de que el servidor responda.

### Hook Estándar

```tsx
import { useOptimisticList } from "@/hooks/use-optimistic-action";

const { 
    optimisticItems, 
    addOptimistic, 
    updateOptimistic, 
    removeOptimistic 
} = useOptimisticList({
    items: serverItems,
    getItemId: (item) => item.id,
});
```

### Patrón Obligatorio para Mutaciones

```tsx
// ✅ CORRECTO: Update optimista ANTES de llamar al servidor
const handleCreate = async (data: FormData) => {
    // 1. Crear item temporal con ID optimista
    const tempId = `temp-${Date.now()}`;
    const optimisticItem = { ...data, id: tempId };
    
    // 2. Actualizar UI inmediatamente
    addOptimistic(optimisticItem);
    closeModal();
    
    // 3. Llamar al servidor en background
    try {
        const result = await createItemAction(data);
        if (!result.success) {
            removeOptimistic(tempId); // Rollback en error
            toast.error(result.error);
        }
    } catch (error) {
        removeOptimistic(tempId);
        toast.error("Error inesperado");
    }
};

// ❌ INCORRECTO: Esperar respuesta del servidor
const handleCreate = async (data: FormData) => {
    setIsLoading(true);
    const result = await createItemAction(data); // UI congelada
    if (result.success) {
        closeModal();
        router.refresh(); // Refresh completo
    }
    setIsLoading(false);
};
```

### Operaciones que DEBEN ser Optimistas

| Operación | Patrón |
|-----------|--------|
| Crear item | `addOptimistic()` → servidor |
| Editar item | `updateOptimistic()` → servidor |
| Eliminar item | `removeOptimistic()` → servidor |
| Mover (drag & drop) | Update posición local → servidor |
| Toggle estado | Update inmediato → servidor |

> ⛔ **NUNCA** usar `router.refresh()` como única forma de actualizar la UI después de una mutación.

---

## 2. Skeleton Loading States (🚨 OBLIGATORIO)

**TODA vista debe mostrar skeletons durante la carga inicial**, nunca pantallas en blanco.

### Patrón Obligatorio

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

### Dimensiones de Skeleton

Los skeletons deben **coincidir con las dimensiones del contenido real** para evitar layout shift:

| Componente | Skeleton |
|------------|----------|
| DataTable | `<Skeleton className="h-[500px] w-full rounded-xl" />` |
| Card | `<Skeleton className="h-[200px] w-full rounded-xl" />` |
| Avatar | `<Skeleton className="h-10 w-10 rounded-full" />` |
| Texto | `<Skeleton className="h-4 w-[200px]" />` |

---

## 3. Debounce en Búsquedas (🚨 OBLIGATORIO)

**TODA búsqueda debe usar debounce** para evitar llamadas excesivas al servidor.

### Patrón Obligatorio

```tsx
import { useDebouncedCallback } from "use-debounce";

// Debounce de 300ms para búsquedas
const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
    // Trigger fetch aquí
}, 300);

<Input 
    onChange={(e) => debouncedSearch(e.target.value)}
    placeholder="Buscar..."
/>
```

### Tiempos de Debounce Estándar

| Tipo de Input | Debounce |
|---------------|----------|
| Búsqueda en tabla | 300ms |
| Filtros complejos | 500ms |
| Autocompletado | 200ms |
| Guardado automático | 1000ms |

> ⛔ **NUNCA** hacer fetch en cada `onChange` sin debounce.

---

## 4. startTransition para Navegación

Usar `startTransition` para operaciones que pueden bloquear el render:

```tsx
import { useTransition } from "react";

const [isPending, startTransition] = useTransition();

const handleNavigate = (href: string) => {
    startTransition(() => {
        router.push(href);
    });
};

// Mostrar estado de pending
<Button disabled={isPending}>
    {isPending ? "Cargando..." : "Ir a página"}
</Button>
```

---

## 5. Prefetch de Datos Críticos

Para navegación predecible, prefetch datos antes de que el usuario haga click:

```tsx
// Next.js Link con prefetch automático
<Link href="/projects" prefetch={true}>
    Proyectos
</Link>

// Prefetch manual en hover
const prefetchProjectData = () => {
    // Llamar a query sin usar resultado
    void getProjectById(projectId);
};

<Card onMouseEnter={prefetchProjectData}>
    ...
</Card>
```

---

## 6. Evitar Layout Shift (CLS)

### Reservar Espacio

```tsx
// ✅ CORRECTO: Altura fija reservada
<div className="h-[400px]">
    {isLoading ? <Skeleton className="h-full" /> : <Content />}
</div>

// ❌ INCORRECTO: Altura dinámica causa saltos
{isLoading ? <Skeleton /> : <Content />}
```

### Imágenes con Aspect Ratio

```tsx
// ✅ CORRECTO
<div className="aspect-video relative">
    <Image fill src={url} alt="" />
</div>

// ❌ INCORRECTO
<Image src={url} width={400} height={300} />
```

---

## Checklist de Performance

Antes de marcar una feature como completa, verificar:

- [ ] ¿Operaciones CRUD usan optimistic updates?
- [ ] ¿Vista muestra skeletons durante carga?
- [ ] ¿Búsquedas tienen debounce?
- [ ] ¿Navegación usa startTransition cuando aplica?
- [ ] ¿Se evita layout shift con dimensiones reservadas?
- [ ] ¿NO se usa `router.refresh()` como único mecanismo de update?
- [ ] ¿Los skeletons coinciden con dimensiones del contenido real?

---

## Violaciones Comunes

| ❌ Violación | ✅ Solución |
|-------------|------------|
| `await action(); router.refresh()` | Optimistic update + background sync |
| `{isLoading && <Spinner />}` | Skeleton con dimensiones específicas |
| `onChange={e => fetch(e.target.value)}` | `useDebouncedCallback` |
| Pantalla en blanco durante carga | Skeleton states |

> [!CAUTION]
> El incumplimiento de esta regla resulta en **experiencia de usuario degradada** y debe ser corregido antes de merge.
