# ListItem — Componente Compartido de Lista

## ¿Qué es?

`ListItem` es un **componente compound base** (`list-item-base.tsx`) diseñado para renderizar cualquier tipo de item en una lista de manera consistente, accesible y composable.

En lugar de crear layouts ad-hoc para cada entidad (materiales, miembros, equipos, etc.), todas las listas del sistema reutilizan este componente base y crean **variantes específicas** dentro de `items/`.

---

## Arquitectura

```
list-item/
├── index.tsx                    # Re-exports públicos
├── list-item-base.tsx           # Componente compound base
├── README.md                    # Este archivo
└── items/
    ├── material-list-item.tsx   # Variante para Materiales
    └── member-list-item.tsx     # Variante para Miembros
```

## Slots Disponibles (Base)

El componente base expone los siguientes **slots composables**:

| Slot | Descripción | Ejemplo de uso |
|------|-------------|----------------|
| `ListItem` (Root) | Contenedor principal. Acepta `variant`, `selected`, `disabled`, `onClick` | Wrapper de cada fila |
| `ListItem.Checkbox` | Checkbox para multi-selección | Selección masiva de items |
| `ListItem.Leading` | Slot izquierdo (ícono, avatar, imagen) | Avatar del miembro |
| `ListItem.ColorStrip` | Barra vertical de color (indicador visual) | Material del sistema vs custom |
| `ListItem.Content` | Contenedor central flexible | Agrupa título + descripción + badges |
| `ListItem.Title` | Título principal del item (con `suffix` opcional) | Nombre del material/miembro |
| `ListItem.Description` | Texto secundario (truncado) | Email, descripción corta |
| `ListItem.Badges` | Contenedor de badges | Categoría, unidad, rol |
| `ListItem.Trailing` | Slot derecho (metadata, valores) | Precio, fecha, rol |
| `ListItem.Value` | Valor numérico/monetario (font-mono) | Precio unitario |
| `ListItem.ValueSubtext` | Subtexto debajo del valor | Fecha de vigencia |
| `ListItem.Actions` | Acciones (dropdown, botones). `showOnHover` opcional | Editar, Eliminar |

## Variantes del Root

| Variante | Estilo | Uso |
|----------|--------|-----|
| `card` | Con borde, padding, fondo `bg-sidebar` | Listas primarias (catálogo) |
| `flat` | Sin borde, padding mínimo | Listas dentro de cards, settings |

## Cómo Crear una Nueva Variante

1. Crear archivo en `items/mi-entidad-list-item.tsx`
2. Definir la interfaz de datos: `MiEntidadListItemData`
3. Definir props: `MiEntidadListItemProps`
4. Componer usando los slots de `ListItem`
5. Exportar en `index.tsx`

### Ejemplo mínimo

```tsx
import { ListItem } from "../list-item-base";

export interface MyItemData {
    id: string;
    name: string;
    description?: string;
}

export function MyListItem({ item }: { item: MyItemData }) {
    return (
        <ListItem variant="card">
            <ListItem.Content>
                <ListItem.Title>{item.name}</ListItem.Title>
                <ListItem.Description>{item.description}</ListItem.Description>
            </ListItem.Content>
        </ListItem>
    );
}
```

## Variantes Existentes

### `MaterialListItem`
- **Leading:** ColorStrip (sistema vs custom)
- **Content:** Código + nombre, badges de unidad y categoría
- **Trailing:** Precio unitario y fecha de vigencia
- **Actions:** Editar / Eliminar (dropdown)

### `MemberListItem`
- **Leading:** Avatar con iniciales
- **Content:** Nombre completo (+ badge "Tú"), email
- **Trailing:** Badge "Dueño" (👑), badge de rol (Admin ó Miembro), fecha de unión
- **Actions:** Editar Rol / Eliminar Miembro (dropdown)
