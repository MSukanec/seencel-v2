"use client";

import { useState, useMemo, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Banknote, Plus, FilterX } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, exportToExcel, ExportColumn } from "@/lib/export";
import { parseDateFromDB } from "@/lib/timezone-data";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { getStandardToolbarActions } from "@/lib/toolbar-actions";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { DateRangeFilter, type DateRangeFilterValue } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";
import { startOfDay, endOfDay, isAfter, isBefore, isEqual } from "date-fns";
import { useModal } from "@/stores/modal-store";
import { useActiveProjectId } from "@/stores/layout-store";
import { BulkImportModal } from "@/components/shared/import/import-modal";
import { useRouter } from "@/i18n/routing";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { createDateColumn, createTextColumn, createMoneyColumn, createProjectColumn } from "@/components/shared/data-table/columns";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { PaymentForm } from "../forms/clients-payment-form";
import { ClientPaymentView, OrganizationFinancialData } from "../types";
import { deletePaymentAction } from "../actions";
import { ImportConfig } from "@/lib/import";
import { createImportBatch, importPaymentsBatch, revertImportBatch } from "@/lib/import";
import { HealthMonitorBanner } from "@/features/health/components/health-monitor-banner";
import { analyzePaymentsHealth } from "@/features/health/modules/payments";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// NOTE: columns are now built dynamically inside the component
// via useMemo to conditionally show the project column.

// ========================================
// VIEW
// ========================================

interface ClientsPaymentsViewProps {
    data: ClientPaymentView[];
    clients: any[];
    financialData: OrganizationFinancialData;
    orgId: string;
    projects?: { id: string; name: string }[];
}

