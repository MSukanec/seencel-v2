---
trigger: always_on
---

---
name: Seencel Page Checklist
description: Checklist OBLIGATORIO de elementos que TODAS las páginas deben cumplir en Seencel V2.
---

# Page Compliance Checklist

Esta regla define los elementos **OBLIGATORIOS** que toda página debe cumplir antes de considerarse completa.

---

## 1. EmptyState Estándar (🚨 OBLIGATORIO)

**TODA página con listados DEBE usar el EmptyState estándar** de `@/components/ui/empty-state` con el patrón de **early return**.

### Patrón Obligatorio

```tsx
import { EmptyState } from "@/components/ui/empty-state";
import { Briefcase, Plus } from "lucide-react";

// ✅ CORRECTO: Early return ANTES del render principal
if (items.length === 0) {
    return (
        <div className="h-full flex flex-col">
            <Toolbar
                portalToHeader
                actions={[{ label: "Crear", icon: Plus, onClick: handleCreate }]}
            />
            <div className="flex-1 flex items-center justify-center">
                <EmptyState
                    icon={Briefcase}
                    title="No hay proyectos"
                    description="Creá tu primer proyecto para comenzar."
                />
            </div>
        </div>
    );
}

// Render principal con DataTable...
```

### Reglas Clave

| Regla | Descripción |
|-------|-------------|
| **Early Return** | Usar `if (items.length === 0) return` ANTES del render principal |
| **Contenedor Flex-1** | `<div className="flex-1 flex items-center justify-center">` |
| **Sin Botón en EmptyState** | El botón va en el `Toolbar`, NO en el EmptyState |
| **Toolbar Siempre Visible** | Renderizar Toolbar incluso en estado vacío |

### Props del EmptyState

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `icon` | LucideIcon | ✅ | Ícono relevante a la entidad |
| `title` | string | ✅ | Título claro del estado vacío |
| `description` | React.ReactNode | ✅ | Explicación breve |
| `action` | React.ReactNode | ⛔ NO USAR | El botón va en Toolbar |
| `comingSoon` | boolean | Opcional | Badge "Próximamente" |

> ⛔ **NUNCA** usar `action` prop del EmptyState. El botón de crear debe estar en el Toolbar.

> ⛔ **NUNCA** usar `emptyState` prop del DataTable para el estado inicial vacío.

---

## 2. TabsContent Clases (🚨 OBLIGATORIO)

**TODOS los TabsContent DEBEN tener estas clases:**

```tsx
<TabsContent 
    value="tab-name" 
    className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden"
>
```

| Clase | Propósito |
|-------|-----------|
| `flex-1` | Ocupa espacio disponible |
| `m-0` | Sin margin extra |
| `overflow-hidden` | Previene scroll en contenedor |
| `data-[state=inactive]:hidden` | Oculta tabs inactivos |

---

## 3. generateMetadata (🚨 OBLIGATORIO)

**TODA página DEBE exportar `generateMetadata`:**

```tsx
export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'MyPage' });
    
    return {
        title: `Mi Página | SEENCEL`,
        description: t('subtitle'),
        robots: "noindex, nofollow", // Dashboard siempre privado
    };
}
```

---

## 4. Error Handling (🚨 OBLIGATORIO)

**TODA página con data fetching DEBE tener `try/catch` con `ErrorDisplay`:**

```tsx
try {
    const data = await fetchData();
    // ... render normal
} catch (error) {
    return (
        <div className="h-full w-full flex items-center justify-center">
            <ErrorDisplay
                title="Error al cargar"
                message={error instanceof Error ? error.message : "Error desconocido"}
                retryLabel="Reintentar"
            />
        </div>
    );
}
```

---

## 5. Toolbar con portalToHeader (🚨 OBLIGATORIO)

**TODA página con acciones/filtros DEBE usar Toolbar con `portalToHeader`:**

