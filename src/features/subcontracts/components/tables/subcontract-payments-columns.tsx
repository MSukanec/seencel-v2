"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Type for subcontract payment data
export interface SubcontractPaymentRow {
    id: string;
    payment_date: string;
    amount: number;
    functional_amount: number;
    status: string;
    reference?: string;
    notes?: string;
    exchange_rate?: number;
    currency?: {
        id: string;
        code: string;
        symbol: string;
    };
    wallet?: {
        id: string;
        name: string;
    };
    // For provider display
    provider_name?: string;
}

export const subcontractPaymentsColumns: ColumnDef<SubcontractPaymentRow>[] = [
    {
        accessorKey: "payment_date",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
        cell: ({ row }) => {
            const date = new Date(row.original.payment_date);
            return (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{date.toLocaleDateString()}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                        {format(date, 'MMMM yyyy', { locale: es })}
                    </span>
                </div>
            );
        },
    },
    {
        accessorKey: "amount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Monto" />,
        cell: ({ row }) => {
            const amount = row.original.amount;
            const symbol = row.original.currency?.symbol || "$";
            const rate = row.original.exchange_rate;

            return (
                <div className="flex flex-col">
                    <span className="font-mono font-medium text-amount-negative">
                        {symbol} {amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {rate && rate > 1 && (
                        <span className="text-xs text-muted-foreground font-mono">
                            Cot: {rate.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: "wallet",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Billetera" />,
        cell: ({ row }) => (
            <span className="text-sm text-foreground/80">{row.original.wallet?.name || "-"}</span>
        ),
    },
    {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
        cell: ({ row }) => {
            const status = row.original.status;

            let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
            let className = "";

            switch (status) {
                case "confirmed":
                    variant = "outline";
                    className = "bg-amount-positive/10 text-amount-positive border-amount-positive/20";
                    break;
                case "pending":
                    variant = "outline";
                    className = "bg-amber-500/10 text-amber-600 border-amber-500/20";
                    break;
                case "rejected":
                    variant = "destructive";
                    break;
                case "void":
                    variant = "secondary";
                    break;
            }

            return (
                <Badge variant={variant} className={className}>
                    {status === "confirmed" ? "Confirmado" :
                        status === "pending" ? "Pendiente" :
                            status === "rejected" ? "Rechazado" :
                                status === "void" ? "Anulado" : status}
                </Badge>
            );
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id));
        },
    },
    {
        accessorKey: "reference",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Referencia" />,
        cell: ({ row }) => (
            <span className="text-sm text-muted-foreground truncate max-w-[150px] inline-block">
                {row.original.reference || "-"}
            </span>
        ),
    },
];
