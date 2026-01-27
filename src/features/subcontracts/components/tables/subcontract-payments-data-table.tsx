"use client";

import React, { useState, useRef } from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { subcontractPaymentsColumns, SubcontractPaymentRow } from "./subcontract-payments-columns";
import { useModal } from "@/providers/modal-store";
import { SubcontractPaymentForm } from "../forms/subcontract-payment-form";
import { deleteSubcontractPaymentAction } from "@/features/subcontracts/actions";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { useMoney } from "@/hooks/use-money";

interface SubcontractPaymentsDataTableProps {
    data: SubcontractPaymentRow[];
    subcontract: any;
    financialData: any;
    projectId: string;
    organizationId: string;
}

export function SubcontractPaymentsDataTable({
    data,
    subcontract,
    financialData,
    projectId,
    organizationId,
}: SubcontractPaymentsDataTableProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const { config } = useMoney();

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

    const handleEdit = (payment: SubcontractPaymentRow) => {
        openModal(
            <SubcontractPaymentForm
                projectId={projectId}
                organizationId={organizationId}
                subcontracts={[subcontract]}
                financialData={financialData}
                initialData={payment}
                onSuccess={() => {
                    closeModal();
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

    const [paymentToDelete, setPaymentToDelete] = useState<SubcontractPaymentRow | null>(null);
    const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([]);
    const resetSelectionRef = useRef<(() => void) | null>(null);

    const handleDelete = (payment: SubcontractPaymentRow) => {
        setPaymentToDelete(payment);
    };

    const handleBulkDelete = (payments: SubcontractPaymentRow[], resetSelection: () => void) => {
        setBulkDeleteIds(payments.map(p => p.id));
        resetSelectionRef.current = resetSelection;
    };

    // 🚀 OPTIMISTIC DELETE: Payment disappears instantly, server action runs in background
    const confirmDelete = async () => {
        if (!paymentToDelete && bulkDeleteIds.length === 0) return;

        const idsToDelete = paymentToDelete ? [paymentToDelete.id] : bulkDeleteIds;
        setPaymentToDelete(null);
        setBulkDeleteIds([]);

        // Reset selection if bulk delete
        if (resetSelectionRef.current) {
            resetSelectionRef.current();
            resetSelectionRef.current = null;
        }

        // Optimistic update - payments disappear NOW
        for (const paymentId of idsToDelete) {
            optimisticRemove(paymentId, async () => {
                try {
                    await deleteSubcontractPaymentAction(paymentId);
                } catch (error) {
                    toast.error("Error al eliminar el pago");
                    router.refresh();
                }
            });
        }

        toast.success(idsToDelete.length === 1 ? "Pago eliminado" : `${idsToDelete.length} pagos eliminados`);
    };

    return (
        <div className="h-full flex flex-col">
            <DataTable
                columns={subcontractPaymentsColumns}
                data={optimisticPayments}
                enableRowSelection={true}
                enableRowActions={true}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                initialSorting={[{ id: "payment_date", desc: true }]}
            />

            <DeleteConfirmationDialog
                open={!!paymentToDelete || bulkDeleteIds.length > 0}
                onOpenChange={(open) => {
                    if (!open) {
                        setPaymentToDelete(null);
                        setBulkDeleteIds([]);
                    }
                }}
                onConfirm={confirmDelete}
                title={bulkDeleteIds.length > 0 ? `¿Eliminar ${bulkDeleteIds.length} pagos?` : "¿Eliminar pago?"}
                description={
                    bulkDeleteIds.length > 0 ? (
                        <span>
                            Estás a punto de eliminar <strong>{bulkDeleteIds.length} pagos</strong> seleccionados. Esta acción no se puede deshacer.
                        </span>
                    ) : (
                        <span>
                            Estás a punto de eliminar un pago por <strong>
                                {paymentToDelete?.currency?.symbol || config.functionalCurrencySymbol} {paymentToDelete?.amount?.toLocaleString('es-AR')}
                            </strong>. Esta acción no se puede deshacer.
                        </span>
                    )
                }
                confirmLabel="Eliminar"
                isDeleting={isPending}
            />
        </div>
    );
}
