"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { DataTable } from "@/components/shared/data-table/data-table";
import { parseDateFromDB } from "@/lib/timezone-data";

export interface ClientSchedule {
    id: string;
    due_date: string;
    amount: number;
    status: 'pending' | 'paid' | 'overdue';
    currency?: {
        symbol: string;
        code: string;
    };
    commitment?: {
        client?: {
            contact?: {
                full_name: string;
            };
        };
    };
}

// ========================================
// COLUMNS
// ========================================

const columns: ColumnDef<any>[] = [
    {
        accessorKey: "due_date",
        header: "Vencimiento",
        cell: ({ row }) => {
            const date = parseDateFromDB(row.original.due_date);
            return date ? date.toLocaleDateString() : '-';
        }
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

// ========================================
// VIEW
// ========================================

interface ClientsSchedulesViewProps {
    data: ClientSchedule[];
}

export function ClientsSchedulesView({ data }: ClientsSchedulesViewProps) {
    // Stats for potential toolbar or header
    const stats = useMemo(() => {
        const pending = data.filter(s => s.status === 'pending').length;
        const overdue = data.filter(s => s.status === 'overdue').length;
        const paid = data.filter(s => s.status === 'paid').length;
        return { pending, overdue, paid, total: data.length };
    }, [data]);

    // ✅ EmptyState
    if (data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <ViewEmptyState
                    mode="empty"
                    icon={Calendar}
                    viewName="Cronogramas de Cuotas"
                    featureDescription="Visualiza y gestiona los vencimientos de cuotas de tus clientes."
                />
            </div>
        );
    }

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="commitment.client.contact.full_name"
        />
    );
}
