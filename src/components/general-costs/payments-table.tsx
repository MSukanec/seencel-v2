"use client";

import { ColumnDef } from "@tanstack/react-table";
import { GeneralCostPaymentView } from "@/types/general-costs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";

interface PaymentsTableProps {
    data: GeneralCostPaymentView[];
}

export function PaymentsTable({ data }: PaymentsTableProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES');
    };

    const columns: ColumnDef<GeneralCostPaymentView>[] = [
        {
            accessorKey: "payment_date",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
            cell: ({ row }) => formatDate(row.getValue("payment_date")),
        },
        {
            accessorKey: "general_cost_name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Concepto" />,
            cell: ({ row }) => (
                <span className="font-medium">
                    {row.getValue("general_cost_name") || "Gasto sin concepto"}
                </span>
            ),
        },
        {
            accessorKey: "category_name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Categoría" />,
            cell: ({ row }) => {
                const categoryName = row.getValue("category_name") as string | null;
                return categoryName ? (
                    <Badge variant="outline" className="text-xs">{categoryName}</Badge>
                ) : null;
            },
        },
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                return (
                    <Badge variant={status === 'confirmed' ? 'default' : 'secondary'}>
                        {status === 'confirmed' ? 'Confirmado' : status}
                    </Badge>
                );
            },
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            accessorKey: "amount",
            header: ({ column }) => (
                <div className="text-right">
                    <DataTableColumnHeader column={column} title="Monto" />
                </div>
            ),
            cell: ({ row }) => (
                <span className="text-right font-mono block">
                    {formatCurrency(row.getValue("amount"))}
                </span>
            ),
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
                <DataTable
                    columns={columns}
                    data={data}
                    searchPlaceholder="Buscar pagos..."
                    showToolbar={data.length > 5}
                    showPagination={true}
                    pageSize={10}
                />
            </CardContent>
        </Card>
    );
}