export function ClientsPaymentsView({
    data,
    clients,
    financialData,
    orgId,
    projects = [],
}: ClientsPaymentsViewProps) {
    const { openModal } = useModal();
    const router = useRouter();
    const activeProjectId = useActiveProjectId();

    // ========================================
    // DYNAMIC COLUMNS (project column only in org mode)
    // ========================================
    const columns = useMemo<ColumnDef<ClientPaymentView>[]>(() => {
        const baseColumns: ColumnDef<ClientPaymentView>[] = [
            createDateColumn<ClientPaymentView>({
                accessorKey: "payment_date",
                avatarUrlKey: "creator_avatar_url",
                avatarFallbackKey: "creator_full_name",
            }),
        ];

        // Insert project column right after date when in org context
        if (!activeProjectId) {
            baseColumns.push(
                createProjectColumn<ClientPaymentView>()
            );
        }

        baseColumns.push(
            createTextColumn<ClientPaymentView>({
                accessorKey: "client_name",
                title: "Cliente",
                subtitle: (row) => row.client_role_name || null,
            }),
            createTextColumn<ClientPaymentView>({
                accessorKey: "commitment_concept",
                title: "Compromiso",
                muted: true,
                emptyValue: "Sin compromiso",
            }),
            createTextColumn<ClientPaymentView>({
                accessorKey: "wallet_name",
                title: "Billetera",
                muted: true,
            }),
            createMoneyColumn<ClientPaymentView>({
                accessorKey: "amount",
                prefix: "+",
                colorMode: "positive",
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
        );

        return baseColumns;
    }, [activeProjectId]);
    const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
    const [walletFilter, setWalletFilter] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [dateRange, setDateRange] = useState<DateRangeFilterValue | undefined>(undefined);

    // === Health Filter (absorbed from page orchestrator) ===
    const [healthFilterActive, setHealthFilterActive] = useState(false);
    const healthReport = useMemo(() => analyzePaymentsHealth(data), [data]);
    const affectedPaymentIds = useMemo(() => {
        return new Set(healthReport.issues.map(issue => issue.paymentId));
    }, [healthReport.issues]);

    const handleShowAffected = useCallback(() => {
        setHealthFilterActive(true);
    }, []);

    const handleClearFilter = useCallback(() => {
        setHealthFilterActive(false);
    }, []);

    // 🚀 OPTIMISTIC UI: Instant visual updates for list operations
    const {
        optimisticItems: optimisticPayments,
        removeItem: optimisticRemove,
    } = useOptimisticList({
        items: data,
        getItemId: (payment) => payment.id,
    });

    // ========================================
    // FILTER OPTIONS
    // ========================================
    const statusOptions = [
        { label: "Confirmado", value: "confirmed" },
        { label: "Pendiente", value: "pending" },
        { label: "Rechazado", value: "rejected" },
        { label: "Anulado", value: "void" },
    ];

    // Get unique wallets from data
    const walletOptions = Array.from(
        new Set(data.map(p => p.wallet_name).filter(Boolean))
    ).map(name => ({ label: name as string, value: name as string }));

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
                        label: c.contact_full_name || c.contact_company_name || 'Sin nombre'
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
                const result = await importPaymentsBatch(orgId, orgId, records, batch.id);
                router.refresh();
                return {
                    success: result.success,
                    errors: result.errors,
                    warnings: result.warnings,
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
                organizationId={orgId}
                clients={clients}
                financialData={financialData}
                projectId={activeProjectId || undefined}
                showProjectSelector={!activeProjectId}
                projects={activeProjectId ? [] : projects}
            />,
            {
                title: "Nuevo Pago de Cliente",
                description: "Registra un nuevo pago para esta organización.",
                size: "lg"
            }
        );
    };

    const handleEdit = (payment: ClientPaymentView) => {
        openModal(
            <PaymentForm
                organizationId={orgId}
                clients={clients}
                financialData={financialData}
                initialData={payment as any}
            />,
            {
                title: "Editar Pago",
                description: "Modifica los detalles del pago.",
                size: "lg"
            }
        );
    };

    const handleImport = () => {
        openModal(
            <BulkImportModal config={paymentsImportConfig} organizationId={orgId} />,
            {
                size: "2xl",
                title: "Importar Pagos de Clientes",
                description: "Importa pagos masivamente desde Excel o CSV."
            }
        );
    };

    // ========================================
    // EXPORT
    // ========================================
    const exportColumns: ExportColumn<ClientPaymentView>[] = [
        {
            key: 'payment_date',
            header: 'Fecha',
            transform: (val) => {
                const d = parseDateFromDB(val);
                return d ? format(d, 'dd/MM/yyyy', { locale: es }) : '';
            }
        },
        { key: 'project_name' as keyof ClientPaymentView, header: 'Proyecto', transform: (val) => val ?? '' },
        { key: 'client_name', header: 'Cliente', transform: (val) => val ?? '' },
        { key: 'commitment_concept', header: 'Compromiso', transform: (val) => val ?? 'Sin compromiso' },
        { key: 'wallet_name', header: 'Billetera', transform: (val) => val ?? '' },
        {
            key: 'amount',
            header: 'Monto',
            transform: (val) => typeof val === 'number' ? val : 0
        },
        { key: 'currency_code' as keyof ClientPaymentView, header: 'Moneda', transform: (val) => val ?? '' },
        {
            key: 'status',
            header: 'Estado',
            transform: (val) => {
                const map: Record<string, string> = {
                    confirmed: 'Confirmado',
                    pending: 'Pendiente',
                    rejected: 'Rechazado',
                    void: 'Anulado',
                };
                return map[val] ?? val ?? '';
            }
        },
        { key: 'reference' as keyof ClientPaymentView, header: 'Referencia', transform: (val) => val ?? '' },
        { key: 'notes' as keyof ClientPaymentView, header: 'Notas', transform: (val) => val ?? '' },
    ];

    const handleExportCSV = () => {
        exportToCSV({
            data: filteredData,
            columns: exportColumns,
            fileName: `cobros-pagos-${format(new Date(), 'yyyy-MM-dd')}`,
        });
        toast.success('Exportación CSV descargada');
    };

    const handleExportExcel = () => {
        exportToExcel({
            data: filteredData,
            columns: exportColumns,
            fileName: `cobros-pagos-${format(new Date(), 'yyyy-MM-dd')}`,
            sheetName: 'Pagos de Clientes',
        });
        toast.success('Exportación Excel descargada');
    };

    // ========================================
    // DELETE (Optimistic)
    // ========================================
    const [paymentToDelete, setPaymentToDelete] = useState<ClientPaymentView | null>(null);

    const handleDelete = (payment: ClientPaymentView) => {
        setPaymentToDelete(payment);
    };

    const confirmDelete = async () => {
        if (!paymentToDelete) return;
        const paymentId = paymentToDelete.id;
        setPaymentToDelete(null);

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

    // ========================================
    // FILTERED DATA
    // ========================================
    const filteredData = optimisticPayments.filter(payment => {
        // Project filter (from header selector)
        if (activeProjectId && payment.project_id !== activeProjectId) {
            return false;
        }
        if (healthFilterActive && !affectedPaymentIds.has(payment.id)) {
            return false;
        }
        if (statusFilter.size > 0 && !statusFilter.has(payment.status)) {
            return false;
        }
        if (walletFilter.size > 0 && (!payment.wallet_name || !walletFilter.has(payment.wallet_name))) {
            return false;
        }
        // Date range filter
        if (dateRange && (dateRange.from || dateRange.to)) {
            const paymentDate = payment.payment_date ? startOfDay(new Date(payment.payment_date)) : null;
            if (!paymentDate) return false;
            const from = dateRange.from ? startOfDay(dateRange.from) : null;
            const to = dateRange.to ? endOfDay(dateRange.to) : null;
            if (from && !(isAfter(paymentDate, from) || isEqual(paymentDate, from))) return false;
            if (to && !(isBefore(paymentDate, to) || isEqual(paymentDate, to))) return false;
        }
        return true;
    });

    // ✅ CORRECTO: EmptyState en la View con Toolbar en header
    if (data.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    actions={[
                        {
                            label: "Nuevo Pago",
                            icon: Plus,
                            onClick: handleNewPayment,
                            variant: "default"
                        },
                        ...getStandardToolbarActions({
                            onImport: handleImport,
                            onExportCSV: handleExportCSV,
                            onExportExcel: handleExportExcel,
                        }),
                    ]}
                />
                <ContentLayout variant="wide">
                    <div className="h-full flex items-center justify-center">
                        <ViewEmptyState
                            mode="empty"
                            icon={Banknote}
                            viewName="Pagos de Clientes"
                            featureDescription="Registrá el primer pago de tus clientes o importalos desde un archivo Excel."
                            onAction={handleNewPayment}
                            actionLabel="Nuevo Pago"
                        />
                    </div>
                </ContentLayout>
            </>
        );
    }

    // ✅ CORRECTO: Toolbar en header con filtros facetados + split button
    return (
        <>
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar pagos..."
                leftActions={
                    <div className="flex gap-2">
                        <DateRangeFilter
                            title="Período"
                            value={dateRange}
                            onChange={(value) => setDateRange(value)}
                        />
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
                        {walletOptions.length > 0 && (
                            <FacetedFilter
                                title="Billetera"
                                options={walletOptions}
                                selectedValues={walletFilter}
                                onSelect={(value) => {
                                    const newSet = new Set(walletFilter);
                                    if (newSet.has(value)) {
                                        newSet.delete(value);
                                    } else {
                                        newSet.add(value);
                                    }
                                    setWalletFilter(newSet);
                                }}
                                onClear={() => setWalletFilter(new Set())}
                            />
                        )}
                    </div>
                }
                actions={[
                    {
                        label: "Nuevo Pago",
                        icon: Plus,
                        onClick: handleNewPayment,
                        variant: "default"
                    },
                    ...getStandardToolbarActions({
                        onImport: handleImport,
                        onExportCSV: handleExportCSV,
                        onExportExcel: handleExportExcel,
                    }),
                ]}
            />

            {/* Health Monitor Banner */}
            <HealthMonitorBanner
                report={healthReport}
                moduleName="pagos"
                storageKey={`clients-health-${orgId}`}
                onShowAffected={handleShowAffected}
                isFilterActive={healthFilterActive}
                onClearFilter={handleClearFilter}
            />

            {/* Health Filter Indicator */}
            {healthFilterActive && (
                <Alert className="mb-4 bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400">
                    <FilterX className="h-4 w-4 !text-orange-500" />
                    <AlertDescription className="flex items-center justify-between w-full">
                        <span>
                            Mostrando solo los <strong>{filteredData.length}</strong> pagos con problemas de datos.
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-current hover:bg-orange-500/20"
                            onClick={handleClearFilter}
                        >
                            Mostrar todos
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <ContentLayout variant="wide">
                <DataTable
                    columns={columns}
                    data={filteredData}
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
                />
            </ContentLayout>
        </>
    );
}
