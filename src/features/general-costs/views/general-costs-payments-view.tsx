"use client";

/**
 * General Costs — Payments View
 * Standard 19.0 - Lean View Pattern (~200 lines)
 *
 * Vista operativa: tabla pura de pagos de gastos generales.
 * Orquesta hooks + columnas + UI. No contiene lógica de negocio.
 */

import { useMemo, useRef, useEffect, useCallback } from "react";
import { Plus, Receipt, CircleDot, Wallet, Coins, FileText, FolderOpen, MoreHorizontal, Upload, Download } from "lucide-react";
import { format, isAfter, isBefore, isEqual, startOfDay, endOfDay } from "date-fns";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { usePanel } from "@/stores/panel-store";
import { useModal } from "@/stores/modal-store";
import { useTableActions } from "@/hooks/use-table-actions";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { PageHeaderActionPortal } from "@/components/layout";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterPopover, SearchButton, ToolbarCard } from "@/components/shared/toolbar-controls";
import { exportToCSV, exportToExcel } from "@/lib/export";
import { createImportBatch, revertImportBatch, importGeneralCostPaymentsBatch, type ImportConfig } from "@/lib/import";
import { BulkImportModal } from "@/components/shared/import/import-modal";
import { deleteGeneralCostPayment, updateGeneralCostPaymentField, duplicateGeneralCostPayment, getPaymentAttachments, linkPaymentAttachment } from "../actions";
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
    initialSearchQuery?: string;
}

// ─── Component ───────────────────────────────────────────

