"use client";

import { Row } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2, Eye, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableRowActionsProps<TData> {
    row: Row<TData>;
    onView?: (data: TData) => void;
    onEdit?: (data: TData) => void;
    onDuplicate?: (data: TData) => void;
    onDelete?: (data: TData) => void;
    customActions?: {
        label: string;
        icon?: React.ReactNode;
        onClick: (data: TData) => void;
        variant?: "default" | "destructive";
    }[];
}

export function DataTableRowActions<TData>({
    row,
    onView,
    onEdit,
    onDuplicate,
    onDelete,
    customActions,
}: DataTableRowActionsProps<TData>) {
    const data = row.original;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Abrir menú</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
                {onView && (
                    <DropdownMenuItem onClick={() => onView(data)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalle
                    </DropdownMenuItem>
                )}
                {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(data)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>
                )}
                {onDuplicate && (
                    <DropdownMenuItem onClick={() => onDuplicate(data)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                    </DropdownMenuItem>
                )}

                {/* Custom Actions */}
                {customActions && customActions.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        {customActions.map((action, index) => (
                            <DropdownMenuItem
                                key={index}
                                onClick={() => action.onClick(data)}
                                className={action.variant === "destructive" ? "text-destructive focus:text-destructive" : ""}
                            >
                                {action.icon}
                                {action.label}
                            </DropdownMenuItem>
                        ))}
                    </>
                )}

                {onDelete && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onDelete(data)}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
