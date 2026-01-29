"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { createDateColumn, createTextColumn, createMoneyColumn } from "@/components/shared/data-table/columns";
import { DataTableAvatarCell } from "@/components/shared/data-table/data-table-avatar-cell";

// Define a local type if not imported, or use any for flexibility during dev
export const columns: ColumnDef<any>[] = [
    createDateColumn<any>({
        accessorKey: "payment_date",
        showAvatar: false,
    }),
    {
        accessorKey: "subcontract_title",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Subcontrato" />,
        cell: ({ row }) => (
            <DataTableAvatarCell
                title={row.original.subcontract_title || "Sin título"}
                subtitle={row.original.provider_name || row.original.provider_company_name || ""}
                src={row.original.provider_avatar_url}
                fallback={(row.original.subcontract_title || "S")[0]}
            />
        ),
        enableSorting: true,
        enableHiding: false,
    },
    createTextColumn<any>({
        accessorKey: "wallet_name",
        title: "Billetera",
        muted: true,
    }),
    createMoneyColumn<any>({
        accessorKey: "amount",
        prefix: "-",
        colorMode: "negative",
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
