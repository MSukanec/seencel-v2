"use client";

import { useState } from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { columns } from "../components/tables/subcontracts-payments-columns";
import { Button } from "@/components/ui/button";
import { Plus, Banknote, Upload, FileSpreadsheet, Trash2 } from "lucide-react";
import { useModal } from "@/providers/modal-store";
import { SubcontractPaymentForm } from "../components/forms/subcontract-payment-form";
import { deleteSubcontractPaymentAction, bulkDeleteSubcontractPaymentsAction } from "@/features/subcontracts/actions";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { createImportBatch, revertImportBatch, importSubcontractPaymentsBatch } from "@/actions/import-actions";
import { ImportConfig } from "@/lib/import-utils";
import { BulkImportModal } from "@/components/shared/import/import-modal";

interface SubcontractsPaymentsViewProps {
    data: any[];
    subcontracts: any[];
    financialData: any;
    projectId: string;
    orgId: string;
}

export function SubcontractsPaymentsView({
    data,
    subcontracts,
    financialData,
    projectId,
    orgId
}: SubcontractsPaymentsViewProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();

    // Optimistic UI
    const {
        optimisticItems: optimisticPayments,
        removeItem: optimisticRemove,
        isPending
    } = useOptimisticList({
        items: data,
        getItemId: (payment) => payment.id,
    });

    // Import Configuration
    const paymentImportConfig: ImportConfig<any> = {
        entityLabel: "Pagos de Subcontratos",
        entityId: "pagos_subcontratos",
        columns: [
            { id: "payment_date", label: "Fecha", required: true, example: "2024-01-20" },
            {
                id: "subcontract_title",
                label: "Contrato / Proveedor",
                required: true,
                example: "Juan Perez",
                foreignKey: {
                    table: 'subcontracts',
                    labelField: 'label',
                    valueField: 'id',
                    fetchOptions: async () => {
                        return (subcontracts || []).map((s: any) => ({
                            id: s.id,
                            label: s.title || "Sin título"
                        }));
                    },
                    allowCreate: true,
                    createAction: async (value: string) => {
                        const { createQuickSubcontractAction } = await import("@/features/subcontracts/actions");
                        return createQuickSubcontractAction(orgId, projectId, value);
                    }
                }
            },
            { id: "amount", label: "Monto", required: true, type: "number", example: "10000" },
            {
                id: "currency_code",
                label: "Moneda",
                required: false,
                example: "ARS",
                foreignKey: {
                    table: 'currencies',
                    labelField: 'code',
                    valueField: 'id',
                    fetchOptions: async () => {
                        return (financialData?.currencies || []).map((c: any) => ({
                            id: c.id,
                            label: `${c.name} (${c.code})`
                        }));
                    }
                }
            },
            { id: "exchange_rate", label: "Cotización", required: false, type: "number", example: "1200" },
            {
                id: "wallet_name",
                label: "Billetera",
                required: false,
                example: "Caja Chica",
                foreignKey: {
                    table: 'organization_wallets',
                    labelField: 'name',
                    valueField: 'id',
                    fetchOptions: async () => {
                        return (financialData?.wallets || []).map((w: any) => ({
                            id: w.id,
                            label: w.name
                        }));
                    }
                }
            },
            { id: "notes", label: "Notas", required: false },
            { id: "reference", label: "Referencia", required: false, example: "Transferencia #123" },
        ],
        onImport: async (data) => {
            const batch = await createImportBatch(orgId, "subcontract_payments", data.length);
            const result = await importSubcontractPaymentsBatch(orgId, projectId, data, batch.id);
            return { success: result.success, errors: result.errors, batchId: batch.id };
        },
        onRevert: async (batchId) => {
            await revertImportBatch(batchId, 'subcontract_payments');
        }
    };

    const handleOpenImport = () => {
        openModal(
            <BulkImportModal config={paymentImportConfig} organizationId={orgId} />,
            {
                size: "2xl",
                title: "Importar Pagos de Subcontratos",
                description: "Importa pagos masivamente desde Excel o CSV."
            }
        );
    };

    // Handlers
    const handleNewPayment = () => {
        openModal(
            <SubcontractPaymentForm
                projectId={projectId}
                organizationId={orgId}
                subcontracts={subcontracts}
                financialData={financialData}
                onSuccess={() => {
                    router.refresh();
                }}
            />,
            {
                title: "Nuevo Pago de Subcontrato",
                description: "Registra un nuevo pago a proveedor.",
                size: "lg"
            }
        );
    };

    const handleEdit = (payment: any) => {
        openModal(
            <SubcontractPaymentForm
                projectId={projectId}
                organizationId={orgId}
                subcontracts={subcontracts}
                financialData={financialData}
                initialData={payment}
                onSuccess={() => {
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

    const [paymentToDelete, setPaymentToDelete] = useState<any | null>(null);

    const handleDelete = (payment: any) => {
        setPaymentToDelete(payment);
    };

    const confirmDelete = async () => {
        if (!paymentToDelete) return;
        const paymentId = paymentToDelete.id;
        setPaymentToDelete(null);

        optimisticRemove(paymentId, async () => {
            try {
                await deleteSubcontractPaymentAction(paymentId);
                toast.success("Pago eliminado");
            } catch (error) {
                toast.error("Error al eliminar el pago");
                router.refresh();
            }
        });
    };

    const statusOptions = [
        { label: "Confirmado", value: "confirmed" },
        { label: "Pendiente", value: "pending" },
        { label: "Rechazado", value: "rejected" },
        { label: "Anulado", value: "void" },
    ];

    // Bulk Delete State
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
    const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const handleOpenBulkDelete = (ids: string[]) => {
        setBulkDeleteIds(ids);
        setShowBulkDeleteDialog(true);
    };

    const confirmBulkDelete = async () => {
        if (bulkDeleteIds.length === 0) return;

        setIsBulkDeleting(true);
        try {
            await bulkDeleteSubcontractPaymentsAction(bulkDeleteIds, projectId);
            toast.success(`${bulkDeleteIds.length} pagos eliminados`);
            router.refresh();
        } catch (error) {
            toast.error("Error al eliminar los pagos");
        } finally {
            setIsBulkDeleting(false);
            setShowBulkDeleteDialog(false);
            setBulkDeleteIds([]);
        }
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
                bulkActions={({ table }) => {
                    const selectedRows = table.getSelectedRowModel().rows;
                    const selectedCount = selectedRows.length;
                    if (selectedCount === 0) return null;

                    return (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                const ids = selectedRows.map((row: any) => row.original.id);
                                handleOpenBulkDelete(ids);
                            }}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar ({selectedCount})
                        </Button>
                    );
                }}
                emptyState={
                    <EmptyState
                        icon={Banknote}
                        title="Sin pagos registrados"
                        description="Registra el primer pago de subcontratos."
                    />
                }
                initialSorting={[{ id: "payment_date", desc: true }]}
            />

            {/* Single Delete Dialog */}
            <DeleteConfirmationDialog
                open={!!paymentToDelete}
                onOpenChange={(open) => !open && setPaymentToDelete(null)}
                onConfirm={confirmDelete}
                title="¿Eliminar pago?"
                description={
                    <span>
                        Estás a punto de eliminar un pago por <strong>{paymentToDelete?.currency?.symbol} {paymentToDelete?.amount}</strong>. Esta acción no se puede deshacer.
                    </span>
                }
                confirmLabel="Eliminar"
                isDeleting={isPending}
            />

            {/* Bulk Delete Dialog */}
            <DeleteConfirmationDialog
                open={showBulkDeleteDialog}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowBulkDeleteDialog(false);
                        setBulkDeleteIds([]);
                    }
                }}
                onConfirm={confirmBulkDelete}
                title={`¿Eliminar ${bulkDeleteIds.length} pagos?`}
                description={
                    <span>
                        Estás a punto de eliminar <strong>{bulkDeleteIds.length} pagos</strong> seleccionados. Esta acción no se puede deshacer.
                    </span>
                }
                confirmLabel={`Eliminar ${bulkDeleteIds.length} pagos`}
                isDeleting={isBulkDeleting}
            />
        </div>
    );
}
