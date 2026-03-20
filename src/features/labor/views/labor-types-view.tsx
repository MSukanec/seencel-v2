"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { HardHat, DollarSign, LayoutGrid, Table2 } from "lucide-react";
import { usePanel } from "@/stores/panel-store";
import { useTableFilters } from "@/hooks/use-table-filters";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ToolbarCard } from "@/components/shared/toolbar-controls";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { LaborListItem } from "@/components/shared/list-item";
import { ContextSidebar } from "@/stores/sidebar-store";
import { CategoriesSidebar } from "../components/categories-sidebar";
import type { LaborTypeWithPrice } from "../types";
import type { EntityCustomAction } from "@/components/shared/entity-context-menu";
import { createTextColumn, createUnitColumn, createEntityColumn, createPriceColumn } from "@/components/shared/data-table/columns";
import type { ColumnDef } from "@tanstack/react-table";
import { upsertLaborPrice } from "../actions";
import { toast } from "sonner";

// ============================================================================
// View Mode
// ============================================================================

type ViewMode = "table" | "cards";

const VIEW_OPTIONS = [
    { value: "table", icon: Table2, label: "Tabla" },
    { value: "cards", icon: LayoutGrid, label: "Tarjetas" },
];

// ============================================================================
// Types
// ============================================================================

interface Currency {
    id: string;
    code: string;
    symbol: string;
    name: string;
}

