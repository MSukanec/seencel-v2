"use client";

import { useState } from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ClientPaymentView, OrganizationFinancialData } from "../../types";
import { columns } from "./payments-columns";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Banknote } from "lucide-react";
import { DataTableExport } from "@/components/shared/data-table/data-table-export";
import { DataTableImport } from "@/components/shared/data-table/data-table-import";
import { useModal } from "@/providers/modal-store";
import { PaymentForm } from "../forms/payment-form";
import { deletePaymentAction } from "@/features/clients/actions";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { ImportConfig } from "@/lib/import-utils";
import { createImportBatch, importPaymentsBatch, revertImportBatch } from "@/actions/import-actions";

interface PaymentsDataTableProps {
    data: ClientPaymentView[];
    clients: any[];
    financialData: OrganizationFinancialData;
    projectId: string;
    orgId: string;
}

export function PaymentsDataTable({
    data,
    clients,
    financialData,
    projectId,
    orgId,
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

    // ========================================
    // IMPORT CONFIG
    // ========================================

    const paymentsImportConfig: ImportConfig<any> = {
        entityLabel: "Pagos",
        entityId: "client_payments",
        columns: [
            {
                id: "payment_date",
                label: "Fecha",
                required: true,
                type: "date",
                example: "2024-01-15"
            },
            {
                id: "client_name",
                label: "Cliente",
                required: true,
                example: "Juan Pérez",
                foreignKey: {
                    table: 'project_clients',
                    labelField: 'contact_full_name',
                    valueField: 'id',
                    fetchOptions: async () => clients.map(c => ({
                        id: c.id,
                        label: c.contact_full_name || 'Sin nombre'
                    })),
                }
            },
            {
                id: "amount",
                label: "Monto",
                required: true,
                type: "currency",
                example: "150000"
            },
            {
                id: "currency_code",
                label: "Moneda",
                required: false,
                example: "ARS",
                foreignKey: {
                    table: 'currencies',
                    labelField: 'code',
                    valueField: 'id',
                    fetchOptions: async () => financialData.currencies.map(c => ({
                        id: c.id,
                        label: c.code
                    })),
                }
            },
            {
                id: "wallet_name",
                label: "Billetera",
                required: false,
                example: "Banco Principal",
                foreignKey: {
                    table: 'wallets',
                    labelField: 'name',
                    valueField: 'id',
                    fetchOptions: async () => financialData.wallets.map(w => ({
                        id: w.id,
                        label: w.name
                    })),
                }
            },
            {
                id: "exchange_rate",
                label: "Tipo de Cambio",
                required: false,
                type: "number",
                example: "1.0000"
            },
            {
                id: "reference",
                label: "Referencia",
                required: false,
                example: "TRX-12345"
            },
            {
                id: "notes",
                label: "Notas",
                required: false
            },
        ],
        onImport: async (records) => {
            try {
                const batch = await createImportBatch(orgId, "client_payments", records.length);
                const result = await importPaymentsBatch(orgId, projectId, records, batch.id);
                router.refresh();
                return {
                    success: result.success,
                    errors: result.errors,
                    batchId: batch.id
                };
            } catch (error: any) {
                console.error("Import error:", error);
                throw error;
            }
        },
        onRevert: async (batchId) => {
            await revertImportBatch(batchId, 'client_payments');
            router.refresh();
        }
    };

    // ========================================
    // HANDLERS
    // ========================================

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
                router.refresh();
            }
        });
    };

    return (
        <div className="h-full flex flex-col">
            <DataTable
                columns={columns}
                data={optimisticPayments}
                enableRowSelection={true}
                enableRowActions={true}
                onEdit={handleEdit}
                onDelete={handleDelete}
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

