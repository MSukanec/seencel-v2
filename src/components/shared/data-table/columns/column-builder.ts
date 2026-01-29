/**
 * Column Builder
 * Utility to compose column factories into a ColumnDef array
 */

import { ColumnDef } from "@tanstack/react-table";

/**
 * Creates a columns array from factory functions
 * @param columns Array of column definitions or factory results
 */
export function createColumns<TData>(
    columns: ColumnDef<TData, any>[]
): ColumnDef<TData, any>[] {
    return columns;
}
