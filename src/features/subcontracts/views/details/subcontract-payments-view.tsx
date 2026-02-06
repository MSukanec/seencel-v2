"use client";

import { useState, useMemo, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Banknote, Wallet, CircleDollarSign, Upload, Download } from "lucide-react";
import { useModal } from "@/stores/modal-store";
import { SubcontractPaymentForm } from "@/features/subcontracts/forms/subcontract-payment-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { useMoney } from "@/hooks/use-money";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { createDateColumn, createTextColumn, createMoneyColumn } from "@/components/shared/data-table/columns";
import { Badge } from "@/components/ui/badge";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { deleteSubcontractPaymentAction } from "@/features/subcontracts/actions";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";

interface SubcontractPaymentsViewProps {
    subcontract: any;
    payments: any[];
    financialData: any;
    projectId: string;
    organizationId: string;
}

export function SubcontractPaymentsView({
    subcontract,
    payments,
    financialData,
    projectId,
    organizationId
}: SubcontractPaymentsViewProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const { format: formatMoney, sum, config } = useMoney();
    const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());

    // Optimistic UI
    const {
        optimisticItems: optimisticPayments,
        removeItem: optimisticRemove,
        isPending
    } = useOptimisticList({
        items: payments,
        getItemId: (payment) => payment.id,
    });

    // === INLINE COLUMN DEFINITIONS (Standard Pattern) ===
    const columns: ColumnDef<any>[] = useMemo(() => [
        createDateColumn<any>({
            accessorKey: "payment_date",
            showAvatar: false,
        }),
        createMoneyColumn<any>({
            accessorKey: "amount",
            prefix: "-",
            colorMode: "negative",
        }),
        {
            accessorKey: "wallet",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Billetera" />,
            cell: ({ row }) => (
                <span className="text-sm text-foreground/80">{row.original.wallet?.name || "-"}</span>
            ),
        },
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
        createTextColumn<any>({
            accessorKey: "reference",
            title: "Referencia",
            truncate: 150,
            muted: true,
        }),
    ], []);

    // Calculate summary using proper money items with actual currency data
    const paymentItems = payments.map(p => ({
        amount: Number(p.amount || 0),
        currency_code: p.currency?.code || config.functionalCurrencyCode,
        exchange_rate: Number(p.exchange_rate) || config.currentExchangeRate
    }));
    const paidSummary = sum(paymentItems);

    const contractAmount = Number(subcontract.amount_total || 0);
    const contractCurrencyCode = subcontract.currency?.code || config.functionalCurrencyCode;
    const contractSymbol = subcontract.currency?.symbol || config.functionalCurrencySymbol;
    const isFunctional = contractCurrencyCode === config.functionalCurrencyCode;
    const contractFunctional = isFunctional
        ? contractAmount
        : contractAmount * (subcontract.exchange_rate || config.currentExchangeRate || 1);
    const remaining = contractFunctional - paidSummary.total;

    // Create items arrays for KPI cards (for proper currency conversion)
    const contractItems = [{
        amount: contractAmount,
        currency_code: contractCurrencyCode,
        exchange_rate: Number(subcontract.exchange_rate) || config.currentExchangeRate || 1
    }];
    const remainingItems = [{
        amount: remaining,
        currency_code: config.functionalCurrencyCode,
        exchange_rate: 1
    }];

    // ========================================
    // FILTER OPTIONS
    // ========================================
    const statusOptions = [
        { label: "Confirmado", value: "confirmed" },
        { label: "Pendiente", value: "pending" },
        { label: "Rechazado", value: "rejected" },
        { label: "Anulado", value: "void" },
    ];

    // ========================================
    // FILTERED DATA
    // ========================================
    const filteredPayments = optimisticPayments.filter(payment => {
        if (statusFilter.size > 0 && !statusFilter.has(payment.status)) {
            return false;
        }
        return true;
    });

    // ========================================
    // HANDLERS
    // ========================================
    const handleNewPayment = () => {
        openModal(
            <SubcontractPaymentForm
                projectId={projectId}
                organizationId={organizationId}
                subcontracts={[subcontract]}
                financialData={financialData}
                onSuccess={() => {
                    closeModal();
                    toast.success("Pago registrado");
                    router.refresh();
                }}
            />,
            {
                title: "Nuevo Pago",
                description: "Registra un pago para este subcontrato.",
                size: "lg"
            }
        );
    };

    const handleEdit = (payment: any) => {
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

    const [paymentToDelete, setPaymentToDelete] = useState<any | null>(null);
    const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([]);
    const resetSelectionRef = useRef<(() => void) | null>(null);

    const handleDelete = (payment: any) => {
        setPaymentToDelete(payment);
    };

    const handleBulkDelete = (selectedPayments: any[], resetSelection: () => void) => {
        setBulkDeleteIds(selectedPayments.map(p => p.id));
        resetSelectionRef.current = resetSelection;
    };

    const confirmDelete = async () => {
        if (!paymentToDelete && bulkDeleteIds.length === 0) return;

        const idsToDelete = paymentToDelete ? [paymentToDelete.id] : bulkDeleteIds;
        setPaymentToDelete(null);
        setBulkDeleteIds([]);

        if (resetSelectionRef.current) {
            resetSelectionRef.current();
            resetSelectionRef.current = null;
        }

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

    const handleImport = () => {
        toast.info("Importación de pagos en desarrollo");
    };

    const handleExport = () => {
        toast.info("Exportación de pagos en desarrollo");
    };

    // ========================================
    // EMPTY STATE
    // ========================================
    if (payments.length === 0) {
        return (
            <div className="h-full flex flex-col">
                <Toolbar
                    portalToHeader
                    actions={[
                        {
                            label: "Nuevo Pago",
                            icon: Plus,
                            onClick: handleNewPayment
                        }
                    ]}
                />
                <div className="flex-1 flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={Banknote}
                        viewName="Pagos del Subcontrato"
                        featureDescription="Registra el primer pago de este subcontrato."
                        onAction={handleNewPayment}
                        actionLabel="Nuevo Pago"
                    />
                </div>
            </div>
        );
    }

    // ========================================
    // MAIN RENDER
    // ========================================
    return (
        <>
            {/* Toolbar with filters */}
            <Toolbar
                portalToHeader
                leftActions={
                    <div className="flex gap-2">
                        <FacetedFilter
                            title="Estado"
                            options={statusOptions}
                            selectedValues={statusFilter}
                            onSelect={(value) => {
                                const newSet = new Set(statusFilter);
                                if (newSet.has(value)) {
                                    newSet.delete(value);
                                } else {
                                    newSet.add(value);
                                }
                                setStatusFilter(newSet);
                            }}
                            onClear={() => setStatusFilter(new Set())}
                        />
                    </div>
                }
                actions={[
                    {
                        label: "Nuevo Pago",
                        icon: Plus,
                        onClick: handleNewPayment,
                        variant: "default"
                    },
                    {
                        label: "Importar",
                        icon: Upload,
                        onClick: handleImport
                    },
                    {
                        label: "Exportar",
                        icon: Download,
                        onClick: handleExport
                    }
                ]}
            />

            <div className="h-full flex flex-col space-y-4">
                {/* KPI Cards: Monto Contrato → Total Pagado → Saldo Pendiente */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DashboardKpiCard
                        title="Monto Contrato"
                        items={contractItems}
                        icon={<CircleDollarSign className="h-6 w-6" />}
                    />
                    <DashboardKpiCard
                        title="Total Pagado"
                        items={paymentItems}
                        icon={<Wallet className="h-6 w-6" />}
                        iconClassName="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                        description={`${payments.length} pago${payments.length !== 1 ? 's' : ''} registrado${payments.length !== 1 ? 's' : ''}`}
                    />
                    <DashboardKpiCard
                        title="Saldo Pendiente"
                        items={remainingItems}
                        icon={<Banknote className="h-6 w-6" />}
                        iconClassName={remaining > 0
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                            : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                        }
                    />
                </div>

                {/* Data Table - Using standard DataTable with inline columns */}
                <div className="flex-1 min-h-0">
                    <DataTable
                        columns={columns}
                        data={filteredPayments}
                        enableRowSelection={true}
                        enableRowActions={true}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onBulkDelete={handleBulkDelete}
                        initialSorting={[{ id: "payment_date", desc: true }]}
                    />
                </div>
            </div>

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
        </>
    );
}
