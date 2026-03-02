"use client";

/**
 * Admin Finance Coupons View
 * Standard 19.0 - Lean View Pattern
 *
 * Columnas extraídas a tables/admin-coupons-columns.tsx.
 * Patrón: useTableFilters + useTableActions + embeddedToolbar
 */

import { useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { Ticket, Plus } from "lucide-react";
import { toast } from "sonner";

import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FilterPopover, SearchButton } from "@/components/shared/toolbar-controls";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { DataTable } from "@/components/shared/data-table/data-table";
import { useModal } from "@/stores/modal-store";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useTableActions } from "@/hooks/use-table-actions";
import { useOptimisticList } from "@/hooks/use-optimistic-action";

import { deleteCoupon, type Coupon } from "@/features/admin/coupon-actions";
import { AdminCouponForm } from "@/features/admin/components/forms/admin-coupon-form";
import {
    getCouponColumns,
    COUPON_APPLIES_TO_OPTIONS,
    COUPON_STATUS_OPTIONS,
} from "../tables/admin-coupons-columns";

// ─── Types ───────────────────────────────────────────────

interface AdminFinanceCouponsViewProps {
    coupons: Coupon[];
}

// ─── Component ───────────────────────────────────────────

export function AdminFinanceCouponsView({ coupons }: AdminFinanceCouponsViewProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();

    const { optimisticItems, removeItem: optimisticRemove } = useOptimisticList({
        items: coupons,
        getItemId: (c) => c.id,
    });

    // ─── Filters ─────────────────────────────────────────
    const filters = useTableFilters({
        facets: [
            { key: "applies_to", title: "Aplica a", options: COUPON_APPLIES_TO_OPTIONS },
            { key: "is_active", title: "Estado", options: COUPON_STATUS_OPTIONS },
        ],
    });

    // ─── Filtered data ───────────────────────────────────
    const filteredCoupons = useMemo(() =>
        optimisticItems.filter(c => {
            const appliesToFilter = filters.facetValues.applies_to;
            if (appliesToFilter?.size > 0 && !appliesToFilter.has(c.applies_to)) return false;
            const statusFilter = filters.facetValues.is_active;
            if (statusFilter?.size > 0 && !statusFilter.has(String(c.is_active))) return false;
            return true;
        }),
        [optimisticItems, filters.facetValues]);

    // ─── Delete (useTableActions) ────────────────────────
    const { handleDelete, DeleteConfirmDialog } = useTableActions<Coupon>({
        onDelete: async (coupon) => {
            optimisticRemove(coupon.id, async () => {
                const result = await deleteCoupon(coupon.id);
                if (result.success) { toast.success("Cupón eliminado"); }
                else {
                    let errorMsg = result.error || "Error al eliminar";
                    if (errorMsg.includes("foreign key constraint")) {
                        errorMsg = "No se puede eliminar: El cupón ya fue usado.";
                    }
                    toast.error(errorMsg);
                    router.refresh();
                }
            });
            return { success: true };
        },
        entityName: "cupón",
    });

    // ─── Handlers ────────────────────────────────────────
    const handleCreate = () => {
        openModal(
            <AdminCouponForm onSuccess={() => { closeModal(); router.refresh(); }} onCancel={closeModal} />,
            { title: "Crear Cupón", description: "Ingresá los datos del nuevo cupón de descuento.", size: "lg" }
        );
    };

    const handleEdit = (coupon: Coupon) => {
        openModal(
            <AdminCouponForm initialData={coupon} onSuccess={() => { closeModal(); router.refresh(); }} onCancel={closeModal} />,
            { title: "Editar Cupón", description: `Modificá los datos del cupón ${coupon.code}.`, size: "lg" }
        );
    };

    // ─── Columns ─────────────────────────────────────────
    const columns = getCouponColumns();
    const toolbarActions = [{ label: "Nuevo Cupón", icon: Plus, onClick: handleCreate }];

    // ─── Empty state ─────────────────────────────────────
    if (optimisticItems.length === 0) {
        return (
            <>
                <Toolbar portalToHeader actions={toolbarActions} />
                <ViewEmptyState
                    mode="empty"
                    icon={Ticket}
                    viewName="Cupones de Descuento"
                    featureDescription="Creá tu primer cupón de descuento."
                    onAction={handleCreate}
                    actionLabel="Nuevo Cupón"
                />
            </>
        );
    }

    // ─── No-results state ────────────────────────────────
    if (filteredCoupons.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    leftActions={<><FilterPopover filters={filters} /><SearchButton filters={filters} placeholder="Buscar cupones..." /></>}
                    actions={toolbarActions}
                />
                <ViewEmptyState
                    mode="no-results"
                    icon={Ticket}
                    viewName="Cupones"
                    featureDescription="No se encontraron cupones con los filtros aplicados."
                    onAction={filters.clearAll}
                    actionLabel="Limpiar filtros"
                />
            </>
        );
    }

    // ─── Embedded toolbar ────────────────────────────────
    const embeddedToolbar = (
        <Toolbar
            leftActions={<><FilterPopover filters={filters} /><SearchButton filters={filters} placeholder="Buscar cupones..." /></>}
            actions={toolbarActions}
        />
    );

    // ─── Render ──────────────────────────────────────────
    return (
        <>
            <DataTable
                columns={columns}
                data={filteredCoupons}
                enableRowSelection={true}
                enableRowActions={true}
                onEdit={handleEdit}
                onDelete={handleDelete}
                initialSorting={[{ id: "code", desc: false }]}
                globalFilter={filters.searchQuery}
                onGlobalFilterChange={filters.setSearchQuery}
                onClearFilters={filters.clearAll}
                embeddedToolbar={embeddedToolbar}
            />
            <DeleteConfirmDialog />
        </>
    );
}
