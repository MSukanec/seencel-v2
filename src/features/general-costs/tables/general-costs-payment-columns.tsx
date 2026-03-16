"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
    createCreatorColumn,
    createDateColumn,
    createTextColumn,
    createMoneyColumn,
    createStatusColumn,
    createEntityColumn,
    createWalletColumn,
    createCurrencyColumn,
    createExchangeRateColumn,
    createPeriodColumn,
    createAttachmentColumn,
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
    concepts?: { id: string; name: string; category?: { name: string } | null }[];
    currencies?: { id: string; name: string; code: string; symbol: string }[];
    /** Fetch existing attachments for a row */
    fetchAttachments?: (row: GeneralCostPaymentView) => Promise<any[]>;
    /** Called when attachments change (upload/remove) */
    onAttachmentsChange?: (row: GeneralCostPaymentView, files: any[]) => void;
    /** Organization ID for attachment upload path */
    organizationId?: string;
}

export function getGeneralCostPaymentColumns(
    options: PaymentColumnsOptions = {}
): ColumnDef<GeneralCostPaymentView>[] {
    const { onInlineUpdate, wallets = [], concepts = [], currencies = [], fetchAttachments, onAttachmentsChange, organizationId } = options;

    // Build entity options for concept column
    const conceptEntityOptions = concepts.map(c => ({
        value: c.name,
        label: c.name,
        subtitle: c.category?.name || undefined,
    }));

    return [
        // 1. Creador — avatar + nombre
        createCreatorColumn<GeneralCostPaymentView>({
            avatarUrlKey: "creator_avatar_url",
            nameKey: "creator_full_name",
        }),
        // 2. Fecha
        createDateColumn<GeneralCostPaymentView>({
            accessorKey: "payment_date",
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, newDate) => onInlineUpdate(row, { payment_date: newDate })
                : undefined,
        }),
        // 2. Concepto — entidad con nombre + categoría, editable inline
        createEntityColumn<GeneralCostPaymentView>({
            accessorKey: "general_cost_name",
            title: "Concepto",
            emptyValue: "Sin concepto",
            getSubtitle: (row) => row.category_name || "Sin categoría",
            editable: !!onInlineUpdate,
            entityOptions: conceptEntityOptions,
            editSearchPlaceholder: "Buscar concepto...",
            emptySearchMessage: "No hay conceptos creados aún.",
            manageRoute: { pathname: "/organization/general-costs" as const, query: { view: "concepts" } },
            manageLabel: "Gestionar conceptos",
            onUpdate: onInlineUpdate
                ? (row, newValue) => {
                    // Find the concept to get its ID and category
                    const concept = concepts.find(c => c.name === newValue);
                    if (concept) {
                        onInlineUpdate(row, {
                            general_cost_id: concept.id,
                            general_cost_name: concept.name,
                            category_name: concept.category?.name || null,
                        });
                    }
                }
                : undefined,
        }),
        // 3. Período — solo visible/editable cuando concepto es recurrente
        createPeriodColumn<GeneralCostPaymentView>({
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, newValue) => onInlineUpdate(row, { covers_period: newValue })
                : undefined,
            manageRoute: { pathname: "/organization/general-costs" as const, query: { view: "concepts" } },
        }),
        // 4. Descripción — notas o referencia
        createTextColumn<GeneralCostPaymentView>({
            accessorKey: "notes",
            title: "Descripción",
            secondary: true,
            emptyValue: "-",
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, newValue) => onInlineUpdate(row, { notes: newValue })
                : undefined,
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
        // 5. Moneda — símbolo + código, inline editable
        createCurrencyColumn<GeneralCostPaymentView>({
            accessorKey: "currency_code",
            editable: !!onInlineUpdate,
            currencyOptions: currencies.map(c => ({
                value: c.code,
                label: `${c.name} (${c.symbol})`,
                symbol: c.symbol,
            })),
            onUpdate: onInlineUpdate
                ? (row, newValue) => {
                    const currency = currencies.find(c => c.code === newValue);
                    if (currency) {
                        onInlineUpdate(row, {
                            currency_id: currency.id,
                            currency_code: currency.code,
                            currency_symbol: currency.symbol,
                        });
                    }
                }
                : undefined,
        }),
        // 6. Monto — con símbolo de moneda, editable inline
        createMoneyColumn<GeneralCostPaymentView>({
            accessorKey: "amount",
            colorMode: "none",
            showExchangeRate: false,
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, newValue) => onInlineUpdate(row, { amount: newValue })
                : undefined,
        }),
        // 7. Tasa de cambio — editable inline
        createExchangeRateColumn<GeneralCostPaymentView>({
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, newValue) => onInlineUpdate(row, { exchange_rate: newValue })
                : undefined,
        }),
        // 7. Estado — con inline editing
        createStatusColumn<GeneralCostPaymentView>({
            accessorKey: "status",
            title: "Estado",
            options: GENERAL_COST_STATUS_CONFIG,
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, newValue) => onInlineUpdate(row, { status: newValue })
                : undefined,
        }),
        // 8. Adjuntos — editable inline con popover
        createAttachmentColumn<GeneralCostPaymentView>({
            editable: !!fetchAttachments,
            bucket: "private-assets",
            folderPath: organizationId
                ? `organizations/${organizationId}/finance/general-costs`
                : "",
            maxSizeMB: 5,
            fetchAttachments,
            onFilesChange: onAttachmentsChange,
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
