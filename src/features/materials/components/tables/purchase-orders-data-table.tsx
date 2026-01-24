"use client";

import { useState } from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    SortingState,
    getSortedRowModel,
    ColumnFiltersState,
    getFilteredRowModel,
} from "@tanstack/react-table";
import { Plus } from "lucide-react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    PurchaseOrderView,
    PurchaseOrderStatus,
    OrganizationFinancialData
} from "../../types";
import { createPurchaseOrdersColumns } from "./purchase-orders-columns";

interface PurchaseOrdersDataTableProps {
    data: PurchaseOrderView[];
    projectId: string;
    orgId: string;
    financialData: OrganizationFinancialData;
    providers: { id: string; name: string }[];
    onNewOrder: () => void;
    onViewOrder: (order: PurchaseOrderView) => void;
    onUpdateStatus: (orderId: string, newStatus: PurchaseOrderStatus) => Promise<void>;
    onDeleteOrder: (orderId: string) => Promise<void>;
}

export function PurchaseOrdersDataTable({
    data,
    projectId,
    orgId,
    financialData,
    providers,
    onNewOrder,
    onViewOrder,
    onUpdateStatus,
    onDeleteOrder,
}: PurchaseOrdersDataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const columns = createPurchaseOrdersColumns({
        onView: onViewOrder,
        onUpdateStatus: async (orderId, newStatus) => {
            await onUpdateStatus(orderId, newStatus);
        },
        onDelete: async (orderId) => {
            await onDeleteOrder(orderId);
        },
    });

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    });

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Buscar por proveedor..."
                        value={(table.getColumn("provider_name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("provider_name")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                </div>
                <Button onClick={onNewOrder}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Orden
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No hay órdenes de compra.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Anterior
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Siguiente
                </Button>
            </div>
        </div>
    );
}
