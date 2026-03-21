"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { usePanel } from "@/stores/panel-store";
import { PageHeaderActionPortal } from "@/components/layout";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
    Package,
    Plus,
    Circle,
    Table2,
    LayoutGrid,
    ScrollText,
} from "lucide-react";
import { toast } from "sonner";
import {
    deleteRecipe,
    updateRecipeStatus,
    updateRecipe,
} from "@/features/tasks/actions";
import type { EditRecipeData } from "@/features/tasks/forms/tasks-recipe-form";
import type { TaskView, TaskRecipeView } from "@/features/tasks/types";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ToolbarCard } from "@/components/shared/toolbar-controls";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useTableActions } from "@/hooks/use-table-actions";
import { getRecipeColumns } from "@/features/tasks/tables/recipes-columns";
import { RecipeListItem } from "@/components/shared/list-item";
import { useParams } from "next/navigation";

// ============================================================================
// Types
// ============================================================================

export interface CatalogMaterialOption {
    id: string;
    name: string;
    code?: string | null;
    unit_id?: string | null;
    unit_name?: string | null;
    unit_symbol?: string | null;
    org_unit_price?: number | null;
    default_sale_unit_quantity?: number | null;
    org_price_currency_id?: string | null;
    org_price_valid_from?: string | null;
}

export interface TasksDetailRecipeViewProps {
    task: TaskView;
    /** All visible recipes (own + public) */
    recipes: TaskRecipeView[];
    /** Current organization ID */
    organizationId: string;
    isAdminMode?: boolean;
    /** Catalog materials for the org — needed for recipe creation context */
    catalogMaterials?: CatalogMaterialOption[];
    /** Catalog labor types — needed for recipe creation context */
    catalogLaborTypes?: { id: string; name: string; unit_id?: string | null; unit_name?: string | null; unit_symbol?: string | null; category_name?: string | null; level_name?: string | null; role_name?: string | null; current_price?: number | null; currency_id?: string | null; currency_symbol?: string | null; price_valid_from?: string | null }[];
}

// ============================================================================
// Component
// ============================================================================

