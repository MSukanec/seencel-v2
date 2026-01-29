"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { createDateColumn, createTextColumn, createMoneyColumn } from "@/components/shared/data-table/columns";

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
    createDateColumn<SubcontractPaymentRow>({
        accessorKey: "payment_date",
        showAvatar: false,
    }),
    createMoneyColumn<SubcontractPaymentRow>({
        accessorKey: "amount",
        prefix: "-",
        colorMode: "negative",
    }),
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
    createTextColumn<SubcontractPaymentRow>({
        accessorKey: "reference",
        title: "Referencia",
        truncate: 150,
        muted: true,
    }),
];
