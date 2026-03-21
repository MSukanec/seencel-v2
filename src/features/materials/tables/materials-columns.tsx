"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
    createEntityColumn,
    createTextColumn,
    createUnitColumn,
    createPriceColumn,
} from "@/components/shared/data-table/columns";
import type { MaterialWithDetails } from "@/features/materials/views/materials-catalog-view";
import type { MaterialCategory, Unit } from "@/features/materials/forms/material-form";
import { Package, Wrench } from "lucide-react";

// ─── Options para Tipo ──────────────────────────────────

const MATERIAL_TYPE_OPTIONS = [
    { value: "material", label: "Material", icon: Package },
    { value: "consumable", label: "Insumo", icon: Wrench },
];


// ─── Factory ──────────────────────────────────────────────

interface MaterialColumnsOptions {
    categories?: MaterialCategory[];
    units?: Unit[];
    isAdminMode?: boolean;
    onPriceUpdate?: (row: MaterialWithDetails, newPrice: number) => Promise<void>;
}

export function getMaterialColumns(
    options: MaterialColumnsOptions = {}
): ColumnDef<MaterialWithDetails>[] {
    const { categories = [], isAdminMode = false, onPriceUpdate } = options;

    return [
        // ── Name + Code ──
        createTextColumn<MaterialWithDetails>({
            accessorKey: "name",
            title: "Nombre",
            subtitle: (row) => row.code || undefined,
            enableSorting: true,
        }),

        // ── Type ──
        createEntityColumn<MaterialWithDetails>({
            accessorKey: "material_type",
            title: "Tipo",
            labels: {
                "material": "Material",
                "consumable": "Insumo",
            },
            entityOptions: MATERIAL_TYPE_OPTIONS,
            size: 130,
        }),

        // ── Category ──
        createEntityColumn<MaterialWithDetails>({
            accessorKey: "category_name",
            title: "Categoría",
            labels: categories.reduce((acc, c) => ({ ...acc, [c.name]: c.name }), {}),
            emptyValue: "Sin Categoría",
            size: 160,
        }),

        // ── Unit ──
        createUnitColumn<MaterialWithDetails>({
            accessorKey: "unit_name",
            title: "Unidad",
            size: 120,
        }),

        // ── Price (org mode only) ──
        ...(!isAdminMode ? [
            createPriceColumn<MaterialWithDetails>({
                accessorKey: "org_unit_price",
                title: "Precio Base",
                currencyKey: "currency_symbol",
                validFromKey: "org_price_valid_from",
                unitSymbolKey: "unit_symbol",
                nameKey: "name",
                editable: !!onPriceUpdate,
                onUpdate: onPriceUpdate,
                size: 150,
            }),
        ] : []),
    ];
}
