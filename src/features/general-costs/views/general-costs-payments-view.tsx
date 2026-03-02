"use client";

/**
 * General Costs — Payments View
 * Standard 19.0 - Lean View Pattern (~200 lines)
 *
 * Vista operativa: tabla pura de pagos de gastos generales.
 * Orquesta hooks + columnas + UI. No contiene lógica de negocio.
 */

import { useMemo } from "react";
import { Plus, Receipt, CircleDot } from "lucide-react";
import { format, isAfter, isBefore, isEqual, startOfDay, endOfDay } from "date-fns";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { usePanel } from "@/stores/panel-store";
import { useModal } from "@/stores/modal-store";
import { useTableActions } from "@/hooks/use-table-actions";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FilterPopover, SearchButton, DisplayButton } from "@/components/shared/toolbar-controls";
import { getStandardToolbarActions } from "@/lib/toolbar-actions";
import { exportToCSV, exportToExcel } from "@/lib/export";
import { createImportBatch, revertImportBatch, importGeneralCostPaymentsBatch, type ImportConfig } from "@/lib/import";
import { BulkImportModal } from "@/components/shared/import/import-modal";
import { deleteGeneralCostPayment, updateGeneralCostPaymentField } from "../actions";
import {
    getGeneralCostPaymentColumns,
    GENERAL_COST_STATUS_OPTIONS,
    GENERAL_COST_EXPORT_COLUMNS,
} from "../tables/general-costs-payment-columns";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { GeneralCost, GeneralCostPaymentView } from "../types";

// ─── Types ───────────────────────────────────────────────

interface GeneralCostsPaymentsViewProps {
    data: GeneralCostPaymentView[];
    concepts: GeneralCost[];
    wallets: { id: string; wallet_name: string }[];
    currencies: { id: string; name: string; code: string; symbol: string }[];
    organizationId: string;
}

// ─── Component ───────────────────────────────────────────

