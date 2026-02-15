"use client";

// ============================================================================
// RECIPE CARD — Resource Lanes Wrapper
// ============================================================================
// Simple container that groups RecipeResourceListItems by type
// (Materials, Labor, Equipment, Subcontracts) with lane headers
// showing item count and subtotal.
// ============================================================================

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Package, HardHat, Wrench, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskRecipeView, RecipeResources } from "@/features/tasks/types";
import { type PricePulseData } from "@/components/shared/price-pulse-popover";
import { RecipeResourceListItem } from "@/components/shared/list-item/items/recipe-resource-list-item";

// ============================================================================
// Types (re-exported for compatibility)
// ============================================================================

export interface RecipeCardData {
    recipe: TaskRecipeView;
    resources: RecipeResources;
    isOwn: boolean;
}

export interface MaterialPriceInfo {
    effectiveUnitPrice: number;
    currencyId: string | null;
    materialName: string;
    materialCode?: string | null;
    materialId: string;
    organizationId: string;
    priceValidFrom?: string | null;
    unitSymbol?: string | null;
}

export interface LaborPriceInfo {
    unitPrice: number;
    currencyId: string | null;
    laborName: string;
    laborTypeId: string;
    organizationId: string;
    priceValidFrom?: string | null;
    unitSymbol?: string | null;
}

export interface ExternalServicePriceInfo {
    unitPrice: number;
    currencyId: string | null;
    serviceName: string;
    serviceId: string;
    organizationId: string;
    priceValidFrom?: string | null;
    unitSymbol?: string | null;
}

