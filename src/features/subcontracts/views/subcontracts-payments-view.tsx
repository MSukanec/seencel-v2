"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { createDateColumn, createTextColumn, createMoneyColumn } from "@/components/shared/data-table/columns";
import { DataTableAvatarCell } from "@/components/shared/data-table/data-table-avatar-cell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { getStandardToolbarActions } from "@/lib/toolbar-actions";
import { Plus, Banknote, Trash2 } from "lucide-react";
import { useModal } from "@/stores/modal-store";
import { SubcontractPaymentForm } from "../forms/subcontract-payment-form";
import { deleteSubcontractPaymentAction, bulkDeleteSubcontractPaymentsAction } from "@/features/subcontracts/actions";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { createImportBatch, revertImportBatch, importSubcontractPaymentsBatch, ImportConfig } from "@/lib/import";
import { BulkImportModal } from "@/components/shared/import/import-modal";

interface SubcontractsPaymentsViewProps {
    data: any[];
    subcontracts: any[];
    financialData: any;
    projectId?: string;
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

    // === INLINE COLUMN DEFINITIONS (Standard Pattern) ===
    const columns: ColumnDef<any>[] = useMemo(() => [
        createDateColumn<any>({
            accessorKey: "payment_date",
            showAvatar: false,
        }),
        {
            accessorKey: "subcontract_title",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Subcontrato" />,
            cell: ({ row }) => (
                <DataTableAvatarCell
                    title={row.original.subcontract_title || "Sin título"}
                    subtitle={row.original.provider_name || row.original.provider_company_name || ""}
                    src={row.original.provider_avatar_url}
                    fallback={(row.original.subcontract_title || "S")[0]}
                />
            ),
            enableSorting: true,
            enableHiding: false,
        },
        createTextColumn<any>({
            accessorKey: "wallet_name",
            title: "Billetera",
            muted: true,
        }),
        createMoneyColumn<any>({
            accessorKey: "amount",
            prefix: "-",
            colorMode: "negative",
        }),
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => {
                const status = row.original.status;
                let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
                let className = "";

                switch (status) {
                    case "confirmed":
                        variant = "outline";
                        className = "bg-amount-positive/10 text-amount-positive border-amount-positive/20";
                        break;
                    case "pending":
                        variant = "outline";
                        className = "bg-amber-500/10 text-amber-600 border-amber-500/20";
                        break;
                    case "rejected":
                        variant = "destructive";
                        break;
                    case "void":
                        variant = "secondary";
                        break;
                }

                return (
                    <Badge variant={variant} className={className}>
                        {status === "confirmed" ? "Confirmado" :
                            status === "pending" ? "Pendiente" :
                                status === "rejected" ? "Rechazado" :
                                    status === "void" ? "Anulado" : status}
                    </Badge>
                );
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },
    ], []);

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
                        return createQuickSubcontractAction(orgId, projectId || '', value);
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
            const result = await importSubcontractPaymentsBatch(orgId, projectId || '', data, batch.id);
            return { success: result.success, errors: result.errors, warnings: result.warnings, batchId: batch.id };
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
                projectId={projectId || ''}
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
                projectId={projectId || ''}
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
            await bulkDeleteSubcontractPaymentsAction(bulkDeleteIds, projectId || '');
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

    // Early return for empty state with Toolbar always visible
    if (data.length === 0) {
        return (
            <div className="h-full flex flex-col">
                <Toolbar
                    portalToHeader
                    actions={[
                        {
                            label: "Nuevo Pago",
                            icon: Plus,
                            onClick: handleNewPayment
                        },
                        ...getStandardToolbarActions({
                            onImport: handleOpenImport,
                            onExportCSV: () => toast.info("Exportar CSV: próximamente"),
                            onExportExcel: () => toast.info("Exportar Excel: próximamente"),
                        }),
                    ]}
                />
                <div className="flex-1 flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={Banknote}
                        viewName="Pagos de Subcontratos"
                        featureDescription="Registra el primer pago de subcontratos."
                        onAction={handleNewPayment}
                        actionLabel="Nuevo Pago"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <Toolbar
                portalToHeader
                actions={[
                    {
                        label: "Nuevo Pago",
                        icon: Plus,
                        onClick: handleNewPayment
                    },
                    ...getStandardToolbarActions({
                        onImport: handleOpenImport,
                        onExportCSV: () => toast.info("Exportar CSV: próximamente"),
                        onExportExcel: () => toast.info("Exportar Excel: próximamente"),
                    }),
                ]}
            />
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