export function GeneralCostsPaymentsView({
    data,
    concepts,
    wallets,
    currencies,
    organizationId,
    initialSearchQuery = "",
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

    // ─── Facet options (built from props) ─────────────────
    const walletOptions = useMemo(
        () => wallets.map(w => ({ label: w.wallet_name, value: w.id })),
        [wallets]
    );
    const currencyOptions = useMemo(
        () => currencies.map(c => ({ label: `${c.code} (${c.symbol})`, value: c.id })),
        [currencies]
    );
    const conceptOptions = useMemo(
        () => concepts.map(c => ({ label: c.name, value: c.id })),
        [concepts]
    );
    const categoryOptions = useMemo(() => {
        const seen = new Map<string, string>();
        for (const c of concepts) {
            if (c.category_id && c.category?.name && !seen.has(c.category_id)) {
                seen.set(c.category_id, c.category.name);
            }
        }
        return Array.from(seen.entries()).map(([id, name]) => ({ label: name, value: id }));
    }, [concepts]);

    // ─── Filters ─────────────────────────────────────────
    const filters = useTableFilters({
        facets: [
            { key: "status", title: "Estado", icon: CircleDot, options: GENERAL_COST_STATUS_OPTIONS },
            { key: "concept", title: "Concepto", icon: FileText, options: conceptOptions },
            { key: "category", title: "Categoría", icon: FolderOpen, options: categoryOptions },
            { key: "wallet", title: "Billetera", icon: Wallet, options: walletOptions },
            { key: "currency", title: "Moneda", icon: Coins, options: currencyOptions },
        ],
        enableDateRange: true,
    });

    // Pre-set search from URL param (e.g. coming from Concepts tab)
    const initializedRef = useRef(false);
    useEffect(() => {
        if (initialSearchQuery && !initializedRef.current) {
            initializedRef.current = true;
            filters.setSearchQuery(initialSearchQuery);
        }
    }, [initialSearchQuery]);

    // ─── Delete actions ──────────────────────────────────
    const { handleDelete, handleBulkDelete, DeleteConfirmDialog } = useTableActions<any>({
        onDelete: async (item) => {
            optimisticRemove(item.id, async () => {
                try {
                    await deleteGeneralCostPayment(item.id);
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
            // Concept facet
            const conceptFilter = filters.facetValues.concept;
            if (conceptFilter?.size > 0 && (!m.general_cost_id || !conceptFilter.has(m.general_cost_id))) return false;
            // Category facet
            const categoryFilter = filters.facetValues.category;
            if (categoryFilter?.size > 0 && (!m.category_id || !categoryFilter.has(m.category_id))) return false;
            // Wallet facet
            const walletFilter = filters.facetValues.wallet;
            if (walletFilter?.size > 0 && !walletFilter.has(m.wallet_id)) return false;
            // Currency facet
            const currencyFilter = filters.facetValues.currency;
            if (currencyFilter?.size > 0 && !currencyFilter.has(m.currency_id)) return false;
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
    const UI_ONLY_KEYS = useMemo(() => new Set(['general_cost_name', 'category_name', 'currency_code', 'currency_symbol', 'creator_avatar_url', 'creator_full_name']), []);

    const handleInlineUpdate = useCallback((row: GeneralCostPaymentView, fields: Record<string, any>) => {
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
    }, [optimisticUpdate, router, UI_ONLY_KEYS]);

    // ─── Attachment handlers ─────────────────────────────
    const fetchAttachments = useCallback(async (row: GeneralCostPaymentView) => {
        return await getPaymentAttachments(row.id);
    }, []);

    const handleAttachmentsChange = useCallback(async (row: GeneralCostPaymentView, files: any[]) => {
        // Link any new files (those without a DB id yet)
        for (const file of files) {
            if (file.id?.startsWith('upload-')) {
                await linkPaymentAttachment(row.id, organizationId, {
                    path: file.path,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    bucket: file.bucket,
                });
            }
        }
    }, [organizationId]);

    // ─── Columns (memoized to prevent TanStack Table recalculation) ──
    const columns = useMemo(
        () => getGeneralCostPaymentColumns({
            onInlineUpdate: handleInlineUpdate,
            wallets,
            concepts,
            currencies,
            fetchAttachments,
            onAttachmentsChange: handleAttachmentsChange,
            organizationId,
        }),
        [handleInlineUpdate, wallets, concepts, currencies, fetchAttachments, handleAttachmentsChange, organizationId]
    );

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

    const handleDuplicate = async (payment: GeneralCostPaymentView) => {
        const result = await duplicateGeneralCostPayment(payment.id);
        if (result.success) {
            toast.success("Pago duplicado correctamente");
            router.refresh();
        } else {
            toast.error(result.error || "Error al duplicar el pago");
        }
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


    // ─── Determine content state ─────────────────────────
    const isEmpty = optimisticItems.length === 0;
    const hasData = optimisticItems.length > 0;
    const noResults = hasData && filteredData.length === 0;

    // ─── Render ──────────────────────────────────────────
    return (
        <>
            {/* Primary Action + Secondary actions → Header */}
            <PageHeaderActionPortal>
                <div className="flex items-center">
                    <button
                        onClick={handleOpenForm}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-l-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Nuevo Pago</span>
                    </button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="flex items-center justify-center h-8 w-8 rounded-r-lg border-l border-primary-foreground/20 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={handleOpenImport}>
                                <Upload className="h-4 w-4 mr-2" />
                                Importar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleExportCSV}>
                                <Download className="h-4 w-4 mr-2" />
                                Exportar CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportExcel}>
                                <Download className="h-4 w-4 mr-2" />
                                Exportar Excel
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </PageHeaderActionPortal>

            {/* Empty state — full height, outside toolbar wrapper */}
            {isEmpty ? (
                <ViewEmptyState
                    mode="empty"
                    icon={Receipt}
                    viewName="Pagos de Gastos Generales"
                    featureDescription="Registrá pagos de gastos generales para llevar control de tus egresos operativos."
                    onAction={handleOpenForm}
                    actionLabel="Nuevo Pago"
                    docsPath="/docs/gastos-generales"
                />
            ) : (
                /* Inline toolbar + content in a unified column */
                <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
                    {/* Toolbar card — inline, content-agnostic */}
                    <ToolbarCard
                        right={
                            <>
                                <SearchButton filters={filters} placeholder="Buscar pagos..." />
                                <FilterPopover filters={filters} />
                            </>
                        }
                    />

                    {/* Content */}
                    {noResults ? (
                        <ViewEmptyState
                            mode="no-results"
                            icon={Receipt}
                            viewName="Pagos"
                            onResetFilters={filters.clearAll}
                        />
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            enableRowSelection
                            enableContextMenu
                            onRowClick={handleRowClick}
                            onEdit={handleEdit}
                            onDuplicate={handleDuplicate}
                            onDelete={handleDelete}
                            onBulkDelete={handleBulkDelete}
                            initialSorting={[{ id: "payment_date", desc: true }]}
                            globalFilter={filters.searchQuery}
                            onGlobalFilterChange={filters.setSearchQuery}
                            onClearFilters={filters.clearAll}
                        />
                    )}
                </div>
            )}

            <DeleteConfirmDialog />
        </>
    );
}
