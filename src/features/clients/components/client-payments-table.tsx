
"use client";

import { DataTable } from "@/components/shared/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ClientPaymentView } from "../types";
import { Badge } from "@/components/ui/badge";

export function ClientPaymentsTable({ data }: { data: ClientPaymentView[] }) {
    const columns: ColumnDef<ClientPaymentView>[] = [
        {
            accessorKey: "client_name", // mapped in view
            header: "Cliente",
            cell: ({ row }) => row.original.client_name || "N/A"
        },
        {
            accessorKey: "amount",
            header: "Monto",
            cell: ({ row }) => {
                return (
                    <span className="font-mono font-medium text-green-600">
                        {row.original.currency_symbol} {row.original.amount.toLocaleString()}
                    </span>
                );
            }
        },
        {
            accessorKey: "payment_date",
            header: "Fecha",
            cell: ({ row }) => new Date(row.original.payment_date).toLocaleDateString()
        },
        {
            accessorKey: "status",
            header: "Estado",
            cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>
        },
        {
            accessorKey: "wallet_name",
            header: "Cuenta",
        }
    ];

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="client_name"
        />
    );
}
