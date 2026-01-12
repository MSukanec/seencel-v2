
"use client";

import { DataTable } from "@/components/ui/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

export function ClientSchedulesTable({ data }: { data: any[] }) {
    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "due_date",
            header: "Vencimiento",
            cell: ({ row }) => new Date(row.original.due_date).toLocaleDateString()
        },
        {
            accessorKey: "commitment.client.contact.full_name",
            header: "Cliente",
            cell: ({ row }) => row.original.commitment?.client?.contact?.full_name || "N/A"
        },
        {
            accessorKey: "amount",
            header: "Monto Cuota",
            cell: ({ row }) => {
                return (
                    <span className="font-mono font-medium">
                        {row.original.currency?.symbol} {Number(row.original.amount).toLocaleString()}
                    </span>
                );
            }
        },
        {
            accessorKey: "status",
            header: "Estado",
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <Badge variant={status === 'paid' ? 'default' : status === 'overdue' ? 'destructive' : 'secondary'}>
                        {status}
                    </Badge>
                );
            }
        }
    ];

    return <DataTable columns={columns} data={data} searchKey="commitment.client.contact.full_name" />;
}
