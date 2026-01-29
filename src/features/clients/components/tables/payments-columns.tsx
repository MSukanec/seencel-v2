"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ClientPaymentView } from "../../types";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTableAvatarCell } from "@/components/shared/data-table/data-table-avatar-cell";
import { createDateColumn, createTextColumn, createMoneyColumn } from "@/components/shared/data-table/columns";

export const columns: ColumnDef<ClientPaymentView>[] = [
    createDateColumn<ClientPaymentView>({
        accessorKey: "payment_date",
        showAvatar: false,
    }),
    {
        accessorKey: "client_name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
        cell: ({ row }) => (
            <DataTableAvatarCell
                title={row.original.client_name || "N/A"}
                subtitle={row.original.creator_full_name ? `por ${row.original.creator_full_name}` : undefined}
                src={row.original.creator_avatar_url}
                fallback={row.original.creator_full_name?.[0] || row.original.client_first_name?.[0]}
            />
        ),
        enableSorting: true,
        enableHiding: false,
    },
    createTextColumn<ClientPaymentView>({
        accessorKey: "wallet_name",
        title: "Billetera",
        muted: true,
    }),
    createMoneyColumn<ClientPaymentView>({
        accessorKey: "amount",
        prefix: "+",
        colorMode: "positive",
    }),

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
];

