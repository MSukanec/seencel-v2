"use client";

/**
 * Movement Table Columns
 * Standard 19.0 - Composable DataTable Columns
 * 
 * Column definitions for the Finance Movements table.
 * Extracted from the view to keep views thin (~150 lines).
 */

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { createDateColumn, createTextColumn, createMoneyColumn, createStatusColumn } from "@/components/shared/data-table/columns";
import { parseDateFromDB } from "@/lib/timezone-data";
import type { StatusOption } from "@/components/shared/data-table/columns";
import type { ExportColumn } from "@/lib/export";

// ─── Constants ───────────────────────────────────────────

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
    'client_payment': 'Cobro Cliente',
    'material_payment': 'Materiales',
    'labor_payment': 'Mano de Obra',
    'subcontract_payment': 'Subcontrato',
    'general_cost': 'Gasto General',
    'partner_contribution': 'Aporte Socio',
    'partner_withdrawal': 'Retiro Socio',
    'wallet_transfer': 'Transferencia',
    'currency_exchange': 'Cambio Moneda',
};

export const MOVEMENT_TYPE_OPTIONS = Object.entries(MOVEMENT_TYPE_LABELS).map(
    ([value, label]) => ({ label, value })
);

export const MOVEMENT_STATUS_CONFIG: StatusOption[] = [
    { value: "confirmed", label: "Confirmado", variant: "positive" },
    { value: "completed", label: "Confirmado", variant: "positive" },
    { value: "paid", label: "Confirmado", variant: "positive" },
    { value: "pending", label: "Pendiente", variant: "warning" },
    { value: "rejected", label: "Rechazado", variant: "negative" },
    { value: "cancelled", label: "Rechazado", variant: "negative" },
    { value: "void", label: "Anulado", variant: "neutral" },
];

export const MOVEMENT_STATUS_OPTIONS = MOVEMENT_STATUS_CONFIG.map(
    ({ value, label }) => ({ label, value })
);

// ─── Column Factory ──────────────────────────────────────

interface MovementColumnsOptions {
    /** Wallet lookup function */
    getWalletName: (walletId: string) => string;
    /** Project lookup function (only needed when showProjectColumn=true) */
    getProjectName?: (projectId: string) => string;
    /** Show the project column */
    showProjectColumn?: boolean;
}

export function getMovementColumns(
    options: MovementColumnsOptions
): ColumnDef<any>[] {
    const { getWalletName, getProjectName, showProjectColumn = false } = options;

    return [
        // 1. Fecha — factory con avatar del creador
        createDateColumn<any>({
            accessorKey: "payment_date",
            avatarFallbackKey: "creator_name",
        }),
        // 2. Tipo — factory con customRender (label + concepto)
        createTextColumn<any>({
            accessorKey: "movement_type",
            title: "Tipo",
            customRender: (_value, row) => {
                const typeLabel = MOVEMENT_TYPE_LABELS[(row as any).movement_type] || (row as any).movement_type;
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{typeLabel}</span>
                        <span className="text-xs text-muted-foreground">{(row as any).concept_name || "-"}</span>
                    </div>
                );
            },
            enableSorting: true,
        }),
        // 3. Proyecto — solo en modo organización
        ...(showProjectColumn && getProjectName ? [createTextColumn<any>({
            accessorKey: "project_id",
            title: "Proyecto",
            customRender: (_value, row) => (
                <span className="text-sm font-medium">{getProjectName((row as any).project_id)}</span>
            ),
        })] : []),
        // 4. Descripción — factory con truncate
        createTextColumn<any>({
            accessorKey: "description",
            title: "Descripción",
            truncate: true,
        }),
        // 5. Billetera — factory con lookup
        createTextColumn<any>({
            accessorKey: "wallet_id",
            title: "Billetera",
            customRender: (_value, row) => (
                <span className="text-sm text-foreground/80">{getWalletName((row as any).wallet_id)}</span>
            ),
        }),
        // 6. Monto — factory con auto prefix/color
        createMoneyColumn<any>({
            accessorKey: "amount",
            title: "Monto",
            prefix: "auto",
            colorMode: "auto",
            currencyKey: "currency_code",
            signKey: "amount_sign",
            signPositiveValue: "+",
        }),
        // 7. Estado — factory con badge semántico
        createStatusColumn<any>({
            options: MOVEMENT_STATUS_CONFIG,
        }),
    ];
}

// ─── Export Column Definitions ───────────────────────────

export const MOVEMENT_EXPORT_COLUMNS: ExportColumn<any>[] = [
    {
        key: 'payment_date', header: 'Fecha', transform: (val) => {
            const date = parseDateFromDB(val);
            return date ? format(date, 'dd/MM/yyyy') : '';
        }
    },
    { key: 'movement_type', header: 'Tipo', transform: (val) => MOVEMENT_TYPE_LABELS[val] || val || '' },
    { key: 'concept_name', header: 'Concepto', transform: (val) => val ?? '' },
    { key: 'description', header: 'Descripción', transform: (val) => val ?? '' },
    { key: 'amount', header: 'Monto', transform: (val) => Number(val) || 0 },
    { key: 'currency_code', header: 'Moneda', transform: (val) => val ?? '' },
    {
        key: 'status', header: 'Estado', transform: (val) => {
            const config = MOVEMENT_STATUS_CONFIG.find(s => s.value === val);
            return config?.label ?? val ?? '';
        }
    },
    { key: 'reference', header: 'Referencia', transform: (val) => val ?? '' },
];
