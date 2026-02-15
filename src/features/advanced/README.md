# Índices Económicos

## Descripción

Los **Índices Económicos** permiten a la organización registrar y gestionar indicadores de referencia utilizados para ajustar presupuestos, contratos y costos de obra según la inflación u otros factores económicos.

### ¿Para qué sirven?

En la industria de la construcción, los costos de materiales, mano de obra y servicios cambian constantemente. Los índices económicos son herramientas esenciales para:

- **Ajuste de presupuestos**: Actualizar valores de presupuestos y contratos según la variación de un índice oficial (CAC, ICC, IPC).
- **Cálculo de redeterminaciones**: Aplicar fórmulas polinómicas a certificados de obra usando los componentes individuales de un índice.
- **Seguimiento de inflación**: Monitorear la evolución de costos a lo largo del tiempo con variaciones porcentuales automáticas.
- **Comparación histórica**: Visualizar la evolución de precios entre períodos distintos.

### ¿Qué índices se pueden usar?

- **Índices reales oficiales**: CAC (Cámara Argentina de la Construcción), ICC (INDEC), IPC, o cualquier índice publicado por organismos oficiales.
- **Índices personalizados**: El usuario puede crear sus propios índices con los componentes que necesite, para uso interno o sectorial.

### ¿Dónde se usan en Seencel?

- **Presupuestos**: Para ajustar montos según inflación entre la fecha base y la fecha de certificación.
- **Contratos y redeterminaciones**: Aplicar fórmulas polinómicas con los distintos componentes del índice.
- **Análisis financiero**: Comparar costos reales vs. costos ajustados por índice.

---

## Modelo de Datos

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `economic_index_types` | Tipos de índice (ej: CAC, ICC, IPC) |
| `economic_index_components` | Componentes de cada índice (ej: Materiales, Mano de Obra, Equipos) |
| `economic_index_values` | Valores numéricos registrados por período |

### Relaciones

```
economic_index_types (1) → (N) economic_index_components
economic_index_types (1) → (N) economic_index_values
```

### Periodicidad

Los índices pueden ser:
- **Mensuales**: Un valor por mes (ej: IPC)
- **Trimestrales**: Un valor por trimestre (ej: algunos índices sectoriales)
- **Anuales**: Un valor por año

### Componentes

Cada índice puede tener múltiples componentes, uno marcado como **principal**:
- El componente principal es obligatorio al cargar valores
- Se usa como referencia para calcular variaciones porcentuales
- Los demás componentes son opcionales y se usan en fórmulas polinómicas

---

## Patrón Arquitectónico

El feature vive en `/src/features/advanced/` y se muestra como tab dentro de la página de Configuración (`/organization/settings`).

### Archivos

| Archivo | Rol |
|---------|-----|
| `views/advanced-indices-view.tsx` | Vista principal — grid de cards con index types |
| `views/index-values-view.tsx` | Sub-vista de valores — tabla cronológica |
| `forms/advanced-index-type-form.tsx` | Form de crear/editar tipo de índice |
| `forms/advanced-index-value-form.tsx` | Form de crear/editar valor periódico |
| `queries.ts` | Server queries (filtradas por org_id) |
| `actions.ts` | Server actions (CRUD con revalidatePath) |
| `types.ts` | Tipos TypeScript y constantes |

### Navegación interna

1. **Grid de cards** → Click en card → **Tabla de valores**
2. Botón "Volver" regresa al grid

### Optimistic Updates

- **Delete**: Usa `useOptimisticList` — el item desaparece instantáneamente, rollback automático si falla
- **Create/Edit**: Forms semi-autónomos con `closeModal()` + `router.refresh()`. El `useOptimistic` de React reconcilia automáticamente

---

## Changelog

- **2026-02-15**: Feature creado con CRUD completo, plantilla ICC, optimistic deletes y documentación.
