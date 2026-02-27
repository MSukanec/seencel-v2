"use client";

/**
 * Finance Movements View
 * 
 * Vista operativa: tabla pura de movimientos financieros.
 * Orquesta hooks + columnas + UI. No contiene lógica de negocio.
 */

import { useMemo } from "react";
import { Plus, Banknote } from "lucide-react";
import { format } from "date-fns";
import { isAfter, isBefore, isEqual, startOfDay, endOfDay } from "date-fns";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { useModal } from "@/stores/modal-store";
import { useTableActions } from "@/hooks/use-table-actions";
import { useTableFilters } from "@/hooks/use-table-filters";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { DateRangeFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { getStandardToolbarActions } from "@/lib/toolbar-actions";
import { exportToCSV, exportToExcel, type ExportColumn } from "@/lib/export";
import { FinanceMovementForm } from "../forms/finance-movement-form";
import { PaymentForm as GeneralCostsPaymentForm } from "@/features/general-costs/forms/general-costs-payment-form";
import { MovementDetailModal } from "../components/movement-detail-modal";
import { deleteFinanceMovement } from "../actions";
import { getMovementColumns, MOVEMENT_TYPE_LABELS, MOVEMENT_TYPE_OPTIONS, MOVEMENT_STATUS_OPTIONS } from "../tables/movements-columns";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";

// ─── Types ───────────────────────────────────────────────

interface FinancesMovementsViewProps {
    movements: any[];
    wallets?: any[];
    projects?: { id: string; name: string }[];
    showProjectColumn?: boolean;
    organizationId?: string;
    currencies?: { id: string; name: string; code: string; symbol: string }[];
    generalCostConcepts?: any[];
    clients?: any[];
    financialData?: any;
}

// ─── Export columns definition ───────────────────────────

const EXPORT_COLUMNS: ExportColumn<any>[] = [
    { key: 'payment_date', header: 'Fecha', transform: (val) => val ? format(new Date(val), 'dd/MM/yyyy') : '' },
    { key: 'movement_type', header: 'Tipo', transform: (val) => MOVEMENT_TYPE_LABELS[val] || val || '' },
    { key: 'concept_name', header: 'Concepto', transform: (val) => val ?? '' },
    { key: 'description', header: 'Descripción', transform: (val) => val ?? '' },
    { key: 'amount', header: 'Monto', transform: (val) => Number(val) || 0 },
    { key: 'currency_code', header: 'Moneda', transform: (val) => val ?? '' },
    {
        key: 'status', header: 'Estado', transform: (val) => {
            const map: Record<string, string> = {
                confirmed: 'Confirmado', completed: 'Confirmado', paid: 'Confirmado',
                pending: 'Pendiente', rejected: 'Rechazado', cancelled: 'Rechazado', void: 'Anulado',
            };
            return map[val] ?? val ?? '';
        }
    },
    { key: 'reference', header: 'Referencia', transform: (val) => val ?? '' },
];

// ─── Component ───────────────────────────────────────────

export function FinancesMovementsView({
    movements,
    wallets = [],
    projects = [],
    showProjectColumn = false,
    organizationId,
    currencies = [],
    generalCostConcepts = [],
    clients = [],
    financialData
}: FinancesMovementsViewProps) {
    const router = useRouter();
    // TODO(legacy): Migrar FinanceMovementForm y MovementDetailModal a openPanel
    const { openModal, closeModal } = useModal();

    // ─── Filter config (shared between hook and render) ──
    const walletOptions = wallets.map(w => ({
        label: w.wallet_name || w.name || "Billetera",
        value: w.id,
    }));

    const facetConfigs = [
        { key: "type", title: "Tipo", options: MOVEMENT_TYPE_OPTIONS },
        { key: "status", title: "Estado", options: MOVEMENT_STATUS_OPTIONS },
        ...(walletOptions.length > 0
            ? [{ key: "wallet", title: "Billetera", options: walletOptions }]
            : []),
    ];

    // ─── Hooks globales ──────────────────────────────────
    const filters = useTableFilters({ facets: facetConfigs });

    const { handleDelete, handleBulkDelete, DeleteConfirmDialog } = useTableActions<any>({
        onDelete: (item) => deleteFinanceMovement(item.id, item.movement_type),
        entityName: "movimiento",
        entityNamePlural: "movimientos",
    });

    // ─── Filtered data ───────────────────────────────────
    const filteredMovements = useMemo(() => {
        return movements.filter(m => {
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
            // Faceted filters
            const typeFilter = filters.facetValues.type;
            if (typeFilter?.size > 0 && !typeFilter.has(m.movement_type)) return false;
            const statusFilter = filters.facetValues.status;
            if (statusFilter?.size > 0 && !statusFilter.has(m.status)) return false;
            const walletFilter = filters.facetValues.wallet;
            if (walletFilter?.size > 0 && !walletFilter.has(m.wallet_id)) return false;
            return true;
        });
    }, [movements, filters.dateRange, filters.facetValues]);

    // ─── Lookups ─────────────────────────────────────────
    const getWalletName = (walletId: string) =>
        wallets.find(w => w.id === walletId)?.wallet_name || "-";

    const getProjectName = (projectId: string) =>
        projects.find(p => p.id === projectId)?.name || "-";

    // ─── Export handlers ─────────────────────────────────
    const handleExportCSV = () => {
        exportToCSV({
            data: filteredMovements,
            columns: EXPORT_COLUMNS,
            fileName: `movimientos-${format(new Date(), 'yyyy-MM-dd')}`,
        });
        toast.success('Exportación CSV descargada');
    };

    const handleExportExcel = () => {
        exportToExcel({
            data: filteredMovements,
            columns: EXPORT_COLUMNS,
            fileName: `movimientos-${format(new Date(), 'yyyy-MM-dd')}`,
            sheetName: 'Movimientos',
        });
        toast.success('Exportación Excel descargada');
    };

    // ─── Handlers ────────────────────────────────────────
    // TODO(legacy): Migrar a openPanel cuando FinanceMovementForm soporte panels
    const openNewMovementModal = () => {
        if (!organizationId) return;
        openModal(
            <FinanceMovementForm
                organizationId={organizationId}
                concepts={generalCostConcepts}
                wallets={wallets}
                currencies={currencies}
                projects={projects}
                clients={clients}
                financialData={financialData}
            />,
            {
                title: "Nuevo Movimiento",
                description: "Seleccioná el tipo de movimiento y completá los datos.",
                size: "lg"
            }
        );
    };

    const handleRowClick = (movement: any) => {
        openModal(
            <MovementDetailModal
                movement={movement}
                walletName={getWalletName(movement.wallet_id)}
                projectName={getProjectName(movement.project_id)}
                onEdit={() => { closeModal(); handleEdit(movement); }}
                onClose={closeModal}
            />,
            { title: "Detalle del Movimiento", description: "Información completa del movimiento financiero.", size: "md" }
        );
    };

    const handleEdit = (movement: any) => {
        switch (movement.movement_type) {
            case 'general_cost':
                openModal(
                    <GeneralCostsPaymentForm
                        initialData={movement}
                        concepts={generalCostConcepts}
                        wallets={wallets}
                        currencies={currencies}
                        organizationId={organizationId || ''}
                        onSuccess={() => { closeModal(); router.refresh(); }}
                        onCancel={closeModal}
                    />,
                    { title: "Editar Pago de Gasto General", description: "Modificá los datos del pago.", size: "md" }
                );
                break;
            case 'client_payment':
                toast.info("Para editar cobros de clientes, andá a la sección de Clientes"); break;
            case 'material_payment':
                toast.info("Para editar pagos de materiales, andá a la sección de Materiales"); break;
            case 'labor_payment':
                toast.info("Para editar pagos de mano de obra, andá a la sección de Mano de Obra"); break;
            case 'subcontract_payment':
                toast.info("Para editar pagos de subcontratos, andá a la sección de Subcontratos"); break;
            case 'partner_contribution':
            case 'partner_withdrawal':
                toast.info("Para editar movimientos de socios, andá a la sección de Capital"); break;
            default:
                toast.info("Edición no disponible para este tipo de movimiento");
        }
    };

    // ─── Columns ─────────────────────────────────────────
    const columns = getMovementColumns({
        getWalletName,
        getProjectName,
        showProjectColumn,
    });

    // ─── Toolbar actions (primary + split button) ────────
    const toolbarActions = organizationId ? [
        { label: "Nuevo Movimiento", onClick: openNewMovementModal, icon: Plus },
        ...getStandardToolbarActions({
            onExportCSV: handleExportCSV,
            onExportExcel: handleExportExcel,
        }),
    ] : undefined;

    // ─── Stats badge ─────────────────────────────────────
    const statsBadge = (
        <Badge variant="secondary" className="text-xs font-normal">
            {filters.hasActiveFilters
                ? `${filteredMovements.length} de ${movements.length}`
                : `${movements.length} movimientos`
            }
        </Badge>
    );

    // ─── Empty State (no data at all) ────────────────────
    if (movements.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    actions={toolbarActions}
                />
                <ViewEmptyState
                    mode="empty"
                    icon={Banknote}
                    viewName="Movimientos Financieros"
                    featureDescription="No hay movimientos registrados. Creá tu primer movimiento para comenzar."
                    onAction={organizationId ? openNewMovementModal : undefined}
                    actionLabel="Nuevo Movimiento"
                />
            </>
        );
    }

    // ─── No-results State (filters returned nothing) ─────
    if (filteredMovements.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    searchQuery={filters.searchQuery}
                    onSearchChange={filters.setSearchQuery}
                    searchPlaceholder="Buscar movimientos..."
                    leftActions={statsBadge}
                    filterContent={
                        <div className="flex items-center gap-2">
                            <DateRangeFilter
                                value={filters.dateRange}
                                onChange={filters.setDateRange}
                            />
                            {facetConfigs.map(facet => (
                                <FacetedFilter
                                    key={facet.key}
                                    title={facet.title}
                                    options={facet.options}
                                    selectedValues={filters.facetValues[facet.key] || new Set()}
                                    onSelect={(val) => filters.toggleFacet(facet.key, val)}
                                    onClear={() => filters.clearFacet(facet.key)}
                                />
                            ))}
                        </div>
                    }
                    actions={toolbarActions}
                />
                <ViewEmptyState
                    mode="no-results"
                    icon={Banknote}
                    viewName="Movimientos Financieros"
                    featureDescription="No se encontraron movimientos con los filtros aplicados."
                    onAction={filters.clearAll}
                    actionLabel="Limpiar filtros"
                />
            </>
        );
    }

    // ─── Render ──────────────────────────────────────────
    return (
        <div className="space-y-4">
            <Toolbar
                portalToHeader
                searchQuery={filters.searchQuery}
                onSearchChange={filters.setSearchQuery}
                searchPlaceholder="Buscar movimientos..."
                leftActions={statsBadge}
                filterContent={
                    <div className="flex items-center gap-2">
                        <DateRangeFilter
                            value={filters.dateRange}
                            onChange={filters.setDateRange}
                        />
                        {facetConfigs.map(facet => (
                            <FacetedFilter
                                key={facet.key}
                                title={facet.title}
                                options={facet.options}
                                selectedValues={filters.facetValues[facet.key] || new Set()}
                                onSelect={(val) => filters.toggleFacet(facet.key, val)}
                                onClear={() => filters.clearFacet(facet.key)}
                            />
                        ))}
                    </div>
                }
                actions={toolbarActions}
            />

            <DataTable
                columns={columns}
                data={filteredMovements}
                enableRowSelection={true}
                enableRowActions={true}
                onRowClick={handleRowClick}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                initialSorting={[{ id: "payment_date", desc: true }]}
                globalFilter={filters.searchQuery}
                onGlobalFilterChange={filters.setSearchQuery}
                onClearFilters={filters.clearAll}
            />

            <DeleteConfirmDialog />
        </div>
    );
}
