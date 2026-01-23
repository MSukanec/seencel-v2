"use client";

import { useState } from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { MaterialPaymentView, OrganizationFinancialData, MaterialPurchase } from "../../types";
import { columns } from "./material-payments-columns";
import { Button } from "@/components/ui/button";
import { Plus, Banknote } from "lucide-react";
import { DataTableExport } from "@/components/shared/data-table/data-table-export";
import { useModal } from "@/providers/modal-store";
import { MaterialPaymentForm } from "../forms/material-payment-form";
import { deleteMaterialPaymentAction } from "@/features/materials/actions";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { useOptimisticList } from "@/hooks/use-optimistic-action";

interface MaterialPaymentsDataTableProps {
    data: MaterialPaymentView[];
    purchases: MaterialPurchase[];
    financialData: OrganizationFinancialData;
    projectId: string;
    orgId: string;
}

export function MaterialPaymentsDataTable({
    data,
    purchases,
    financialData,
    projectId,
    orgId
}: MaterialPaymentsDataTableProps) {
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

    // ========================================
    // HANDLERS
    // ========================================

    const handleNewPayment = () => {
        openModal(
            <MaterialPaymentForm
                projectId={projectId}
                organizationId={orgId}
                purchases={purchases}
                financialData={financialData}
                onSuccess={() => {
                    router.refresh();
                }}
            />,
            {
                title: "Nuevo Pago de Material",
                description: "Registra un nuevo pago por materiales.",
                size: "lg"
            }
        );
    };

    const handleEdit = (payment: MaterialPaymentView) => {
        openModal(
            <MaterialPaymentForm
                projectId={projectId}
                organizationId={orgId}
                purchases={purchases}
                financialData={financialData}
                initialData={payment as any}
                onSuccess={() => {
                    toast.success("Pago actualizado");
                    router.refresh();
                }}
            />,
            {
                title: "Editar Pago de Material",
                description: "Modifica los detalles del pago.",
                size: "lg"
            }
        );
    };

    const [paymentToDelete, setPaymentToDelete] = useState<MaterialPaymentView | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = (payment: MaterialPaymentView) => {
        setPaymentToDelete(payment);
    };

    // 🚀 OPTIMISTIC DELETE
    const confirmDelete = async () => {
        if (!paymentToDelete) return;
        const paymentId = paymentToDelete.id;
        setPaymentToDelete(null);

        optimisticRemove(paymentId, async () => {
            try {
                await deleteMaterialPaymentAction(paymentId);
                toast.success("Pago eliminado");
            } catch (error) {
                toast.error("Error al eliminar el pago");
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
                title="Sin pagos de materiales"
                description="Registrá el primer pago de materiales para este proyecto."
                action={
                    <Button onClick={handleNewPayment}>
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Pago
                    </Button>
                }
            />
        );
    }

    return (
        <div className="h-full flex flex-col">
            <DataTable
                columns={columns}
                data={optimisticPayments}
                searchKey="reference"
                searchPlaceholder="Buscar por referencia..."
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
                        Estás a punto de eliminar el pago por <strong>{paymentToDelete?.currency_symbol}{paymentToDelete?.amount}</strong>. Esta acción no se puede deshacer.
                    </span>
                }
                confirmLabel="Eliminar"
                isDeleting={isDeleting}
            />
        </div>
    );
}

