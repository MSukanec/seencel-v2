"use client";

import { useState } from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ClientPaymentView } from "../types";
import { columns } from "./payments-columns";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Banknote } from "lucide-react";
import { DataTableExport } from "@/components/shared/data-table/data-table-export";
import { useModal } from "@/providers/modal-store";
import { PaymentForm } from "./payment-form";
import { deletePaymentAction } from "@/features/clients/actions";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { useOptimisticList } from "@/hooks/use-optimistic-action";

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

    // 🚀 OPTIMISTIC UI: Instant visual updates for list operations
    const {
        optimisticItems: optimisticPayments,
        removeItem: optimisticRemove,
        isPending
    } = useOptimisticList({
        items: data,
        getItemId: (payment) => payment.id,
    });

    const handleNewPayment = () => {
        openModal(
            <PaymentForm
                projectId={projectId}
                organizationId={orgId}
                clients={clients}
                financialData={financialData}
                onSuccess={() => {
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

    const handleImport = () => {
        toast.info("Próximamente: Importar pagos desde CSV");
    };

    const handleEdit = (payment: ClientPaymentView) => {
        openModal(
            <PaymentForm
                projectId={projectId}
                organizationId={orgId}
                clients={clients}
                financialData={financialData}
                initialData={payment as any}
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

    // 🚀 OPTIMISTIC DELETE: Payment disappears instantly, server action runs in background
    const confirmDelete = async () => {
        if (!paymentToDelete) return;
        const paymentId = paymentToDelete.id;
        setPaymentToDelete(null); // Close dialog immediately

        // Optimistic update - payment disappears NOW
        optimisticRemove(paymentId, async () => {
            try {
                await deletePaymentAction(paymentId);
                toast.success("Pago eliminado");
            } catch (error) {
                toast.error("Error al eliminar el pago");
                // On error, React will revert the optimistic update automatically
                // Force refresh to ensure consistency
                router.refresh();
            }
        });
    };

    // Define filters options
    const statusOptions = [
        { label: "Confirmado", value: "confirmed" },
        { label: "Pendiente", value: "pending" },
        { label: "Rechazado", value: "rejected" },
        { label: "Anulado", value: "void" },
    ];

    // Empty State when no payments
    if (data.length === 0) {
        return (
            <EmptyState
                icon={Banknote}
                title="Sin pagos registrados"
                description="Registrá el primer pago de tus clientes o importalos desde un archivo CSV."
                action={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleImport}>
                            <Upload className="mr-2 h-4 w-4" /> Importar
                        </Button>
                        <Button onClick={handleNewPayment}>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Pago
                        </Button>
                    </div>
                }
            />
        );
    }

    return (
        <div className="h-full flex flex-col">
            <DataTable
                columns={columns}
                data={optimisticPayments}
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
                        <Button size="sm" variant="outline" className="h-9" onClick={handleImport}>
                            <Upload className="mr-2 h-4 w-4" />
                            Importar
                        </Button>
                        <Button size="sm" className="h-9" onClick={handleNewPayment}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Pago
                        </Button>
                    </div>
                )}
                initialSorting={[{ id: "payment_date", desc: true }]}
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
