"use client";

import { memo, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from "@/components/ui/collapsible";
import {
    ChevronDown,
    Building2,
    Eye,
    EyeOff,
    Star,
    Package,
    Plus,
    Trash2,
    MoreHorizontal,
    Globe,
    Hammer,
    HardHat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskRecipeView, TaskRecipeMaterial, TaskRecipeLabor, RecipeResources } from "@/features/tasks/types";
import { PricePulsePopover, FreshnessDot, ResourcePriceDisplay, type PricePulseData } from "@/components/shared/price-pulse-popover";

// ============================================================================
// Types
// ============================================================================

export interface RecipeListItemData {
    recipe: TaskRecipeView;
    resources: RecipeResources;
    /** Whether this recipe belongs to the current org (editable) */
    isOwn: boolean;
}

/** Price info for a material — effectiveUnitPrice = org_unit_price / sale_unit_qty */
export interface MaterialPriceInfo {
    effectiveUnitPrice: number;
    currencyId: string | null;
    /** For Price Pulse popover */
    materialName: string;
    materialCode?: string | null;
    materialId: string;
    organizationId: string;
    priceValidFrom?: string | null;
    unitSymbol?: string | null;
}

/** Price info for a labor type */
export interface LaborPriceInfo {
    unitPrice: number;
    currencyId: string | null;
    laborName: string;
    laborTypeId: string;
    organizationId: string;
    priceValidFrom?: string | null;
    unitSymbol?: string | null;
}

export interface RecipeListItemProps {
    data: RecipeListItemData;
    /** Whether to start expanded */
    defaultOpen?: boolean;
    /** Material price lookup: material_id → { effectiveUnitPrice, currencyId } */
    materialPriceMap?: Map<string, MaterialPriceInfo>;
    laborPriceMap?: Map<string, LaborPriceInfo>;
    /** Unit name of the task (e.g. M2) — shown in the grand total */
    taskUnitName?: string;
    /** Callback to add a resource — opens unified resource form */
    onAddResource?: (recipeId: string) => void;
    /** Callback to update a material's quantity */
    onUpdateMaterialQuantity?: (itemId: string, quantity: number) => void;
    /** Callback to update a material's waste percentage */
    onUpdateMaterialWaste?: (itemId: string, wastePercentage: number) => void;
    /** Callback to remove a material */
    onRemoveMaterial?: (itemId: string) => void;
    /** Callback to update a labor's quantity */
    onUpdateLaborQuantity?: (itemId: string, quantity: number) => void;
    /** Callback to remove a labor item */
    onRemoveLabor?: (itemId: string) => void;
    /** Callback to toggle recipe visibility */
    onToggleVisibility?: (recipeId: string, isPublic: boolean) => void;
    /** Callback to delete this recipe */
    onDeleteRecipe?: (recipeId: string) => void;
    /** Callback when a material price is updated via Price Pulse */
    onPriceUpdated?: (materialId: string, newPrice: number) => void;
}

// ============================================================================
// Component
// ============================================================================

export const RecipeListItem = memo(function RecipeListItem({
    data,
    defaultOpen = false,
    materialPriceMap,
    laborPriceMap,
    taskUnitName,
    onAddResource,
    onUpdateMaterialQuantity,
    onUpdateMaterialWaste,
    onRemoveMaterial,
    onUpdateLaborQuantity,
    onRemoveLabor,
    onToggleVisibility,
    onDeleteRecipe,
    onPriceUpdated,
}: RecipeListItemProps) {
    const { recipe, resources, isOwn } = data;
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const totalItems = resources.materials.length + resources.labor.length;

    const displayName = recipe.name
        || (isOwn ? "Receta sin nombre" : recipe.org_name || "Receta Anónima");

    const handleToggleVisibility = useCallback(() => {
        onToggleVisibility?.(recipe.id, !recipe.is_public);
    }, [onToggleVisibility, recipe.id, recipe.is_public]);

    const handleDeleteRecipe = useCallback(() => {
        onDeleteRecipe?.(recipe.id);
    }, [onDeleteRecipe, recipe.id]);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            {/* ============================================================ */}
            {/* Header (always visible) */}
            {/* ============================================================ */}
            <div
                className={cn(
                    "border rounded-lg bg-sidebar transition-colors flex items-center",
                    isOpen && "rounded-b-none border-b-0"
                )}
            >
                <CollapsibleTrigger asChild>
                    <button
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left cursor-pointer"
                        type="button"
                    >
                        {/* Icon */}
                        <div className="shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-muted/50 border">
                            {isOwn ? (
                                <Building2 className="h-5 w-5 text-primary" />
                            ) : (
                                <Globe className="h-5 w-5 text-muted-foreground" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm leading-tight truncate">
                                {displayName}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {totalItems} recurso{totalItems !== 1 ? "s" : ""}
                                {resources.materials.length > 0 && ` · ${resources.materials.length} mat.`}
                                {resources.labor.length > 0 && ` · ${resources.labor.length} m.o.`}
                                {recipe.region && ` · ${recipe.region}`}
                            </p>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 shrink-0">
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

                        {/* Grand Total next to chevron */}
                        {(() => {
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
                            const grandTotal = materialsTotal + laborTotal;
                            return grandTotal > 0 ? (
                                <span className="text-sm font-semibold text-foreground mr-1">
                                    Total: ${grandTotal.toLocaleString("es-AR", {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                    })}
                                </span>
                            ) : null;
                        })()}

                        {/* Chevron */}
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                                isOpen && "rotate-180"
                            )}
                        />
                    </button>
                </CollapsibleTrigger>
            </div>

            {/* ============================================================ */}
            {/* Expanded Content */}
            {/* ============================================================ */}
            <CollapsibleContent>
                <div className="border border-t-0 rounded-b-lg bg-sidebar/50 overflow-hidden">
                    {totalItems > 0 ? (
                        <div className="divide-y">
                            {/* ============================== */}
                            {/* Materials Section */}
                            {/* ============================== */}
                            {resources.materials.length > 0 && (() => {
                                // Calculate total cost for materials section
                                const materialsTotalCost = resources.materials.reduce((sum, item) => {
                                    const priceInfo = materialPriceMap?.get(item.material_id);
                                    if (!priceInfo) return sum;
                                    const totalQty = item.total_quantity ?? item.quantity * (1 + (item.waste_percentage || 0) / 100);
                                    return sum + totalQty * priceInfo.effectiveUnitPrice;
                                }, 0);

                                return (
                                    <ResourceSection
                                        title="Materiales"
                                        icon={<Package className="h-3.5 w-3.5" />}
                                        count={resources.materials.length}
                                        totalCost={materialsTotalCost > 0 ? materialsTotalCost : undefined}
                                    >
                                        {resources.materials.map((item) => {
                                            const priceInfo = materialPriceMap?.get(item.material_id);
                                            return (
                                                <MaterialResourceRow
                                                    key={item.id}
                                                    name={item.material_name || "Material"}
                                                    code={item.material_code}
                                                    unitSymbol={item.unit_symbol || item.unit_name}
                                                    quantity={item.quantity}
                                                    wastePercentage={item.waste_percentage}
                                                    totalQuantity={item.total_quantity}
                                                    effectiveUnitPrice={priceInfo?.effectiveUnitPrice}
                                                    notes={item.notes}
                                                    isOptional={item.is_optional}
                                                    isOwn={isOwn}
                                                    priceInfo={priceInfo}
                                                    onUpdateQuantity={(qty) => onUpdateMaterialQuantity?.(item.id, qty)}
                                                    onUpdateWaste={(pct) => onUpdateMaterialWaste?.(item.id, pct)}
                                                    onRemove={() => onRemoveMaterial?.(item.id)}
                                                    onPriceUpdated={onPriceUpdated}
                                                />
                                            );
                                        })}
                                    </ResourceSection>
                                );
                            })()}

                            {/* ============================== */}
                            {/* Labor Section */}
                            {/* ============================== */}
                            {resources.labor.length > 0 && (() => {
                                // Calculate total cost for labor section
                                const laborTotalCost = resources.labor.reduce((sum, item) => {
                                    const priceInfo = laborPriceMap?.get(item.labor_type_id);
                                    if (!priceInfo) return sum;
                                    return sum + item.quantity * priceInfo.unitPrice;
                                }, 0);

                                return (
                                    <ResourceSection
                                        title="Mano de Obra"
                                        icon={<HardHat className="h-3.5 w-3.5" />}
                                        count={resources.labor.length}
                                        totalCost={laborTotalCost > 0 ? laborTotalCost : undefined}
                                    >
                                        {resources.labor.map((item) => {
                                            const priceInfo = laborPriceMap?.get(item.labor_type_id);
                                            return (
                                                <LaborResourceRow
                                                    key={item.id}
                                                    name={item.labor_name || "Mano de obra"}
                                                    unitSymbol={item.unit_symbol || item.unit_name}
                                                    quantity={item.quantity}
                                                    unitPrice={priceInfo?.unitPrice}
                                                    priceValidFrom={priceInfo?.priceValidFrom}
                                                    notes={item.notes}
                                                    isOptional={item.is_optional}
                                                    isOwn={isOwn}
                                                    onUpdateQuantity={(qty) => onUpdateLaborQuantity?.(item.id, qty)}
                                                    onRemove={() => onRemoveLabor?.(item.id)}
                                                />
                                            );
                                        })}
                                    </ResourceSection>
                                );
                            })()}
                        </div>
                    ) : (
                        /* No resources yet — only show add row */
                        <div />
                    )}

                    {/* Add Resource Row — always visible for own recipes */}
                    {isOwn && (
                        <button
                            type="button"
                            onClick={() => onAddResource?.(recipe.id)}
                            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors cursor-pointer border-t border-dashed"
                        >
                            <Plus className="h-4 w-4" />
                            Agregar recurso
                        </button>
                    )}

                    {/* Actions Footer */}
                    {isOwn && (
                        <div className="flex items-center justify-end px-4 py-3 border-t bg-muted/20 gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleToggleVisibility}
                                className="gap-1.5 text-xs"
                            >
                                {recipe.is_public ? (
                                    <>
                                        <EyeOff className="h-3.5 w-3.5" />
                                        Hacer Privada
                                    </>
                                ) : (
                                    <>
                                        <Eye className="h-3.5 w-3.5" />
                                        Publicar
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDeleteRecipe}
                                className="gap-1.5 text-xs text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Eliminar
                            </Button>
                        </div>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
});

// ============================================================================
// Sub-Components
// ============================================================================

function ResourceSection({
    title,
    icon,
    count,
    totalCost,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    count: number;
    totalCost?: number;
    children: React.ReactNode;
}) {
    return (
        <div>
            {/* Section Header */}
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b">
                {icon}
                <span className="text-sm font-medium text-muted-foreground">
                    {title}
                </span>
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    {count}
                </Badge>
                {totalCost != null && totalCost > 0 && (
                    <span className="ml-auto font-mono text-sm font-semibold text-foreground">
                        Subtotal: ${totalCost.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                )}
            </div>
            {/* Section Rows */}
            <div className="divide-y divide-dashed">
                {children}
            </div>
        </div>
    );
}

/**
 * MaterialResourceRow — Material row with waste%, total, price × subtotal
 */
function MaterialResourceRow({
    name,
    code,
    unitSymbol,
    quantity,
    wastePercentage,
    totalQuantity,
    effectiveUnitPrice,
    notes,
    isOptional,
    isOwn,
    priceInfo,
    onUpdateQuantity,
    onUpdateWaste,
    onRemove,
    onPriceUpdated,
}: {
    name: string;
    code?: string | null;
    unitSymbol?: string | null;
    quantity: number;
    wastePercentage: number;
    totalQuantity: number;
    effectiveUnitPrice?: number;
    notes?: string | null;
    isOptional: boolean;
    isOwn: boolean;
    priceInfo?: MaterialPriceInfo;
    onUpdateQuantity: (qty: number) => void;
    onUpdateWaste: (pct: number) => void;
    onRemove: () => void;
    onPriceUpdated?: (materialId: string, newPrice: number) => void;
}) {
    const displayTotal = totalQuantity ?? quantity * (1 + (wastePercentage || 0) / 100);
    const subtotal = effectiveUnitPrice != null ? displayTotal * effectiveUnitPrice : null;

    // Build PricePulse data if available
    const pricePulseData: PricePulseData | null = priceInfo ? {
        materialId: priceInfo.materialId,
        materialName: priceInfo.materialName,
        materialCode: priceInfo.materialCode,
        organizationId: priceInfo.organizationId,
        currencyId: priceInfo.currencyId,
        effectiveUnitPrice: priceInfo.effectiveUnitPrice,
        priceValidFrom: priceInfo.priceValidFrom,
        unitSymbol: priceInfo.unitSymbol,
    } : null;

    return (
        <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/20 transition-colors">
            {/* Name — takes remaining space */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                    {name}
                </p>
                {code && (
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                        {code}
                    </p>
                )}
                {notes && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {notes}
                    </p>
                )}
            </div>
            {/* Quantity (with label prefix and unit suffix) */}
            <div className="w-40 shrink-0">
                {isOwn ? (
                    <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                            Cant.
                        </span>
                        <Input
                            type="number"
                            value={quantity || ""}
                            onChange={(e) => {
                                const newQty = parseFloat(e.target.value);
                                if (!isNaN(newQty) && newQty > 0) {
                                    onUpdateQuantity(newQty);
                                }
                            }}
                            className="h-8 w-full text-sm text-right pl-11 pr-7"
                            min="0.001"
                            step="0.001"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground pointer-events-none font-medium uppercase">
                            {unitSymbol || ""}
                        </span>
                    </div>
                ) : (
                    <span className="font-mono text-sm">
                        {quantity} <span className="text-muted-foreground text-[9px] uppercase">{unitSymbol}</span>
                    </span>
                )}
            </div>
            {/* Waste % (with label prefix and % suffix) */}
            <div className="w-40 shrink-0">
                {isOwn ? (
                    <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                            Merma
                        </span>
                        <Input
                            type="number"
                            value={wastePercentage || ""}
                            onChange={(e) => {
                                const newPct = parseFloat(e.target.value);
                                onUpdateWaste(!isNaN(newPct) ? newPct : 0);
                            }}
                            className="h-8 w-full text-sm text-right pl-14 pr-6"
                            min="0"
                            step="0.5"
                            placeholder="0"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                            %
                        </span>
                    </div>
                ) : (
                    <span className="font-mono text-sm text-muted-foreground">
                        {wastePercentage > 0 ? `${wastePercentage}%` : "—"}
                    </span>
                )}
            </div>
            {/* = Total qty */}
            <div className="w-14 shrink-0">
                <span className="font-mono text-sm font-medium">
                    {displayTotal.toFixed(2)}
                </span>
            </div>
            {/* × Price = Subtotal — uses ResourcePriceDisplay for the price part */}
            <div className="w-48 shrink-0">
                {effectiveUnitPrice != null ? (
                    <span className="flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
                        <ResourcePriceDisplay
                            price={effectiveUnitPrice}
                            priceValidFrom={priceInfo?.priceValidFrom}
                            pricePulseData={pricePulseData && isOwn ? pricePulseData : null}
                            onPriceUpdated={onPriceUpdated}
                            className="text-sm"
                        />
                        <span>
                            {" × "}
                            {displayTotal.toFixed(2)}
                            {" = "}
                            <span className="font-semibold text-foreground">
                                ${subtotal!.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                        </span>
                    </span>
                ) : (
                    <span className="text-sm text-muted-foreground/50">sin precio</span>
                )}
            </div>
            {/* Optional badge + Actions menu */}
            <div className="shrink-0 flex items-center gap-1">
                {isOptional && (
                    <Badge variant="secondary" className="text-[10px]">
                        Opc
                    </Badge>
                )}
                {isOwn && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 p-0">
                                <span className="sr-only">Acciones</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={onRemove}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
}

/**
 * LaborResourceRow — Labor row with price × qty = subtotal (no waste)
 */
function LaborResourceRow({
    name,
    unitSymbol,
    quantity,
    unitPrice,
    priceValidFrom,
    notes,
    isOptional,
    isOwn,
    onUpdateQuantity,
    onRemove,
}: {
    name: string;
    unitSymbol?: string | null;
    quantity: number;
    unitPrice?: number;
    priceValidFrom?: string | null;
    notes?: string | null;
    isOptional: boolean;
    isOwn: boolean;
    onUpdateQuantity: (qty: number) => void;
    onRemove: () => void;
}) {
    const subtotal = unitPrice != null ? quantity * unitPrice : null;

    return (
        <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/20 transition-colors">
            {/* Name — takes remaining space */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                    {name}
                </p>
                {notes && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {notes}
                    </p>
                )}
            </div>
            {/* Quantity (with label prefix and unit suffix) */}
            <div className="w-40 shrink-0">
                {isOwn ? (
                    <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                            Cant.
                        </span>
                        <Input
                            type="number"
                            value={quantity || ""}
                            onChange={(e) => {
                                const newQty = parseFloat(e.target.value);
                                if (!isNaN(newQty) && newQty > 0) {
                                    onUpdateQuantity(newQty);
                                }
                            }}
                            className="h-8 w-full text-sm text-right pl-11 pr-7"
                            min="0.001"
                            step="0.001"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground pointer-events-none font-medium uppercase">
                            {unitSymbol || ""}
                        </span>
                    </div>
                ) : (
                    <span className="font-mono text-sm">
                        {quantity} <span className="text-muted-foreground text-[9px] uppercase">{unitSymbol}</span>
                    </span>
                )}
            </div>
            {/* × Price = Subtotal */}
            <div className="w-48 shrink-0">
                {unitPrice != null ? (
                    <span className="flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
                        <ResourcePriceDisplay
                            price={unitPrice}
                            priceValidFrom={priceValidFrom}
                            className="text-sm"
                        />
                        <span>
                            {" × "}
                            {quantity}
                            {" = "}
                            <span className="font-semibold text-foreground">
                                ${subtotal!.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                        </span>
                    </span>
                ) : (
                    <span className="text-sm text-muted-foreground/50">sin precio</span>
                )}
            </div>
            {/* Optional badge + Actions menu */}
            <div className="shrink-0 flex items-center gap-1">
                {isOptional && (
                    <Badge variant="secondary" className="text-[10px]">
                        Opc
                    </Badge>
                )}
                {isOwn && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 p-0">
                                <span className="sr-only">Acciones</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={onRemove}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
}
