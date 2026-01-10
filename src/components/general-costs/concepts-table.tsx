"use client";

import { ColumnDef } from "@tanstack/react-table";
import { GeneralCost, GeneralCostCategory } from "@/types/general-costs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";

interface ConceptsTableProps {
    data: GeneralCost[];
    categories: GeneralCostCategory[];
}

export function ConceptsTable({ data }: ConceptsTableProps) {
    const columns: ColumnDef<GeneralCost>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
            cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
        },
        {
            id: "category",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Categoría" />,
            accessorFn: (row) => row.category?.name,
            cell: ({ row }) => {
                const category = row.original.category;
                return category ? (
                    <Badge variant="outline">{category.name}</Badge>
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
        },
        {
            accessorKey: "is_recurring",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Recurrencia" />,
            cell: ({ row }) => {
                const cost = row.original;
                return cost.is_recurring ? (
                    <Badge variant="secondary">Recurrente: {cost.recurrence_interval}</Badge>
                ) : (
                    <span className="text-muted-foreground">Único</span>
                );
            },
        },
        {
            accessorKey: "description",
            header: "Descripción",
            cell: ({ row }) => (
                <span className="text-muted-foreground truncate max-w-[200px] block">
                    {row.getValue("description") || "-"}
                </span>
            ),
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Conceptos de Gasto</CardTitle>
            </CardHeader>
            <CardContent>
                <DataTable
                    columns={columns}
                    data={data}
                    searchPlaceholder="Buscar conceptos..."
                    showToolbar={data.length > 5}
                    showPagination={true}
                    pageSize={10}
                />
            </CardContent>
        </Card>
    );
}

