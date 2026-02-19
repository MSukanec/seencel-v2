
# ⚠️ GOTCHA: Patrón de Layout de Páginas del Dashboard

Esta regla surge de un bug que costó más de 1 hora en la página de Presupuestos.
Si ves una página nueva o existente que NO sigue este patrón, **avisar inmediatamente al usuario**.

---

## El Árbol Correcto

```
Root Layout
└── Sidebar + Main
    └── PageWrapper  (flex flex-col h-full overflow-hidden)
        ├── PageHeader  (~48px fijo)
        └── Content Area  (flex-1 overflow-hidden flex flex-col)   ← div generado por PageWrapper
            └── ContentLayout variant="wide"  (h-full flex-1 overflow-y-auto px-2 md:px-8 py-6 pb-20)
                └── View  (Fragment <>)
                    ├── <Toolbar portalToHeader>   ← vacío en el DOM, renderiza en header
                    └── <ViewEmptyState> | <lista>
```

---

## Reglas Obligatorias

### 1. ContentLayout SIEMPRE en page.tsx

Toda página que muestre contenido de lista o empty state **DEBE** tener `ContentLayout variant="wide"` en el `page.tsx`, wrapeando la View:

```tsx
// ✅ CORRECTO — page.tsx
return (
    <PageWrapper type="page" title="..." icon={<Icon />}>
        <ContentLayout variant="wide">
            <MiFeatureView ... />
        </ContentLayout>
    </PageWrapper>
);
```

```tsx
// ❌ INCORRECTO — page.tsx sin ContentLayout
return (
    <PageWrapper type="page" title="..." icon={<Icon />}>
        <MiFeatureView ... />   {/* sin padding, sin scroll correcto */}
    </PageWrapper>
);
```

### 2. La View NO repite ContentLayout

Si `page.tsx` ya tiene `ContentLayout`, la View **NO debe** agregar otro `ContentLayout` adentro. Solo pone el contenido directamente:

```tsx
// ✅ CORRECTO — la View retorna fragment con lista simple
return (
    <>
        {toolbar}
        <div className="flex flex-col gap-2">
            {items.map(...)}
        </div>
    </>
);
```

```tsx
// ❌ INCORRECTO — la View wrappea en ContentLayout de nuevo
return (
    <>
        {toolbar}
        <ContentLayout variant="wide">  {/* DOUBLE-WRAP! */}
            ...
        </ContentLayout>
    </>
);
```

### 3. ViewEmptyState como Early Return (sin wrapper extra)

Los empty states **DEBEN** ser early returns con Fragment. El `ViewEmptyState` va **directo** en el fragment, sin `div` extra. El `ContentLayout` de `page.tsx` ya provee el padding. El `ViewEmptyState` tiene `h-full` que referencia la altura del `ContentLayout`.

```tsx
// ✅ CORRECTO — early return con fragment
if (items.length === 0) {
    return (
        <>
            {toolbar}
            <ViewEmptyState mode="empty" ... />
        </>
    );
}
```

```tsx
// ❌ INCORRECTO — ViewEmptyState dentro de div wrapper
if (items.length === 0) {
    return (
        <>
            {toolbar}
            <div className="h-full flex items-center justify-center">
                <ViewEmptyState ... />   {/* el div no tiene referencia de altura */}
            </div>
        </>
    );
}
```

```tsx
// ❌ INCORRECTO — ViewEmptyState dentro de space-y-4 u otro contenedor
return (
    <div className="space-y-4">
        {toolbar}
        {items.length === 0 ? <ViewEmptyState ... /> : <lista />}
    </div>
);
// El ViewEmptyState dentro de space-y-4 (no flex) no puede usar flex-1 ni h-full bien.
```

---

## Cuándo usar cada variante de ContentLayout

| Variante | Cuándo usar |
|----------|-------------|
| `wide` | Listas, tablas, vistas generales. `px-2 md:px-8 py-6`. |
| `narrow` | Formularios centrados. `max-w-4xl` centrado. |
| `settings` | Páginas de configuración. `max-w-5xl` centrado. |
| `full` | Canvas, mapas. Sin padding ni scroll. |

---

## Con Tabs: ContentLayout dentro del TabsContent

Si la página usa Tabs, el `ContentLayout` va dentro de cada `TabsContent`, no en el `PageWrapper`:

```tsx
// ✅ CORRECTO con Tabs
<PageWrapper type="page" title="..." tabs={...}>
    <TabsContent value="list" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
        <ContentLayout variant="wide">
            <MiView ... />
        </ContentLayout>
    </TabsContent>
</PageWrapper>
```

---

## Checklist antes de terminar una página

- [ ] ¿`page.tsx` usa `ContentLayout variant="wide"` (o la variante correcta)?
- [ ] ¿La View NO tiene un `ContentLayout` propio?
- [ ] ¿Los `ViewEmptyState` son early returns con fragment directo?
- [ ] ¿No hay `div` wrapper alrededor del `ViewEmptyState`?
- [ ] ¿El Toolbar usa `portalToHeader={true}`?

---

## Por qué esto funciona así

```
PageWrapper content area: flex flex-col flex-1
  └── ContentLayout wide: h-full flex-1 overflow-y-auto px-2 md:px-8 py-6
       └── ViewEmptyState: h-full  ← toma 100% del ContentLayout (con su padding)
```

- `ContentLayout` es un flex item del `flex flex-col` del PageWrapper → tiene altura definida
- `ViewEmptyState.h-full` = 100% de la altura de `ContentLayout` → llena el área correctamente
- El padding `px-2 md:px-8 py-6` de `ContentLayout` **es el que da el espacio** alrededor del contenido
- **NUNCA** agregar padding manualmente al `ViewEmptyState` (`m-4`, `className="m-4"` etc) — el `ContentLayout` ya lo hace
