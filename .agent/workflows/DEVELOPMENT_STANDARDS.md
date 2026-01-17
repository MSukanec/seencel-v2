# Development Standards & Architecture Decisions

This document serves as the **Single Source of Truth** for all developers and AI agents working on the SEENCEL v2 project. Follow these guidelines strictly to maintain consistency and "Enterprise" quality.

---

## 1. Project Architecture (Feature-First)

### Directory Structure

#### `src/components` (UI Agnostic)
Reserved **EXCLUSIVELY** for generic components:
| Folder | Purpose |
|--------|---------|
| `ui/` | Atomic primitives (Button, Input, Select). Shadcn components. |
| `layout/` | Visual structure (Header, Sidebar, Footer, PageWrapper). |
| `shared/` | Complex reusable components (DeleteModal, FormFooter, DataTable). |
| `charts/` | Chart components (BaseBarChart, BasePieChart, etc.). |
| `dashboard/` | Dashboard-specific components (DashboardCard, DashboardKpiCard). |

⛔ **FORBIDDEN**: Creating business folders here (e.g., `src/components/users`).
⛔ **FORBIDDEN**: Using `src/components/global`. Use `shared` instead.

#### `src/features` (Domain & Business)
All feature-specific logic lives here:
- Structure: `src/features/[feature-name]/components`
- Examples: `auth`, `finance`, `projects`, `kanban`, `organization`, `clients`
- If a component imports business logic (actions, queries) → it belongs in a Feature.

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files/Dirs | ✅ kebab-case | `delete-confirmation-modal.tsx` |
| Components | ✅ PascalCase | `export function UserProfile()` |
| ❌ Wrong | PascalCase files | `DeleteConfirmationModal.tsx` |

---

## 2. Page Layout System

### PageWrapper
**Location:** `@/components/layout/page-wrapper`

| Prop | Values | Description |
|------|--------|-------------|
| `type` | `"page"` / `"dashboard"` | `page` = header; `dashboard` = no header |
| `title` | String | Page title |
| `icon` | ReactElement | **MANDATORY**: Must match sidebar icon |
| `tabs` | ReactNode | Tabs below title (pass `TabsList` here) |

### ContentLayout
**Location:** `@/components/layout/content-layout`

| Variant | Use Case |
|---------|----------|
| `wide` | Tables, lists, dashboards |
| `narrow` | Forms, profiles, settings |
| `full` | Canvas, maps, editors |

### Layout Rules
1. **Title in PageWrapper**, not as `<h1>` in content.
2. **Icons**: Always pass the `icon` prop to `PageWrapper`. Use the SAME icon as the sidebar.
3. **Tabs Structure**: 
   - Root `<Tabs>` wraps `PageWrapper`.
   - Pass `<TabsList>` to `PageWrapper`'s `tabs` prop.
   - Use standard transparent tab styles (reference `ContactsPage`).
4. **TabsContent inside ContentLayout**.

---

## 3. Forms & Modal System

### Modal Usage
```tsx
import { useModal } from "@/providers/modal-store";
openModal(<MyComponent />, { 
    title: "...",
    description: "...", // MANDATORY - never leave empty
    size: 'md'
});
```

### Form Architecture
- **FormFooter**: `@/components/shared/form-footer` (handles `Cmd+Enter`).
- **FormGroup**: ALWAYS wrap inputs for accessibility.
- **FormFooter class**: `className="-mx-4 -mb-4 mt-6"`.
- **Grid Layout**: `grid grid-cols-1 md:grid-cols-2 gap-4`.
- **Agnostic**: Forms receive `onSuccess` and `initialData` as props.

### Specialized Inputs
- **Phone**: `PhoneInput` - NEVER native inputs.
- **Date**: `DatePicker`.

### Deletion Patterns
| Pattern | Use Case | Component |
|---------|----------|-----------|
| **Soft Delete + Reassign** | Categories, Roles (in use) | `DeleteReplacementModal` |
| **Simple Delete** | Projects, Tasks (leaf nodes) | `DeleteDialog` |

### File Uploads & MIME Types
**CRITICAL**: Database tables (like `media_files`) often use restricted ENUMs for `file_type`.
**ALWAYS** map the raw MIME type to the allowed DB value before insertion in Server Actions:

| Raw MIME Type | DB Value |
|---------------|----------|
| `image/*` (png, jpeg, etc.) | `'image'` |
| `video/*` (mp4, webm) | `'video'` |
| `application/pdf` | `'pdf'` |
| `application/msword`, etc. | `'doc'` |
| Everything else | `'other'` |

**NEVER** insert `file.type` (e.g., `'image/png'`) directly into `file_type` columns. Use a helper function like `getMediaType(mime)`.

---

## 4. Financial Data Handling

For forms with transactions, payments, or financial movements:

1. **Single Source**: NEVER query `wallets` or `currencies` directly. Use `getOrganizationFinancialData(orgId)`.
2. **Default Logic**: Returns lists + default IDs (`defaultCurrencyId`, `defaultWalletId`).
3. **Pre-selection**: Use defaults to pre-fill Currency/Wallet selectors.

```tsx
// In Page.tsx
const financialData = await getOrganizationFinancialData(orgId);
<PaymentForm financialData={financialData} />

// In Form
const [walletId] = useState(initialData?.wallet_id || financialData.defaultWalletId);
```

---

## 5. User Interface (UI/UX)

### Dialogs
**NEVER** use `window.confirm()`. Use `AlertDialog`.

### Toasts
- **System**: Sonner (`toast.success()`, `toast.error()`).
- **Rule**: No inline success/error messages.

