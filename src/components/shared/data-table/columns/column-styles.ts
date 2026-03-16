/**
 * Column Styles — Shared design tokens for ALL column factories
 * 
 * Single source of truth for consistent cell styling across the DataTable system.
 * Every column factory MUST import from here instead of hardcoding styles.
 */

// ─── Cell Value Styles ──────────────────────────────────
// Used by: entity-column, address-column, project-column, wallet-column, currency-column, etc.

/** Text style when cell HAS a value (prominent, readable) */
export const CELL_VALUE_CLASS = "text-sm font-medium";

/** Text style when cell has NO value / empty state (muted, smaller) */
export const CELL_EMPTY_CLASS = "text-xs text-muted-foreground";

// ─── Editable Cell Styles ───────────────────────────────
// Used by: all editable column factories

/** Base button style for editable cells (dashed border on hover) */
export const EDITABLE_CELL_CLASS =
    "cursor-pointer rounded-md px-1.5 py-1 -mx-1.5 transition-all border border-transparent hover:border-dashed hover:border-border hover:bg-[#2a2b2d]";

/** Loading state for editable cells */
export const EDITABLE_CELL_LOADING_CLASS = "opacity-50 pointer-events-none";
