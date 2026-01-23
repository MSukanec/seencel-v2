"use client";

import { Toolbar as SharedToolbar, ToolbarProps } from "@/components/layout/dashboard/shared/toolbar";

/**
 * Re-exporting unified Toolbar as DataTableToolbar for backward compatibility.
 * The logic has been unified in components/layout/dashboard/shared/toolbar/index.tsx
 */
export function DataTableToolbar<TData>(props: ToolbarProps<TData>) {
    return <SharedToolbar {...props} />;
}

export type { ToolbarProps as DataTableToolbarProps };
// Export Generic Toolbar alias if needed for compat
export const Toolbar = SharedToolbar;