export interface LaborTypesViewProps {
    laborTypes: LaborTypeWithPrice[];
    currencies: Currency[];
    orgId: string;
    defaultCurrencyId: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function LaborTypesView({
    laborTypes,
    currencies,
    orgId,
    defaultCurrencyId,
}: LaborTypesViewProps) {
    const router = useRouter();
    const { openPanel } = usePanel();

    // ── View mode ─────────────────────────────────────────────
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    // ── Sidebar category selection ────────────────────────────
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // ── Price update handler ──────────────────────────────────
    const handlePriceUpdate = useCallback(async (row: LaborTypeWithPrice, newPrice: number) => {
        const currencyId = row.currency_id || defaultCurrencyId;
        const result = await upsertLaborPrice({
            organization_id: orgId,
            labor_type_id: row.id,
            unit_price: newPrice,
            currency_id: currencyId,
        });
        if (!result.success) {
            toast.error(result.error || "Error al guardar precio");
            return;
        }
        toast.success(`Precio de "${row.name}" actualizado`);
        router.refresh();
    }, [orgId, defaultCurrencyId, router]);

    // ── Columns (dynamic to pass onUpdate) ────────────────────
    const columns: ColumnDef<LaborTypeWithPrice, any>[] = useMemo(() => [
        createTextColumn<LaborTypeWithPrice>({
            accessorKey: "name",
            title: "Nombre",
            enableSorting: true,
        }),
        createTextColumn<LaborTypeWithPrice>({
            accessorKey: "category_name",
            title: "Oficio",
            enableSorting: true,
        }),
        createEntityColumn<LaborTypeWithPrice>({
            accessorKey: "level_name",
            title: "Nivel",
            emptyValue: "Sin nivel",
            size: 140,
        }),
        createEntityColumn<LaborTypeWithPrice>({
            accessorKey: "role_name",
            title: "Rol",
            emptyValue: "Sin rol",
            size: 140,
        }),
        createUnitColumn<LaborTypeWithPrice>({
            accessorKey: "unit_name",
            title: "Unidad",
            size: 140,
        }),
        createPriceColumn<LaborTypeWithPrice>({
            accessorKey: "current_price",
            title: "Precio",
            currencyKey: "currency_symbol",
            validFromKey: "price_valid_from",
            unitSymbolKey: "unit_symbol",
            nameKey: "name",
            editable: true,
            onUpdate: handlePriceUpdate,
            size: 150,
        }),
    ], [handlePriceUpdate]);

    // ── Sidebar categories + counts ───────────────────────────
    const sidebarCategories = useMemo(() => {
        const categoryMap = new Map<string, string>();
        laborTypes.forEach(lt => {
            if (lt.category_name) {
                categoryMap.set(lt.labor_category_id, lt.category_name);
            }
        });
        return Array.from(categoryMap.entries()).map(([id, name]) => ({ id, name }));
    }, [laborTypes]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        laborTypes.forEach(lt => {
            const key = lt.labor_category_id || "sin-oficio";
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    }, [laborTypes]);

    // ── Toolbar filters ───────────────────────────────────────
    const categoryOptions = useMemo(() => {
        return sidebarCategories
            .sort((a, b) => a.name.localeCompare(b.name, "es"))
            .map(c => ({ value: c.id, label: c.name }));
    }, [sidebarCategories]);

    const filters = useTableFilters({
        facets: [
            {
                key: "category",
                title: "Oficio",
                icon: HardHat,
                options: categoryOptions,
            },
        ],
    });

    // ── Filter + sort data ────────────────────────────────────
    const filteredTypes = useMemo(() => {
        let result = [...laborTypes];

        // Sidebar category filter
        if (selectedCategoryId) {
            result = result.filter(lt => lt.labor_category_id === selectedCategoryId);
        }

        // Toolbar facet filter
        const categoryFilter = filters.facetValues["category"];
        if (categoryFilter && categoryFilter.size > 0) {
            result = result.filter(lt => lt.labor_category_id && categoryFilter.has(lt.labor_category_id));
        }

        // Sort alphabetically by name
        result.sort((a, b) => (a.name || "").localeCompare(b.name || "", "es"));

        return result;
    }, [laborTypes, selectedCategoryId, filters.facetValues]);

    // ── Handlers ──────────────────────────────────────────────
    const handleEditPrice = useCallback((laborType: LaborTypeWithPrice) => {
        openPanel('labor-price-form', {
            laborType,
            organizationId: orgId,
            currencies,
            defaultCurrencyId: laborType.currency_id || defaultCurrencyId,
        });
    }, [openPanel, orgId, currencies, defaultCurrencyId]);

    // ── Custom actions for context menu ───────────────────────
    const customActions: EntityCustomAction<LaborTypeWithPrice>[] = useMemo(() => [
        {
            label: "Establecer precio",
            icon: <DollarSign className="h-3.5 w-3.5" />,
            onClick: (data) => handleEditPrice(data),
        },
    ], [handleEditPrice]);

    // ═══════════════════════════════════════════════════════════
    // Empty State
    // ═══════════════════════════════════════════════════════════
    if (laborTypes.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <ViewEmptyState
                    mode="empty"
                    icon={HardHat}
                    viewName="Tipos de Mano de Obra"
                    featureDescription="Los tipos de mano de obra representan las distintas especialidades y roles laborales que intervienen en tus proyectos de construcción. Desde aquí podés establecer los precios por unidad para cada tipo, que luego se usan en las recetas de las tareas."
                />
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════
    // Main Render (identical structure to tasks-catalog-view)
    // ═══════════════════════════════════════════════════════════
    const hasActiveFilters = filters.hasActiveFilters || selectedCategoryId !== null;

    return (
        <>
            {/* Context Sidebar — Oficios */}
            <ContextSidebar title="Oficios">
                <CategoriesSidebar
                    categories={sidebarCategories}
                    categoryCounts={categoryCounts}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={setSelectedCategoryId}
                    totalItems={laborTypes.length}
                />
            </ContextSidebar>

            <div className="h-full flex flex-col">
                <div className="mb-4">
                    <ToolbarCard
                        filters={filters}
                        searchPlaceholder="Buscar por nombre, oficio, nivel o rol..."
                        display={{
                            viewMode,
                            onViewModeChange: (v) => setViewMode(v as ViewMode),
                            viewModeOptions: VIEW_OPTIONS,
                        }}
                    />
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    {/* No-results */}
                    {hasActiveFilters && filteredTypes.length === 0 ? (
                        <ViewEmptyState
                            mode="no-results"
                            icon={HardHat}
                            viewName="tipos de mano de obra"
                            filterContext="con esos filtros"
                            onResetFilters={() => {
                                filters.clearAll();
                                setSelectedCategoryId(null);
                            }}
                            totalCount={laborTypes.length}
                        />
                    ) : (
                        /* ── TABLE / CARDS VIEW ───────────────── */
                        <DataTable
                            viewMode={viewMode === "cards" ? "grid" : "table"}
                            gridClassName="flex flex-col gap-2 pb-8"
                            columns={columns}
                            data={filteredTypes}
                            enableContextMenu
                            onEdit={handleEditPrice}
                            customActions={customActions}
                            groupBy="category_name"
                            getGroupValue={(row) => row.category_name || "Sin Oficio"}
                            renderGroupHeader={(groupValue, groupRows) => (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-muted-foreground tracking-wider">
                                        {groupValue}
                                    </span>
                                    <span className="text-xs text-muted-foreground">({groupRows.length})</span>
                                </div>
                            )}
                            globalFilter={filters.searchQuery}
                            onGlobalFilterChange={filters.setSearchQuery}
                            renderGridItem={(row) => (
                                <LaborListItem
                                    laborType={row}
                                    onEditPrice={handleEditPrice}
                                    onPriceSave={handlePriceUpdate}
                                />
                            )}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
