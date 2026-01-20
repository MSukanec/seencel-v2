"use client";

import { QuoteView, QuoteItemView } from "../../types";
import { TaskView } from "@/features/tasks/types";
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
import { MoreHorizontal, Edit, Trash2, GripVertical } from "lucide-react";
import { formatCurrency } from "@/lib/currency-utils";
import { deleteQuoteItem } from "../../actions";
import { toast } from "sonner";

interface QuoteItemsTableProps {
    items: QuoteItemView[];
    quote: QuoteView;
    tasks: TaskView[];
    onRefresh: () => void;
}

export function QuoteItemsTable({ items, quote, tasks, onRefresh }: QuoteItemsTableProps) {
    const handleDelete = async (itemId: string) => {
        const toastId = toast.loading("Eliminando ítem...");
        const result = await deleteQuoteItem(itemId);

        if (result.error) {
            toast.error(result.error, { id: toastId });
        } else {
            toast.success("Ítem eliminado", { id: toastId });
            onRefresh();
        }
    };

    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No hay ítems en este presupuesto</p>
                <p className="text-sm">Agregá tareas del catálogo para armar el presupuesto</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Tarea</TableHead>
                    <TableHead>División</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-right">Markup %</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item, index) => (
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
                        <TableCell>
                            {item.division_name ? (
                                <Badge variant="outline">{item.division_name}</Badge>
                            ) : (
                                <span className="text-muted-foreground">-</span>
                            )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                            {item.quantity}
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary">{item.unit || "-"}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                            {quote.currency_symbol} {formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                            {item.markup_pct > 0 ? `+${item.markup_pct}%` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                            {quote.currency_symbol} {formatCurrency(item.subtotal_with_markup || item.subtotal || 0)}
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
