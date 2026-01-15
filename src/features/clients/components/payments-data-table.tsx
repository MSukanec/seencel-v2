"use client";

import { useState } from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ClientPaymentView } from "../types";
import { columns } from "./payments-columns";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { DataTableExport } from "@/components/shared/data-table/data-table-export";
import { useModal } from "@/providers/modal-store";
import { PaymentForm } from "./payment-form";
import { deletePaymentAction } from "@/features/clients/actions";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PaymentsDataTableProps {
    data: ClientPaymentView[];
    clients: any[];
    financialData: any;
    projectId: string;
    orgId: string;
}

export function PaymentsDataTable({
    data,
    clients,
    financialData,
    projectId,
    orgId
}: PaymentsDataTableProps) {
    const { openModal } = useModal();
    const router = useRouter();

    const handleNewPayment = () => {
        openModal(
            <PaymentForm
                projectId={projectId}
                organizationId={orgId}
                clients={clients}
                financialData={financialData}
                onSuccess={() => {
                    // Ideally revalidate path or refresh data
                    router.refresh();
                }}
            />,
            {
                title: "Nuevo Pago de Cliente",
                description: "Registra un nuevo pago para este proyecto.",
                size: "lg"
            }
        );
    };

    const handleEdit = (payment: ClientPaymentView) => {
        openModal(
            <PaymentForm
                projectId={projectId}
                organizationId={orgId}
                clients={clients}
                financialData={financialData}
                initialData={payment as any} // Cast safely or map types
                onSuccess={() => {
                    toast.success("Pago actualizado");
                    router.refresh();
                }}
            />,
            {
                title: "Editar Pago",
                description: "Modifica los detalles del pago.",
                size: "lg"
            }
        );
    };

    const [paymentToDelete, setPaymentToDelete] = useState<ClientPaymentView | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = (payment: ClientPaymentView) => {
        setPaymentToDelete(payment);
    };

    const confirmDelete = async () => {
        if (!paymentToDelete) return;
        setIsDeleting(true);
        try {
            await deletePaymentAction(paymentToDelete.id);
            toast.success("Pago eliminado");
            router.refresh();
        } catch (error) {
            toast.error("Error al eliminar el pago");
        } finally {
            setIsDeleting(false);
            setPaymentToDelete(null);
        }
    };

    // Define filters options
    const statusOptions = [
        { label: "Confirmado", value: "confirmed" },
        { label: "Pendiente", value: "pending" },
        { label: "Rechazado", value: "rejected" },
        { label: "Anulado", value: "void" },
    ];

    return (
        <div className="h-full flex flex-col">
            <DataTable
                columns={columns}
                data={data}
                searchKey="client_name"
                searchPlaceholder="Buscar por cliente..."
                enableRowSelection={true}
                enableRowActions={true}
                onEdit={handleEdit}
                onDelete={handleDelete}
                facetedFilters={[
                    {
                        columnId: "status",
                        title: "Estado",
                        options: statusOptions
                    }
                ]}
                toolbar={({ table }) => (
                    <div className="flex gap-2">
                        <DataTableExport table={table} />
                        <Button size="sm" onClick={handleNewPayment}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Pago
                        </Button>
                    </div>
                )}
                initialSorting={[{ id: "payment_date", desc: true }]}
                emptyState={
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-muted/50 p-4 mb-4">
                            <Download className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="font-medium text-lg">No hay pagos registrados</h3>
                        <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                            No se encontraron pagos que coincidan con los filtros aplicados.
                        </p>
                    </div>
                }
            />

            <DeleteConfirmationDialog
                open={!!paymentToDelete}
                onOpenChange={(open) => !open && setPaymentToDelete(null)}
                onConfirm={confirmDelete}
                title="¿Eliminar pago?"
                description={
                    <span>
                        Estás a punto de eliminar el pago de <strong>{paymentToDelete?.client_name}</strong> por <strong>{paymentToDelete?.amount}</strong>. Esta acción no se puede deshacer.
                    </span>
                }
                confirmLabel="Eliminar"
                isDeleting={isDeleting}
            />
        </div>
    );
}
