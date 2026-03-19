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
import { Plus, CreditCard, TrendingDown, CalendarDays } from "lucide-react";
import { startOfMonth, endOfMonth, isAfter, isBefore, isEqual, startOfDay, format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { MetricCard } from "@/components/cards";

import { Toolbar } from "@/components/layout/dashboard/toolbar";
import { ToolbarFilter, ToolbarSearch } from "@/components/shared/toolbar-controls";
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

    // ─── KPI Calculations ────────────────────────────────
    const kpiData = useMemo(() => {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        const allItems: { amount: number; currency_code: string; exchange_rate?: number }[] = [];
        const monthItems: { amount: number; currency_code: string; exchange_rate?: number }[] = [];

        filteredPayments.forEach(p => {
            const amt = Math.abs(Number(p.amount) || 0);
            if (amt === 0) return;

            const item = {
                amount: amt,
                currency_code: (p.currency || 'ARS').toUpperCase(),
            };
            allItems.push(item);

            // Current month check
            const payDate = startOfDay(new Date(p.created_at));
            if ((isAfter(payDate, monthStart) || isEqual(payDate, monthStart)) &&
                (isBefore(payDate, monthEnd) || isEqual(payDate, monthEnd))) {
                monthItems.push(item);
            }
        });

        return { allItems, monthItems };
    }, [filteredPayments]);

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
                    leftActions={<><ToolbarFilter filters={filters} /><ToolbarSearch filters={filters} placeholder="Buscar pagos..." /></>}
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
            leftActions={<><ToolbarFilter filters={filters} /><ToolbarSearch filters={filters} placeholder="Buscar pagos..." /></>}
            actions={toolbarActions}
        />
    );

    return (
        <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 px-6 pt-4">
                <MetricCard
                    title="Total Histórico"
                    items={kpiData.allItems}
                    icon={<TrendingDown className="h-5 w-5" />}
                    iconClassName="bg-amount-positive/10 text-amount-positive"
                    size="default"
                    compact
                />
                <MetricCard
                    title={`Total ${format(new Date(), 'MMMM yyyy', { locale: es })}`}
                    items={kpiData.monthItems}
                    icon={<CalendarDays className="h-5 w-5" />}
                    iconClassName="bg-primary/10 text-primary"
                    size="default"
                    compact
                />
            </div>

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