export function GeneralCostsPaymentsView({
    data,
    concepts,
    wallets,
    currencies,
    organizationId,
}: GeneralCostsPaymentsViewProps) {
    const router = useRouter();
    const { openPanel } = usePanel();
    const { openModal } = useModal();

    // 🚀 Optimistic UI
    const {
        optimisticItems,
        removeItem: optimisticRemove,
        updateItem: optimisticUpdate,
    } = useOptimisticList({
        items: data,
        getItemId: (m) => m.id,
    });

    // ─── Filters ─────────────────────────────────────────
    const filters = useTableFilters({
        facets: [
            { key: "status", title: "Estado", icon: CircleDot, options: GENERAL_COST_STATUS_OPTIONS },
        ],
        enableDateRange: true,
    });

    // ─── Delete actions ──────────────────────────────────
    const { handleDelete, handleBulkDelete, DeleteConfirmDialog } = useTableActions<any>({
        onDelete: async (item) => {
            optimisticRemove(item.id, async () => {
                try {
                    await deleteGeneralCostPayment(item.id);
                    toast.success("Pago eliminado");
                } catch {
                    toast.error("Error al eliminar el pago");
                    router.refresh();
                }
            });
            return { success: true };
        },
        entityName: "pago",
        entityNamePlural: "pagos",
    });

    // ─── Filtered data ───────────────────────────────────
    const filteredData = useMemo(() => {
        return optimisticItems.filter(m => {
            // Date range
            if (filters.dateRange?.from || filters.dateRange?.to) {
                const date = startOfDay(new Date(m.payment_date));
                const from = filters.dateRange.from ? startOfDay(filters.dateRange.from) : null;
                const to = filters.dateRange.to ? endOfDay(filters.dateRange.to) : null;
                if (from && to) {
                    if (!(isAfter(date, from) || isEqual(date, from)) || !(isBefore(date, to) || isEqual(date, to))) return false;
                } else if (from) {
                    if (!(isAfter(date, from) || isEqual(date, from))) return false;
                } else if (to) {
                    if (!(isBefore(date, to) || isEqual(date, to))) return false;
                }
            }
            // Status facet
            const statusFilter = filters.facetValues.status;
            if (statusFilter?.size > 0 && !statusFilter.has(m.status)) return false;
            // Search
            if (filters.searchQuery) {
                const q = filters.searchQuery.toLowerCase();
                const searchable = [
                    m.general_cost_name,
                    m.category_name,
                    m.notes,
                    m.reference,
                    m.wallet_name,
                ].filter(Boolean).join(" ").toLowerCase();
                if (!searchable.includes(q)) return false;
            }
            return true;
        });
    }, [optimisticItems, filters.dateRange, filters.facetValues, filters.searchQuery]);

    // ─── Inline update handler ───────────────────────────
    // UI-only keys used for optimistic display but not sent to DB
    const UI_ONLY_KEYS = new Set(['general_cost_name', 'category_name', 'currency_code', 'currency_symbol', 'creator_avatar_url', 'creator_full_name']);

    const handleInlineUpdate = (row: GeneralCostPaymentView, fields: Record<string, any>) => {
        optimisticUpdate(row.id, fields, async () => {
            const dbFields = Object.fromEntries(
                Object.entries(fields).filter(([key]) => !UI_ONLY_KEYS.has(key))
            );
            try {
                const result = await updateGeneralCostPaymentField(row.id, dbFields);
                if (!result.success) {
                    toast.error(result.error || "Error al actualizar");
                }
                router.refresh();
            } catch {
                toast.error("Error al actualizar el pago");
                router.refresh();
            }
        });
    };

    // ─── Columns ─────────────────────────────────────────
    const columns = getGeneralCostPaymentColumns({
        onInlineUpdate: handleInlineUpdate,
        wallets,
    });

    // ─── Panel handlers ──────────────────────────────────
    const handleOpenForm = () => {
        openPanel('general-cost-payment-form', {
            concepts,
            wallets,
            currencies,
            organizationId,
        });
    };

    const handleRowClick = (payment: GeneralCostPaymentView) => {
        openPanel('general-cost-payment-form', {
            initialData: payment,
            concepts,
            wallets,
            currencies,
            organizationId,
        });
    };

    const handleEdit = (payment: GeneralCostPaymentView) => {
        openPanel('general-cost-payment-form', {
            initialData: payment,
            concepts,
            wallets,
            currencies,
            organizationId,
        });
    };

    // ─── Import config ────────────────────────────────────
    const paymentImportConfig: ImportConfig<any> = {
        entityLabel: "Pagos de Gastos Generales",
        entityId: "general_cost_payments",
        columns: [
            { id: "payment_date", label: "Fecha", required: true, type: "date", example: "2024-01-20" },
            {
                id: "general_cost_name",
                label: "Concepto",
                required: false,
                example: "Alquiler Local",
                foreignKey: {
                    table: 'general_costs',
                    labelField: 'name',
                    valueField: 'id',
                    fetchOptions: async () => {
                        return (concepts || []).map((c) => ({
                            id: c.id,
                            label: c.name,
                        }));
                    },
                },
            },
            { id: "amount", label: "Monto", required: true, type: "number", example: "15000" },
            {
                id: "currency_code",
                label: "Moneda",
                required: false,
                example: "ARS",
                foreignKey: {
                    table: 'currencies',
                    labelField: 'code',
                    valueField: 'id',
                    fetchOptions: async () => {
                        return (currencies || []).map((c) => ({
                            id: c.id,
                            label: `${c.name} (${c.code})`,
                        }));
                    },
                },
            },
            {
                id: "wallet_name",
                label: "Billetera",
                required: false,
                example: "Caja Chica",
                foreignKey: {
                    table: 'organization_wallets',
                    labelField: 'name',
                    valueField: 'id',
                    fetchOptions: async () => {
                        return (wallets || []).map((w) => ({
                            id: w.id,
                            label: w.wallet_name,
                        }));
                    },
                },
            },
            { id: "exchange_rate", label: "Cotización", required: false, type: "number", example: "1200" },
            { id: "notes", label: "Notas", required: false },
            { id: "reference", label: "Referencia", required: false, example: "Factura #456" },
        ],
        onImport: async (data) => {
            const batch = await createImportBatch(organizationId, "general_cost_payments", data.length);
            const result = await importGeneralCostPaymentsBatch(organizationId, data, batch.id);
            return { success: result.success, errors: result.errors, warnings: result.warnings, batchId: batch.id };
        },
        onRevert: async (batchId) => {
            await revertImportBatch(batchId, 'general_costs_payments');
        },
    };

    const handleOpenImport = () => {
        openModal(
            <BulkImportModal config={paymentImportConfig} organizationId={organizationId} />,
            {
                size: "2xl",
                title: "Importar Pagos de Gastos Generales",
                description: "Importá pagos masivamente desde Excel o CSV.",
            }
        );
    };

    // ─── Export ───────────────────────────────────────────
    const handleExportCSV = () => {
        exportToCSV({
            data: filteredData,
            columns: GENERAL_COST_EXPORT_COLUMNS,
            fileName: `gastos-generales-pagos-${format(new Date(), 'yyyy-MM-dd')}`,
        });
        toast.success('Exportación CSV descargada');
    };

    const handleExportExcel = () => {
        exportToExcel({
            data: filteredData,
            columns: GENERAL_COST_EXPORT_COLUMNS,
            fileName: `gastos-generales-pagos-${format(new Date(), 'yyyy-MM-dd')}`,
            sheetName: 'Pagos Gastos Generales',
        });
        toast.success('Exportación Excel descargada');
    };

    // ─── Toolbar actions ─────────────────────────────────
    const toolbarActions = [
        { label: "Nuevo Pago", icon: Plus, onClick: handleOpenForm },
        ...getStandardToolbarActions({
            onImport: handleOpenImport,
            onExportCSV: handleExportCSV,
            onExportExcel: handleExportExcel,
        }),
    ];

    // ─── Empty state ─────────────────────────────────────
    if (optimisticItems.length === 0) {
        return (
            <>
                <Toolbar portalToHeader actions={toolbarActions} />
                <ViewEmptyState
                    mode="empty"
                    icon={Receipt}
                    viewName="Pagos de Gastos Generales"
                    featureDescription="Registrá pagos de gastos generales para llevar control de tus egresos operativos."
                    onAction={handleOpenForm}
                    actionLabel="Nuevo Pago"
                />
            </>
        );
    }

    // ─── No results ──────────────────────────────────────
    if (filteredData.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    leftActions={
                        <>
                            <FilterPopover filters={filters} />
                            <SearchButton filters={filters} placeholder="Buscar pagos..." />
                        </>
                    }
                    actions={toolbarActions}
                />
                <ViewEmptyState
                    mode="no-results"
                    icon={Receipt}
                    viewName="Pagos"
                    onResetFilters={filters.clearAll}
                />
            </>
        );
    }

    // ─── Embedded toolbar ────────────────────────────────
    const embeddedToolbar = (table: any) => (
        <Toolbar
            leftActions={
                <>
                    <FilterPopover filters={filters} />
                    <DisplayButton table={table} />
                    <SearchButton filters={filters} placeholder="Buscar pagos..." />
                </>
            }
            actions={toolbarActions}
        />
    );

    // ─── Render ──────────────────────────────────────────
    return (
        <>
            <DataTable
                columns={columns}
                data={filteredData}
                enableRowSelection
                enableRowActions
                onRowClick={handleRowClick}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                initialSorting={[{ id: "payment_date", desc: true }]}
                globalFilter={filters.searchQuery}
                onGlobalFilterChange={filters.setSearchQuery}
                onClearFilters={filters.clearAll}
                embeddedToolbar={embeddedToolbar}
            />
            <DeleteConfirmDialog />
        </>
    );
}