### Image Uploads
**CRITICAL**: Compress before upload.
```tsx
import { compressImage } from "@/lib/client-image-compression";
const file = await compressImage(rawFile, 'avatar');
```

---

## 6. Data Tables

**Location**: `@/components/shared/data-table/`

### Usage
```tsx
<DataTable
    columns={columns}  // NO manual "actions" column
    data={data}
    enableRowActions={true}
    onEdit={handleEdit}
    onDelete={handleDelete}
/>
```

### When to Use
- ✅ Entity lists, > 20 items, sortable/filterable
- ❌ Tables < 5 rows, inside modals

---

## 7. Internationalization (i18n)
- **Library**: `next-intl`
- **Rule**: **NO HARDCODED STRINGS**. Extract to `messages/es.json`.
- **Locale**: Default is Spanish (`es`).

---

## 8. Backend (Supabase)

### RLS
- Use `.update()` not `.upsert()` for existing profiles.

### Storage
- Use `getStorageUrl` for public URLs.
- Prefer `logo_path` column.

---

## 9. Implementation Checklist
- [ ] **Architecture**: Component in correct folder (`features/` or `components/`)?
- [ ] **Naming**: File is kebab-case?
- [ ] **Layout**: Used `PageWrapper` + `ContentLayout`?
- [ ] **Modal**: Has description?
- [ ] **Form**: Used `FormGroup`, `FormFooter`?
- [ ] **Financial**: Used `getOrganizationFinancialData`?
- [ ] **Images**: Used `compressImage`?
- [ ] **MIME**: Mapped file types for DB?
- [ ] **Tables**: Used `DataTable`?
- [ ] **I18n**: No hardcoded strings?
- [ ] **Performance**: Used optimistic UI for mutations? (NEW)
- [ ] **Tabs**: Used local state, not router.replace()? (NEW)

---

## 10. Performance & High-Speed UX ⚡

### MANDATORY: All new features MUST follow these patterns for instant user feedback.

---

### 10.1 Optimistic UI (Delete/Archive Operations)

**Hook:** `@/hooks/use-optimistic-list`

```tsx
import { useOptimisticList } from "@/hooks/use-optimistic-list";

// In component
const { optimisticItems, removeOptimistically, isPending } = useOptimisticList(items);

// On delete
const handleDelete = async (id: string) => {
    removeOptimistically(id); // Item disappears INSTANTLY
    const result = await deleteAction(id);
    if (!result.success) {
        router.refresh(); // Rollback on error
    }
};

// Render with optimistic data
<DataTable data={optimisticItems} />
```

**Rule:** NEVER show loading spinner for delete. Item must vanish immediately.

---

### 10.2 React Query (Caching & Invalidation)

**Provider:** `@/providers/query-provider` (wraps `LayoutSwitcher`)

**Hooks:**
- `@/hooks/use-query-patterns` - Standardized query keys
- `@/hooks/use-smart-refresh` - Hybrid refresh pattern

```tsx
import { useSmartRefresh } from "@/hooks/use-smart-refresh";
import { queryKeys } from "@/hooks/use-query-patterns";

const { invalidate, refresh } = useSmartRefresh();

// After mutation:
invalidate(queryKeys.clients(projectId)); // Invalidate specific cache
// OR
refresh(); // Full page refresh (legacy, avoid)
```

**Query Keys** (standardized in `use-query-patterns.ts`):
- `queryKeys.clients(projectId)`
- `queryKeys.projects(orgId)`
- `queryKeys.kanbanCards(boardId)`
- etc.

---

### 10.3 Lazy Loading (Charts & Heavy Components)

**Location:** `@/components/charts/lazy-charts.tsx`

```tsx
// ❌ WRONG - Loads entire Recharts bundle immediately
import { BaseAreaChart } from "@/components/charts/area/base-area-chart";

// ✅ CORRECT - Lazy loads ~200KB only when rendered
import { LazyAreaChart as BaseAreaChart } from "@/components/charts/lazy-charts";
```

**Available Lazy Components:**
- `LazyAreaChart`, `LazyDualAreaChart`
- `LazyBarChart`, `LazyPieChart`, `LazyDonutChart`
- `LazyLineChart`

**Rule:** ALWAYS use lazy versions for charts in dashboards and overviews.

---

### 10.4 Tab Navigation (Instant Switching)

**Problem:** `router.replace()` causes full page re-fetch = SLOW.

**Solution:** Local state + shallow URL update.

```tsx
// ❌ WRONG - Causes full re-fetch
const handleTabChange = (value: string) => {
    router.replace(`${pathname}?view=${value}`);
};

// ✅ CORRECT - Instant tab switch
const [activeTab, setActiveTab] = useState(defaultTab);

const handleTabChange = (value: string) => {
    setActiveTab(value); // Instant UI update
    window.history.replaceState(null, '', `${pathname}?view=${value}`); // Shallow URL
};

<Tabs value={activeTab} onValueChange={handleTabChange}>
```

---

### 10.5 Prefetching (Navigation)

**Location:** `@/components/layout/sidebar-button.tsx`

All sidebar links prefetch on hover via `router.prefetch()`.

```tsx
// Already implemented in SidebarButton
const handleMouseEnter = useCallback(() => {
    if (href) router.prefetch(href);
}, [href, router]);
```

---

### 10.6 Animation Durations

**Standard:** `duration-150` (150ms) for sidebar/drawer animations.

**Rule:** NEVER use `duration-300` for navigation animations. It feels sluggish.

---

### Performance Checklist (Add to every PR)
- [ ] Delete operations use `useOptimisticList`?
- [ ] Charts use `Lazy*` components?
- [ ] Tab switching uses local state, not `router.replace()`?
- [ ] Animations are `duration-150` or faster?

