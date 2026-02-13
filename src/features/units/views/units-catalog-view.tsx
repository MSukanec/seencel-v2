"use client";

import { useState, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { ListItem } from "@/components/ui/list-item";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { ContextSidebar } from "@/stores/sidebar-store";
import {
    Plus,
    Ruler,
    MoreHorizontal,
    Pencil,
    Trash2,
    Package,
    Clock,
    LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/stores/modal-store";
import { UnitForm, type ApplicableTo } from "../forms/unit-form";
import { deleteUnit } from "../actions";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/shared/forms/general/delete-dialog";
import { CategoriesSidebar, type UnitCategory } from "../components/categories-sidebar";
import type { CatalogUnit } from "../queries";
import { useOptimisticList } from "@/hooks/use-optimistic-action";

// ============================================================================
// Types
// ============================================================================

type TabValue = "all" | "task" | "material" | "labor";

export interface UnitsCatalogViewProps {
    units: CatalogUnit[];
    categories: UnitCategory[];
    orgId: string;
    isAdminMode?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const TAB_OPTIONS = [
    { label: "Todos", value: "all" as TabValue, icon: LayoutGrid },
    { label: "Tareas", value: "task" as TabValue, icon: Ruler },
    { label: "Materiales", value: "material" as TabValue, icon: Package },
    { label: "Mano de Obra", value: "labor" as TabValue, icon: Clock },
];

// ============================================================================
// Main Component
// ============================================================================

export function UnitsCatalogView({
    units,
    categories,
    orgId,
    isAdminMode = false,
}: UnitsCatalogViewProps) {
    const router = useRouter();
    const { openModal } = useModal();
    const [activeTab, setActiveTab] = useState<TabValue>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<CatalogUnit | null>(null);

    // Optimistic list for instant UI updates
    const { optimisticItems, removeItem } = useOptimisticList({
        items: units,
        getItemId: (u) => u.id,
    });

    // Create category lookup map
    const categoryMap = useMemo(() => {
        const map = new Map<string, UnitCategory>();
        categories.forEach(c => map.set(c.id, c));
        return map;
    }, [categories]);

    // Calculate unit counts per category (considering tab filter)
    const unitCounts = useMemo(() => {
        const counts: Record<string, number> = {};

        let unitsToCount = optimisticItems;
        if (activeTab !== "all") {
            unitsToCount = unitsToCount.filter(u => u.applicable_to?.includes(activeTab));
        }

        unitsToCount.forEach(u => {
            const catId = u.unit_category_id || "sin-categoria";
            counts[catId] = (counts[catId] || 0) + 1;
        });

        return counts;
    }, [optimisticItems, activeTab]);

    // Filter units by applicable_to based on active tab
    const filteredByTab = useMemo(() => {
        if (activeTab === "all") return optimisticItems;
        return optimisticItems.filter((u) => u.applicable_to?.includes(activeTab));
    }, [optimisticItems, activeTab]);

    // Filter by selected category
    const filteredByCategory = useMemo(() => {
        if (selectedCategoryId === null) return filteredByTab;
        if (selectedCategoryId === "sin-categoria") {
            return filteredByTab.filter(u => !u.unit_category_id);
        }
        return filteredByTab.filter(u => u.unit_category_id === selectedCategoryId);
    }, [filteredByTab, selectedCategoryId]);

    // Filter data based on search
    const filteredUnits = useMemo(() => {
        if (!searchQuery.trim()) return filteredByCategory;
        const query = searchQuery.toLowerCase();
        return filteredByCategory.filter(
            (u) =>
                u.name.toLowerCase().includes(query) ||
                u.symbol?.toLowerCase().includes(query)
        );
    }, [filteredByCategory, searchQuery]);

    // Check if item can be edited
    // - Admins can edit system units (in admin mode)
    // - Org members can edit their org's units
    const canEditItem = (item: CatalogUnit) => {
        if (isAdminMode) return item.is_system;
        return !item.is_system; // Org can only edit their own units
    };

    // Total for sidebar
    const totalFilteredUnits = activeTab === "all"
        ? optimisticItems.length
        : optimisticItems.filter(u => u.applicable_to?.includes(activeTab)).length;

    // ========================================================================
    // Unit Handlers
    // ========================================================================

    const handleCreateUnit = () => {
        // Default type based on current tab
        const defaultType: ApplicableTo = activeTab === "all" ? "task" : activeTab;
        openModal(
            <UnitForm
                organizationId={orgId}
                categories={categories}
                defaultApplicableTo={defaultType}
            />,
            {
                title: "Nueva Unidad",
                description: "Crear una nueva unidad",
                size: "md"
            }
        );
    };

    const handleEditUnit = (unit: CatalogUnit) => {
        if (!canEditItem(unit)) {
            toast.error("No podés editar unidades del sistema");
            return;
        }
        openModal(
            <UnitForm
                organizationId={orgId}
                categories={categories}
                initialData={unit}
            />,
            {
                title: "Editar Unidad",
                description: "Modificar los datos de esta unidad",
                size: "md"
            }
        );
    };

    const handleDeleteUnitClick = (unit: CatalogUnit) => {
        if (!canEditItem(unit)) {
            toast.error("No podés eliminar unidades del sistema");
            return;
        }
        setItemToDelete(unit);
        setDeleteModalOpen(true);
    };

    // ========================================================================
    // Delete Confirmation - OPTIMISTIC
    // ========================================================================

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        const unitId = itemToDelete.id;
        const unitName = itemToDelete.name;

        // 1. Close modal and clear state IMMEDIATELY
        setDeleteModalOpen(false);
        setItemToDelete(null);

        // 2. Optimistically remove from UI
        removeItem(unitId, async () => {
            try {
                const result = await deleteUnit(unitId);
                if (!result.success) {
                    toast.error(result.error || "Error al eliminar");
                    router.refresh(); // Rollback by refreshing
                    return;
                }
                toast.success(`"${unitName}" eliminada correctamente`);
            } catch (error) {
                toast.error("Error inesperado al eliminar");
                router.refresh(); // Rollback by refreshing
            }
        });
    };

    // Sidebar content
    const sidebarContent = (
        <CategoriesSidebar
            categories={categories}
            unitCounts={unitCounts}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            totalUnits={totalFilteredUnits}
        />
    );

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <>
            {/* Inject sidebar content into the layout's context sidebar slot */}
            <ContextSidebar title="Categorías">
                {sidebarContent}
            </ContextSidebar>

            {/* Toolbar with tabs */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar unidades por nombre o símbolo..."
                leftActions={
                    <ToolbarTabs
                        value={activeTab}
                        onValueChange={(v) => setActiveTab(v as TabValue)}
                        options={TAB_OPTIONS}
                    />
                }
                actions={[
                    {
                        label: "Nueva Unidad",
                        icon: Plus,
                        onClick: handleCreateUnit,
                    },
                ]}
            />

            {/* Items View */}
            <div className="space-y-2">
                {filteredUnits.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        {searchQuery || selectedCategoryId ? (
                            <ViewEmptyState
                                mode="no-results"
                                icon={Ruler}
                                viewName="unidades"
                                filterContext={searchQuery ? "con ese criterio de búsqueda" : "en esta categoría"}
                                onResetFilters={() => {
                                    setSearchQuery("");
                                    setSelectedCategoryId(null);
                                }}
                            />
                        ) : (
                            <ViewEmptyState
                                mode="empty"
                                icon={Ruler}
                                viewName="Unidades de Medida"
                                featureDescription="Las unidades de medida definen cómo se cuantifican tareas, materiales y mano de obra en tus proyectos. Podés crear unidades personalizadas para tu organización o usar las del sistema."
                                onAction={handleCreateUnit}
                                actionLabel="Nueva Unidad"
                            />
                        )}
                    </div>
                ) : (
                    filteredUnits.map((unit) => (
                        <UnitCard
                            key={unit.id}
                            unit={unit}
                            category={unit.unit_category_id ? categoryMap.get(unit.unit_category_id) : null}
                            canEdit={canEditItem(unit)}
                            onEdit={handleEditUnit}
                            onDelete={handleDeleteUnitClick}
                        />
                    ))
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteDialog
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteModalOpen(false);
                        setItemToDelete(null);
                    }
                }}
                onConfirm={handleConfirmDelete}
                title="Eliminar Unidad"
                description={`¿Estás seguro de que querés eliminar "${itemToDelete?.name}"? Esta acción no se puede deshacer.`}
            />
        </>
    );
}

