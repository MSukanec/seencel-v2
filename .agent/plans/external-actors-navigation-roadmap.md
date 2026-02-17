# 🗺️ Roadmap: External Actors — Navegación Dinámica por Modo de Acceso

## Visión General

Permitir que usuarios de tipo **external_actor** accedan al espacio de trabajo con navegación adaptada a su rol (`client`, `accountant`, `field_worker`, etc.), sin duplicar layouts ni crear routers paralelos.

---

## Estado Actual (Completado)

| Componente | Estado | Descripción |
|:---|:---:|:---|
| Tabla `organization_external_actors` | ✅ | SQL creado, tipos definidos en `features/external-actors/types.ts` |
| Portal de cliente viejo | ✅ | Eliminado completamente (rutas, componentes, queries, actions, types, middleware) |
| Feature `external-actors/` | ✅ | `types.ts`, `actions.ts`, `queries.ts` — CRUD básico |

---

## Etapas del Roadmap

### Etapa 1: Arquitectura de Navegación Dinámica 🏗️

**Objetivo:** El sidebar muestra items distintos según si el usuario es `member`, `external_actor`, o ambos.

#### 1.1 — Access Context Store
- Crear `stores/access-context-store.ts`
- State: `activeAccessMode` (member | external), `externalActorType`, `availableModes`
- Hidratación automática al entrar a una organización

#### 1.2 — Navigation Config
- Crear `config/external-navigation-config.ts`
- Mapa de items de navegación por `ExternalActorType`
- Formato compatible con `NavItem`/`NavGroup` del sidebar existente

#### 1.3 — Selector de Modo
- Si el usuario es **member + external_actor**, mostrar selector
- Ubicación: dentro del sidebar (probablemente encima de la navegación, o como context button)
- Si solo es external_actor, entrar automáticamente en modo external

#### 1.4 — Refactor de Sidebar
- `useSidebarNavigation` lee `accessMode` del store
- Si `accessMode === "external"`, usa `external-navigation-config` para los items
- Si `accessMode === "member"`, usa la navegación actual sin cambios

#### 1.5 — Detección de Tipo de Acceso
- Al entrar al workspace, query a `organization_members` + `organization_external_actors`
- Determinar si el user es member, external, o ambos
- Hidratar el store de access context

---

### Etapa 2: Páginas para Externos 📄

**Objetivo:** Crear las páginas básicas que cada tipo de actor externo puede ver.

> Las páginas son **nuevas**, no se modifican las existentes de miembros.

| Actor Type | Páginas |
|:---|:---|
| `client` | Dashboard, Mis Proyectos, Documentos, Pagos, Reportes |
| `accountant` | Dashboard Financiero, Ingresos, Egresos, Reportes, Exportar |
| `field_worker` | Marcar Presente, Mi Asistencia, Mis Pagos |
| `external_site_manager` | Dashboard Proyecto, Avance de Obra, Certificaciones, Reportes |
| `subcontractor_portal_user` | Mi Contrato, Certificaciones, Pagos, Documentación |

---

### Etapa 3: Permisos Granulares 🔐

**Objetivo:** Control fino de qué puede ver/hacer cada actor externo.

- Crear tabla `external_actor_permissions` (permission_key por actor)
- Filtrar items del `navigationConfig` por permissions
- Hook `useExternalPermissions()` para components
- RLS policies para queries de externos

---

### Etapa 4: Experiencia Digital para Externos ✨

**Objetivo:** Personalización visual del portal de cada organización.

- Branding organizacional aplicado al layout del modo externo
- Temas de color por organización
- Logo y marca en el header/sidebar

---

## Archivos Clave (Referencia)

| Archivo | Rol |
|:---|:---|
| `stores/layout-store.ts` | `NavigationContext`, `activeContext`, `activeProjectId` |
| `hooks/use-sidebar-navigation.ts` | `NavItem`, `NavGroup`, items por contexto |
| `sidebar/sidebar-content.tsx` | Drill-down UI, renderiza items según `drillState` |
| `stores/organization-store.ts` | `activeOrgId`, hydration 2 fases |
| `features/external-actors/types.ts` | `ExternalActorType`, schemas Zod |

---

## Principios de Diseño

1. **Un layout, N configs** — No duplicar layouts
2. **Config-driven** — La navegación sale de un archivo de config, no de lógica en componentes
3. **Escalable** — Cuando vengan permisos granulares, el mismo config se filtra
4. **No romper lo actual** — Member mode sigue funcionando 100% igual
