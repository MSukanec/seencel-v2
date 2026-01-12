---
description: How to create pages with the correct layout system (PageWrapper + ContentLayout)
---

# Page Layout System

This workflow explains how to create new pages using SEENCEL's standardized layout architecture. The system uses two main components that work together: `PageWrapper` and `ContentLayout`.

## Quick Reference

When creating a new page, ask yourself:
1. **Does this page need a header with title?** → Use `type="page"` or `type="dashboard"`
2. **What content variant fits best?** → Use `variant="wide"`, `variant="narrow"`, or `variant="full"`

---

## Component 1: PageWrapper

**Location:** `@/components/layout/page-wrapper`

Controls whether the page has a header with title and optional tabs.

### Props:
- `type`: `"page"` | `"dashboard"`
  - `"page"`: Shows header with title and optional tabs
  - `"dashboard"`: No header (for dashboard-style pages)
- `title`: String for the page title (only when type="page")
- `tabs`: ReactNode for tabs to display below the title
- `actions`: ReactNode for action buttons in the header

### Examples:

```tsx
// Page WITH header (most common)
<PageWrapper type="page" title="Proyectos">
  {children}
</PageWrapper>

// Page WITH header AND tabs
<Tabs defaultValue="list" className="h-full flex flex-col">
  <PageWrapper
    type="page"
    title="Contactos"
    tabs={
      <TabsList className="bg-transparent p-0 gap-4">
        <TabsTrigger value="list" className={tabTriggerClass}>Lista</TabsTrigger>
        <TabsTrigger value="settings" className={tabTriggerClass}>Config</TabsTrigger>
      </TabsList>
    }
  >
    <ContentLayout variant="wide">
      <TabsContent value="list">...</TabsContent>
      <TabsContent value="settings">...</TabsContent>
    </ContentLayout>
  </PageWrapper>
</Tabs>

// Dashboard (NO header)
<PageWrapper type="dashboard">
  <ContentLayout variant="wide">
    {/* Dashboard content */}
  </ContentLayout>
</PageWrapper>
```

---

## Component 2: ContentLayout

**Location:** `@/components/layout/content-layout`

Controls the content area styling (padding, width, scroll behavior).

### Props:
- `variant`: `"wide"` | `"narrow"` | `"full"`

### Variants:

| Variant | Use Case | Behavior |
|---------|----------|----------|
| `wide` | Tables, lists, grids, dashboards | Padding lateral (`px-6 md:px-8 py-6`), scrollable, full width |
| `narrow` | Forms, profile pages, settings | Centered content, max-width ~800px, scrollable |
| `full` | Canvas, maps, editors, PDF preview | No padding, 100% height, no scroll (content fills container) |

### Examples:

```tsx
// Wide - for data tables and lists
<ContentLayout variant="wide">
  <DataTable data={items} />
</ContentLayout>

// Narrow - for forms
<ContentLayout variant="narrow">
  <ProfileForm />
</ContentLayout>

// Full - for canvas/editor experiences
<ContentLayout variant="full">
  <MapCanvas />
</ContentLayout>
```

---

## Tab Trigger Style (Reusable)

When using tabs in the header, use this consistent style:

```tsx
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";
```

---

## Complete Page Template

```tsx
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

export default async function MyPage() {
  return (
    <Tabs defaultValue="main" className="h-full flex flex-col">
      <PageWrapper
        type="page"
        title="Mi Página"
        tabs={
          <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
            <TabsTrigger value="main" className={tabTriggerClass}>Principal</TabsTrigger>
            <TabsTrigger value="settings" className={tabTriggerClass}>Config</TabsTrigger>
          </TabsList>
        }
      >
        <ContentLayout variant="wide">
          <TabsContent value="main" className="m-0 h-full focus-visible:outline-none">
            {/* Main content */}
          </TabsContent>
          <TabsContent value="settings" className="m-0 h-full focus-visible:outline-none">
            {/* Settings content */}
          </TabsContent>
        </ContentLayout>
      </PageWrapper>
    </Tabs>
  );
}
```

