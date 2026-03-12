"use client";

import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
    column: Column<TData, TValue>;
    title: string;
}

export function DataTableColumnHeader<TData, TValue>({
    column,
    title,
    className,
}: DataTableColumnHeaderProps<TData, TValue>) {
    if (!column.getCanSort()) {
        return <div className={cn("flex items-center h-7 text-xs font-medium text-muted-foreground", className)}>{title}</div>;
    }

    const isSorted = column.getIsSorted();

    return (
        <div className={cn("flex items-center w-full", className)}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className={cn(
                            "flex items-center h-7 w-full rounded-md px-2 -mx-2 cursor-pointer",
                            "hover:bg-muted/50 data-[state=open]:bg-accent",
                            "transition-colors duration-100",
                            className?.includes("justify-end") && "justify-end"
                        )}
                    >
                        <span className="text-xs font-medium">{title}</span>
                        {isSorted === "desc" ? (
                            <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-foreground shrink-0" />
                        ) : isSorted === "asc" ? (
                            <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-foreground shrink-0" />
                        ) : (
                            <ArrowUpDown
                                className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/50 shrink-0 opacity-0 group-hover/header:opacity-100 transition-opacity duration-150"
                            />
                        )}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                        <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        Ascendente
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                        <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        Descendente
                    </DropdownMenuItem>
                    {column.getCanHide() && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                                <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                                Ocultar columna
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
