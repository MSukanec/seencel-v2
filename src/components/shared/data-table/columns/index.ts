/**
 * Column Factory System
 * Standard 19.0 - Composable DataTable Columns
 * 
 * This module exports pre-built, reusable column factories for DataTables.
 * Each factory returns a fully configured ColumnDef that can be customized.
 * 
 * All factories support inline editing (Linear-style) via `editable` + `onUpdate` props.
 */

export { createDateColumn, type DateColumnOptions } from "./date-column";
export { createTextColumn, type TextColumnOptions } from "./text-column";
export { createMoneyColumn, type MoneyColumnOptions } from "./money-column";
export { createProjectColumn, type ProjectColumnOptions, type ProjectOption } from "./project-column";
export { createStatusColumn, type StatusColumnOptions, type StatusOption } from "./status-column";
export { createPercentColumn, type PercentColumnOptions } from "./percent-column";
export { createEntityColumn, type EntityColumnOptions } from "./entity-column";
export { createWalletColumn, type WalletColumnOptions, type WalletOption } from "./wallet-column";
export { createColumns } from "./column-builder";
