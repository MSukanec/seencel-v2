"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
    createDateColumn,
    createTextColumn,
    createMoneyColumn,
    createStatusColumn,
    createEntityColumn,
    createWalletColumn,
    type StatusOption,
} from "@/components/shared/data-table/columns";
import type { ExportColumn } from "@/lib/export";
import { GeneralCostPaymentView } from "@/features/general-costs/types";
import { parseDateFromDB } from "@/lib/timezone-data";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ─── Status Config ──────────────────────────────────────
export const GENERAL_COST_STATUS_CONFIG: StatusOption[] = [
    { value: "confirmed", label: "Confirmado", variant: "positive" },
    { value: "pending", label: "Pendiente", variant: "warning" },
    { value: "overdue", label: "Vencido", variant: "negative" },
    { value: "cancelled", label: "Cancelado", variant: "neutral" },
];

export const GENERAL_COST_STATUS_OPTIONS = GENERAL_COST_STATUS_CONFIG.map(
    ({ value, label }) => ({ label, value })
);

// ─── Status Labels (for export) ─────────────────────────
const STATUS_LABELS: Record<string, string> = Object.fromEntries(
    GENERAL_COST_STATUS_CONFIG.map(s => [s.value, s.label])
);

// ─── Column Factory ─────────────────────────────────────

interface PaymentColumnsOptions {
    onInlineUpdate?: (row: GeneralCostPaymentView, updates: Record<string, any>) => Promise<void> | void;
    wallets?: { id: string; wallet_name: string }[];
}

export function getGeneralCostPaymentColumns(
    options: PaymentColumnsOptions = {}
): ColumnDef<GeneralCostPaymentView>[] {
    const { onInlineUpdate, wallets = [] } = options;

    return [
        // 1. Fecha — con avatar del creador
        createDateColumn<GeneralCostPaymentView>({
            accessorKey: "payment_date",
            avatarUrlKey: "creator_avatar_url",
            avatarFallbackKey: "creator_full_name",
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, newDate) => onInlineUpdate(row, { payment_date: newDate })
                : undefined,
        }),
        // 2. Concepto — entidad con nombre + categoría como subtítulo
        createEntityColumn<GeneralCostPaymentView>({
            accessorKey: "general_cost_name",
            title: "Concepto",
            getSubtitle: (row) => row.category_name || "Sin categoría",
        }),
        // 3. Descripción — notas o referencia
        createTextColumn<GeneralCostPaymentView>({
            accessorKey: "notes",
            title: "Descripción",
            secondary: true,
            emptyValue: "-",
        }),
        // 4. Billetera — icono + nombre, auto-sized, inline editable
        createWalletColumn<GeneralCostPaymentView>({
            accessorKey: "wallet_name",
            editable: !!onInlineUpdate,
            walletOptions: wallets.map(w => ({ value: w.wallet_name, label: w.wallet_name })),
            onUpdate: onInlineUpdate
                ? (row, newValue) => onInlineUpdate(row, { wallet_name: newValue })
                : undefined,
        }),
        // 5. Monto — negativo (es gasto)
        createMoneyColumn<GeneralCostPaymentView>({
            accessorKey: "amount",
            prefix: "-",
            colorMode: "negative",
            currencyKey: "currency_code",
        }),
        // 6. Estado — con inline editing
        createStatusColumn<GeneralCostPaymentView>({
            accessorKey: "status",
            title: "Estado",
            options: GENERAL_COST_STATUS_CONFIG,
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, newValue) => onInlineUpdate(row, { status: newValue })
                : undefined,
        }),
    ];
}

// ─── Export Columns ─────────────────────────────────────
export const GENERAL_COST_EXPORT_COLUMNS: ExportColumn<GeneralCostPaymentView>[] = [
    {
        key: 'payment_date',
        header: 'Fecha',
        transform: (val) => {
            const d = parseDateFromDB(val);
            return d ? format(d, 'dd/MM/yyyy', { locale: es }) : '';
        }
    },
    { key: 'general_cost_name', header: 'Concepto', transform: (val) => val ?? '' },
    { key: 'category_name', header: 'Categoría', transform: (val) => val ?? 'Sin categoría' },
    { key: 'amount', header: 'Monto', transform: (val) => typeof val === 'number' ? val : 0 },
    { key: 'currency_code', header: 'Moneda', transform: (val) => val ?? '' },
    { key: 'wallet_name', header: 'Billetera', transform: (val) => val ?? '' },
    { key: 'status', header: 'Estado', transform: (val) => STATUS_LABELS[val] ?? val ?? '' },
    { key: 'reference', header: 'Referencia', transform: (val) => val ?? '' },
    { key: 'notes', header: 'Notas', transform: (val) => val ?? '' },
];
