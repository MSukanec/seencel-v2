# Empty State System

Componente estandarizado para estados vacíos en toda la aplicación.

## Variantes

### 1. Vista Vacía (`mode="empty"`)

Cuando **no hay datos** en la vista (onboarding state).

```tsx
<ViewEmptyState
    mode="empty"
    icon={Package}
    viewName="Materiales e Insumos"
    featureDescription="Los materiales e insumos son los productos físicos..."
    onAction={() => openModal(<MaterialForm />)}
    actionLabel="Nuevo Material"
    docsPath="/docs/materiales"  // Opcional - solo si hay docs
/>
```

**Elementos:**
- 🎨 **Icono**: El de la página/feature
- 📌 **Título**: Nombre de la vista
- 📝 **Descripción**: Explicación extensa del feature
- 🔘 **Botones**: `[+ Acción]` + `[📖 Documentación]` (si existe)

---

### 2. Sin Resultados (`mode="no-results"`)

Cuando **filtros aplicados** no encuentran coincidencias.

```tsx
<ViewEmptyState
    mode="no-results"
    icon={Package}
    viewName="materiales e insumos"
    filterContext="con esa búsqueda"
    onResetFilters={() => resetFilters()}
/>
```

**Elementos:**
- 📌 **Título**: "Sin resultados"
- 📝 **Descripción**: "No se encontraron X con los filtros aplicados"
- 🔘 **Botón**: `[↻ Limpiar filtros]`

---

## Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `mode` | `"empty"` \| `"no-results"` | Variante a mostrar |
| `icon` | `LucideIcon` | Ícono de la página |
| `viewName` | `string` | Nombre de la vista |
| `featureDescription` | `string` | *(empty)* Descripción del feature |
| `onAction` | `() => void` | *(empty)* Callback de acción primaria |
| `actionLabel` | `string` | *(empty)* Label del botón |
| `actionIcon` | `LucideIcon` | *(empty)* Ícono del botón (default: `Plus`) |
| `docsPath` | `string` | *(empty)* Ruta i18n a documentación |
| `onResetFilters` | `() => void` | *(no-results)* Callback para limpiar |
| `filterContext` | `string` | *(no-results)* Contexto adicional |

---

## Reglas Importantes

### Botón de Documentación
- ⚠️ **Solo incluir si existe documentación** para ese feature
- ✅ Abre automáticamente en **nueva pestaña** (`target="_blank"`)
- ✅ Usa `Link` de `@/i18n/routing` (agrega locale automáticamente)

### Botón de Acción
- ✅ Mismo ícono que el header (por defecto `Plus`)
- ✅ Mismo label que el botón principal del header

### Empty Unificado
- ✅ Para vistas con sub-tabs (ej: Materiales/Insumos), usar UN empty que abarque todo
- ❌ NO un empty diferente por cada tab

---

## Cuándo usar cada modo

| Situación | Modo |
|-----------|------|
| Usuario nuevo, aún no creó nada | `empty` |
| Lista vacía después de filtrar | `no-results` |
| Categoría sin items | `no-results` |
| Búsqueda sin coincidencias | `no-results` |
