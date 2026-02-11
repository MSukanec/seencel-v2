"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { RecipeListItem } from "@/components/shared/list-item/items/recipe-list-item";
import { Package, Plus } from "lucide-react";
import { toast } from "sonner";
import {
    updateRecipeMaterial,
    deleteRecipeMaterial,
    updateRecipeLabor,
    deleteRecipeLabor,
    updateRecipeVisibility,
    deleteRecipe,
} from "@/features/tasks/actions";
import { TasksRecipeForm } from "@/features/tasks/forms/tasks-recipe-form";
import { TasksRecipeResourceForm } from "@/features/tasks/forms/tasks-recipe-resource-form";
import type { TaskView, TaskRecipeView, RecipeResources } from "@/features/tasks/types";
import type { RecipeListItemData, MaterialPriceInfo } from "@/components/shared/list-item/items/recipe-list-item";

// ============================================================================
// Types
// ============================================================================

export interface TasksDetailRecipeViewProps {
    task: TaskView;
    /** All visible recipes (own + public) */
    recipes: TaskRecipeView[];
    /** Pre-loaded resources per recipe (keyed by recipeId) */
    recipeResourcesMap: Record<string, RecipeResources>;
    /** Current organization ID */
    organizationId: string;
    isAdminMode?: boolean;
    /** Catalog materials for the org — needed for material form Combobox + pricing */
    catalogMaterials?: CatalogMaterialOption[];
    /** Catalog labor types — needed for labor form Combobox */
    catalogLaborTypes?: { id: string; name: string; unit_id?: string | null; unit_name?: string | null; unit_symbol?: string | null; category_name?: string | null; level_name?: string | null; role_name?: string | null }[];
}

/** Material option from catalog — includes pricing for cost calculations */
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

// ============================================================================
// Component
// ============================================================================

