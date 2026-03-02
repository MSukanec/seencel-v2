"use client";

/**
 * Admin Finance Transfers View
 * Standard 19.0 - Lean View Pattern
 *
 * Solo transferencias bancarias manuales.
 * Columnas en tables/admin-payments-columns.tsx
 */

import { useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { Landmark } from "lucide-react";
import { toast } from "sonner";

import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FilterPopover, SearchButton } from "@/components/shared/toolbar-controls";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { useModal } from "@/stores/modal-store";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useTableActions } from "@/hooks/use-table-actions";
import { useOptimisticList } from "@/hooks/use-optimistic-action";

import { BankTransferForm } from "../components/bank-transfer-form";
import { BankTransferDetailModal } from "../components/bank-transfer-detail-modal";
import { deleteBankTransfer } from "../actions";
import { getTransferColumns, TRANSFER_STATUS_OPTIONS } from "../tables/admin-payments-columns";
import type { AdminBankTransfer } from "../queries";

// ─── Types ───────────────────────────────────────────────

interface AdminFinanceTransfersViewProps {
    bankTransfers: AdminBankTransfer[];
}

// ─── Component ───────────────────────────────────────────

export function AdminFinanceTransfersView({ bankTransfers }: AdminFinanceTransfersViewProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();

    // ─── Optimistic updates ──────────────────────────────
    const { optimisticItems, removeItem: optimisticRemove } = useOptimisticList({
        items: bankTransfers,
        getItemId: (t) => t.id,
    });

    // ─── Filters ─────────────────────────────────────────
    const filters = useTableFilters({
        facets: [{ key: "status", title: "Estado", options: TRANSFER_STATUS_OPTIONS }],
    });

    const filteredTransfers = useMemo(() =>
        optimisticItems.filter(t => {
            const statusFilter = filters.facetValues.status;
            if (statusFilter?.size > 0 && !statusFilter.has(t.status)) return false;
            return true;
        }),
        [optimisticItems, filters.facetValues]);

    // ─── Delete ──────────────────────────────────────────
    const { handleDelete, DeleteConfirmDialog } = useTableActions<AdminBankTransfer>({
        onDelete: async (transfer) => {
            optimisticRemove(transfer.id, async () => {
                const result = await deleteBankTransfer(transfer.id);
                if (result.success) { toast.success("Transferencia eliminada"); }
                else { toast.error(result.error || "Error al eliminar"); router.refresh(); }
            });
            return { success: true };
        },
        entityName: "transferencia",
    });

    // ─── Handlers ────────────────────────────────────────
    const handleViewTransfer = (transfer: AdminBankTransfer) => {
        openModal(
            <BankTransferDetailModal transfer={transfer} onEdit={() => { closeModal(); handleEditTransfer(transfer); }} onClose={closeModal} />,
            { title: "Detalle de Transferencia", description: `Transferencia de ${transfer.user?.full_name || transfer.user?.email}`, size: "lg" }
        );
    };

    const handleEditTransfer = (transfer: AdminBankTransfer) => {
        openModal(
            <BankTransferForm transfer={transfer} onSuccess={() => { closeModal(); router.refresh(); }} onCancel={closeModal} />,
            { title: "Revisar Transferencia", description: `Transferencia de ${transfer.user?.full_name || transfer.user?.email}`, size: "lg" }
        );
    };

    // ─── Columns ─────────────────────────────────────────
    const columns = getTransferColumns();

    // ─── Empty state ─────────────────────────────────────
    if (optimisticItems.length === 0) {
        return (
            <ViewEmptyState
                mode="empty"
                icon={Landmark}
                viewName="Transferencias Bancarias"
                featureDescription="Las transferencias bancarias aparecerán aquí."
            />
        );
    }

    if (filteredTransfers.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    leftActions={<><FilterPopover filters={filters} /><SearchButton filters={filters} placeholder="Buscar transferencias..." /></>}
                />
                <ViewEmptyState
                    mode="no-results"
                    icon={Landmark}
                    viewName="Transferencias"
                    featureDescription="No se encontraron transferencias con los filtros aplicados."
                    onAction={filters.clearAll}
                    actionLabel="Limpiar filtros"
                />
            </>
        );
    }

    // ─── Render ──────────────────────────────────────────
    const embeddedToolbar = (
        <Toolbar
            leftActions={<><FilterPopover filters={filters} /><SearchButton filters={filters} placeholder="Buscar transferencias..." /></>}
        />
    );

    return (
        <>
            <DataTable
                columns={columns}
                data={filteredTransfers}
                enableRowSelection={true}
                enableRowActions={true}
                onRowClick={handleViewTransfer}
                onEdit={handleEditTransfer}
                onDelete={handleDelete}
                initialSorting={[{ id: "created_at", desc: true }]}
                globalFilter={filters.searchQuery}
                onGlobalFilterChange={filters.setSearchQuery}
                onClearFilters={filters.clearAll}
                embeddedToolbar={embeddedToolbar}
            />
            <DeleteConfirmDialog />
        </>
    );
}
