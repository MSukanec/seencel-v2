/**
 * Data Source Registry
 * 
 * Scalable system for connecting report blocks to real application data.
 * Each feature registers its available data tables with columns and filters.
 */

import {
    Truck,
    DollarSign,
    FileText,
    Users,
    type LucideIcon
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type ColumnType = "text" | "currency" | "date" | "number" | "badge";

export interface ColumnDefinition {
    key: string;
    label: string;
    type: ColumnType;
    /** Show only when multiple entities are selected (e.g., Proveedor when all subcontracts) */
    showOnMultiple?: boolean;
}

export interface FilterDefinition {
    key: string;
    label: string;
    type: "select" | "multiselect" | "date-range";
    required: boolean;
    /** If true, adds "Todos" option */
    allowAll?: boolean;
}

export interface DataTableDefinition {
    id: string;
    name: string;
    description: string;
    columns: ColumnDefinition[];
    filters: FilterDefinition[];
}

export interface DataSourceDefinition {
    id: string;
    name: string;
    icon: LucideIcon;
    tables: DataTableDefinition[];
}

// ============================================================================
// Registry
// ============================================================================

export const DATA_SOURCE_REGISTRY: DataSourceDefinition[] = [
    {
        id: "subcontracts",
        name: "Subcontratistas",
        icon: Truck,
        tables: [
            {
                id: "payments",
                name: "Pagos",
                description: "Pagos realizados a subcontratistas",
                columns: [
                    { key: "payment_date", label: "Fecha", type: "date" },
                    { key: "provider_name", label: "Proveedor", type: "text", showOnMultiple: true },
                    { key: "wallet_name", label: "Billetera", type: "text" },
                    { key: "amount", label: "Monto", type: "currency" },
                ],
                filters: [
                    {
                        key: "projectId",
                        label: "Proyecto",
                        type: "select",
                        required: true,
                        allowAll: false
                    },
                    {
                        key: "subcontractId",
                        label: "Subcontrato",
                        type: "select",
                        required: false,
                        allowAll: true
                    },
                ],
            },
        ],
    },
    // Future: Finance, Tasks, Clients, etc.
];

// ============================================================================
// Helpers
// ============================================================================

export function getDataSource(sourceId: string): DataSourceDefinition | undefined {
    return DATA_SOURCE_REGISTRY.find(s => s.id === sourceId);
}

export function getDataTable(sourceId: string, tableId: string): DataTableDefinition | undefined {
    const source = getDataSource(sourceId);
    return source?.tables.find(t => t.id === tableId);
}

export function getVisibleColumns(
    sourceId: string,
    tableId: string,
    isMultipleEntities: boolean
): ColumnDefinition[] {
    const table = getDataTable(sourceId, tableId);
    if (!table) return [];

    return table.columns.filter(col => {
        // Always show columns that don't have showOnMultiple
        if (!col.showOnMultiple) return true;
        // Show showOnMultiple columns only when multiple entities selected
        return isMultipleEntities;
    });
}
