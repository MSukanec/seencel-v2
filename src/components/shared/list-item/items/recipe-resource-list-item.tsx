"use client";

// ============================================================================
// RECIPE RESOURCE LIST ITEM
// ============================================================================
// Shared component for displaying a resource within a recipe.
// Supports variants: material, labor, equipment, subcontract.
// Uses the ListItem base pattern (card variant + ColorStrip) for visual
// consistency with MaterialListItem and LaborListItem.
//
// Right-side controls use CatalogValueButton (click-to-edit) and
// CatalogPriceButton (click opens PricePulsePopover) for a unified
// dashed-border aesthetic.
// ============================================================================

import { memo, useCallback } from "react";
import { ListItem } from "../list-item-base";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Package,
    HardHat,
    Wrench,
    FileText,
    Pencil,
    Trash2,
    MoreHorizontal,
    ExternalLink,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type PricePulseData } from "@/components/shared/price-pulse-popover";
import { CatalogPriceButton } from "@/components/shared/catalog/catalog-price-button";
import { QuantityPopover, type QuantityPopoverData } from "@/components/shared/catalog/quantity-popover";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type RecipeResourceVariant = "material" | "labor" | "equipment" | "subcontract";

/** Visual config per variant — earthy palette inspired by interior design */
const VARIANT_CONFIG: Record<RecipeResourceVariant, {
    icon: typeof Package;
    accentColor: string;
    stripColor: "terracotta" | "pewter" | "sage" | "sand" | "system";
    label: string;
}> = {
    material: {
        icon: Package,
        accentColor: "text-[#C48B6A]",
        stripColor: "terracotta",
        label: "Material",
    },
    labor: {
        icon: HardHat,
        accentColor: "text-[#9B8E8A]",
        stripColor: "pewter",
        label: "Mano de Obra",
    },
    equipment: {
        icon: Wrench,
        accentColor: "text-[#8A9A7B]",
        stripColor: "sage",
        label: "Equipo",
    },
    subcontract: {
        icon: FileText,
        accentColor: "text-[#C4B590]",
        stripColor: "sand",
        label: "Servicio Ext.",
    },
};

export interface RecipeResourceListItemProps {
    /** Resource variant */
    variant: RecipeResourceVariant;

    /** Unique ID of the recipe resource entry (recipe_material / recipe_labor row) */
    id: string;

    /** Display name (material_name, labor_name, etc.) */
    name: string;

    /** Optional code (material code) */
    code?: string | null;

    /** Measurement unit symbol */
    unitSymbol?: string | null;

    /** Measurement unit full name (e.g. "Metro Cuadrado") */
    unitName?: string | null;

    /** Whether this resource belongs to the current org (enables editing) */
    isOwn: boolean;



    // ── Quantity ──

    /** Current quantity */
    quantity: number;

    /** Callback when quantity changes */
    onUpdateQuantity?: (id: string, quantity: number) => void;

    // ── Waste (materials only) ──

    /** Waste percentage (0-100), null if not applicable */
    wastePercentage?: number | null;

    /** Computed total quantity including waste */
    totalQuantity?: number | null;

    /** Callback when waste percentage changes */
    onUpdateWaste?: (id: string, wastePercentage: number) => void;

    // ── Pricing ──

    /** Effective unit price */
    unitPrice?: number | null;

    /** Price valid from date */
    priceValidFrom?: string | null;

    /** PricePulse data for popover (null = no popover) */
    pricePulseData?: PricePulseData | null;

    /** Callback when price is updated via PricePulse */
    onPriceUpdated?: (resourceId: string, newPrice: number) => void;

    // ── Actions ──

    /** Callback to edit this resource */
    onEdit?: (id: string) => void;

    /** Callback to remove this resource */
    onRemove?: (id: string) => void;