export function TasksDetailRecipeView({
    task,
    recipes: serverRecipes,
    recipeResourcesMap: serverResourcesMap,
    organizationId,
    isAdminMode = false,
    catalogMaterials = [],
    catalogLaborTypes = [],
}: TasksDetailRecipeViewProps) {
    const router = useRouter();
    const { openModal } = useModal();

    // Local state — synced with server props via useEffect
    const [recipes, setRecipes] = useState(serverRecipes);
    const [resourcesMap, setResourcesMap] = useState(serverResourcesMap);

    // ========================================================================
    // Sync server data → local state (critical for router.refresh())
    // ========================================================================

    useEffect(() => {
        setRecipes(serverRecipes);
    }, [serverRecipes]);

    useEffect(() => {
        setResourcesMap(serverResourcesMap);
    }, [serverResourcesMap]);

    // ========================================================================
    // Recipe Creation — opens semi-autonomous form in modal
    // ========================================================================

    const handleCreateRecipe = useCallback(() => {
        openModal(
            <TasksRecipeForm taskId={task.id} />,
            {
                title: "Nueva Receta",
                description: "Definí un nombre descriptivo para la nueva receta.",
                size: "md",
            }
        );
    }, [task.id, openModal]);

    // ========================================================================
    // Add Resource — opens material or labor form
    // ========================================================================

    const handleAddResource = useCallback((recipeId: string) => {
        openModal(
            <TasksRecipeResourceForm
                recipeId={recipeId}
                materials={catalogMaterials}
                laborTypes={catalogLaborTypes}
            />,
            {
                title: "Agregar Recurso",
                description: "Seleccioná el tipo de recurso y completá los datos.",
                size: "md",
            }
        );
    }, [catalogMaterials, catalogLaborTypes, openModal]);

    // ========================================================================
    // Material Handlers
    // ========================================================================

    const handleUpdateMaterialQuantity = useCallback(async (itemId: string, newQuantity: number) => {
        // Optimistic update
        setResourcesMap(prev => {
            const updated = { ...prev };
            for (const recipeId of Object.keys(updated)) {
                updated[recipeId] = {
                    ...updated[recipeId],
                    materials: updated[recipeId].materials.map(m =>
                        m.id === itemId ? {
                            ...m,
                            quantity: newQuantity,
                            total_quantity: newQuantity * (1 + (m.waste_percentage || 0) / 100),
                        } : m
                    ),
                };
            }
            return updated;
        });

        const result = await updateRecipeMaterial(itemId, { quantity: newQuantity });
        if (!result.success) {
            toast.error(result.error || "Error al actualizar");
            setResourcesMap(serverResourcesMap); // Rollback
        }
    }, [serverResourcesMap]);

    const handleUpdateMaterialWaste = useCallback(async (itemId: string, wastePercentage: number) => {
        // Optimistic update
        setResourcesMap(prev => {
            const updated = { ...prev };
            for (const recipeId of Object.keys(updated)) {
                updated[recipeId] = {
                    ...updated[recipeId],
                    materials: updated[recipeId].materials.map(m =>
                        m.id === itemId ? {
                            ...m,
                            waste_percentage: wastePercentage,
                            total_quantity: m.quantity * (1 + wastePercentage / 100),
                        } : m
                    ),
                };
            }
            return updated;
        });

        const result = await updateRecipeMaterial(itemId, { waste_percentage: wastePercentage });
        if (!result.success) {
            toast.error(result.error || "Error al actualizar merma");
            setResourcesMap(serverResourcesMap); // Rollback
        }
    }, [serverResourcesMap]);

    const handleRemoveMaterial = useCallback(async (itemId: string) => {
        // Optimistic: remove item immediately
        const previousMap = { ...resourcesMap };
        setResourcesMap(prev => {
            const updated = { ...prev };
            for (const recipeId of Object.keys(updated)) {
                updated[recipeId] = {
                    ...updated[recipeId],
                    materials: updated[recipeId].materials.filter(m => m.id !== itemId),
                };
            }
            return updated;
        });

        const result = await deleteRecipeMaterial(itemId);
        if (!result.success) {
            toast.error("Error al eliminar material");
            setResourcesMap(previousMap); // Rollback
        } else {
            toast.success("Material eliminado");
        }
    }, [resourcesMap]);

    // ========================================================================
    // Labor Handlers
    // ========================================================================

    const handleUpdateLaborQuantity = useCallback(async (itemId: string, newQuantity: number) => {
        // Optimistic update
        setResourcesMap(prev => {
            const updated = { ...prev };
            for (const recipeId of Object.keys(updated)) {
                updated[recipeId] = {
                    ...updated[recipeId],
                    labor: updated[recipeId].labor.map(l =>
                        l.id === itemId ? { ...l, quantity: newQuantity } : l
                    ),
                };
            }
            return updated;
        });

        const result = await updateRecipeLabor(itemId, { quantity: newQuantity });
        if (!result.success) {
            toast.error(result.error || "Error al actualizar");
            setResourcesMap(serverResourcesMap); // Rollback
        }
    }, [serverResourcesMap]);

    const handleRemoveLabor = useCallback(async (itemId: string) => {
        // Optimistic: remove item immediately
        const previousMap = { ...resourcesMap };
        setResourcesMap(prev => {
            const updated = { ...prev };
            for (const recipeId of Object.keys(updated)) {
                updated[recipeId] = {
                    ...updated[recipeId],
                    labor: updated[recipeId].labor.filter(l => l.id !== itemId),
                };
            }
            return updated;
        });

        const result = await deleteRecipeLabor(itemId);
        if (!result.success) {
            toast.error("Error al eliminar mano de obra");
            setResourcesMap(previousMap); // Rollback
        } else {
            toast.success("Mano de obra eliminada");
        }
    }, [resourcesMap]);

    // ========================================================================
    // Recipe Actions
    // ========================================================================

    const handleToggleVisibility = useCallback(async (recipeId: string, isPublic: boolean) => {
        // Optimistic update
        setRecipes(prev => prev.map(r =>
            r.id === recipeId ? { ...r, is_public: isPublic } : r
        ));

        const result = await updateRecipeVisibility(recipeId, isPublic);
        if (result.success) {
            toast.success(isPublic ? "Receta publicada" : "Receta ahora es privada");
        } else {
            toast.error(result.error || "Error al cambiar visibilidad");
            setRecipes(serverRecipes); // Rollback
        }
    }, [serverRecipes]);

    const handleDeleteRecipe = useCallback(async (recipeId: string) => {
        // Optimistic: remove recipe immediately
        const previousRecipes = [...recipes];
        setRecipes(prev => prev.filter(r => r.id !== recipeId));

        const result = await deleteRecipe(recipeId);
        if (!result.success) {
            toast.error(result.error || "Error al eliminar receta");
            setRecipes(previousRecipes); // Rollback
        } else {
            toast.success("Receta eliminada");
        }
    }, [recipes]);

    // ========================================================================
    // Material Price Map — for cost calculations
    // ========================================================================

    const materialPriceMap = useMemo(() => {
        const map = new Map<string, MaterialPriceInfo>();
        for (const mat of catalogMaterials) {
            if (mat.org_unit_price != null && mat.org_unit_price > 0) {
                const saleQty = mat.default_sale_unit_quantity ?? 1;
                map.set(mat.id, {
                    effectiveUnitPrice: mat.org_unit_price / (saleQty > 0 ? saleQty : 1),
                    currencyId: mat.org_price_currency_id ?? null,
                    materialName: mat.name,
                    materialCode: mat.code,
                    materialId: mat.id,
                    organizationId: organizationId,
                    priceValidFrom: mat.org_price_valid_from,
                    unitSymbol: mat.unit_symbol,
                });
            }
        }
        return map;
    }, [catalogMaterials, organizationId]);

    // ========================================================================
    // Build list item data
    // ========================================================================

    const recipeListData: RecipeListItemData[] = recipes.map(recipe => ({
        recipe,
        resources: resourcesMap[recipe.id] || { materials: [], labor: [] },
        isOwn: recipe.organization_id === organizationId,
    }));

    // Price update handler — refresh data after price change
    const handlePriceUpdated = useCallback((_materialId: string, _newPrice: number) => {
        // Server-side revalidation already triggered by upsertMaterialPrice
        // We just refresh to pick up the new prices
        router.refresh();
    }, [router]);

    // ========================================================================
    // Empty State
    // ========================================================================

    if (recipes.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    actions={[
                        {
                            label: "Crear Receta",
                            icon: Plus,
                            onClick: handleCreateRecipe,
                        },
                    ]}
                />
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={Package}
                        viewName="Recetas"
                        featureDescription="Las recetas definen los recursos necesarios para ejecutar esta tarea: materiales, mano de obra y equipos. Cada organización puede crear múltiples recetas con distintas variantes."
                        onAction={handleCreateRecipe}
                        actionLabel="Crear Receta"
                        docsPath="/docs/tareas"
                    />
                </div>
            </>
        );
    }

    // ========================================================================
    // Render — Lista de recetas
    // ========================================================================

    return (
        <>
            <Toolbar
                portalToHeader
                actions={[
                    {
                        label: "Crear Receta",
                        icon: Plus,
                        onClick: handleCreateRecipe,
                    },
                ]}
            />

            <div className="space-y-3 px-2 py-3">
                {recipeListData.map((data, index) => (
                    <RecipeListItem
                        key={data.recipe.id}
                        data={data}
                        defaultOpen={index === 0 && data.isOwn}
                        materialPriceMap={materialPriceMap}
                        taskUnitName={task.unit_name}
                        onAddResource={handleAddResource}
                        onUpdateMaterialQuantity={handleUpdateMaterialQuantity}
                        onUpdateMaterialWaste={handleUpdateMaterialWaste}
                        onRemoveMaterial={handleRemoveMaterial}
                        onUpdateLaborQuantity={handleUpdateLaborQuantity}
                        onRemoveLabor={handleRemoveLabor}
                        onToggleVisibility={handleToggleVisibility}
                        onDeleteRecipe={handleDeleteRecipe}
                        onPriceUpdated={handlePriceUpdated}
                    />
                ))}
            </div>
        </>
    );
}
