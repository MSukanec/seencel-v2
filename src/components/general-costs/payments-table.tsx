"use client";

import { useState, useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { GeneralCost, GeneralCostPaymentView } from "@/types/general-costs";
import { deleteGeneralCostPayment } from "@/actions/general-costs";
import { PaymentFormDialog } from "./payment-form-dialog";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PaymentsTableProps {
    data: GeneralCostPaymentView[];
    concepts: GeneralCost[]; // Needed for the dropdown in the form
    organizationId: string;
}

export function PaymentsTable({ data, concepts, organizationId }: PaymentsTableProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<GeneralCostPaymentView | undefined>(undefined);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState<GeneralCostPaymentView | null>(null);
    const [isDeleting, startDeleteTransition] = useTransition();

    const handleCreate = () => {
        setSelectedPayment(undefined);
        setIsDialogOpen(true);
    };

    const handleEdit = (payment: GeneralCostPaymentView) => {
        setSelectedPayment(payment);
        setIsDialogOpen(true);
    };

    const handleDeleteClick = (payment: GeneralCostPaymentView) => {
        setPaymentToDelete(payment);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!paymentToDelete) return;

        startDeleteTransition(async () => {
            try {
                await deleteGeneralCostPayment(paymentToDelete.id);
                toast.success("Pago eliminado");
                setIsDeleteDialogOpen(false);
            } catch (error) {
                console.error(error);
                toast.error("Error al eliminar el pago");
            }
        });
    };

    const formatCurrency = (amount: number, currency = 'USD') => {
        try {
            // Basic validation: ensure currency looks like a 3-letter code
            const safeCurrency = (currency && currency.length === 3) ? currency : 'USD';
            return new Intl.NumberFormat('es-ES', { style: 'currency', currency: safeCurrency }).format(amount);
        } catch (error) {
            // Fallback for invalid currency codes
            return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2 }).format(amount);
        }
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
                    {formatCurrency(row.getValue("amount"), row.original.currency_id)}
                </span>
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const payment = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(payment)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleDeleteClick(payment)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Historial de Pagos</h3>
                    <p className="text-sm text-muted-foreground">Registro de todos los pagos realizados.</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Pago
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pagos Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={data}
                        searchPlaceholder="Buscar pagos..."
                        showToolbar={true}
                        showPagination={true}
                        pageSize={10}
                    />
                </CardContent>
            </Card>

            <PaymentFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                paymentToEdit={selectedPayment}
                concepts={concepts}
                organizationId={organizationId}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará el registro del pago.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault(); // Prevent auto-close
                                confirmDelete();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

