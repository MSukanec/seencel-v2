"use client";

/**
 * Admin Finance Payments View
 * Standard 19.0 - Lean View Pattern
 *
 * Solo pagos de gateway (MercadoPago, Stripe, etc.)
 * Columnas en tables/admin-payments-columns.tsx
 */

import { useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { Plus, CreditCard } from "lucide-react";
import { toast } from "sonner";

import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FilterPopover, SearchButton } from "@/components/shared/toolbar-controls";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { useModal } from "@/stores/modal-store";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useTableActions } from "@/hooks/use-table-actions";
import { useOptimisticList } from "@/hooks/use-optimistic-action";

import { AdminPaymentForm } from "../forms/admin-payment-form";
import { deletePayment } from "../actions";
import { getPaymentColumns, PAYMENT_STATUS_OPTIONS } from "../tables/admin-payments-columns";
import type { AdminPayment } from "../queries";

// ─── Types ───────────────────────────────────────────────

interface AdminFinancePaymentsViewProps {
    payments: AdminPayment[];
}

// ─── Component ───────────────────────────────────────────

export function AdminFinancePaymentsView({ payments }: AdminFinancePaymentsViewProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();

    // ─── Optimistic updates ──────────────────────────────
    const { optimisticItems, removeItem: optimisticRemove } = useOptimisticList({
        items: payments,
        getItemId: (p) => p.id,
    });

    // ─── Filters ─────────────────────────────────────────
    const filters = useTableFilters({
        facets: [{ key: "status", title: "Estado", options: PAYMENT_STATUS_OPTIONS }],
    });

    const filteredPayments = useMemo(() =>
        optimisticItems.filter(p => {
            const statusFilter = filters.facetValues.status;
            if (statusFilter?.size > 0 && !statusFilter.has(p.status)) return false;
            return true;
        }),
        [optimisticItems, filters.facetValues]);

    // ─── Delete ──────────────────────────────────────────
    const { handleDelete, DeleteConfirmDialog } = useTableActions<AdminPayment>({
        onDelete: async (payment) => {
            optimisticRemove(payment.id, async () => {
                try { await deletePayment(payment.id); toast.success("Pago eliminado"); }
                catch { toast.error("Error al eliminar pago"); router.refresh(); }
            });
            return { success: true };
        },
        entityName: "pago",
    });

    // ─── Handlers ────────────────────────────────────────
    const handleCreate = () => {
        openModal(<AdminPaymentForm />, { title: "Nuevo Pago", description: "Registra un pago manualmente.", size: "md" });
    };

    const handleEdit = (payment: AdminPayment) => {
        openModal(
            <AdminPaymentForm initialData={payment} />,
            { title: "Editar Pago", description: `Modificando pago de ${payment.user?.full_name || payment.user?.email}`, size: "md" }
        );
    };

    // ─── Columns & toolbar ───────────────────────────────
    const columns = getPaymentColumns();
    const toolbarActions = [{ label: "Nuevo Pago", icon: Plus, onClick: handleCreate }];

    // ─── Empty state ─────────────────────────────────────
    if (optimisticItems.length === 0) {
        return (
            <>
                <Toolbar portalToHeader actions={toolbarActions} />
                <ViewEmptyState
                    mode="empty"
                    icon={CreditCard}
                    viewName="Pagos Registrados"
                    featureDescription="Los pagos aparecerán cuando los usuarios compren cursos."
                />
            </>
        );
    }

    if (filteredPayments.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    leftActions={<><FilterPopover filters={filters} /><SearchButton filters={filters} placeholder="Buscar pagos..." /></>}
                    actions={toolbarActions}
                />
                <ViewEmptyState
                    mode="no-results"
                    icon={CreditCard}
                    viewName="Pagos"
                    featureDescription="No se encontraron pagos con los filtros aplicados."
                    onAction={filters.clearAll}
                    actionLabel="Limpiar filtros"
                />
            </>
        );
    }

    // ─── Render ──────────────────────────────────────────
    const embeddedToolbar = (
        <Toolbar
            leftActions={<><FilterPopover filters={filters} /><SearchButton filters={filters} placeholder="Buscar pagos..." /></>}
            actions={toolbarActions}
        />
    );

    return (
        <>
            <DataTable
                columns={columns}
                data={filteredPayments}
                enableRowSelection={true}
                enableRowActions={true}
                onEdit={handleEdit}
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