export interface RecipeCardProps {
    data: RecipeCardData;
    materialPriceMap?: Map<string, MaterialPriceInfo>;
    laborPriceMap?: Map<string, LaborPriceInfo>;
    externalServicePriceMap?: Map<string, ExternalServicePriceInfo>;
    onUpdateMaterialQuantity?: (itemId: string, quantity: number) => void;
    onUpdateMaterialWaste?: (itemId: string, wastePercentage: number) => void;
    onRemoveMaterial?: (itemId: string) => void;
    onUpdateLaborQuantity?: (itemId: string, quantity: number) => void;
    onRemoveLabor?: (itemId: string) => void;
    onUpdateExternalServiceQuantity?: (itemId: string, quantity: number) => void;
    onRemoveExternalService?: (itemId: string) => void;
    onPriceUpdated?: (resourceId: string, newPrice: number) => void;
    className?: string;
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
// RecipeCard — Main Component
// ============================================================================

export function RecipeCard({
    data,
    materialPriceMap,
    laborPriceMap,
    externalServicePriceMap,
    onUpdateMaterialQuantity,
    onUpdateMaterialWaste,
    onRemoveMaterial,
    onUpdateLaborQuantity,
    onRemoveLabor,
    onUpdateExternalServiceQuantity,
    onRemoveExternalService,
    onPriceUpdated,
    className,
}: RecipeCardProps) {
    const { resources, isOwn } = data;

    // ── Cost calculations ──
    const costs = useMemo(() => {
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
            const priceInfo = externalServicePriceMap?.get(item.external_service_id);
            if (!priceInfo) return sum;
            return sum + item.quantity * priceInfo.unitPrice;
        }, 0);

        return { materialsTotal, laborTotal, externalServicesTotal };
    }, [resources, materialPriceMap, laborPriceMap, externalServicePriceMap]);

    return (
        <div className={cn("space-y-3", className)}>

            {/* MATERIALS LANE */}
            {resources.materials.length > 0 && (
                <ResourceLane
                    title="Materiales"
                    icon={<Package className="h-4 w-4" />}
                    count={resources.materials.length}
                    subtotal={costs.materialsTotal}
                    accentColor="text-[#C48B6A]"
                >
                    {resources.materials.map((item) => {
                        const priceInfo = materialPriceMap?.get(item.material_id);
                        const pricePulseData: PricePulseData | null = priceInfo ? {
                            resourceType: "material",
                            resourceId: priceInfo.materialId,
                            resourceName: priceInfo.materialName,
                            resourceCode: priceInfo.materialCode,
                            organizationId: priceInfo.organizationId,
                            currencyId: priceInfo.currencyId,
                            effectiveUnitPrice: priceInfo.effectiveUnitPrice,
                            priceValidFrom: priceInfo.priceValidFrom,
                            unitSymbol: priceInfo.unitSymbol,
                            icon: Package,
                        } : null;

                        return (
                            <RecipeResourceListItem
                                key={item.id}
                                variant="material"
                                id={item.id}
                                name={item.material_name || "Material"}
                                code={item.material_code}
                                unitSymbol={item.unit_symbol || item.unit_name}
                                unitName={item.unit_name}
                                isOwn={isOwn}
                                isOptional={item.is_optional}
                                quantity={item.quantity}
                                onUpdateQuantity={(id, val) => onUpdateMaterialQuantity?.(id, val)}
                                wastePercentage={item.waste_percentage}
                                totalQuantity={item.total_quantity}
                                onUpdateWaste={(id, val) => onUpdateMaterialWaste?.(id, val)}
                                unitPrice={priceInfo?.effectiveUnitPrice}
                                priceValidFrom={priceInfo?.priceValidFrom}
                                pricePulseData={pricePulseData}
                                onPriceUpdated={onPriceUpdated}
                                onRemove={(id) => onRemoveMaterial?.(id)}
                                resourceId={item.material_id}
                            />
                        );
                    })}
                </ResourceLane>
            )}

            {/* LABOR LANE */}
            {resources.labor.length > 0 && (
                <ResourceLane
                    title="Mano de Obra"
                    icon={<HardHat className="h-4 w-4" />}
                    count={resources.labor.length}
                    subtotal={costs.laborTotal}
                    accentColor="text-[#9B8E8A]"
                >
                    {resources.labor.map((item) => {
                        const priceInfo = laborPriceMap?.get(item.labor_type_id);
                        const pricePulseData: PricePulseData | null = priceInfo ? {
                            resourceType: "labor",
                            resourceId: priceInfo.laborTypeId,
                            resourceName: priceInfo.laborName,
                            organizationId: priceInfo.organizationId,
                            currencyId: priceInfo.currencyId,
                            effectiveUnitPrice: priceInfo.unitPrice,
                            priceValidFrom: priceInfo.priceValidFrom,
                            unitSymbol: priceInfo.unitSymbol,
                            icon: HardHat,
                        } : null;

                        return (
                            <RecipeResourceListItem
                                key={item.id}
                                variant="labor"
                                id={item.id}
                                name={item.labor_name || "Mano de obra"}
                                unitSymbol={item.unit_symbol || item.unit_name}
                                unitName={item.unit_name}
                                isOwn={isOwn}
                                isOptional={item.is_optional}
                                quantity={item.quantity}
                                onUpdateQuantity={(id, val) => onUpdateLaborQuantity?.(id, val)}
                                unitPrice={priceInfo?.unitPrice}
                                priceValidFrom={priceInfo?.priceValidFrom}
                                pricePulseData={pricePulseData}
                                onPriceUpdated={onPriceUpdated}
                                onRemove={(id) => onRemoveLabor?.(id)}
                                resourceId={item.labor_type_id}
                            />
                        );
                    })}
                </ResourceLane>
            )}

            {/* EXTERNAL SERVICES LANE */}
            {(resources.externalServices || []).length > 0 && (
                <ResourceLane
                    title="Servicios Externos"
                    icon={<FileText className="h-4 w-4" />}
                    count={resources.externalServices.length}
                    subtotal={costs.externalServicesTotal}
                    accentColor="text-[#C4B590]"
                >
                    {resources.externalServices.map((item) => {
                        const priceInfo = externalServicePriceMap?.get(item.external_service_id);
                        const pricePulseData: PricePulseData | null = priceInfo ? {
                            resourceType: "external_service",
                            resourceId: priceInfo.serviceId,
                            resourceName: priceInfo.serviceName,
                            organizationId: priceInfo.organizationId,
                            currencyId: priceInfo.currencyId,
                            effectiveUnitPrice: priceInfo.unitPrice,
                            priceValidFrom: priceInfo.priceValidFrom,
                            unitSymbol: priceInfo.unitSymbol,
                            icon: FileText,
                        } : null;

                        return (
                            <RecipeResourceListItem
                                key={item.id}
                                variant="subcontract"
                                id={item.id}
                                name={item.service_name || "Servicio"}
                                unitSymbol={item.unit_symbol || item.unit_name}
                                unitName={item.unit_name}
                                isOwn={isOwn}
                                isOptional={item.is_optional}
                                quantity={item.quantity}
                                onUpdateQuantity={(id, val) => onUpdateExternalServiceQuantity?.(id, val)}
                                unitPrice={priceInfo?.unitPrice}
                                priceValidFrom={priceInfo?.priceValidFrom}
                                pricePulseData={pricePulseData}
                                onPriceUpdated={onPriceUpdated}
                                onRemove={(id) => onRemoveExternalService?.(id)}
                                resourceId={item.external_service_id}
                            />
                        );
                    })}
                </ResourceLane>
            )}

            {/* EQUIPOS LANE (coming soon) */}
        </div>
    );
}


// ============================================================================
// ResourceLane — Group header + items for a resource type
// ============================================================================

function ResourceLane({
    title,
    icon,
    count,
    subtotal,
    accentColor,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    count: number;
    subtotal: number;
    accentColor: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            {/* Lane Header */}
            <div className="flex items-center gap-2.5 px-1 py-2">
                <div className={cn("flex items-center gap-2", accentColor)}>
                    {icon}
                    <span className="text-sm font-semibold">{title}</span>
                </div>
                <Badge
                    variant="secondary"
                    className="text-[10px] h-5 px-1.5"
                >
                    {count}
                </Badge>
                {subtotal > 0 && (
                    <span className="ml-auto font-semibold text-sm tabular-nums text-muted-foreground">
                        {formatCurrency(subtotal)}
                    </span>
                )}
            </div>

            {/* Resource items — stacked cards with gap */}
            <div className="space-y-1.5">
                {children}
            </div>
        </div>
    );
}