// ============================================================================
// Unit Card Component
// ============================================================================

interface UnitCardProps {
    unit: CatalogUnit;
    category: UnitCategory | null | undefined;
    canEdit: boolean;
    onEdit: (unit: CatalogUnit) => void;
    onDelete: (unit: CatalogUnit) => void;
}

function UnitCard({ unit, category, canEdit, onEdit, onDelete }: UnitCardProps) {
    return (
        <ListItem variant="card">
            {/* Color strip: gray for system, green for org */}
            <ListItem.ColorStrip color={unit.is_system ? "system" : "green"} />

            <ListItem.Content>
                <ListItem.Title suffix={unit.symbol ? `(${unit.symbol})` : undefined}>
                    {unit.name}
                </ListItem.Title>
                <ListItem.Badges>
                    {/* Aplicación badges */}
                    {unit.applicable_to?.map((app) => (
                        <Badge key={app} variant="outline" className="text-xs">
                            {app === 'task' ? 'Tarea' : app === 'material' ? 'Material' : 'Mano de Obra'}
                        </Badge>
                    ))}
                    {/* Categoría badge */}
                    {category && (
                        <Badge variant="secondary" className="text-xs">
                            {category.name}
                        </Badge>
                    )}
                </ListItem.Badges>
            </ListItem.Content>

            {canEdit && (
                <ListItem.Actions>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Acciones</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(unit)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(unit)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ListItem.Actions>
            )}
        </ListItem>
    );
}
