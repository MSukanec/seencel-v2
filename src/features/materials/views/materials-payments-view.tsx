"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Banknote, Upload, Download, TrendingDown, DollarSign, Receipt } from "lucide-react";
import { toast } from "sonner";

import { MaterialPaymentView, OrganizationFinancialData, MaterialPurchase, MaterialType } from "../types";
import { deleteMaterialPaymentAction, createMaterialType } from "../actions";
import { MaterialPaymentForm } from "../forms/material-payment-form";

import { ContentLayout } from "@/components/layout";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { createDateColumn, createTextColumn, createMoneyColumn } from "@/components/shared/data-table/columns";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { useModal } from "@/stores/modal-store";
import { useRouter } from "next/navigation";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { useMoney } from "@/hooks/use-money";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";

// Import System
import { ImportConfig } from "@/lib/import";
import { BulkImportModal } from "@/components/shared/import/import-modal";
import { createImportBatch, revertImportBatch, importMaterialPaymentsBatch } from "@/lib/import";

interface MaterialsPaymentsViewProps {
    projectId: string;
    orgId: string;
    payments: MaterialPaymentView[];
    purchases: MaterialPurchase[];
    financialData: OrganizationFinancialData;
    materialTypes: MaterialType[];
}

export function MaterialsPaymentsView({
    projectId,
    orgId,
    payments,
    purchases,
    financialData,
    materialTypes
}: MaterialsPaymentsViewProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();

    // Search state for Toolbar
    const [searchQuery, setSearchQuery] = useState("");

    // 🚀 OPTIMISTIC UI: Instant visual updates for list operations
    const {
        optimisticItems: optimisticPayments,
        removeItem: optimisticRemove,
    } = useOptimisticList({
        items: payments,
        getItemId: (payment) => payment.id,
    });

    // Delete modal state
    const [paymentToDelete, setPaymentToDelete] = useState<MaterialPaymentView | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // ========================================
    // IMPORT CONFIGURATION
    // ========================================
    const paymentImportConfig: ImportConfig<any> = {
        entityLabel: "Pagos de Materiales",
        entityId: "pagos_materiales",
        columns: [
            { id: "payment_date", label: "Fecha", required: true, example: "2024-01-20" },
            {
                id: "material_type_name",
                label: "Tipo de Material",
                required: false,
                example: "Construcción",
                foreignKey: {
                    table: 'material_types',
                    labelField: 'name',
                    valueField: 'id',
                    fetchOptions: async () => {
                        return (materialTypes || []).map((t: any) => ({
                            id: t.id,
                            label: t.name
                        }));
                    },
                    allowCreate: true,
                    createAction: async (organizationId: string, name: string) => {
                        const result = await createMaterialType({
                            organization_id: organizationId,
                            name: name,
                            is_system: false
                        });
                        return { id: result.id };
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
            const batch = await createImportBatch(orgId, "material_payments", data.length);
            const result = await importMaterialPaymentsBatch(orgId, projectId, data, batch.id);
            return { success: result.success, errors: result.errors, warnings: result.warnings, batchId: batch.id };
        },
        onRevert: async (batchId) => {
            await revertImportBatch(batchId, 'material_payments');
        }
    };

    // ========================================
    // COLUMNS - Defined inline following general-costs pattern
    // ========================================
    const columns: ColumnDef<MaterialPaymentView>[] = [
        createDateColumn<MaterialPaymentView>({
            accessorKey: "payment_date",
            avatarUrlKey: "creator_avatar_url",
            avatarFallbackKey: "creator_full_name",
        }),
        createTextColumn<MaterialPaymentView>({
            accessorKey: "material_type_name",
            title: "Tipo",
            muted: true,
        }),
        createTextColumn<MaterialPaymentView>({
            accessorKey: "invoice_number",
            title: "Orden de Compra",
            muted: true,
        }),
        createTextColumn<MaterialPaymentView>({
            accessorKey: "provider_name",
            title: "Proveedor",
            muted: true,
        }),
        createTextColumn<MaterialPaymentView>({
            accessorKey: "notes",
            title: "Notas",
            muted: true,
        }),
        createTextColumn<MaterialPaymentView>({
            accessorKey: "wallet_name",
            title: "Billetera",
            muted: true,
        }),
        createMoneyColumn<MaterialPaymentView>({
            accessorKey: "amount",
            prefix: "-",
            colorMode: "negative",
            currencyKey: "currency_code",
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
    ];

    // ========================================
    // HANDLERS
    // ========================================

    const handleNewPayment = () => {
        openModal(
            <MaterialPaymentForm
                projectId={projectId}
                organizationId={orgId}
                purchases={purchases}
                materialTypes={materialTypes}
                financialData={financialData}
                onSuccess={() => {
                    closeModal();
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
                materialTypes={materialTypes}
                financialData={financialData}
                initialData={payment as any}
                onSuccess={() => {
                    closeModal();
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

    const handleImport = () => {
        openModal(
            <BulkImportModal config={paymentImportConfig} organizationId={orgId} />,
            {
                size: "2xl",
                title: "Importar Pagos de Materiales",
                description: "Importa pagos masivamente desde Excel o CSV."
            }
        );
    };

    const handleExport = () => {
        // TODO: Export to Excel
        toast.info("Funcionalidad de exportación próximamente");
    };

    // Filter options for status
    const statusOptions = [
        { label: "Confirmado", value: "confirmed" },
        { label: "Pendiente", value: "pending" },
        { label: "Rechazado", value: "rejected" },
        { label: "Anulado", value: "void" },
    ];

    // Filter payments by search
    const filteredPayments = searchQuery
        ? optimisticPayments.filter(p =>
            p.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.wallet_name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : optimisticPayments;

    // ========================================
    // KPI CALCULATIONS
    // ========================================
    const kpiData = useMemo(() => {
        const allItems: { amount: number; currency_code: string; exchange_rate?: number }[] = [];
        const confirmedItems: { amount: number; currency_code: string; exchange_rate?: number }[] = [];
        const pendingItems: { amount: number; currency_code: string; exchange_rate?: number }[] = [];

        filteredPayments.forEach(p => {
            const item = {
                amount: Number(p.amount) || 0,
                currency_code: p.currency_code || 'ARS',
                exchange_rate: Number(p.exchange_rate) || 1
            };
            allItems.push(item);
            if (p.status === 'confirmed') {
                confirmedItems.push(item);
            } else if (p.status === 'pending') {
                pendingItems.push(item);
            }
        });

        return {
            allItems,
            confirmedItems,
            pendingItems,
            cantidadPagos: filteredPayments.length
        };
    }, [filteredPayments]);

    // ========================================
    // RENDER
    // ========================================
    return (
        <>
            {/* Toolbar with portal to header - Split button with Import/Export options */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar pagos por referencia..."
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

            <ContentLayout variant="wide" className="pb-6">
                {/* Empty State - sin botón, la acción está en la toolbar del header */}
                {payments.length === 0 ? (
                    <EmptyState
                        icon={Banknote}
                        title="Sin pagos de materiales"
                        description="Registrá el primer pago de materiales usando el botón en la barra superior."
                    />
                ) : (
                    <div className="space-y-6">
                        {/* KPI Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <DashboardKpiCard
                                title="Total Pagos"
                                items={kpiData.allItems}
                                icon={<TrendingDown className="h-5 w-5" />}
                                iconClassName="bg-amount-negative/10 text-amount-negative"
                            />
                            <DashboardKpiCard
                                title="Confirmados"
                                items={kpiData.confirmedItems}
                                icon={<DollarSign className="h-5 w-5" />}
                                iconClassName="bg-amount-positive/10 text-amount-positive"
                            />
                            <DashboardKpiCard
                                title="Pendientes"
                                items={kpiData.pendingItems}
                                icon={<DollarSign className="h-5 w-5" />}
                                iconClassName="bg-amber-500/10 text-amber-600"
                            />
                            <DashboardKpiCard
                                title="Cantidad"
                                value={kpiData.cantidadPagos.toString()}
                                icon={<Receipt className="h-5 w-5" />}
                            />
                        </div>

                        {/* DataTable */}
                        <DataTable
                            columns={columns}
                            data={filteredPayments}
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
                )}
            </ContentLayout>
        </>
    );
}
