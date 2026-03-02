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
import { createDateColumn, createTextColumn, createMoneyColumn, createStatusColumn, createProjectColumn, createEntityColumn } from "@/components/shared/data-table/columns";
import type { ProjectOption } from "@/components/shared/data-table/columns";

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
    { value: "pending", label: "Pendiente", variant: "warning" },
    { value: "rejected", label: "Rechazado", variant: "negative" },
];

export const MOVEMENT_STATUS_OPTIONS = MOVEMENT_STATUS_CONFIG.map(
    ({ value, label }) => ({ label, value })
);

// ─── Column Factory ──────────────────────────────────────

interface MovementColumnsOptions {
    /** Wallet lookup function */
    getWalletName: (walletId: string) => string;
    /** Project options for avatar + inline editing */
    projectOptions?: ProjectOption[];
    /** Show the project column */
    showProjectColumn?: boolean;
    /** Generic inline update handler (row, partialFields) */
    onInlineUpdate?: (row: any, fields: Record<string, any>) => void;
}

export function getMovementColumns(
    options: MovementColumnsOptions
): ColumnDef<any>[] {
    const { getWalletName, projectOptions = [], showProjectColumn = false, onInlineUpdate } = options;

    return [
        // 1. Fecha — factory con avatar del creador + inline editing
        createDateColumn<any>({
            accessorKey: "payment_date",
            avatarFallbackKey: "creator_name",
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, newDate) => onInlineUpdate(row, { payment_date: newDate })
                : undefined,
        }),
        // 2. Tipo — factory con label + concepto como subtítulo
        createEntityColumn<any>({
            accessorKey: "movement_type",
            title: "Tipo",
            labels: MOVEMENT_TYPE_LABELS,
            getSubtitle: (row) => (row as any).concept_name || "-",
            size: 140,
        }),
        // 3. Proyecto — avatar + inline editing (Linear-style)
        ...(showProjectColumn ? [createProjectColumn<any>({
            accessorKey: "project_name",
            size: 160,
            editable: !!onInlineUpdate,
            projectOptions,
            getProjectId: (row: any) => row.project_id,
            getImageUrl: (row: any) => row.project_image_url,
            getColor: (row: any) => row.project_color,
            onUpdate: onInlineUpdate
                ? (row, newProjectId) => {
                    // Find the selected project to get name for optimistic update
                    const project = projectOptions.find(p => p.value === newProjectId);
                    onInlineUpdate(row, {
                        project_id: newProjectId,
                        project_name: project?.label || null,
                        project_image_url: project?.imageUrl || null,
                        project_color: project?.color || null,
                    });
                }
                : undefined,
        })] : []),
        // 4. Descripción — truncado
        createTextColumn<any>({
            accessorKey: "description",
            title: "Descripción",
            truncate: true,
            secondary: true,
        }),
        // 5. Billetera — factory con lookup
        createTextColumn<any>({
            accessorKey: "wallet_id",
            title: "Billetera",
            size: 110,
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
        // 7. Estado — factory con badge semántico + inline editing
        // No editable para currency_exchange y wallet_transfer (status hardcodeado en la vista SQL)
        createStatusColumn<any>({
            options: MOVEMENT_STATUS_CONFIG,
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, newValue) => {
                    // Block editing for financial operations (hardcoded status)
                    const type = (row as any).movement_type;
                    if (type === 'currency_exchange' || type === 'wallet_transfer') return;
                    onInlineUpdate(row, { status: newValue });
                }
                : undefined,
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
