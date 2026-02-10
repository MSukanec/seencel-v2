---
name: Docs System Gotchas
description: Errores comunes al agregar documentación al sistema in-app de Seencel.
---

# ⚠️ Gotchas del Sistema de Documentación

## 1. Íconos del Sidebar requieren registro explícito

Al agregar una nueva sección a `content/docs/es/_meta.json`, el campo `"icon"` debe corresponder a un ícono **previamente registrado** en el `iconMap` de:

```
src/features/docs/components/docs-sidebar.tsx
```

### Íconos disponibles (actualizado feb 2026)

| Key en `_meta.json` | Componente Lucide |
|---------------------|-------------------|
| `rocket` | `Rocket` |
| `package` | `Package` |
| `dollar-sign` | `DollarSign` |
| `building` | `Building` |
| `building-2` | `Building2` |
| `clipboard-list` | `ClipboardList` |
| `users` | `Users` |
| `hard-hat` | `HardHat` |
| `calendar` | `Calendar` |

### Si necesitás un ícono nuevo

1. Agregá el import de Lucide en `docs-sidebar.tsx`
2. Registralo en el `iconMap` con su key kebab-case
3. Usá esa key en `_meta.json`

> ⛔ **Si usás un ícono no registrado**, el sidebar crashea con:
> `"Element type is invalid... Check the render method of 'SidebarSection'"`

---

## 2. Estructura obligatoria para nueva sección de docs

Para agregar una nueva sección de documentación:

### Archivos necesarios

```
content/docs/es/<seccion>/
├── _meta.json          # Define orden y títulos de los artículos
└── <articulo>.mdx      # Contenido del artículo
```

### Registro global

Agregar la sección en `content/docs/es/_meta.json`:

```json
{
    "order": ["...", "<seccion>"],
    "items": {
        "<seccion>": {
            "title": "Título Visible",
            "icon": "<key-del-iconMap>"   // ← DEBE existir en iconMap
        }
    }
}
```

### Mapping de rutas

Si la documentación se vincula a una página del dashboard, registrar en:

```
src/features/docs/lib/docs-mapping.ts
```

```ts
FEATURE_DOCS_MAP: {
    '/organization/<ruta>': '<seccion>/<articulo>',
    '/organizacion/<ruta-es>': '<seccion>/<articulo>',
}
```

---

## 3. Formato del `_meta.json` de sección

```json
{
    "order": ["introduccion", "otro-articulo"],
    "items": {
        "introduccion": {
            "title": "Introducción"
        },
        "otro-articulo": {
            "title": "Otro Artículo"
        }
    }
}
```

- Los keys del `items` deben coincidir con los nombres de los archivos `.mdx` (sin extensión)
- El array `order` define el orden de aparición en el sidebar

---

## 4. Frontmatter obligatorio del `.mdx`

```mdx
---
title: Título del Artículo
description: Descripción breve para SEO
---

# Contenido aquí
```

Sin frontmatter, el artículo no se renderiza correctamente.
