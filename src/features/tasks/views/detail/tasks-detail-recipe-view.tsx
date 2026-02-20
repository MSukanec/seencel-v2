"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Package,
    Plus,
    Building2,
    Globe,
    Eye,
    Star,
    ChevronRight,
    ArrowLeft,
    HardHat,
    Wrench,
    Handshake,
    DollarSign,
    Layers,
    MoreHorizontal,
    Pencil,
    Trash2,
    Circle,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
    updateRecipeMaterial,
    deleteRecipeMaterial,
    updateRecipeLabor,
    deleteRecipeLabor,
    updateRecipeExternalService,
    deleteRecipeExternalService,
    deleteRecipe,
    updateRecipeStatus,
} from "@/features/tasks/actions";
import { TasksRecipeForm, type EditRecipeData, type TaskContext } from "@/features/tasks/forms/tasks-recipe-form";
import { TasksRecipeResourceForm, type EditResourceData } from "@/features/tasks/forms/tasks-recipe-resource-form";
import type { TaskView, TaskRecipeView, RecipeResources } from "@/features/tasks/types";
import { RecipeCard } from "@/features/tasks/components/recipe-card";
import type { RecipeCardData, MaterialPriceInfo, LaborPriceInfo, ExternalServicePriceInfo } from "@/features/tasks/components/recipe-card";
import { cn } from "@/lib/utils";
import { StatCard, StatCardGroup } from "@/components/shared/stat-card";
import { FreshnessDot } from "@/components/shared/price-pulse-popover";

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
    catalogLaborTypes?: { id: string; name: string; unit_id?: string | null; unit_name?: string | null; unit_symbol?: string | null; category_name?: string | null; level_name?: string | null; role_name?: string | null; current_price?: number | null; currency_id?: string | null; currency_symbol?: string | null; price_valid_from?: string | null }[];
    /** Available currencies for external service form */
    currencies?: { id: string; code: string; symbol: string; name: string }[];
    /** Available contacts for external service form */
    contacts?: { id: string; full_name: string; company_name?: string | null }[];
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
// Helpers
// ============================================================================

