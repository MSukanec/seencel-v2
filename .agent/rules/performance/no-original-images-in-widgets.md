---
name: No imágenes originales en widgets/thumbnails
description: Prohibido cargar imágenes a tamaño completo en widgets, grids, listas o thumbnails.
severity: high
---

# ⛔ Prohibido: Imágenes Originales en Widgets

## Regla

**NUNCA** cargar imágenes a tamaño completo en widgets, grids de thumbnails, listas de archivos o cualquier contexto donde la imagen se muestre a menos de 512px.

## Patrón prohibido

```tsx
// ❌ PROHIBIDO: Imagen original (3000x4000px) en thumbnail de 100px
<img
    src={file.signed_url}
    className="w-24 h-24 object-cover"
/>
```

## Patrón correcto

```tsx
// ✅ CORRECTO: Thumbnail con Supabase Image Transformations
<img
    src={`${file.url}?width=256&height=256&resize=cover`}
    className="w-24 h-24 object-cover"
/>

// ✅ CORRECTO: next/image con dimensiones explícitas
import Image from 'next/image';
<Image
    src={file.url}
    width={256}
    height={256}
    alt={file.name}
/>
```

## Tamaños estándar

| Contexto | Tamaño máximo |
|----------|---------------|
| Widget thumbnail (grid pequeño) | 256x256 |
| Card preview | 512x512 |
| Lista con avatar/preview | 128x128 |
| Vista completa / lightbox | Original |

## Por qué

Una imagen de cámara de obra puede pesar 3-5MB. Cargar 12-36 de estas imágenes para mostrarlas a 100px desperdicia ~50-100MB de ancho de banda y causa loading delays de 3-5 segundos en el widget.
