"use client";

import React from "react";
import { QuoteView, QuoteItemView } from "../../types";
import { TaskView, TaskDivision } from "@/features/tasks/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Edit, Trash2, GripVertical } from "lucide-react";

import { deleteQuoteItem } from "../../actions";
import { toast } from "sonner";
import { useMemo, useState } from "react";

interface QuoteItemsTableProps {
    items: QuoteItemView[];
    quote: QuoteView;
    tasks: TaskView[];
    divisions: TaskDivision[];
    onRefresh: () => void;
    onEditItem?: (item: QuoteItemView) => void;
}

// Group items by division and sort
interface ItemsByDivision {
    division: { id: string; name: string; order: number | null } | null;
    items: QuoteItemView[];
}

export function QuoteItemsTable({ items, quote, tasks, divisions, onRefresh, onEditItem }: QuoteItemsTableProps) {
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; item: QuoteItemView | null }>({
        open: false,
        item: null
    });

    const handleDelete = async () => {
        if (!deleteConfirm.item) return;

        const toastId = toast.loading("Eliminando ítem...");
        const result = await deleteQuoteItem(deleteConfirm.item.id);

        if (result.error) {
            toast.error(result.error, { id: toastId });
        } else {
            toast.success("Ítem eliminado", { id: toastId });
            onRefresh();
        }
        setDeleteConfirm({ open: false, item: null });
    };

    const openDeleteConfirm = (item: QuoteItemView) => {
        setDeleteConfirm({ open: true, item });
    };

    // Group items by division and sort by division order
    const groupedItems = useMemo(() => {
        // Create a map to lookup division order
        const divisionMap = new Map<string, TaskDivision>();
        divisions.forEach(d => divisionMap.set(d.id, d));

        // Group items by their task's division
        const groups = new Map<string | null, ItemsByDivision>();

        for (const item of items) {
            // Get the division from the item's task
            const task = tasks.find(t => t.id === item.task_id);
            const divisionId = task?.task_division_id || null;
            const division = divisionId ? divisionMap.get(divisionId) : null;

            if (!groups.has(divisionId)) {
                groups.set(divisionId, {
                    division: division ? {
                        id: division.id,
                        name: division.name,
                        order: division.order ?? null,
                    } : null,
                    items: []
                });
            }

            groups.get(divisionId)!.items.push(item);
        }

        // Sort groups by division order
        return Array.from(groups.values()).sort((a, b) => {
            if (!a.division) return 1;
            if (!b.division) return -1;
            const orderA = a.division.order ?? 999999;
            const orderB = b.division.order ?? 999999;
            if (orderA !== orderB) return orderA - orderB;
            return (a.division.name || "").localeCompare(b.division.name || "");
        });
    }, [items, tasks, divisions]);

    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No hay ítems en este presupuesto</p>
                <p className="text-sm">Agregá tareas del catálogo para armar el presupuesto</p>
            </div>
        );
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Tarea</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-right">Markup %</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groupedItems.map((group, groupIndex) => (
                        <React.Fragment key={group.division?.id || `group-${groupIndex}`}>
                            {/* Division header row */}
                            {group.division && groupedItems.length > 1 && (() => {
                                // Calculate division subtotal
                                const divisionSubtotal = group.items.reduce((sum, item) =>
                                    sum + (item.subtotal_with_markup || item.subtotal || 0), 0
                                );
                                return (
                                    <TableRow key={`div-${group.division.id}`} className="bg-muted/50 hover:bg-muted/50">
                                        <TableCell className="py-2"></TableCell>
                                        <TableCell className="font-medium py-2 text-sm">
                                            <span className="text-muted-foreground">📁</span>{" "}
                                            {group.division.name}
                                            <Badge variant="secondary" className="ml-2 text-xs">
                                                {group.items.length} {group.items.length === 1 ? "ítem" : "ítems"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                        <TableCell className="text-right font-mono font-bold py-2 text-sm">
                                            {quote.currency_symbol} {divisionSubtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                );
                            })()}
                            {/* Items in this division */}
                            {group.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">
                                                {item.task_name || item.custom_name || item.description || "Sin nombre"}
                                            </p>
                                            {item.description && item.task_name && (
                                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {item.quantity}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{item.unit || "-"}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {quote.currency_symbol} {item.unit_price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {item.markup_pct > 0 ? `+${item.markup_pct}%` : "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-semibold">
                                        {quote.currency_symbol} {(item.subtotal_with_markup || item.subtotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => onEditItem?.(item)}
                                                    disabled={!onEditItem}
                                                >
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => openDeleteConfirm(item)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm({ open: false, item: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar ítem?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vas a eliminar &quot;{deleteConfirm.item?.task_name || deleteConfirm.item?.custom_name || 'este ítem'}&quot; del presupuesto.
                            Esta acción se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