---

## Current Pages Reference

| Page | PageWrapper Type | ContentLayout Variant |
|------|------------------|----------------------|
| Organization Dashboard | `dashboard` | `wide` |
| Identity - Información | `page` + tabs | `narrow` |
| Identity - Ubicación | `page` + tabs | `full` |
| Identity - Exp. Digital | `page` + tabs | `full` |
| Identity - PDF | `page` + tabs | `full` |
| Proyectos | `page` + tabs | `wide` |
| Kanban | `page` | `wide` |
| Contactos | `page` + tabs | `wide` |
| Finanzas | `page` | `wide` |
| Gastos Generales | `page` + tabs | `wide` |
| Configuración | `page` + tabs | `wide` |

---

## Important Rules

1. **NEVER put title/description inside the body** - The title goes in `PageWrapper`, not as an `<h1>` in the content
2. **Tabs must wrap PageWrapper** - When using tabs, the `<Tabs>` component goes OUTSIDE `PageWrapper`
3. **TabsContent inside ContentLayout** - The tab content goes inside the ContentLayout
4. **Use `m-0 h-full focus-visible:outline-none`** on TabsContent for proper spacing
5. **Client components** - If the page has tabs with state, split into server page + client component

---

## Modal & Form Standards (Must Read)

All modals and forms must adhere to the following strict guidelines to maintain consistency across the enterprise application.

### 1. Mandatory Header Description
> [!CAUTION]
> **This is non-negotiable.** Every Modal Header **MUST** include a `description`.
> It provides critical context to the user. Never leave it empty.

```tsx
openModal(<MyComponent />, { 
    title: "Crear Nuevo Rol",
    description: "Define un nuevo rol para segmentar tus clientes." // MANDATORY
});
```

### 2. Standard Form Architecture
Do not invent your own layouts. Use our global components.

*   **Wrapper**: Use standard spacing (e.g., `space-y-4`).
*   **Fields**: ALWAYS use **`<FormGroup>`** (`@/components/ui/form-group`).
    *   Handles labels, error states, and accessibility automatically.
*   **Footer**: ALWAYS use **`<FormFooter>`** (`@/components/global/form-footer`).
    *   Handles loading state, `Cmd+Enter` shortcuts, and button grouping.
    *   **Style**: You MUST use the className `"-mx-4 -mb-4 mt-6"` to align it flush with the modal bottom (breaking the default padding).

```tsx
<form className="flex h-full flex-col">
    <div className="flex-1 space-y-4">
        <FormGroup label="Nombre" htmlFor="name" error={state.errors?.name}>
            <Input id="name" ... />
        </FormGroup>
    </div>
    
    <FormFooter 
        className="-mx-4 -mb-4 mt-6"
        onCancel={closeModal}
        onSubmit={handleSubmit}
        isLoading={isPending}
        submitLabel="Guardar"
    />
</form>
```

### 3. Deletion Patterns
We have two distinct patterns for deletion. Choose the correct one:

#### A. Soft Delete with Reassignment (Catalog Items)
**Use Case:** Deleting a Category, Role, Type, or any "Catalog" item that might be in use.
**Component:** **`<DeleteReplacementModal>`** (`@/components/global/DeleteReplacementModal`).

*   Allows the user to **reassign** dependent items to another category before deletion.
*   Required for data integrity in an enterprise system.

```tsx
<DeleteReplacementModal
    entityName={deletingItem.name}
    replacementOptions={allItems.filter(i => i.id !== deletingItem.id)}
    onConfirm={async (replacementId) => {
        await deleteAction(deletingItem.id, replacementId);
    }}
/>
```

#### B. Simple Delete (Leaf Nodes)
**Use Case:** Deleting a specific Project, Task, or Contact that has no dependents.
**Component:** `DeleteDialog` or simple confirmation (with care).
