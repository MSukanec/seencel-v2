"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { usePanel } from "@/stores/panel-store";
import { PageHeaderActionPortal } from "@/components/layout";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
    Package,
    Plus,
    HardHat,
    Wrench,
    Handshake,
    DollarSign,
    Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
    updateRecipeMaterial,
    deleteRecipeMaterial,
    updateRecipeLabor,
    deleteRecipeLabor,
    deleteRecipeExternalService,
} from "@/features/tasks/actions";
import type { EditResourceData } from "@/features/tasks/forms/tasks-recipe-resource-form";
import type { TaskView, TaskRecipeView, RecipeResources } from "@/features/tasks/types";
import { RecipeCard } from "@/features/tasks/components/recipe-card";
import type { RecipeCardData, MaterialPriceInfo, LaborPriceInfo, ExternalServicePriceInfo } from "@/features/tasks/components/recipe-card";
import { cn } from "@/lib/utils";
import { ContentCard } from "@/components/cards";

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

export interface TasksRecipeDetailViewProps {
    task: TaskView;
    recipe: TaskRecipeView;
    resources: RecipeResources;
    organizationId: string;
    catalogMaterials?: CatalogMaterialOption[];
    catalogLaborTypes?: { id: string; name: string; unit_id?: string | null; unit_name?: string | null; unit_symbol?: string | null; category_name?: string | null; level_name?: string | null; role_name?: string | null; current_price?: number | null; currency_id?: string | null; currency_symbol?: string | null; price_valid_from?: string | null }[];
    currencies?: { id: string; code: string; symbol: string; name: string }[];
    contacts?: { id: string; full_name: string; company_name?: string | null }[];
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

export function TasksRecipeDetailView({
    task,
    recipe,
    resources: serverResources,
    organizationId,
    catalogMaterials = [],
    catalogLaborTypes = [],
    currencies = [],
    contacts = [],
}: TasksRecipeDetailViewProps) {
    const router = useRouter();
    const { openPanel } = usePanel();

    // Local state — synced with server props
    const [resources, setResources] = useState(serverResources);

    const isOwn = recipe.organization_id === organizationId;

    // ── Build RecipeCardData for the RecipeCard component ──
    const recipeData: RecipeCardData = useMemo(() => ({
        recipe,
        resources,
        isOwn,
    }), [recipe, resources, isOwn]);

    // ========================================================================
    // Add Resource
    // ========================================================================

    const handleAddResource = useCallback(() => {
        const existingLaborCount = (resources.labor || []).length;
        const existingMaterialsCount = (resources.materials || []).length;

        openPanel('tasks-recipe-resource-form', {
            recipeId: recipe.id,
            materials: catalogMaterials,
            laborTypes: catalogLaborTypes,
            currencies,
            contacts,
            existingLaborCount,
            existingMaterialsCount,
        });
    }, [recipe.id, catalogMaterials, catalogLaborTypes, currencies, contacts, openPanel, resources]);

    // ========================================================================
    // Edit Resource Handlers
    // ========================================================================

    const handleEditMaterial = useCallback((itemId: string) => {
        const foundItem = resources.materials.find(m => m.id === itemId);
        if (!foundItem) return;

        const editData: EditResourceData = {
            itemId: foundItem.id,
            resourceType: "material",
            selectedId: foundItem.material_id,
            quantity: foundItem.quantity,
            notes: foundItem.notes,
            wastePercentage: foundItem.waste_percentage,
        };

        openPanel('tasks-recipe-resource-form', {
            recipeId: recipe.id,
            materials: catalogMaterials,
            laborTypes: catalogLaborTypes,
            currencies,
            contacts,
            editData,
        });
    }, [recipe.id, catalogMaterials, catalogLaborTypes, currencies, contacts, openPanel, resources]);

    const handleEditLabor = useCallback((itemId: string) => {
        const foundItem = resources.labor.find(l => l.id === itemId);
        if (!foundItem) return;

        const editData: EditResourceData = {
            itemId: foundItem.id,
            resourceType: "labor",
            selectedId: foundItem.labor_type_id,
            quantity: foundItem.quantity,
            notes: foundItem.notes,
        };

        openPanel('tasks-recipe-resource-form', {
            recipeId: recipe.id,
            materials: catalogMaterials,
            laborTypes: catalogLaborTypes,
            currencies,
            contacts,
            editData,
        });
    }, [recipe.id, catalogMaterials, catalogLaborTypes, currencies, contacts, openPanel, resources]);

    const handleEditExternalService = useCallback((itemId: string) => {
        const foundItem = (resources.externalServices || []).find(es => es.id === itemId);
        if (!foundItem) return;

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

        openPanel('tasks-recipe-resource-form', {
            recipeId: recipe.id,
            materials: catalogMaterials,
            laborTypes: catalogLaborTypes,
            currencies,
            contacts,
            editData,
        });
    }, [recipe.id, catalogMaterials, catalogLaborTypes, currencies, contacts, openPanel, resources]);

    // ========================================================================
    // Material Handlers
    // ========================================================================

    const handleUpdateMaterialQuantity = useCallback(async (itemId: string, newQuantity: number) => {
        setResources(prev => ({
            ...prev,
            materials: prev.materials.map(m =>
                m.id === itemId ? {
                    ...m,
                    quantity: newQuantity,
                    total_quantity: newQuantity * (1 + (m.waste_percentage || 0) / 100),
                } : m
            ),
        }));

        const result = await updateRecipeMaterial(itemId, { quantity: newQuantity });
        if (!result.success) {
            toast.error(result.error || "Error al actualizar");
            setResources(serverResources);
        }
    }, [serverResources]);

    const handleUpdateMaterialWaste = useCallback(async (itemId: string, wastePercentage: number) => {
        setResources(prev => ({
            ...prev,
            materials: prev.materials.map(m =>
                m.id === itemId ? {
                    ...m,
                    waste_percentage: wastePercentage,
                    total_quantity: m.quantity * (1 + wastePercentage / 100),
                } : m
            ),
        }));

        const result = await updateRecipeMaterial(itemId, { waste_percentage: wastePercentage });
        if (!result.success) {
            toast.error(result.error || "Error al actualizar merma");
            setResources(serverResources);
        }
    }, [serverResources]);

    const handleRemoveMaterial = useCallback(async (itemId: string) => {
        const previousResources = { ...resources };
        setResources(prev => ({
            ...prev,
            materials: prev.materials.filter(m => m.id !== itemId),
        }));

        const result = await deleteRecipeMaterial(itemId);
        if (!result.success) {
            toast.error("Error al eliminar material");
            setResources(previousResources);
        } else {
            toast.success("Material eliminado");
        }
    }, [resources]);

    // ========================================================================
    // Labor Handlers
    // ========================================================================

    const handleUpdateLaborQuantity = useCallback(async (itemId: string, newQuantity: number) => {
        setResources(prev => ({
            ...prev,
            labor: prev.labor.map(l =>
                l.id === itemId ? { ...l, quantity: newQuantity } : l
            ),
        }));

        const result = await updateRecipeLabor(itemId, { quantity: newQuantity });
        if (!result.success) {
            toast.error(result.error || "Error al actualizar");
            setResources(serverResources);
        }
    }, [serverResources]);

    const handleRemoveLabor = useCallback(async (itemId: string) => {
        const previousResources = { ...resources };
        setResources(prev => ({
            ...prev,
            labor: prev.labor.filter(l => l.id !== itemId),
        }));

        const result = await deleteRecipeLabor(itemId);
        if (!result.success) {
            toast.error("Error al eliminar mano de obra");
            setResources(previousResources);
        } else {
            toast.success("Mano de obra eliminada");
        }
    }, [resources]);

    // ========================================================================
    // External Service Handlers
    // ========================================================================

    const handleRemoveExternalService = useCallback(async (itemId: string) => {
        const previousResources = { ...resources };
        setResources(prev => ({
            ...prev,
            externalServices: (prev.externalServices || []).filter(es => es.id !== itemId),
        }));

        const result = await deleteRecipeExternalService(itemId);
        if (!result.success) {
            toast.error("Error al eliminar servicio externo");
            setResources(previousResources);
        } else {
            toast.success("Servicio externo eliminado");
        }
    }, [resources]);

    // ========================================================================
    // Price Maps
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
                    organizationId,
                    priceValidFrom: mat.org_price_valid_from,
                    unitSymbol: mat.unit_symbol,
                });
            }
        }
        return map;
    }, [catalogMaterials, organizationId]);

    const laborPriceMap = useMemo(() => {
        const map = new Map<string, LaborPriceInfo>();
        for (const lt of catalogLaborTypes) {
            if (lt.current_price != null && lt.current_price > 0) {
                map.set(lt.id, {
                    unitPrice: lt.current_price,
                    currencyId: lt.currency_id ?? null,
                    laborName: lt.name,
                    laborTypeId: lt.id,
                    organizationId,
                    priceValidFrom: lt.price_valid_from,
                    unitSymbol: lt.unit_symbol,
                });
            }
        }
        return map;
    }, [catalogLaborTypes, organizationId]);

    const externalServicePriceMap = useMemo(() => {
        const map = new Map<string, ExternalServicePriceInfo>();
        for (const es of (resources.externalServices || [])) {
            if (es.unit_price != null && es.unit_price > 0) {
                map.set(es.id, {
                    unitPrice: es.unit_price,
                    currencyId: es.currency_id ?? null,
                    serviceName: es.name,
                    serviceId: es.id,
                    organizationId,
                    unitSymbol: es.unit_symbol,
                    priceValidFrom: es.price_valid_from ?? null,
                });
            }
        }
        return map;
    }, [resources, organizationId]);

    const handlePriceUpdated = useCallback((_materialId: string, _newPrice: number) => {
        router.refresh();
    }, [router]);

    // ========================================================================
    // Cost Calculations
    // ========================================================================

    const totalResources = resources.materials.length + resources.labor.length + (resources.externalServices || []).length;

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



    // ========================================================================
    // Render
    // ========================================================================

    return (
        <div className="h-full flex flex-col">
            <PageHeaderActionPortal>
                <Button onClick={handleAddResource} size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Agregar Recurso
                </Button>
            </PageHeaderActionPortal>

            {/* ── Empty state: no resources yet ── */}
            {totalResources === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={Layers}
                        viewName="Recursos de la Receta"
                        featureDescription="Agregá materiales, mano de obra o servicios subcontratados para componer el costo de esta receta."
                        onAction={handleAddResource}
                        actionLabel="Agregar Recurso"
                    />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* ── Costo Total ── */}
                        <ContentCard
                            title="Costo Total"
                            description={task.unit_name ? `por ${task.unit_name}` : "por unidad"}
                            icon={<DollarSign className="h-4 w-4" />}
                            compact
                            value={
                                <span className="flex items-baseline gap-1">
                                    {grandTotal > 0 ? formatCurrency(grandTotal) : "$0"}
                                    {task.unit_symbol && (
                                        <span className="text-lg font-semibold text-muted-foreground">
                                            / {task.unit_symbol.toUpperCase()}
                                        </span>
                                    )}
                                </span>
                            }
                            footer={grandTotal > 0 ? (
                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
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
                            ) : undefined}
                        >
                            {/* value-only card, no additional content */}
                            <></>
                        </ContentCard>

                        {/* ── Composición de Costos (2 cols) ── */}
                        <ContentCard
                            title="Composición"
                            description="Distribución por categoría"
                            icon={<Layers className="h-4 w-4" />}
                            compact
                            className="sm:col-span-2"
                        >
                            <div className="space-y-3">
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
                        </ContentCard>

                        {/* ── Recursos ── */}
                        <ContentCard
                            title="Recursos"
                            description={`${totalResources} componente${totalResources !== 1 ? "s" : ""}`}
                            icon={<Layers className="h-4 w-4" />}
                            compact
                        >
                            <div className="space-y-2">
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
                        </ContentCard>
                    </div>

                    {/* Full recipe detail — resource lanes grouped by type */}
                    <RecipeCard
                        data={recipeData}
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
            )}
        </div>
    );
}
