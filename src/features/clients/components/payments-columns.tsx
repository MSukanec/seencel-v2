"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ClientPaymentView } from "../types";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DataTableAvatarCell } from "@/components/shared/data-table/data-table-avatar-cell";

export const columns: ColumnDef<ClientPaymentView>[] = [
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
        accessorKey: "client_name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
        cell: ({ row }) => (
            <DataTableAvatarCell
                title={row.original.client_name || "N/A"}
                subtitle={row.original.client_role_name}
                src={row.original.client_avatar_url}
                fallback={row.original.client_first_name?.[0]}
            />
        ),
        enableSorting: true,
        enableHiding: false,
    },
    {
        accessorKey: "commitment_concept",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Compromiso" />,
        cell: ({ row }) => (
            <div className="max-w-[180px] truncate" title={row.original.commitment_concept || ""}>
                <span className="text-sm">{row.original.commitment_concept || "-"}</span>
            </div>
        ),
    },
    {
        accessorKey: "schedule_notes",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cuota" />,
        cell: ({ row }) => (
            <span className="text-sm font-medium text-muted-foreground">
                {row.original.schedule_notes || "-"}
            </span>
        ),
    },
    {
        accessorKey: "wallet_name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Billetera" />,
        cell: ({ row }) => (
            <span className="text-sm text-foreground/80">{row.original.wallet_name || "-"}</span>
        ),
    },
    {
        accessorKey: "amount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Monto" />,
        cell: ({ row }) => {
            const amount = row.original.amount;
            const currency = row.original.currency_symbol || "$";
            const rate = row.original.exchange_rate;

            return (
                <div className="flex flex-col">
                    <span className="font-mono font-medium text-emerald-600 dark:text-emerald-500">
                        {currency} {amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
        cell: ({ row }) => {
            const status = row.original.status;

            let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
            let className = "";

            switch (status) {
                case "confirmed":
                    variant = "outline";
                    className = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
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
