# Sistema de Documentación SEENCEL

Este feature implementa la documentación interna de la plataforma usando MDX.

## Arquitectura

```
/content/docs/                      # Contenido MDX (fuera de src/)
├── es/                             # Español
│   ├── _meta.json                  # Orden del sidebar
│   ├── materiales/
│   │   ├── _meta.json              # Orden de artículos en esta sección
│   │   ├── introduccion.mdx        # Artículo
│   │   └── importar.mdx            # Otro artículo
│   └── finanzas/
│       └── ...
└── en/                             # Inglés (misma estructura)

/src/features/docs/                 # Lógica del feature
├── README.md                       # Este archivo
├── types.ts                        # Tipos TypeScript
├── components/
│   ├── docs-sidebar.tsx            # Sidebar izquierdo (navegación)
│   ├── docs-toc.tsx                # Sidebar derecho (table of contents)
│   └── mdx/                        # Componentes para usar en MDX
│       ├── index.ts
│       ├── callout.tsx
│       ├── video.tsx
│       └── screenshot.tsx
└── lib/
    └── get-docs-content.ts         # Funciones para leer MDX
```

---

## Cómo Agregar Nueva Documentación

### 1. Crear el archivo MDX

```mdx
---
title: Mi Artículo
description: Descripción corta para SEO
---

# Mi Artículo

Contenido aquí...
```

Ubicación: `content/docs/[locale]/[feature]/[articulo].mdx`

### 2. Actualizar `_meta.json`

```json
{
  "order": ["intro", "nuevo-articulo"],
  "items": {
    "intro": { "title": "Introducción" },
    "nuevo-articulo": { "title": "Nuevo Artículo" }
  }
}
```

### 3. (Opcional) Agregar nueva sección/feature

En `content/docs/[locale]/_meta.json`:

```json
{
  "order": ["materiales", "finanzas", "nueva-seccion"],
  "items": {
    "nueva-seccion": {
      "title": "Nueva Sección",
      "icon": "folder"  // icono de lucide-react
    }
  }
}
```

Iconos disponibles: `rocket`, `package`, `dollar-sign`, `building`, `folder`, etc.

---

## Componentes MDX Disponibles

### Callout (Alertas)

```mdx
<Callout type="info">
  Información importante aquí.
</Callout>

<Callout type="warning" title="Atención">
  Advertencia con título.
</Callout>

<Callout type="tip">
  Pro tip para el usuario.
</Callout>

<Callout type="danger">
  Algo peligroso o destructivo.
</Callout>
```

Tipos: `info` (azul), `warning` (amarillo), `tip` (verde), `danger` (rojo)

### Video (YouTube)

```mdx
<Video 
  src="https://www.youtube.com/watch?v=XXXXX" 
  title="Título del video" 
/>
```

### Screenshot (Imágenes con Zoom)

```mdx
<Screenshot 
  src="/docs/screenshots/mi-imagen.png" 
  alt="Descripción de la imagen"
  caption="Texto debajo de la imagen" 
/>
```

Las imágenes se clickean para hacer zoom.

---

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/docs` | Redirect al primer artículo |
| `/docs/[feature]/[articulo]` | Artículo específico |

Ejemplo: `/es/docs/materiales/importar`

---

## Mapping Feature → Docs

Para que el botón "Documentación" aparezca en el header de cada feature, hay un mapping en:

`/src/features/docs/lib/docs-mapping.ts`

```typescript
export const FEATURE_DOCS_MAP: Record<string, string> = {
    '/organization/catalog': 'materiales/introduccion',
    '/organization/finance': 'finanzas/introduccion',
    // Agregar más aquí
};
```

El botón solo aparece si existe un mapping para esa ruta.

---

## Dependencias

```json
{
  "next-mdx-remote": "^4.x",
  "gray-matter": "^4.x",
  "rehype-slug": "^6.x",
  "rehype-autolink-headings": "^7.x"
}
```

---

## Estructura de Archivos MDX

### Frontmatter Requerido

```yaml
---
title: Título del artículo (obligatorio)
description: Descripción para SEO (opcional)
---
```

### Headings para TOC

- Solo `##` (H2) y `###` (H3) aparecen en el Table of Contents
- El título principal debe ser `#` (H1)
- Los headings generan automáticamente IDs para deep linking

### Markdown Estándar

Todo el markdown estándar funciona:
- **Bold**, *italic*, ~~strikethrough~~
- Listas ordenadas y desordenadas
- Tablas
- Links
- Bloques de código con syntax highlighting
- Blockquotes

---

## Troubleshooting

### El artículo no aparece en el sidebar

1. Verificar que el archivo existe en `content/docs/[locale]/[feature]/`
2. Verificar que está en el `_meta.json` de esa carpeta
3. Verificar que el orden está correcto

### Error al renderizar MDX

1. Verificar sintaxis del frontmatter (YAML válido)
2. Verificar que los componentes están correctamente importados
3. Verificar comillas y caracteres especiales

### El TOC no muestra headings

Solo se muestran `##` y `###`. Verificar que los headings usan la sintaxis correcta.
