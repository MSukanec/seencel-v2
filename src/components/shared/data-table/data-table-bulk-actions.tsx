"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataTableBulkActionsProps<TData> {
    table: Table<TData>;
    children?: React.ReactNode;
}

export function DataTableBulkActions<TData>({
    table,
    children,
}: DataTableBulkActionsProps<TData>) {
    const selectedCount = table.getFilteredSelectedRowModel().rows.length;

    return (
        <div className="flex items-center justify-between gap-4 w-full min-h-[2.25rem]">
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => table.resetRowSelection()}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Cancelar selección</span>
                </Button>
                <div className="text-sm font-medium">
                    {selectedCount} seleccionad{selectedCount === 1 ? "o" : "os"}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {children}
            </div>
        </div>
    );
}

