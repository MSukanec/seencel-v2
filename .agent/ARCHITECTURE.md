# 🏗️ Arquitectura de Seencel V2

> **Para:** Cualquier persona que necesite entender cómo funciona este proyecto.  
> **Última auditoría:** Febrero 2025

---

## ¿Qué es este proyecto?

Seencel es una aplicación web construida con:
- **Next.js 15** → Framework de React para aplicaciones web
- **TypeScript** → JavaScript con tipos (previene errores)
- **Supabase** → Base de datos PostgreSQL + Autenticación
- **Zustand** → Manejo de estado global

---

## 📁 Estructura de Carpetas

```
src/
├── app/           → Páginas de la aplicación (rutas)
├── components/    → Piezas de UI reutilizables (botones, cards, etc)
├── features/      → Módulos de negocio (finanzas, proyectos, tareas)
├── stores/        → Estado global compartido ✅ AUDITADO
├── providers/     → Wrappers de librerías externas
├── hooks/         → Lógicas reutilizables
├── lib/           → Utilidades y helpers
├── types/         → Definiciones de TypeScript
├── actions/       → Operaciones del servidor (CRUD)
└── i18n/          → Traducciones (español/inglés)
```

---

## 🔍 ¿Qué es cada cosa?

### `/stores/` - Estado Global ✅ AUDITADO

**¿Qué es?** Datos que TODA la aplicación puede leer y modificar.

**Tecnología:** Zustand (librería de estado)

**Estado:** ✅ 100% auditado y nivel enterprise (Feb 2025)

| Archivo | ¿Qué guarda? |
|---------|--------------|
| `organization-store.ts` | Organización activa, monedas, billeteras, proyectos |
| `user-store.ts` | Usuario logueado |
| `layout-store.ts` | Estado de la UI (sidebar, navegación) |
| `modal-store.ts` | Stack de ventanas emergentes |
| `modal-registry.ts` | Registry para deep linking |
| `modal-url-sync.tsx` | Sincroniza modales con URL |
| `drawer-store.ts` | Panel lateral |
| `sidebar-store.ts` | Panel derecho contextual |
| `theme-store.ts` | Variables CSS personalizadas |

📄 Ver detalles: [stores/README.md](../src/stores/README.md)

---

### `/app/` - Páginas

**¿Qué es?** Las rutas de la aplicación. Cada carpeta = una página.

**Ejemplo:**
- `app/[locale]/(dashboard)/organization/finances/` → Página de finanzas
- `app/[locale]/(dashboard)/organization/projects/` → Página de proyectos

---

### `/features/` - Módulos de Negocio

**¿Qué es?** Todo el código relacionado a una funcionalidad específica.

**Estructura de cada feature:**
```
features/finance/
├── actions/     → Operaciones de servidor (crear, editar, borrar)
├── components/  → Piezas de UI específicas de finanzas
├── forms/       → Formularios
├── views/       → Vistas de página
├── hooks/       → Lógica específica
└── types/       → Tipos de datos
```

| Feature | Descripción | Estado |
|---------|-------------|--------|
| `finance` | Movimientos, billeteras, monedas | ⏳ En revisión |
| `projects` | Gestión de proyectos | ⏳ En revisión |
| `tasks` | Tareas de construcción | ⏳ En revisión |
| `materials` | Catálogo de materiales | ⏳ En revisión |
| `quotes` | Presupuestos | ⏳ En revisión |
| `subcontracts` | Subcontratos | ⏳ En revisión |
| `organization` | Configuración de org | ⏳ En revisión |
| `users` | Perfil y preferencias | ⏳ En revisión |

---

### `/components/` - Piezas de UI

**¿Qué es?** Componentes visuales reutilizables.

```
components/
├── ui/          → Botones, inputs, cards (base)
├── shared/      → Componentes compartidos (PageWrapper, Toolbar)
└── layout/      → Sidebar, header, navegación
```

---

### `/providers/` - Wrappers ✅ AUDITADO

**¿Qué es?** Componentes que envuelven la app para proveer funcionalidad de librerías externas.

**Estado:** ✅ 100% auditado y nivel enterprise (Feb 2025)

| Provider | Función |
|----------|---------|
| `modal-provider` | Renderiza los modales del stack |
| `query-provider` | React Query para cache |
| `theme-provider` | Tema claro/oscuro (next-themes) |
| `feature-flags-provider` | Features activables O(1) lookup |
| `presence-provider` | Telemetría y heartbeat |

📄 Ver detalles: [providers/README.md](../src/providers/README.md)

---

### `/actions/` - Operaciones de Servidor

**¿Qué es?** Funciones que hablan con la base de datos.

**Ejemplo:** `createMovement()`, `updateProject()`, `deleteTask()`

---

### `/hooks/` - Lógica Reutilizable ✅ AUDITADO

**¿Qué es?** React hooks que encapsulan lógica con estado.

**Estado:** ✅ 100% auditado y nivel enterprise (Feb 2025)

| Hook | Función |
|------|---------|
| `use-money` | Operaciones de dinero, formateo, display mode |
| `use-optimistic-action` | Updates optimistas con rollback |
| `use-financial-features` | Feature flags financieros |
| `use-sidebar-data` | Datos para sidebar |
| `use-sidebar-navigation` | Items de navegación |

📄 Ver detalles: [hooks/README.md](../src/hooks/README.md)

---

### `/lib/` - Utilidades

**¿Qué es?** Funciones helper puras (sin UI).

**Ejemplos:**
- `currency-utils.ts` → Conversiones de moneda
- `supabase/` → Cliente de base de datos
- `date-utils.ts` → Formateo de fechas

---

### `/types/` - Definiciones

**¿Qué es?** Descripción de la forma de los datos.

**Ejemplo:**
```typescript
interface Project {
    id: string;
    name: string;
    client_id: string;
    status: 'active' | 'paused' | 'completed';
}
```

---

## 📊 Estado de Auditoría

| Carpeta | Estado | Fecha | Notas |
|---------|--------|-------|-------|
| `/stores/` | ✅ Auditado | Feb 2025 | 9 archivos, corregidos 6 hooks con useShallow |
| `/providers/` | ✅ Auditado | Feb 2025 | 5 providers optimizados |
| `/hooks/` | ✅ Auditado | Feb 2025 | 5 hooks, eliminado código muerto |
| `/lib/` | ✅ Auditado | Feb 2025 | 21 archivos, módulo money/ enterprise-grade |
| `/app/` | ⏳ Pendiente | - | - |
| `/features/` | ⏳ Pendiente | - | - |
| `/components/` | ⏳ Pendiente | - | - |
| `/types/` | ⏳ Pendiente | - | - |
| `/actions/` | ⏳ Pendiente | - | - |

---

## 🔧 Cómo Actualizar Este Documento

Cuando audites una carpeta:

1. Cambiar estado de `⏳ Pendiente` a `✅ Auditado`
2. Agregar fecha
3. Agregar notas si es necesario
4. Crear README específico dentro de esa carpeta

---

## 📚 Documentación Adicional

- [Stores README](./stores/README.md) → Estado global
- [Skills](./../.agent/skills/) → Patrones de código

---

**Mantenido por:** Seencel Team  
**Actualizado:** Febrero 2025
