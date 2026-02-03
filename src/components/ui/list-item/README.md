# ListItem Component

A flexible, composable list item component for displaying resources, entities, and catalog items. Built with compound components pattern following industry standards (Linear, Vercel, Shopify Polaris).

## Installation

Already included in `@/components/ui/list-item`.

```tsx
import { ListItem } from "@/components/ui/list-item";
```

---

## Anatomy

```
┌────────────────────────────────────────────────────────────────┐
│ [Leading]  [Content]                    [Trailing]  [Actions] │
│            ├─ Title (suffix)                                  │
│            ├─ Description                                     │
│            └─ [Badge] [Badge] [Badge]                         │
└────────────────────────────────────────────────────────────────┘
```

| Slot | Component | Purpose |
|------|-----------|---------|
| Leading | `ListItem.Leading` | Icon, avatar, color strip, checkbox |
| Content | `ListItem.Content` | Main content area |
| Title | `ListItem.Title` | Primary text (with optional suffix) |
| Description | `ListItem.Description` | Secondary text |
| Badges | `ListItem.Badges` | Tags container |
| Trailing | `ListItem.Trailing` | Right-aligned value/metadata |
| Value | `ListItem.Value` | Numeric/price display |
| ValueSubtext | `ListItem.ValueSubtext` | Value description |
| Actions | `ListItem.Actions` | Action buttons (⋮ menu) |
| ColorStrip | `ListItem.ColorStrip` | Vertical color indicator |

---

## Basic Usage

```tsx
<ListItem onClick={() => handleClick()}>
  <ListItem.Content>
    <ListItem.Title>Cemento Portland</ListItem.Title>
  </ListItem.Content>
</ListItem>
```

---

## Complete Example

```tsx
<ListItem onClick={() => onView(item)}>
  <ListItem.Leading>
    <ListItem.ColorStrip color="indigo" />
  </ListItem.Leading>
  
  <ListItem.Content>
    <ListItem.Title suffix="(kg)">
      Cemento Portland
    </ListItem.Title>
    <ListItem.Description>
      Material de construcción
    </ListItem.Description>
    <ListItem.Badges>
      <Badge variant="secondary">Materiales</Badge>
      <Badge variant="outline">Sistema</Badge>
    </ListItem.Badges>
  </ListItem.Content>
  
  <ListItem.Trailing>
    <ListItem.Value>$ 1.500,00</ListItem.Value>
    <ListItem.ValueSubtext>por bolsa</ListItem.ValueSubtext>
  </ListItem.Trailing>
  
  <ListItem.Actions>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Editar</DropdownMenuItem>
        <DropdownMenuItem>Eliminar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </ListItem.Actions>
</ListItem>
```

---

## Props

### ListItem (Root)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"card" \| "flat"` | `"card"` | Visual style |
| `selected` | `boolean` | `false` | Selection state |
| `disabled` | `boolean` | `false` | Disabled state |
| `onClick` | `() => void` | - | Click handler |

### ListItem.Title

| Prop | Type | Description |
|------|------|-------------|
| `suffix` | `string` | Text after title (e.g., unit) |

### ListItem.ColorStrip

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `"slate" \| "indigo" \| "green" \| "amber" \| "red" \| "blue"` | `"slate"` | Strip color |

### ListItem.Actions

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showOnHover` | `boolean` | `false` | Only show on hover |

---

## Variants

### Card (default)
Bordered with background, suitable for list items:
```tsx
<ListItem variant="card">...</ListItem>
```

### Flat
Minimal, suitable for dense lists:
```tsx
<ListItem variant="flat">...</ListItem>
```

---

## Use Cases

### Catalog Items (Materials, Tasks, Labor)
```tsx
<ListItem onClick={() => onView(item)}>
  <ListItem.Leading>
    <ListItem.ColorStrip color={item.is_system ? "slate" : "indigo"} />
  </ListItem.Leading>
  <ListItem.Content>
    <ListItem.Title suffix={`(${item.unit})`}>{item.name}</ListItem.Title>
    <ListItem.Badges>
      <Badge>{item.category}</Badge>
    </ListItem.Badges>
  </ListItem.Content>
  <ListItem.Actions>...</ListItem.Actions>
</ListItem>
```

### Selectable Items
```tsx
<ListItem 
  selected={selectedId === item.id}
  onClick={() => setSelectedId(item.id)}
>
  ...
</ListItem>
```

---

## Accessibility

- Keyboard navigation with Enter/Space
- Proper ARIA roles for interactive items
- Focus-visible states
- Screen reader support
