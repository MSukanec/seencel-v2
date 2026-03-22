# 📐 Seencel V2 Layout Architecture (Marzo 2026)

Este directorio conforma la arquitectura "Nivel Dios" (estilo Vercel/Linear) que controla la estructura maestra de Seencel V2. Ha sido refactorizada para garantizar la Separación de Responsabilidades (SRP), el renderizado predecible (sin dobles scroll) y el aislamiento de estado.

## 🗂 Estructura de Módulos

El sistema está dividido en 4 dominios principales, orquestados desde el `index.ts`:

### 1. `/(dashboard)`
El "Global Shell" de la aplicación principal.
- **`dashboard-shell.tsx`**: El orquestador general de la app. Es el único componente que envuelve todo el espacio de trabajo. Está configurado con un layout estricto de puro Flexbox (`flex-col h-screen`) donde los *Banners* (Layer 1) tienen `shrink-0` y el *Aplicación* (Layer 2) usa `flex-1 min-h-0` para **prevenir matemáticamente la propagación anidada del scroll**.
- **`sidebar/`**: El ecosistema del menú.
  - `sidebar-layout.tsx`: Reducido a solo ~110 líneas declarativas. Toda su lógica asíncrona o imperativa impera en la carpeta `/hooks`.
  - `/hooks/use-sidebar-sync.ts`: Resuelve internamente el pathname y sincroniza el contexto (Settings vs Org).
  - `/hooks/use-sidebar-resize.ts`: Aísla toda la lógica de cálculo imperativo del DOM y el localStorage para arrastrar el borde derecho.
  - `/hooks/use-sidebar-hover.ts`: Aísla los timers de debounce para el efecto de hover.

### 2. `/banners`
Sistema de Avisos Global (God-Tier Banner System).
- **`global-banner.tsx`**: El Primitivo UI genérico. Soporta variantes (destructive, warning, context, info) e introduce lógica independiente de validación y ocultamiento temporal mediante `localStorage` (memoriza si lo cerraste usando `id` e `isDismissible`).
- **`banner-stack.tsx`**: El Orquestador. Agrupa jerárquicamente todos los anuncios globales para respetar estéticamente el Z-Index (1. Mantenimiento > 2. Impersonation > 3. Viendo como).

### 3. `/page`
Contenedores estandarizados para componer vistas individuales (El "Hijo" del Shell).
- **`page-wrapper.tsx`**: Envuelve la página particular (ej: Catálogo). Dibuja el Header blanco, calcula migas de pan automáticas, y coloca el botón derecho global.
- **`content-layout.tsx`**: Dicta los márgenes y anchos internos (`wide` para tablas, `narrow` para formularios centrados, `full` para canvas). Es "tonto", simplemente limita espacios.
- **`split-editor-layout.tsx`**: Un Layout de componentes compuestos paralelos. Construye a demanda interfaces de *Sidebar Izquierdo (Controles)* + *Right Preview (Lienzo)*. Es el layout elegido para cualquier herramienta de diseño, creación o parametrización compleja (Ej: Editor de Plantillas Email, Editor de Presupuestos). 

### 4. `/public`
Layout base purísimo usado al momento de estar fuera del dashboard general (Auth, Landing, Sign Ups, Creadores Públicos).

---

## 🏗 Reglas Inquebrantables de Layout
1. **El `DashboardShell` NUNCA debe ensuciarse con HTML o Lógica Condicional**. Si necesitas un componente flotante nuevo, envuelvelo en una carpeta de su propio dominio e inyecta solo el Provider/Stack dentro del Shell.
2. **Double Scroll Zero-Tolerance**. Si la aplicación muestra un doble overlay de scroll vertical a la derecha del monitor, la culpa jamás la tiene el Body. Alguien violó el contrato del `min-h-0` dentro del flujo flex de una página.
3. El Sidebar es **completamente agnóstico**. Derivará y adivinará dónde pintar el resaltado y la flechita basándose explícitamente y únicamente leyendo tu string de URL. Modificar rutas requiere modificar sus arreglos constantes.
4. Jamás un Layout (como `SidebarLayout` o `dashboard-shell`) debe manejar "estados iniciales de servidor" ni fetchear queries manuales en un `useEffect`. Dichas delegaciones pre-render correspondientes pertenecen a la capa en `providers/` o clases hidratadoras como `<UserStoreHydrator />`.
