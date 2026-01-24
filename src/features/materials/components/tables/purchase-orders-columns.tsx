"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MoreHorizontal, Send, CheckCircle, XCircle, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    PurchaseOrderView,
    PurchaseOrderStatus,
    PURCHASE_ORDER_STATUS_LABELS,
    PURCHASE_ORDER_STATUS_COLORS
} from "../../types";

interface ColumnsProps {
    onView: (order: PurchaseOrderView) => void;
    onUpdateStatus: (orderId: string, newStatus: PurchaseOrderStatus) => void;
    onDelete: (orderId: string) => void;
}

export const createPurchaseOrdersColumns = ({
    onView,
    onUpdateStatus,
    onDelete,
}: ColumnsProps): ColumnDef<PurchaseOrderView>[] => [
        {
            accessorKey: "order_number",
            header: "Nº Orden",
            cell: ({ row }) => (
                <span className="font-mono font-medium">
                    {row.original.order_number || "—"}
                </span>
            ),
        },
        {
            accessorKey: "order_date",
            header: "Fecha",
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.original.order_date
                        ? format(new Date(row.original.order_date), "dd MMM yyyy", { locale: es })
                        : "—"
                    }
                </span>
            ),
        },
        {
            accessorKey: "provider_name",
            header: "Proveedor",
            cell: ({ row }) => (
                <span>{row.original.provider_name || "Sin asignar"}</span>
            ),
        },
        {
            accessorKey: "item_count",
            header: "Items",
            cell: ({ row }) => (
                <Badge variant="outline">{row.original.item_count}</Badge>
            ),
        },
        {
            accessorKey: "total",
            header: () => <div className="text-right">Total</div>,
            cell: ({ row }) => (
                <div className="text-right font-medium tabular-nums">
                    {row.original.currency_symbol || "$"}
                    {row.original.total.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Estado",
            cell: ({ row }) => {
                const status = row.original.status as PurchaseOrderStatus;
                return (
                    <Badge className={PURCHASE_ORDER_STATUS_COLORS[status]}>
                        {PURCHASE_ORDER_STATUS_LABELS[status]}
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const order = row.original;
                const status = order.status as PurchaseOrderStatus;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView(order)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalles
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {status === "draft" && (
                                <DropdownMenuItem
                                    onClick={() => onUpdateStatus(order.id, "sent")}
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    Enviar a proveedor
                                </DropdownMenuItem>
                            )}

                            {(status === "sent" || status === "quoted") && (
                                <DropdownMenuItem
                                    onClick={() => onUpdateStatus(order.id, "approved")}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Aprobar
                                </DropdownMenuItem>
                            )}

                            {status !== "converted" && status !== "rejected" && (
                                <DropdownMenuItem
                                    onClick={() => onUpdateStatus(order.id, "rejected")}
                                    className="text-destructive"
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Rechazar
                                </DropdownMenuItem>
                            )}

                            {status === "draft" && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => onDelete(order.id)}
                                        className="text-destructive"
                                    >
                                        Eliminar
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
