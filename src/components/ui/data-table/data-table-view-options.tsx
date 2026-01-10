"use client";

import { Table } from "@tanstack/react-table";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
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

interface DataTableViewOptionsProps<TData> {
    table: Table<TData>;
}

export function DataTableViewOptions<TData>({
    table,
}: DataTableViewOptionsProps<TData>) {
    const t = useTranslations("DataTable");
    const columns = table.getAllColumns().filter(
        (column) => typeof column.accessorFn !== "undefined" && column.getCanHide()
    );

    const hasHiddenColumns = columns.some((column) => !column.getIsVisible());

    if (columns.length === 0) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={hasHiddenColumns ? "secondary" : "outline"}
                    size="sm"
                    className={cn(
                        "h-9 gap-2 transition-all duration-300",
                        hasHiddenColumns && "border-dashed border-primary/50 bg-primary/5 text-primary animate-tremble"
                    )}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("columns")}</span>
                    {hasHiddenColumns && (
                        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuLabel>{t("showColumns")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((column) => {
                    return (
                        <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                            {/* Try to translate column header if possible, or fallback to id */}
                            {t.has(`columnHeaders.${column.id}`) ? t(`columnHeaders.${column.id}`) : column.id.replace(/_/g, " ")}
                        </DropdownMenuCheckboxItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
