"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
    createEntityColumn,
    createMoneyColumn,
    createTextColumn,
} from "@/components/shared/data-table/columns";
import { EDITABLE_CELL_CLASS } from "@/components/shared/data-table/columns/column-styles";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { type MaterialWithDetails } from "@/features/materials/views/materials-catalog-view";
import { type MaterialCategory, type Unit } from "@/features/materials/forms/material-form";
import { useFormData } from "@/stores/organization-store";
import { Monitor, Building2, Package, Wrench, FolderTree, Ruler } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";

// ─── Inline Edit Cell para Nombre ──────────────────────────

function MaterialNameCell({
    name,
    code,
    onUpdate,
    canEdit,
}: {
    name: string;
    code: string | null | undefined;
    onUpdate: (newName: string) => Promise<void> | void;
    canEdit: boolean;
}) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(name);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleStartEditing = (e: React.MouseEvent) => {
        if (!canEdit) return;
        e.stopPropagation();
        setEditValue(name);
        setIsEditing(true);
        setTimeout(() => inputRef.current?.select(), 10);
    };

    const handleSave = () => {
        setIsEditing(false);
        if (editValue !== name && editValue.trim()) {
            onUpdate(editValue.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") { e.preventDefault(); handleSave(); }
        if (e.key === "Escape") { setIsEditing(false); }
    };

    if (isEditing) {
        return (
            <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    placeholder="Nombre del material..."
                    className={cn(
                        "h-7 px-2 text-sm bg-background border border-border rounded-md",
                        "focus:outline-none focus:ring-1 focus:ring-ring",
                    )}
                />
                {code && (
                    <span className="text-xs text-muted-foreground font-mono px-2">{code}</span>
                )}
            </div>
        );
    }

    return (
        <button
            className={cn("flex flex-col gap-0 text-left", canEdit ? EDITABLE_CELL_CLASS : "cursor-default")}
            onClick={canEdit ? handleStartEditing : undefined}
            disabled={!canEdit}
        >
            <span className={cn("text-sm font-medium truncate", !canEdit && "text-muted-foreground font-normal")}>{name}</span>
            {code && (
                <span className="text-xs text-muted-foreground font-mono">{code}</span>
            )}
        </button>
    );
}

// ─── Options para Tipo y Origen ──────────────────────────

const MATERIAL_TYPE_OPTIONS = [
    { value: "material", label: "Material", icon: Package },
    { value: "consumable", label: "Insumo", icon: Wrench },
];

const ORIGIN_OPTIONS = [
    { value: "system", label: "Sistema", icon: Monitor },
    { value: "org", label: "Propio", icon: Building2 },
];

// ─── Constants ───
const NO_CATEGORY_VALUE = "sin-categoria";

// ─── Factory ──────────────────────────────────────────────

interface MaterialColumnsOptions {
    categories?: MaterialCategory[];
    units?: Unit[];
    isAdminMode?: boolean;
    onInlineUpdate?: (material: MaterialWithDetails, updates: Record<string, any>) => Promise<void> | void;
}

export function getMaterialColumns(
    options: MaterialColumnsOptions = {}
): ColumnDef<MaterialWithDetails>[] {
    const { categories = [], units = [], isAdminMode = false, onInlineUpdate } = options;

    const categoryOptions = [
        { value: NO_CATEGORY_VALUE, label: "Sin Categoría", icon: FolderTree },
        ...categories.map(c => ({
            value: c.id,
            label: c.name,
            icon: FolderTree,
        }))
    ];

    const unitOptions = units.map(u => ({
        value: u.id,
        label: `${u.name}${u.symbol ? ` (${u.symbol})` : ""}`,
        icon: Ruler,
    }));

    return [
        {
            accessorKey: "name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
            size: 300,
            enableHiding: false,
            enableSorting: true,
            meta: { fillWidth: true },
            cell: ({ row }) => {
                const material = row.original;
                const canEditItem = isAdminMode ? material.is_system : !material.is_system;

                return (
                    <MaterialNameCell
                        name={material.name || "Sin nombre"}
                        code={material.code}
                        canEdit={!!onInlineUpdate && canEditItem}
                        onUpdate={(newName) => onInlineUpdate?.(material, { name: newName })}
                    />
                );
            },
        },
        createEntityColumn<MaterialWithDetails>({
            accessorKey: "material_type",
            title: "Tipo",
            labels: {
                "material": "Material",
                "consumable": "Insumo",
            },
            entityOptions: MATERIAL_TYPE_OPTIONS,
            size: 150,
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, value) => {
                    const canEditItem = isAdminMode ? row.is_system : !row.is_system;
                    if (canEditItem) {
                        onInlineUpdate(row, { material_type: value });
                    }
                }
                : undefined,
        }),
        createEntityColumn<MaterialWithDetails>({
            accessorKey: "category_id",
            title: "Categoría",
            labels: categories.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {}),
            emptyValue: "Sin Categoría",
            entityOptions: categoryOptions,
            size: 180,
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, value) => {
                    const canEditItem = isAdminMode ? row.is_system : !row.is_system;
                    if (canEditItem) {
                        onInlineUpdate(row, { category_id: value === NO_CATEGORY_VALUE ? null : value });
                    }
                }
                : undefined,
        }),
        createTextColumn<MaterialWithDetails>({
            accessorKey: "unit_name",
            title: "Unidad",
            subtitle: (row) => row.unit_symbol || undefined,
            size: 100,
        }),
        createEntityColumn<MaterialWithDetails>({
            accessorKey: "is_system",
            title: "Origen",
            labels: {
                "true": "Sistema",
                "false": "Propio",
            },
            size: 130,
        }),
        // Precio base para organizaciones
        ...(!isAdminMode ? [
            {
                accessorKey: "org_unit_price",
                header: ({ column }: any) => <DataTableColumnHeader column={column} title="Precio Base" className="justify-end" />,
                size: 140,
                cell: function PriceCellComponent({ row }: any) {
                    const material = row.original;
                    // Llamamos a hooks de react en runtime
                    const { currencies } = useFormData();
                    const curr = currencies.find((c: any) => c.id === material.org_price_currency_id) || currencies.find((c: any) => c.is_default);
                    
                    if (!material.org_unit_price) {
                        return <span className="text-muted-foreground text-sm flex w-full justify-end">—</span>;
                    }

                    const formatted = new Intl.NumberFormat("es-AR", {
                        style: "currency",
                        currency: curr?.code || "ARS",
                    }).format(material.org_unit_price);

                    return <span className="font-mono text-sm flex w-full justify-end">{formatted}</span>;
                }
            } as ColumnDef<MaterialWithDetails>
        ] : []),
    ];
}
