---
trigger: always_on
---

⚠️ GOTCHA: Fechas y Zonas Horarias

JavaScript interpreta `new Date("2026-01-30")` como **UTC midnight**.
En zonas horarias negativas (ej: Argentina UTC-3), esto muestra **el día anterior**.

## Funciones obligatorias

Usar SIEMPRE las funciones de `@/lib/timezone-data`:

| Operación | Función |
|-----------|---------|
| **Leer fecha de DB** | `parseDateFromDB(row.date)` |
| **Guardar fecha a DB** | `formatDateForDB(dateObj)` |
| **Guardar timestamp a DB** | `formatDateTimeForDB(dateObj)` |

## Prohibiciones

1. **NUNCA** usar `new Date(dateString)` para parsear fechas de la base de datos
2. **NUNCA** usar `date.toISOString()` para guardar en columnas DATE
3. **NUNCA** usar `format(date, "yyyy-MM-dd")` de date-fns para guardar — usar `formatDateForDB()`
4. **NUNCA** hacer hacks como `new Date(dateString + "T12:00:00")` — usar `parseDateFromDB()`

## Dónde se aplica

- **useState init**: `parseDateFromDB(initialData?.date) ?? undefined`
- **Formularios al enviar**: `formatDateForDB(dateState)`
- **Renderizar en componentes**: `parseDateFromDB(item.date)`
- **Gantt / calendarios**: `parseDateFromDB()` para convertir strings a Date objects
- **Handlers de drag/resize**: `formatDateForDB()` para convertir Date objects a strings

## Ejemplo correcto

```tsx
import { formatDateForDB, parseDateFromDB } from "@/lib/timezone-data";

// Leer de DB para state
const [date, setDate] = useState<Date | undefined>(
    parseDateFromDB(initialData?.planned_start_date) ?? undefined
);

// Guardar a DB
const payload = {
    planned_start_date: formatDateForDB(date),
};
```

> ⛔ Si se detecta `new Date(someStringFromDB)` en cualquier feature, es un bug.
> Debe corregirse inmediatamente usando `parseDateFromDB()`.