export function TasksDetailRecipeView({
    task,
    recipes: serverRecipes,
    organizationId,
    isAdminMode = false,
    catalogMaterials = [],
    catalogLaborTypes = [],
}: TasksDetailRecipeViewProps) {
    const router = useRouter();
    const { openPanel } = usePanel();
    const params = useParams<{ taskId: string }>();

    // Local state — synced with server props via useEffect
    const [recipes, setRecipes] = useState(serverRecipes);

    // ── View mode (table/cards) ──
    type ViewMode = "table" | "cards";
    const VIEW_OPTIONS = [
        { value: "table", icon: Table2, label: "Tabla" },
        { value: "cards", icon: LayoutGrid, label: "Tarjetas" },
    ];
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    // ── Table Filters ──
    const filters = useTableFilters({
        facets: [
            {
                key: "status",
                title: "Estado",
                icon: Circle,
                options: [
                    { label: "Activa", value: "active" },
                    { label: "Borrador", value: "draft" },
                    { label: "Archivada", value: "archived" },
                ],
            },
        ],
    });

    // ── Table Actions (delete) ──
    const { handleDelete, DeleteConfirmDialog } = useTableActions<TaskRecipeView>({
        onDelete: async (recipe) => {
            const result = await deleteRecipe(recipe.id);
            if (result.success) router.refresh();
            return { success: !!result.success };
        },
        entityName: "receta",
        entityNamePlural: "recetas",
    });

    // ── Sync server data → local state ──
    useEffect(() => {
        setRecipes(serverRecipes);
    }, [serverRecipes]);

    // ========================================================================
    // Navigate to recipe detail (real route)
    // ========================================================================

    const navigateToRecipe = useCallback((recipeId: string) => {
        router.push(`/organization/catalog/task/${params.taskId}/recipe/${recipeId}` as any);
    }, [router, params.taskId]);

    // ========================================================================
    // Recipe Creation
    // ========================================================================

    const handleCreateRecipe = useCallback(() => {
        openPanel('tasks-recipe-form', {
            taskId: task.id,
        });
    }, [task.id, openPanel]);

    // ========================================================================
    // Edit Recipe
    // ========================================================================

    const handleEditRecipe = useCallback((recipeId: string, recipeName: string) => {
        const editData: EditRecipeData = { recipeId, name: recipeName };
        openPanel('tasks-recipe-form', {
            taskId: task.id,
            editData,
        });
    }, [task.id, openPanel]);

    // ========================================================================
    // Status & Name Change
    // ========================================================================

    const handleStatusChangeRecipe = useCallback(async (recipe: TaskRecipeView, status: string) => {
        const result = await updateRecipeStatus(recipe.id, status as "draft" | "active" | "archived");
        if (result.success) {
            const labels: Record<string, string> = { draft: "Borrador", active: "Activa", archived: "Archivada" };
            toast.success(`Estado cambiado a: ${labels[status]}`);
            router.refresh();
        } else {
            toast.error(result.error || "Error al cambiar el estado");
        }
    }, [router]);

    const handleNameChangeRecipe = useCallback(async (recipe: TaskRecipeView, newName: string) => {
        const result = await updateRecipe(recipe.id, { name: newName });
        if (result.success) {
            toast.success("Nombre actualizado");
            router.refresh();
        } else {
            toast.error(result.error || "Error al actualizar el nombre");
        }
    }, [router]);

    // ── DataTable columns ──
    const columns = useMemo(() => getRecipeColumns({
        organizationId,
        onStatusChange: handleStatusChangeRecipe,
        onNameChange: handleNameChangeRecipe,
    }), [organizationId, handleStatusChangeRecipe, handleNameChangeRecipe]);

    // ========================================================================
    // Filtered recipes
    // ========================================================================

    const statusFilter = filters.facetValues["status"] || new Set<string>();

    const filteredRecipes = useMemo(() => {
        let items = recipes;
        if (filters.searchQuery.trim()) {
            const q = filters.searchQuery.toLowerCase();
            items = items.filter(r =>
                r.name?.toLowerCase().includes(q) ||
                r.org_name?.toLowerCase().includes(q)
            );
        }
        if (statusFilter.size > 0) {
            items = items.filter(r => statusFilter.has(r.status ?? "active"));
        }
        return items;
    }, [recipes, filters.searchQuery, statusFilter]);

    /** Render a recipe as a card for grid view */
    const renderRecipeGridItem = useCallback((recipe: TaskRecipeView) => {
        return (
            <RecipeListItem
                recipe={recipe}
                organizationId={organizationId}
                onClick={(r) => navigateToRecipe(r.id)}
                onEdit={(r) => handleEditRecipe(r.id, r.name || "Receta")}
                onDelete={handleDelete}
                onStatusChange={handleStatusChangeRecipe}
            />
        );
    }, [organizationId, navigateToRecipe, handleEditRecipe, handleDelete, handleStatusChangeRecipe]);

    // ========================================================================
    // Empty State
    // ========================================================================

    if (recipes.length === 0) {
        return (
            <>
                <PageHeaderActionPortal>
                    <Button onClick={handleCreateRecipe} size="sm">
                        <Plus className="h-4 w-4 mr-1.5" />
                        Crear Receta
                    </Button>
                </PageHeaderActionPortal>
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={Package}
                        viewName="Recetas"
                        featureDescription="Las recetas definen los recursos necesarios para ejecutar esta tarea: materiales, mano de obra y equipos. Cada organización puede crear múltiples recetas con distintas variantes."
                        onAction={handleCreateRecipe}
                        actionLabel="Crear Receta"
                        docsPath="/docs/catalogo-tecnico/recetas"
                    />
                </div>
            </>
        );
    }

    // ========================================================================
    // Render — List View (all recipes) with DataTable
    // ========================================================================

    return (
        <>
            <PageHeaderActionPortal>
                <Button onClick={handleCreateRecipe} size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Crear Receta
                </Button>
            </PageHeaderActionPortal>

            <div className="h-full flex flex-col">
                <div className="mb-4">
                    <ToolbarCard
                        filters={filters}
                        searchPlaceholder="Buscar recetas..."
                        display={{
                            viewMode,
                            onViewModeChange: (v) => setViewMode(v as ViewMode),
                            viewModeOptions: VIEW_OPTIONS,
                        }}
                    />
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    {filters.hasActiveFilters && filteredRecipes.length === 0 ? (
                        <ViewEmptyState
                            mode="no-results"
                            icon={ScrollText}
                            viewName="recetas"
                            filterContext="con ese criterio de búsqueda"
                            onResetFilters={filters.clearAll}
                        />
                    ) : (
                        <DataTable
                            viewMode={viewMode === "cards" ? "grid" : "table"}
                            gridClassName="flex flex-col gap-2 pb-8"
                            columns={columns}
                            data={filteredRecipes}
                            enableContextMenu
                            onRowClick={(recipe) => navigateToRecipe(recipe.id)}
                            onView={(recipe) => navigateToRecipe(recipe.id)}
                            onEdit={(recipe) => handleEditRecipe(recipe.id, recipe.name || "Receta")}
                            onDelete={handleDelete}
                            parameters={[
                                {
                                    label: "Estado",
                                    icon: Circle,
                                    currentValueKey: "status",
                                    options: [
                                        { value: "draft", label: "Borrador", icon: <Circle className="h-3 w-3 fill-amber-500 text-amber-500" /> },
                                        { value: "active", label: "Activa", icon: <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" /> },
                                        { value: "archived", label: "Archivada", icon: <Circle className="h-3 w-3 fill-muted-foreground text-muted-foreground" /> },
                                    ],
                                    onSelect: (data: any, value: string) => handleStatusChangeRecipe(data, value),
                                },
                            ]}
                            globalFilter={filters.searchQuery}
                            onGlobalFilterChange={filters.setSearchQuery}
                            renderGridItem={renderRecipeGridItem}
                        />
                    )}
                </div>
            </div>

            <DeleteConfirmDialog />
        </>
    );
}