    /** Resource ID for navigation (e.g. material_id, labor_type_id) */
    resourceId?: string | null;
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

export const RecipeResourceListItem = memo(function RecipeResourceListItem({
    variant,
    id,
    name,
    code,
    unitSymbol,
    unitName,
    isOwn,

    quantity,
    onUpdateQuantity,
    wastePercentage,
    totalQuantity,
    onUpdateWaste,
    unitPrice,
    priceValidFrom,
    pricePulseData,
    onPriceUpdated,
    onEdit,
    onRemove,
    resourceId,
}: RecipeResourceListItemProps) {
    const config = VARIANT_CONFIG[variant];

    // Effective total quantity (with waste applied)
    const effectiveQty = totalQuantity ?? quantity * (1 + (wastePercentage || 0) / 100);

    // Subtotal
    const subtotal = unitPrice != null ? effectiveQty * unitPrice : null;

    // Quantity popover data
    const quantityPopoverData: QuantityPopoverData = {
        resourceName: name,
        icon: config.icon,
        unitSymbol: unitSymbol,
        quantity,
        wastePercentage: wastePercentage,
    };

    const handleQuantitySave = useCallback((newQty: number, newWaste?: number) => {
        if (newQty !== quantity) {
            onUpdateQuantity?.(id, newQty);
        }
        if (newWaste !== undefined && newWaste !== wastePercentage) {
            onUpdateWaste?.(id, newWaste);
        }
    }, [id, quantity, wastePercentage, onUpdateQuantity, onUpdateWaste]);

    // Unit display
    const unitDisplay = unitSymbol || unitName || null;

    // Handlers
    const handleEdit = useCallback(() => {
        onEdit?.(id);
    }, [onEdit, id]);

    const handleRemove = useCallback(() => {
        onRemove?.(id);
    }, [onRemove, id]);

    return (
        <ListItem variant="card">
            {/* Color strip — same pattern as MaterialListItem / LaborListItem */}
            <ListItem.ColorStrip color={config.stripColor} />

            {/* Wrapper: stacks vertically on mobile, horizontal on desktop */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                {/* Content: name, unit, code, badges */}
                <ListItem.Content className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                        <ListItem.Title className="text-sm">{name}</ListItem.Title>

                    </div>
                    <div className="flex items-center gap-2">
                        {unitDisplay && (
                            <span className="text-[11px] text-muted-foreground">
                                {unitName || unitDisplay}
                                {unitSymbol && unitName && (
                                    <span className="text-muted-foreground/60 ml-0.5">({unitSymbol})</span>
                                )}
                            </span>
                        )}
                        {code && (
                            <span className="text-[11px] text-muted-foreground/50 font-mono">
                                {code}
                            </span>
                        )}
                    </div>
                </ListItem.Content>

                {/* ── Right side: Cantidad × Precio Unitario = Total ── */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>

                    {/* Quantity button — shows total (with waste) */}
                    <QuantityPopover data={quantityPopoverData} onSave={handleQuantitySave}>
                        <button
                            type="button"
                            disabled={!onUpdateQuantity}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-3 h-9 rounded-md",
                                "border border-dashed border-input",
                                "whitespace-nowrap",
                                "hover:bg-muted/50 hover:border-muted-foreground/30",
                                "transition-colors cursor-pointer select-none",
                                !onUpdateQuantity && "opacity-50 pointer-events-none"
                            )}
                        >
                            <span className="text-xs text-muted-foreground font-medium sm:hidden">Cant.</span>
                            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Cantidad</span>
                            <span className="font-mono font-semibold tabular-nums text-foreground text-base">
                                {new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(effectiveQty)}
                            </span>
                            {unitSymbol && (
                                <span className="text-[11px] text-muted-foreground uppercase">{unitSymbol}</span>
                            )}
                        </button>
                    </QuantityPopover>

                    {/* × symbol */}
                    <span className="text-muted-foreground/50 text-sm font-medium select-none">×</span>

                    {/* Price button — with label */}
                    <CatalogPriceButton
                        label="Precio Unitario"
                        shortLabel="P.U."
                        price={unitPrice}
                        priceValidFrom={priceValidFrom}
                        pricePulseData={pricePulseData ?? null}
                        onPriceUpdated={onPriceUpdated}
                        disabled={false}
                    />

                    {/* = symbol */}
                    <span className="text-muted-foreground/50 text-sm font-medium select-none">=</span>

                    {/* Total (read-only) */}
                    <span className="text-lg font-bold tabular-nums whitespace-nowrap text-foreground">
                        {subtotal != null ? formatCurrency(subtotal) : "—"}
                    </span>
                </div>
            </div>

            {/* Actions: "..." dropdown menu */}
            {isOwn && (onEdit || onRemove || resourceId) && (
                <ListItem.Actions>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Acciones</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {/* Edit — open form in edit mode */}
                            {onEdit && (
                                <DropdownMenuItem onClick={handleEdit}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </DropdownMenuItem>
                            )}
                            {/* Detail link — only for materials and labor */}
                            {(variant === "material" || variant === "labor") && resourceId && (
                                <DropdownMenuItem
                                    onClick={() => {
                                        // TODO: Navigate to detail page when routes exist
                                        // router.push(`/organization/catalog/${variant}/${resourceId}`)
                                    }}
                                >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Ver detalle
                                </DropdownMenuItem>
                            )}
                            {/* Separator before destructive action */}
                            {onRemove && (onEdit || resourceId) && (
                                <DropdownMenuSeparator />
                            )}
                            {/* Delete */}
                            {onRemove && (
                                <DropdownMenuItem
                                    onClick={handleRemove}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ListItem.Actions>
            )}
        </ListItem>
    );
});
