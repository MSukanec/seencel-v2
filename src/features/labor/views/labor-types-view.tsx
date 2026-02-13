"use client";

import { useState, useMemo } from "react";
import { ContentLayout } from "@/components/layout";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { LaborListItem } from "@/components/shared/list-item";
import { ContextSidebar } from "@/stores/sidebar-store";
import { HardHat } from "lucide-react";
import { useModal } from "@/stores/modal-store";
import { LaborTypeWithPrice } from "../types";
import { LaborPriceForm } from "../forms/labor-price-form";
import { LaborCategoriesSidebar, type LaborCategoryItem } from "../components/labor-categories-sidebar";

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
    const { openModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // Extract unique categories from labor types
    const categories: LaborCategoryItem[] = useMemo(() => {
        const categoryMap = new Map<string, string>();
        laborTypes.forEach(lt => {
            if (lt.labor_category_id && lt.category_name) {
                categoryMap.set(lt.labor_category_id, lt.category_name);
            }
        });
        return Array.from(categoryMap.entries()).map(([id, name]) => ({ id, name }));
    }, [laborTypes]);

    // Count labor types per category
    const laborCounts: Record<string, number> = useMemo(() => {
        const counts: Record<string, number> = {};
        laborTypes.forEach(lt => {
            const catId = lt.labor_category_id || "sin-categoria";
            counts[catId] = (counts[catId] || 0) + 1;
        });
        return counts;
    }, [laborTypes]);

    // Filter labor types by search AND category
    const filteredTypes = useMemo(() => {
        return laborTypes.filter(lt => {
            // Category filter
            if (selectedCategoryId) {
                if (selectedCategoryId === "sin-categoria") {
                    if (lt.labor_category_id) return false;
                } else {
                    if (lt.labor_category_id !== selectedCategoryId) return false;
                }
            }

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    lt.name?.toLowerCase().includes(query) ||
                    lt.category_name?.toLowerCase().includes(query) ||
                    lt.level_name?.toLowerCase().includes(query) ||
                    lt.role_name?.toLowerCase().includes(query)
                );
            }

            return true;
        });
    }, [laborTypes, searchQuery, selectedCategoryId]);

    // Handler to open price edit modal
    const handleEditPrice = (laborType: LaborTypeWithPrice) => {
        openModal(
            <LaborPriceForm
                laborType={laborType}
                organizationId={orgId}
                currencies={currencies}
                defaultCurrencyId={laborType.currency_id || defaultCurrencyId}
            />,
            {
                title: "Establecer Precio",
                description: `Define el costo por ${laborType.unit_name || 'unidad'} para "${laborType.name}"`,
                size: "md"
            }
        );
    };

    // Reset filters
    const handleResetFilters = () => {
        setSearchQuery("");
        setSelectedCategoryId(null);
    };

    // EmptyState for no types
    if (laborTypes.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Buscar tipos de mano de obra..."
                />
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={HardHat}
                        viewName="Tipos de Mano de Obra"
                        featureDescription="Los tipos de mano de obra representan las distintas especialidades y roles laborales que intervienen en tus proyectos de construcción. Desde aquí podés establecer los precios por unidad para cada tipo, que luego se usan en las recetas de las tareas."
                    />
                </div>
            </>
        );
    }

    return (
        <>
            {/* Categories Sidebar */}
            <ContextSidebar title="Categorías">
                <LaborCategoriesSidebar
                    categories={categories}
                    laborCounts={laborCounts}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={setSelectedCategoryId}
                    totalLabor={laborTypes.length}
                />
            </ContextSidebar>

            {/* Main content */}
            <ContentLayout variant="wide">
                <Toolbar
                    portalToHeader
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Buscar por nombre, categoría, nivel o rol..."
                />

                <div className="space-y-2">
                    {filteredTypes.length === 0 ? (
                        <div className="py-12 flex items-center justify-center">
                            <ViewEmptyState
                                mode="no-results"
                                icon={HardHat}
                                viewName="tipos de mano de obra"
                                filterContext="con esos filtros"
                                onResetFilters={handleResetFilters}
                            />
                        </div>
                    ) : (
                        filteredTypes.map((laborType) => (
                            <LaborListItem
                                key={laborType.id}
                                laborType={laborType}
                                onEditPrice={handleEditPrice}
                            />
                        ))
                    )}
                </div>
            </ContentLayout>
        </>
    );
}
