---
description: Guía maestra de arquitectura y estándares de código "Senior Pro"
---
# Estándares de Arquitectura SEENCEL

Este documento define la "Ley Marcial" de la arquitectura para asegurar consistencia y calidad Enterprise.

## 1. Estructura de Directorios (Feature-First)

### `src/components` (UI Agnóstica)
Esta carpeta está reservada **EXCLUSIVAMENTE** para componentes genéricos.
*   **`ui/`**: Primitivas atómicas (Button, Input, Select). Generalmente de Shadcn.
*   **`layout/`**: Estructura visual (Header, Sidebar, Footer, PageWrapper).
*   **`shared/`**: Componentes reutilizables complejos (DeleteModal, FormFooter, EmptyState).
*   ⛔ **PROHIBIDO**: Crear carpetas de negocio aquí (e.g., `src/components/users`, `src/components/billing`).
*   ⛔ **PROHIBIDO**: Usar `src/components/global`. Usar `shared` en su lugar.

### `src/features` (Dominio y Negocio)
Todo lo relacionado con una funcionalidad específica debe vivir aquí.
*   Estructura: `src/features/[feature-name]/components`.
*   Ejemplos: `auth`, `billing`, `projects`, `kanban`, `organization`.
*   Si un componente importa lógica de negocio (actions, queries), **pertenece a un Feature**.

## 2. Convenciones de Nombres

### Archivos y Directorios
*   ✅ **kebab-case**: `delete-confirmation-modal.tsx`, `user-profile.tsx`.
*   ❌ **PascalCase**: `DeleteConfirmationModal.tsx`, `UserProfile.tsx`.
*   ❌ **camelCase**: `deleteConfirmation.tsx`.

### Componentes (Exportaciones)
*   ✅ **PascalCase**: `export function UserProfile() {}`.

## 3. Checklist para Nuevos Desarrollos
Antes de crear un componente, pregúntate:
1.  ¿Es genérico y podría usarse en otro proyecto? -> `src/components/shared` o `src/components/ui`.
2.  ¿Tiene lógica específica de Seencel (Planes, Roles, Datos)? -> `src/features/[feature]`.
3.  ¿Cómo debo nombrar el archivo? -> **kebab-case**.

## 4. Workflows Sugeridos
*   Usa `/architecture` para revisar estas reglas.
