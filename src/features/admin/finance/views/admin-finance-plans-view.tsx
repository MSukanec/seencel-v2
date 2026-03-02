"use client";

/**
 * Admin Finance Plans View
 * Standard 19.0 - Lean View Pattern
 *
 * Muestra los planes de precios disponibles.
 * Columnas en tables/admin-plans-columns.tsx
 */

import { useMemo } from "react";
import { PieChart } from "lucide-react";

import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FilterPopover, SearchButton } from "@/components/shared/toolbar-controls";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { useTableFilters } from "@/hooks/use-table-filters";

import { getPlanColumns, PLAN_STATUS_OPTIONS } from "../tables/admin-plans-columns";
import type { AdminPlan } from "../queries";

// ─── Types ───────────────────────────────────────────────

interface AdminFinancePlansViewProps {
    plans: AdminPlan[];
}

// ─── Component ───────────────────────────────────────────

export function AdminFinancePlansView({ plans }: AdminFinancePlansViewProps) {

    // ─── Filters ─────────────────────────────────────────
    const filters = useTableFilters({
        facets: [
            { key: "is_active", title: "Estado", options: PLAN_STATUS_OPTIONS },
        ],
    });

    const filteredPlans = useMemo(() =>
        plans.filter(p => {
            const statusFilter = filters.facetValues.is_active;
            if (statusFilter?.size > 0 && !statusFilter.has(String(p.is_active))) return false;
            return true;
        }),
        [plans, filters.facetValues]);

    // ─── Columns ─────────────────────────────────────────
    const columns = getPlanColumns();

    // ─── Empty state ─────────────────────────────────────
    if (plans.length === 0) {
        return (
            <ViewEmptyState
                mode="empty"
                icon={PieChart}
                viewName="Planes de Precios"
                featureDescription="No hay planes configurados."
            />
        );
    }

    if (filteredPlans.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    leftActions={<><FilterPopover filters={filters} /><SearchButton filters={filters} placeholder="Buscar planes..." /></>}
                />
                <ViewEmptyState
                    mode="no-results"
                    icon={PieChart}
                    viewName="Planes"
                    featureDescription="No se encontraron planes con los filtros aplicados."
                    onAction={filters.clearAll}
                    actionLabel="Limpiar filtros"
                />
            </>
        );
    }

    // ─── Render ──────────────────────────────────────────
    const embeddedToolbar = (
        <Toolbar
            leftActions={<><FilterPopover filters={filters} /><SearchButton filters={filters} placeholder="Buscar planes..." /></>}
        />
    );

    return (
        <DataTable
            columns={columns}
            data={filteredPlans}
            enableRowSelection={false}
            enableRowActions={false}
            initialSorting={[{ id: "name", desc: false }]}
            globalFilter={filters.searchQuery}
            onGlobalFilterChange={filters.setSearchQuery}
            onClearFilters={filters.clearAll}
            embeddedToolbar={embeddedToolbar}
        />
    );
}
