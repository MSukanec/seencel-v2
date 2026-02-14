---
name: startTransition para Navegación
description: Usar startTransition para operaciones de navegación que pueden bloquear el render.
severity: recommended
---

# startTransition para Navegación

## Regla

Usar `startTransition` para operaciones de navegación que pueden bloquear el render, evitando que la UI se congele durante la transición.

## Patrón

```tsx
import { useTransition } from "react";

const [isPending, startTransition] = useTransition();

const handleNavigate = (href: string) => {
    startTransition(() => {
        router.push(href);
    });
};

<Button disabled={isPending}>
    {isPending ? "Cargando..." : "Ir a página"}
</Button>
```

## Cuándo Aplicar

- Navegación programática con `router.push()`
- Cambios de tab que cargan datos pesados
- Cualquier operación que puede bloquear el thread principal
