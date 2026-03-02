"use client";

import { Table } from "@tanstack/react-table";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Map of column IDs to human-readable Spanish labels
const COLUMN_LABELS: Record<string, string> = {
    payment_date: "Fecha",
    movement_type: "Tipo",
    project_name: "Proyecto",
    concept_name: "Descripción",
    wallet_name: "Billetera",
    amount: "Monto",
    functional_amount: "Monto funcional",
    status: "Estado",
    contact_name: "Contacto",
    category_name: "Categoría",
    notes: "Notas",
    reference: "Referencia",
    created_at: "Creación",
    creator_name: "Creador",
};

interface DataTableViewOptionsProps<TData> {
    table: Table<TData>;
}

export function DataTableViewOptions<TData>({
    table,
}: DataTableViewOptionsProps<TData>) {
    const columns = table.getAllColumns().filter(
        (column) => typeof column.accessorFn !== "undefined" && column.getCanHide()
    );

    const hasHiddenColumns = columns.some((column) => !column.getIsVisible());

    if (columns.length === 0) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-7 gap-1.5 text-xs font-[450] text-muted-foreground hover:text-foreground",
                        hasHiddenColumns && "text-primary"
                    )}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Display</span>
                    {hasHiddenColumns && (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuLabel className="text-xs font-medium">
                    Propiedades visibles
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((column) => {
                    const label = COLUMN_LABELS[column.id] || column.id.replace(/_/g, " ");
                    return (
                        <DropdownMenuCheckboxItem
                            key={column.id}
                            className="text-xs capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                            {label}
                        </DropdownMenuCheckboxItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