```tsx
<Toolbar
    portalToHeader
    searchQuery={searchQuery}
    onSearchChange={setSearchQuery}
    actions={[{ label: "Crear", icon: Plus, onClick: handleCreate }]}
/>
```

> ⛔ **NUNCA** colocar botones de acción directamente en el body de la página.

---

## Checklist de Página

Antes de marcar una página como completa:

- [ ] ¿Usa `EmptyState` de `@/components/ui/empty-state`?
- [ ] ¿TabsContent tiene clases `flex-1 m-0 overflow-hidden data-[state=inactive]:hidden`?
- [ ] ¿Exporta `generateMetadata` con robots noindex?
- [ ] ¿Tiene `try/catch` con `ErrorDisplay`?
- [ ] ¿Toolbar usa `portalToHeader`?
- [ ] ¿Usa `PageWrapper` con icon y title?

---

## Violaciones Comunes

| ❌ Violación | ✅ Solución |
|-------------|------------|
| EmptyState custom | Usar `@/components/ui/empty-state` |
| TabsContent sin clases | Agregar `flex-1 m-0 overflow-hidden data-[state=inactive]:hidden` |
| Sin Metadata | Agregar `generateMetadata` |
| Sin error handling | Agregar `try/catch` + `ErrorDisplay` |
| Botones en body | Mover a `Toolbar portalToHeader` |

---

## 6. Internacionalización de URLs (🚨 OBLIGATORIO)

**TODAS las páginas del dashboard DEBEN tener rutas traducidas** en `src/i18n/routing.ts`.

### Regla Principal

Cada nueva página del dashboard requiere:

1. **Definición en routing.ts** con rutas en español e inglés
2. **Uso de `Link` de `@/i18n/routing`** para navegación (NO de `next/link`)
3. **Uso de `router` de `@/i18n/routing`** para navegación programática

### Patrón Obligatorio

```ts
// En src/i18n/routing.ts
pathnames: {
    // ✅ CORRECTO: Ruta con traducciones
    '/organization/catalog': {
        en: '/organization/catalog',
        es: '/organizacion/catalogo'
    },
    '/organization/catalog/task/[taskId]': {
        en: '/organization/catalog/task/[taskId]',
        es: '/organizacion/catalogo/tarea/[taskId]'
    },
}
```

### Navegación

```tsx
// ✅ CORRECTO: Usar Link/router de @/i18n/routing
import { Link, useRouter } from "@/i18n/routing";

<Link href="/organization/catalog">Catálogo</Link>

// ❌ INCORRECTO: Usar next/link directo o rutas hardcodeadas
import Link from "next/link";
<Link href={`/${locale}/organization/catalog`}>Catálogo</Link>
```

### Convención de Nombres de Rutas

| Inglés | Español |
|--------|---------|
| `organization` | `organizacion` |
| `catalog` | `catalogo` |
| `task` | `tarea` |
| `tasks` | `tareas` |
| `planner` | `planificador` |
| `materials` | `materiales` |
| `labor` | `mano-de-obra` |
| `equipment` | `equipos` |
| `subcontracts` | `subcontratos` |
| `finance` | `finanzas` |
| `settings` | `configuracion` |
| `division` | `division` |
| `element` | `elemento` |
| `project` | `proyecto` |
| `projects` | `proyectos` |
| `team` | `equipo` |
| `contacts` | `contactos` |
| `billing` | `facturacion` |
| `reports` | `informes` |

### Checklist de Nueva Página

- [ ] ¿Está definida la ruta en `routing.ts` con ambos idiomas?
- [ ] ¿Las rutas con parámetros dinámicos (`[id]`) están definidas?
- [ ] ¿Se usa `Link` y `useRouter` de `@/i18n/routing`?
- [ ] ¿Las rutas hijas también están traducidas?

> ⛔ **NUNCA** construir URLs manualmente con template strings y el locale.
> 
> ⛔ **NUNCA** crear una página sin agregarla a `routing.ts`.
> 
> ⛔ **NUNCA** usar `next/link` o `next/navigation` directamente para rutas del dashboard.

