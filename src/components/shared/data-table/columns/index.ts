/**
 * Column Factory System
 * Standard 19.0 - Composable DataTable Columns
 * 
 * This module exports pre-built, reusable column factories for DataTables.
 * Each factory returns a fully configured ColumnDef that can be customized.
 */

export { createDateColumn, type DateColumnOptions } from "./date-column";
export { createTextColumn, type TextColumnOptions } from "./text-column";
export { createMoneyColumn, type MoneyColumnOptions } from "./money-column";
export { createColumns } from "./column-builder";
