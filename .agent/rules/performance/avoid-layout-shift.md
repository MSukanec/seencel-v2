---
name: Evitar Layout Shift (CLS)
description: Reservar espacio para contenido dinámico para evitar saltos visuales durante la carga.
severity: critical
---

# ⛔ Obligatorio: Evitar Layout Shift (CLS)

## Regla

**Siempre reservar espacio** para contenido dinámico para evitar saltos visuales durante la carga.

## Reservar Espacio

```tsx
// ✅ CORRECTO: Altura fija reservada
<div className="h-[400px]">
    {isLoading ? <Skeleton className="h-full" /> : <Content />}
</div>

// ❌ INCORRECTO: Altura dinámica causa saltos
{isLoading ? <Skeleton /> : <Content />}
```

## Imágenes con Aspect Ratio

```tsx
// ✅ CORRECTO
<div className="aspect-video relative">
    <Image fill src={url} alt="" />
</div>

// ❌ INCORRECTO
<Image src={url} width={400} height={300} />
```

## Cuándo Aplicar

- Todo contenedor que alterna entre skeleton y contenido
- Imágenes de tamaño dinámico
- Listas que pueden cambiar de longitud
- Widgets del dashboard