function formatCurrency(value: number): string {
    return "$" + value.toLocaleString("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
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
    currencies = [],
    contacts = [],
}: TasksDetailRecipeViewProps) {
    const router = useRouter();
    const { openModal } = useModal();

    // Local state — synced with server props via useEffect
    const [recipes, setRecipes] = useState(serverRecipes);
    const [resourcesMap, setResourcesMap] = useState(serverResourcesMap);

    // ── Navigation state: null = lista, string = detalle de receta ──
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

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
        const taskContext: TaskContext = {
            name: task.name ?? task.code ?? "Tarea sin nombre",
            unit: task.unit_symbol ?? task.unit_name ?? null,
            division: task.division_name ?? null,
            organizationId: organizationId,
            catalogMaterials: catalogMaterials?.map((m) => ({
                id: m.id,
                name: m.name,
                unit_symbol: m.unit_symbol ?? null,
            })),
            catalogLaborTypes: catalogLaborTypes?.map((l) => ({
                id: l.id,
                name: l.name,
                unit_symbol: l.unit_symbol ?? null,
            })),
        };
        openModal(
            <TasksRecipeForm taskId={task.id} taskContext={taskContext} />,
            {
                title: "Nueva Receta",
                description: "Definí un nombre o usá la IA para sugerir materiales.",
                size: "lg",
            }
        );
    }, [task, catalogMaterials, catalogLaborTypes, openModal]);

    // ========================================================================
    // Edit Recipe — opens form with name pre-filled
    // ========================================================================

    const handleEditRecipe = useCallback((recipeId: string, recipeName: string) => {
        const editData: EditRecipeData = {
            recipeId,
            name: recipeName,
        };

        openModal(
            <TasksRecipeForm taskId={task.id} editData={editData} />,
            {
                title: "Editar Receta",
                description: "Modificá el nombre de la receta.",
                size: "md",
            }
        );
    }, [task.id, openModal]);

    // ========================================================================
    // Delete Recipe — soft delete with confirmation
    // ========================================================================

    const handleDeleteRecipe = useCallback(async (recipeId: string) => {
        const result = await deleteRecipe(recipeId);
        if (result.success) {
            toast.success("Receta eliminada");
            router.refresh();
        } else {
            toast.error(result.error || "Error al eliminar la receta");
        }
    }, [router]);

    const handleStatusChangeRecipe = useCallback(async (recipeId: string, status: "draft" | "active" | "archived") => {
        const result = await updateRecipeStatus(recipeId, status);
        if (result.success) {
            const labels = { draft: "Borrador", active: "Activa", archived: "Archivada" };
            toast.success(`Estado cambiado a: ${labels[status]}`);
            router.refresh();
        } else {
            toast.error(result.error || "Error al cambiar el estado");
        }
    }, [router]);

    // ========================================================================
    // Add Resource — opens material or labor form
    // ========================================================================

    const handleAddResource = useCallback((recipeId: string) => {
        const resources = resourcesMap[recipeId];
        const existingLaborCount = (resources?.labor || []).length;
        const existingMaterialsCount = (resources?.materials || []).length;

        openModal(
            <TasksRecipeResourceForm
                recipeId={recipeId}
                materials={catalogMaterials}
                laborTypes={catalogLaborTypes}
                currencies={currencies}
                contacts={contacts}
                existingLaborCount={existingLaborCount}
                existingMaterialsCount={existingMaterialsCount}
            />,
            {
                title: "Agregar Recurso",
                description: "Seleccioná el tipo de recurso y completá los datos.",
                size: "md",
            }
        );
    }, [catalogMaterials, catalogLaborTypes, currencies, contacts, openModal, resourcesMap]);

    // ========================================================================
    // Edit Resource — opens form in edit mode with concept locked
    // ========================================================================

    const handleEditMaterial = useCallback((itemId: string) => {
        // Find the material item across all recipes
        let foundItem: any = null;
        let foundRecipeId: string | null = null;
        for (const recipeId of Object.keys(resourcesMap)) {
            const item = resourcesMap[recipeId].materials.find(m => m.id === itemId);
            if (item) {
                foundItem = item;
                foundRecipeId = recipeId;
                break;
            }
        }
        if (!foundItem || !foundRecipeId) return;

        const editData: EditResourceData = {
            itemId: foundItem.id,
            resourceType: "material",
            selectedId: foundItem.material_id,
            quantity: foundItem.quantity,
            notes: foundItem.notes,
            wastePercentage: foundItem.waste_percentage,
        };

        openModal(
            <TasksRecipeResourceForm
                recipeId={foundRecipeId}
                materials={catalogMaterials}
                laborTypes={catalogLaborTypes}
                currencies={currencies}
                contacts={contacts}
                editData={editData}
            />,
            {
                title: "Editar Material",
                description: "Modificá la cantidad y notas del material.",
                size: "md",
            }
        );
    }, [catalogMaterials, catalogLaborTypes, currencies, contacts, openModal, resourcesMap]);

    const handleEditLabor = useCallback((itemId: string) => {
        let foundItem: any = null;
        let foundRecipeId: string | null = null;
        for (const recipeId of Object.keys(resourcesMap)) {
            const item = resourcesMap[recipeId].labor.find(l => l.id === itemId);
            if (item) {
                foundItem = item;
                foundRecipeId = recipeId;
                break;
            }
        }
        if (!foundItem || !foundRecipeId) return;

        const editData: EditResourceData = {
            itemId: foundItem.id,
            resourceType: "labor",
            selectedId: foundItem.labor_type_id,
            quantity: foundItem.quantity,
            notes: foundItem.notes,
        };

        openModal(
            <TasksRecipeResourceForm
                recipeId={foundRecipeId}
                materials={catalogMaterials}
                laborTypes={catalogLaborTypes}
                currencies={currencies}
                contacts={contacts}
                editData={editData}
            />,
            {
                title: "Editar Mano de Obra",
                description: "Modificá la cantidad y notas de la mano de obra.",
                size: "md",
            }
        );
    }, [catalogMaterials, catalogLaborTypes, currencies, contacts, openModal, resourcesMap]);

    const handleEditExternalService = useCallback((itemId: string) => {
        let foundItem: any = null;
        let foundRecipeId: string | null = null;
        for (const recipeId of Object.keys(resourcesMap)) {
            const item = (resourcesMap[recipeId].externalServices || []).find(es => es.id === itemId);
            if (item) {
                foundItem = item;
                foundRecipeId = recipeId;
                break;
            }
        }
        if (!foundItem || !foundRecipeId) return;

        const editData: EditResourceData = {
            itemId: foundItem.id,
            resourceType: "external_service",
            quantity: 1,
            notes: foundItem.notes,
            serviceName: foundItem.name,
            unitPrice: foundItem.unit_price,
            currencyId: foundItem.currency_id,
            contactId: foundItem.contact_id,
            includesMaterials: foundItem.includes_materials,
        };

        openModal(
            <TasksRecipeResourceForm
                recipeId={foundRecipeId}
                materials={catalogMaterials}
                laborTypes={catalogLaborTypes}
                currencies={currencies}
                contacts={contacts}
                editData={editData}
            />,
            {
                title: "Editar Servicio Externo",
                description: "Modificá los datos del servicio subcontratado.",
                size: "md",
            }
        );
    }, [catalogMaterials, catalogLaborTypes, currencies, contacts, openModal, resourcesMap]);

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
    // External Service Handlers
    // ========================================================================



    const handleRemoveExternalService = useCallback(async (itemId: string) => {
        // Optimistic: remove item immediately
        const previousMap = { ...resourcesMap };
        setResourcesMap(prev => {
            const updated = { ...prev };
            for (const recipeId of Object.keys(updated)) {
                updated[recipeId] = {
                    ...updated[recipeId],
                    externalServices: (updated[recipeId].externalServices || []).filter(es => es.id !== itemId),
                };
            }
            return updated;
        });

        const result = await deleteRecipeExternalService(itemId);
        if (!result.success) {
            toast.error("Error al eliminar servicio externo");
            setResourcesMap(previousMap); // Rollback
        } else {
            toast.success("Servicio externo eliminado");
        }
    }, [resourcesMap]);


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
    // Labor Price Map — for cost calculations
    // ========================================================================

    const laborPriceMap = useMemo(() => {
        const map = new Map<string, LaborPriceInfo>();
        for (const lt of catalogLaborTypes) {
            if (lt.current_price != null && lt.current_price > 0) {
                map.set(lt.id, {
                    unitPrice: lt.current_price,
                    currencyId: lt.currency_id ?? null,
                    laborName: lt.name,
                    laborTypeId: lt.id,
                    organizationId: organizationId,
                    priceValidFrom: lt.price_valid_from,
                    unitSymbol: lt.unit_symbol,
                });
            }
        }
        return map;
    }, [catalogLaborTypes, organizationId]);

    // ========================================================================
    // External Service Price Map — for cost calculations
    // ========================================================================

    const externalServicePriceMap = useMemo(() => {
        const map = new Map<string, ExternalServicePriceInfo>();
        for (const recipeId of Object.keys(resourcesMap)) {
            for (const es of (resourcesMap[recipeId].externalServices || [])) {
                if (es.unit_price != null && es.unit_price > 0) {
                    map.set(es.id, {
                        unitPrice: es.unit_price,
                        currencyId: es.currency_id ?? null,
                        serviceName: es.name,
                        serviceId: es.id,
                        organizationId: organizationId,
                        unitSymbol: es.unit_symbol,
                        priceValidFrom: es.price_valid_from ?? null,
                    });
                }
            }
        }
        return map;
    }, [resourcesMap, organizationId]);

    // ========================================================================
    // Build list item data
    // ========================================================================

    const recipeListData: RecipeCardData[] = recipes.map(recipe => ({
        recipe,
        resources: resourcesMap[recipe.id] || { materials: [], labor: [], externalServices: [] },
        isOwn: recipe.organization_id === organizationId,
    }));

    // Price update handler — refresh data after price change
    const handlePriceUpdated = useCallback((_materialId: string, _newPrice: number) => {
        router.refresh();
    }, [router]);

    // Calculate grand total for a recipe (used in list items)
    const getRecipeGrandTotal = useCallback((data: RecipeCardData): number => {
        const { resources } = data;
        const materialsTotal = resources.materials.reduce((sum, item) => {
            const priceInfo = materialPriceMap?.get(item.material_id);
            if (!priceInfo) return sum;
            const totalQty = item.total_quantity ?? item.quantity * (1 + (item.waste_percentage || 0) / 100);
            return sum + totalQty * priceInfo.effectiveUnitPrice;
        }, 0);
        const laborTotal = resources.labor.reduce((sum, item) => {
            const priceInfo = laborPriceMap?.get(item.labor_type_id);
            if (!priceInfo) return sum;
            return sum + item.quantity * priceInfo.unitPrice;
        }, 0);
        const externalServicesTotal = (resources.externalServices || []).reduce((sum, item) => {
            return sum + (item.unit_price || 0);
        }, 0);
        return materialsTotal + laborTotal + externalServicesTotal;
    }, [materialPriceMap, laborPriceMap, externalServicePriceMap]);

    // Get the oldest price date across all resources of a recipe (for freshness semaphore)
    const getOldestPriceDate = useCallback((data: RecipeCardData): string | null => {
        const { resources } = data;
        const dates: string[] = [];

        for (const item of resources.materials) {
            const priceInfo = materialPriceMap?.get(item.material_id);
            if (priceInfo?.priceValidFrom) dates.push(priceInfo.priceValidFrom);
        }
        for (const item of resources.labor) {
            const priceInfo = laborPriceMap?.get(item.labor_type_id);
            if (priceInfo?.priceValidFrom) dates.push(priceInfo.priceValidFrom);
        }
        for (const es of (resources.externalServices || [])) {
            const priceInfo = externalServicePriceMap?.get(es.id);
            if (priceInfo?.priceValidFrom) dates.push(priceInfo.priceValidFrom);
        }

        if (dates.length === 0) return null;
        dates.sort(); // ISO strings sort lexicographically
        return dates[0]; // oldest date
    }, [materialPriceMap, laborPriceMap, externalServicePriceMap]);

    // ========================================================================
    // Selected recipe for detail view
    // ========================================================================

    const selectedData = selectedRecipeId
        ? recipeListData.find(d => d.recipe.id === selectedRecipeId)
        : null;

    // If selected recipe was deleted or no longer exists, go back to list
    useEffect(() => {
        if (selectedRecipeId && !selectedData) {
            setSelectedRecipeId(null);
        }
    }, [selectedRecipeId, selectedData]);

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
                        docsPath="/docs/tareas/recetas"
                    />
                </div>
            </>
        );
    }

    // ========================================================================
    // Render — Detail View (selected recipe)
    // ========================================================================

    if (selectedRecipeId && selectedData) {
        const displayName = selectedData.recipe.name
            || (selectedData.isOwn ? "Receta sin nombre" : selectedData.recipe.org_name || "Receta Anónima");

        return (
            <div className="h-full flex flex-col">
                <Toolbar
                    portalToHeader
                    mobileShowSearch={false}
                    leftActions={
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedRecipeId(null)}
                                className="gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Recetas
                            </Button>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                            <div className="flex items-center gap-1.5 min-w-0">
                                <div className={cn(
                                    "shrink-0 flex items-center justify-center h-5 w-5 rounded",
                                    selectedData.isOwn
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    {selectedData.isOwn ? (
                                        <Building2 className="h-3 w-3" />
                                    ) : (
                                        <Globe className="h-3 w-3" />
                                    )}
                                </div>
                                <span className="font-medium text-sm truncate">
                                    {displayName}
                                </span>
                            </div>
                        </div>
                    }
                    actions={[
                        {
                            label: "Agregar Recurso",
                            icon: Plus,
                            onClick: () => handleAddResource(selectedRecipeId),
                        },
                    ]}
                />

                {/* ── Check if recipe has resources ── */}
                {(() => {
                    const { resources } = selectedData;
                    const totalResources = resources.materials.length + resources.labor.length + (resources.externalServices || []).length;

                    // ── Empty state: no resources yet ──
                    if (totalResources === 0) {
                        return (
                            <div className="flex-1 flex items-center justify-center">
                                <ViewEmptyState
                                    mode="empty"
                                    icon={Layers}
                                    viewName="Recursos de la Receta"
                                    featureDescription="Agregá materiales, mano de obra o servicios subcontratados para componer el costo de esta receta."
                                    onAction={() => handleAddResource(selectedRecipeId!)}
                                    actionLabel="Agregar Recurso"
                                />
                            </div>
                        );
                    }

                    // ── Has resources: show KPI cards + RecipeCard ──
                    const materialsTotal = resources.materials.reduce((sum, item) => {
                        const priceInfo = materialPriceMap?.get(item.material_id);
                        if (!priceInfo) return sum;
                        const totalQty = item.total_quantity ?? item.quantity * (1 + (item.waste_percentage || 0) / 100);
                        return sum + totalQty * priceInfo.effectiveUnitPrice;
                    }, 0);
                    const laborTotal = resources.labor.reduce((sum, item) => {
                        const priceInfo = laborPriceMap?.get(item.labor_type_id);
                        if (!priceInfo) return sum;
                        return sum + item.quantity * priceInfo.unitPrice;
                    }, 0);
                    const externalServicesTotal = (resources.externalServices || []).reduce((sum, item) => {
                        return sum + (item.unit_price || 0);
                    }, 0);
                    const equipmentTotal = 0; // placeholder
                    const grandTotal = materialsTotal + laborTotal + externalServicesTotal + equipmentTotal;

                    const materialsPct = grandTotal > 0 ? (materialsTotal / grandTotal) * 100 : 0;
                    const laborPct = grandTotal > 0 ? (laborTotal / grandTotal) * 100 : 0;
                    const externalServicesPct = grandTotal > 0 ? (externalServicesTotal / grandTotal) * 100 : 0;
                    const equipmentPct = grandTotal > 0 ? (equipmentTotal / grandTotal) * 100 : 0;

                    return (
                        <>
                            <StatCardGroup columns={4} className="mb-4">
                                {/* ── Costo Total (first position) ── */}
                                <StatCard
                                    title="Costo Total"
                                    subtitle={task.unit_name ? `por ${task.unit_name}` : "por unidad"}
                                    icon={DollarSign}
                                    compact
                                >
                                    <div className="px-4 py-3 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                                            {grandTotal > 0 ? formatCurrency(grandTotal) : "$0"}
                                            {task.unit_symbol && (
                                                <span className="text-lg font-semibold text-muted-foreground ml-1">
                                                    / {task.unit_symbol.toUpperCase()}
                                                </span>
                                            )}
                                        </span>
                                        {grandTotal > 0 && (
                                            <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <span className="h-2 w-2 rounded-sm bg-[#C48B6A]" />
                                                    Mat. {formatCurrency(materialsTotal)}
                                                </span>
                                                <span className="text-border">·</span>
                                                <span className="flex items-center gap-1">
                                                    <span className="h-2 w-2 rounded-sm bg-[#9B8E8A]" />
                                                    M.O. {formatCurrency(laborTotal)}
                                                </span>
                                                {externalServicesTotal > 0 && (
                                                    <>
                                                        <span className="text-border">·</span>
                                                        <span className="flex items-center gap-1">
                                                            <span className="h-2 w-2 rounded-sm bg-[#C4B590]" />
                                                            Serv. {formatCurrency(externalServicesTotal)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </StatCard>

                                {/* ── Composición de Costos (2 cols) ── */}
                                <StatCard
                                    title="Composición"
                                    subtitle="Distribución por categoría"
                                    icon={Layers}
                                    compact
                                    className="col-span-1 sm:col-span-2"
                                >
                                    <div className="px-4 py-3 space-y-3">
                                        {/* Stacked bar */}
                                        <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                                            {materialsPct > 0 && (
                                                <div
                                                    className="h-full bg-[#C48B6A] transition-all duration-500"
                                                    style={{ width: `${materialsPct}%` }}
                                                />
                                            )}
                                            {laborPct > 0 && (
                                                <div
                                                    className="h-full bg-[#9B8E8A] transition-all duration-500"
                                                    style={{ width: `${laborPct}%` }}
                                                />
                                            )}
                                            {equipmentPct > 0 && (
                                                <div
                                                    className="h-full bg-[#8A9A7B] transition-all duration-500"
                                                    style={{ width: `${equipmentPct}%` }}
                                                />
                                            )}
                                            {externalServicesPct > 0 && (
                                                <div
                                                    className="h-full bg-[#C4B590] transition-all duration-500"
                                                    style={{ width: `${externalServicesPct}%` }}
                                                />
                                            )}
                                        </div>

                                        {/* Legend */}
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="h-2.5 w-2.5 rounded-sm bg-[#C48B6A]" />
                                                    <span className="text-xs text-muted-foreground">Materiales</span>
                                                </div>
                                                <span className="text-xs font-semibold tabular-nums">
                                                    {materialsTotal > 0 ? `${formatCurrency(materialsTotal)} (${materialsPct.toFixed(0)}%)` : "—"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="h-2.5 w-2.5 rounded-sm bg-[#9B8E8A]" />
                                                    <span className="text-xs text-muted-foreground">Mano de Obra</span>
                                                </div>
                                                <span className="text-xs font-semibold tabular-nums">
                                                    {laborTotal > 0 ? `${formatCurrency(laborTotal)} (${laborPct.toFixed(0)}%)` : "—"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="h-2.5 w-2.5 rounded-sm bg-[#8A9A7B] opacity-40" />
                                                    <span className="text-xs text-muted-foreground/50">Equipos</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground/40">—</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={cn("h-2.5 w-2.5 rounded-sm bg-[#C4B590]", externalServicesTotal === 0 && "opacity-40")} />
                                                    <span className={cn("text-xs text-muted-foreground", externalServicesTotal === 0 && "text-muted-foreground/50")}>Servicios Ext.</span>
                                                </div>
                                                <span className={cn("text-xs", externalServicesTotal > 0 ? "font-semibold tabular-nums" : "text-muted-foreground/40")}>
                                                    {externalServicesTotal > 0 ? `${formatCurrency(externalServicesTotal)} (${externalServicesPct.toFixed(0)}%)` : "—"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </StatCard>

                                {/* ── Recursos ── */}
                                <StatCard
                                    title="Recursos"
                                    subtitle={`${totalResources} componente${totalResources !== 1 ? "s" : ""}`}
                                    icon={Layers}
                                    compact
                                >
                                    <div className="px-4 py-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Package className="h-3.5 w-3.5 text-[#C48B6A]" />
                                                <span className="text-xs text-muted-foreground">Materiales</span>
                                            </div>
                                            <span className="text-sm font-semibold tabular-nums">
                                                {resources.materials.length}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <HardHat className="h-3.5 w-3.5 text-[#9B8E8A]" />
                                                <span className="text-xs text-muted-foreground">Mano de Obra</span>
                                            </div>
                                            <span className="text-sm font-semibold tabular-nums">
                                                {resources.labor.length}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Handshake className={cn("h-3.5 w-3.5 text-[#C4B590]", (resources.externalServices || []).length === 0 && "opacity-40")} />
                                                <span className={cn("text-xs text-muted-foreground", (resources.externalServices || []).length === 0 && "opacity-40")}>Subcontrato</span>
                                            </div>
                                            <span className={cn("text-sm tabular-nums", (resources.externalServices || []).length > 0 ? "font-semibold" : "text-xs text-muted-foreground opacity-40")}>
                                                {(resources.externalServices || []).length > 0 ? (resources.externalServices || []).length : "—"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between opacity-40">
                                            <div className="flex items-center gap-1.5">
                                                <Wrench className="h-3.5 w-3.5 text-[#8A9A7B]" />
                                                <span className="text-xs text-muted-foreground">Equipos</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">—</span>
                                        </div>
                                    </div>
                                </StatCard>
                            </StatCardGroup>

                            {/* Full recipe detail — resource lanes grouped by type */}
                            <RecipeCard
                                data={selectedData}
                                materialPriceMap={materialPriceMap}
                                laborPriceMap={laborPriceMap}
                                externalServicePriceMap={externalServicePriceMap}
                                onEditMaterial={handleEditMaterial}
                                onUpdateMaterialQuantity={handleUpdateMaterialQuantity}
                                onUpdateMaterialWaste={handleUpdateMaterialWaste}
                                onRemoveMaterial={handleRemoveMaterial}
                                onEditLabor={handleEditLabor}
                                onUpdateLaborQuantity={handleUpdateLaborQuantity}
                                onRemoveLabor={handleRemoveLabor}
                                onEditExternalService={handleEditExternalService}
                                onRemoveExternalService={handleRemoveExternalService}
                                onPriceUpdated={handlePriceUpdated}
                            />
                        </>
                    );
                })()}
            </div>
        );
    }

    // ========================================================================
    // Render — List View (all recipes)
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

            {(() => {
                // Classify recipes based on resource composition
                const ownRecipes = recipeListData.filter(d => {
                    const esCount = (d.resources.externalServices || []).length;
                    return esCount === 0;
                });
                const subcontractedRecipes = recipeListData.filter(d => {
                    const esCount = (d.resources.externalServices || []).length;
                    return esCount > 0;
                });

                /** Get the right icon based on resource composition */
                const getRecipeIcon = (data: typeof recipeListData[number]) => {
                    const hasMaterials = data.resources.materials.length > 0;
                    const hasLabor = data.resources.labor.length > 0;
                    const hasES = (data.resources.externalServices || []).length > 0;

                    if (hasES) return Handshake;
                    if (hasMaterials && hasLabor) return Wrench;
                    if (hasLabor) return HardHat;
                    if (hasMaterials) return Package;
                    return Layers; // empty recipe
                };

                /** Get a descriptive subtitle based on composition */
                const getCompositionLabel = (data: typeof recipeListData[number]) => {
                    const matCount = data.resources.materials.length;
                    const laborCount = data.resources.labor.length;
                    const esCount = (data.resources.externalServices || []).length;
                    const parts: string[] = [];
                    if (matCount > 0) parts.push(`${matCount} mat.`);
                    if (laborCount > 0) parts.push(`${laborCount} m.o.`);
                    if (esCount > 0) parts.push(`${esCount} serv.`);
                    if (parts.length === 0) return "Sin recursos";
                    return parts.join(" · ");
                };

                const renderRecipeItem = (data: typeof recipeListData[number]) => {
                    const { recipe, resources, isOwn } = data;
                    const displayName = recipe.name
                        || (isOwn ? "Receta sin nombre" : recipe.org_name || "Receta Anónima");
                    const grandTotal = getRecipeGrandTotal(data);
                    const RecipeIcon = getRecipeIcon(data);

                    return (
                        <div
                            key={recipe.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedRecipeId(recipe.id)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedRecipeId(recipe.id); } }}
                            className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-lg border bg-sidebar",
                                "hover:bg-muted/50 transition-colors text-left cursor-pointer",
                                "group"
                            )}
                        >
                            {/* Smart Icon */}
                            <div className={cn(
                                "shrink-0 flex items-center justify-center h-10 w-10 rounded-lg",
                                isOwn
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground"
                            )}>
                                <RecipeIcon className="h-5 w-5" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm leading-tight truncate">
                                    {displayName}
                                </h3>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {getCompositionLabel(data)}
                                    {recipe.region && ` · ${recipe.region}`}
                                </p>
                            </div>

                            {/* Badges */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                {/* Status badge */}
                                {recipe.status === "draft" && (
                                    <Badge variant="secondary" className="text-xs text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1">
                                        <Circle className="h-2 w-2 fill-current" />
                                        Borrador
                                    </Badge>
                                )}
                                {recipe.status === "archived" && (
                                    <Badge variant="secondary" className="text-xs text-muted-foreground gap-1">
                                        <Circle className="h-2 w-2 fill-current" />
                                        Archivada
                                    </Badge>
                                )}
                                {recipe.is_public && (
                                    <Badge variant="outline" className="text-xs gap-1">
                                        <Eye className="h-3 w-3" />
                                        Pública
                                    </Badge>
                                )}
                                {recipe.rating_avg != null && recipe.rating_count > 0 && (
                                    <Badge variant="outline" className="text-xs gap-1">
                                        <Star className="h-3 w-3 text-yellow-500" />
                                        {recipe.rating_avg.toFixed(1)}
                                    </Badge>
                                )}
                            </div>

                            {/* Grand total + freshness */}
                            {grandTotal > 0 && (
                                <span className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-foreground tabular-nums shrink-0">
                                    <FreshnessDot validFrom={getOldestPriceDate(data)} />
                                    {formatCurrency(grandTotal)}
                                </span>
                            )}

                            {/* Actions dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditRecipe(recipe.id, displayName);
                                        }}
                                    >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {recipe.status !== "draft" && (
                                        <DropdownMenuItem
                                            onClick={(e) => { e.stopPropagation(); handleStatusChangeRecipe(recipe.id, "draft"); }}
                                        >
                                            <Circle className="mr-2 h-3 w-3 fill-amber-500 text-amber-500" />
                                            Marcar como Borrador
                                        </DropdownMenuItem>
                                    )}
                                    {recipe.status !== "active" && (
                                        <DropdownMenuItem
                                            onClick={(e) => { e.stopPropagation(); handleStatusChangeRecipe(recipe.id, "active"); }}
                                        >
                                            <Circle className="mr-2 h-3 w-3 fill-emerald-500 text-emerald-500" />
                                            Marcar como Activa
                                        </DropdownMenuItem>
                                    )}
                                    {recipe.status !== "archived" && (
                                        <DropdownMenuItem
                                            onClick={(e) => { e.stopPropagation(); handleStatusChangeRecipe(recipe.id, "archived"); }}
                                        >
                                            <Circle className="mr-2 h-3 w-3 fill-muted-foreground text-muted-foreground" />
                                            Archivar
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteRecipe(recipe.id);
                                        }}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                };

                // Both categories exist — show separated
                const showBothSections = ownRecipes.length > 0 && subcontractedRecipes.length > 0;

                return (
                    <div className="space-y-6">
                        {/* Own execution recipes */}
                        {ownRecipes.length > 0 && (
                            <div className="space-y-2">
                                {showBothSections && (
                                    <div className="flex items-center gap-2 px-1 mb-1">
                                        <Wrench className="h-3.5 w-3.5 text-primary" />
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Ejecución Propia
                                        </span>
                                        <div className="flex-1 border-t border-border/50" />
                                    </div>
                                )}
                                {ownRecipes.map(renderRecipeItem)}
                            </div>
                        )}

                        {/* Subcontracted recipes */}
                        {subcontractedRecipes.length > 0 && (
                            <div className="space-y-2">
                                {showBothSections && (
                                    <div className="flex items-center gap-2 px-1 mb-1">
                                        <Handshake className="h-3.5 w-3.5 text-amber-500" />
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Subcontratadas
                                        </span>
                                        <div className="flex-1 border-t border-border/50" />
                                    </div>
                                )}
                                {subcontractedRecipes.map(renderRecipeItem)}
                            </div>
                        )}
                    </div>
                );
            })()}
        </>
    );
}
