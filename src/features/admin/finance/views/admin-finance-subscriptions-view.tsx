"use client";

/**
 * Admin Finance Subscriptions View
 * Standard 19.0 - Lean View Pattern
 *
 * Muestra suscripciones activas de organizaciones.
 * Columnas en tables/admin-subscriptions-columns.tsx
 */

import { useMemo } from "react";
import { Wallet } from "lucide-react";

import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FilterPopover, SearchButton } from "@/components/shared/toolbar-controls";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { useTableFilters } from "@/hooks/use-table-filters";

import {
    getSubscriptionColumns,
    SUBSCRIPTION_STATUS_OPTIONS,
    BILLING_PERIOD_OPTIONS,
} from "../tables/admin-subscriptions-columns";
import type { AdminSubscription } from "../queries";

// ─── Types ───────────────────────────────────────────────

interface AdminFinanceSubscriptionsViewProps {
    subscriptions: AdminSubscription[];
}

// ─── Component ───────────────────────────────────────────

export function AdminFinanceSubscriptionsView({ subscriptions }: AdminFinanceSubscriptionsViewProps) {

    // ─── Filters ─────────────────────────────────────────
    const filters = useTableFilters({
        facets: [
            { key: "status", title: "Estado", options: SUBSCRIPTION_STATUS_OPTIONS },
            { key: "billing_period", title: "Período", options: BILLING_PERIOD_OPTIONS },
        ],
    });

    const filteredSubs = useMemo(() =>
        subscriptions.filter(s => {
            const statusFilter = filters.facetValues.status;
            if (statusFilter?.size > 0 && !statusFilter.has(s.status)) return false;
            const periodFilter = filters.facetValues.billing_period;
            if (periodFilter?.size > 0 && !periodFilter.has(s.billing_period)) return false;
            return true;
        }),
        [subscriptions, filters.facetValues]);

    // ─── Columns ─────────────────────────────────────────
    const columns = getSubscriptionColumns();

    // ─── Empty state ─────────────────────────────────────
    if (subscriptions.length === 0) {
        return (
            <ViewEmptyState
                mode="empty"
                icon={Wallet}
                viewName="Suscripciones"
                featureDescription="No hay suscripciones registradas todavía."
            />
        );
    }

    if (filteredSubs.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    leftActions={<><FilterPopover filters={filters} /><SearchButton filters={filters} placeholder="Buscar suscripciones..." /></>}
                />
                <ViewEmptyState
                    mode="no-results"
                    icon={Wallet}
                    viewName="Suscripciones"
                    featureDescription="No se encontraron suscripciones con los filtros aplicados."
                    onAction={filters.clearAll}
                    actionLabel="Limpiar filtros"
                />
            </>
        );
    }

    // ─── Render ──────────────────────────────────────────
    const embeddedToolbar = (
        <Toolbar
            leftActions={<><FilterPopover filters={filters} /><SearchButton filters={filters} placeholder="Buscar suscripciones..." /></>}
        />
    );

    return (
        <DataTable
            columns={columns}
            data={filteredSubs}
            enableRowSelection={false}
            enableRowActions={false}
            initialSorting={[{ id: "created_at", desc: true }]}
            globalFilter={filters.searchQuery}
            onGlobalFilterChange={filters.setSearchQuery}
            onClearFilters={filters.clearAll}
            embeddedToolbar={embeddedToolbar}
        />
    );
}
