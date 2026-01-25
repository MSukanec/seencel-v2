"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTableAvatarCell } from "@/components/shared/data-table/data-table-avatar-cell";
import { DataTableRowActions } from "@/components/shared/data-table/data-table-row-actions";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const columns: ColumnDef<any>[] = [
    {
        accessorKey: "provider",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Proveedor" />,
        cell: ({ row }) => {
            const data = row.original;
            const contact = data.contact;
            const name = data.provider_name || contact?.full_name || contact?.company_name || "Sin Nombre";
            const fallback = (name[0] || "").toUpperCase();
            const imageUrl = data.provider_image || contact?.image_url;

            return (
                <DataTableAvatarCell
                    title={name}
                    subtitle={data.role || "Subcontratista"}
                    src={imageUrl}
                    fallback={fallback}
                />
            );
        },
        enableSorting: true,
        enableHiding: false,
    },
    {
        accessorKey: "description",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción" />,
        cell: ({ row }) => (
            <div className="max-w-[300px] truncate" title={row.original.description}>
                <span className="text-sm font-medium">{row.original.description || "Sin descripción"}</span>
            </div>
        ),
    },
    {
        accessorKey: "amount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Monto Contrato" />,
        cell: ({ row }) => {
            const amount = row.original.amount;
            // Access nested currency symbol if available, or fallback
            const symbol = row.original.currency?.currencies?.symbol || "$";

            if (!amount) return <span className="text-sm text-muted-foreground">-</span>;

            return (
                <span className="font-mono font-medium">
                    {symbol} {Number(amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
            );
        },
    },
    {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
        cell: ({ row }) => {
            const status = row.original.status || "active";

            let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
            let label = status;

            switch (status) {
                case "active":
                    variant = "outline";
                    label = "Activo";
                    break;
                case "completed":
                    variant = "secondary";
                    label = "Completado";
                    break;
                case "cancelled":
                    variant = "destructive";
                    label = "Cancelado";
                    break;
                case "draft":
                    variant = "outline"; // dashed border style often used for drafts
                    label = "Borrador";
                    break;
            }

            return <Badge variant={variant}>{label}</Badge>;
        },
    },
    {
        accessorKey: "start_date",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Inicio" />,
        cell: ({ row }) => {
            if (!row.original.start_date) return <span className="text-muted-foreground">-</span>;
            return (
                <span className="text-sm">
                    {format(new Date(row.original.start_date), "dd MMM yyyy", { locale: es })}
                </span>
            );
        },
    },
    // Actions are handled by the DataTable component passing `enableRowActions={true}`
];
