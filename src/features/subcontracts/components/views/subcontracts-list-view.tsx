"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Plus, Users, Wallet, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";

import { useModal } from "@/providers/modal-store";
import { SubcontractsSubcontractForm } from "../forms/subcontracts-subcontract-form";
import { SubcontractCard } from "../cards/subcontract-card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteSubcontractAction } from "@/features/subcontracts/actions";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { toast } from "sonner";

import { DataTable } from "@/components/shared/data-table/data-table";
import { columns } from "../tables/subcontracts-columns";
import { useFormatCurrency } from "@/hooks/use-format-currency";

interface SubcontractsListViewProps {
    projectId: string;
    organizationId: string;
    providers: { id: string; name: string; image?: string | null; fallback?: string }[];
    currencies: { id: string; code: string; symbol: string; name: string }[];
    initialSubcontracts: any[];
    defaultCurrencyId?: string | null;
}

export function SubcontractsListView({ projectId, organizationId, providers, currencies, initialSubcontracts = [], defaultCurrencyId }: SubcontractsListViewProps) {
    const { openModal, closeModal } = useModal();
    const { formatNumber, decimalPlaces } = useFormatCurrency();
    console.log('[SubcontractsListView] decimalPlaces from context:', decimalPlaces);
    const subcontracts = initialSubcontracts;

    // KPI CALCULATIONS
    const calculateTotals = (field: string) => {
        const totals: Record<string, { amount: number; symbol: string }> = {};

        subcontracts.forEach(sub => {
            if (sub.status === 'cancelled') return; // Only skip cancelled subcontracts

            const currency = sub.currency_code || 'ARS';
            const symbol = sub.currency_symbol || '$';
            const val = Number(sub[field] || 0);

            if (!totals[currency]) {
                totals[currency] = { amount: 0, symbol };
            }
            totals[currency].amount += val;
        });

        return Object.entries(totals).map(([code, data]) => ({
            currencyCode: code,
            symbol: data.symbol,
            nativeTotal: data.amount,
            functionalTotal: 0, // Not used for display
            isPrimary: code === 'USD' // Simple heuristic
        }));
    };

    const totalContracted = calculateTotals('amount_total');
    const totalPaid = calculateTotals('paid_amount');
    const totalRemaining = calculateTotals('remaining_amount');

    // Helper to get main display string - uses organization's decimal preference
    const getMainValue = (breakdown: any[]) => {
        if (breakdown.length === 0) return "$ 0";
        // Prefer USD or first
        const primary = breakdown.find(b => b.currencyCode === 'USD') || breakdown[0];
        return `${primary.symbol} ${formatNumber(primary.nativeTotal)}`;
    };

    const activeCount = subcontracts.filter(s => s.status === 'active').length;
    const totalCount = subcontracts.length;

    const router = useRouter();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [subcontractToDelete, setSubcontractToDelete] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handlers
    const handleCreate = () => {
        openModal(
            <SubcontractsSubcontractForm
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
                onCancel={closeModal}
                organizationId={organizationId}
                projectId={projectId}
                providers={providers}
                currencies={currencies}
                defaultCurrencyId={defaultCurrencyId}
            />,
            {
                title: "Nuevo Subcontrato",
                description: "Complete los datos para registrar un nuevo subcontrato en el proyecto.",
                size: "lg"
            }
        );
    };

    const handleEdit = (subcontract: any) => {
        openModal(
            <SubcontractsSubcontractForm
                initialData={subcontract}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
                onCancel={closeModal}
                organizationId={organizationId}
                projectId={projectId}
                providers={providers}
                currencies={currencies}
                defaultCurrencyId={defaultCurrencyId}
            />,
            {
                title: "Editar Subcontrato",
                description: "Modifique los datos del subcontrato.",
                size: "lg"
            }
        );
    };

    const handleDeleteClick = (subcontract: any) => {
        setSubcontractToDelete(subcontract);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!subcontractToDelete) return;
        setIsDeleting(true);
        try {
            await deleteSubcontractAction(subcontractToDelete.id);
            toast.success("Subcontrato eliminado");
            router.refresh();
        } catch (error) {
            toast.error("Error al eliminar el subcontrato");
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setSubcontractToDelete(null);
        }
    };

    const handleView = (subcontract: any) => {
        // Navigation to Detail Page
        // Assuming current path is /project/[id]/subcontracts
        // We want /project/[id]/subcontracts/[subcontractId]
        // But the Tabs structure uses query params or different segments?
        // User requested "lleva a OTRA PAGINA DE DETALLE ESPECIFICA".
        // So it's a new route segment.
        router.push(window.location.pathname + '/' + subcontract.id);
    };

    return (
        <div className="space-y-4 h-full flex flex-col">
            {/* KPI GRID */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-2">
                <DashboardKpiCard
                    title="Total Contratado"
                    value={getMainValue(totalContracted)}
                    icon={<Wallet className="h-4 w-4" />}
                    currencyBreakdown={totalContracted}
                    description="Monto total acumulado"
                />
                <DashboardKpiCard
                    title="Total Pagado"
                    value={getMainValue(totalPaid)}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    currencyBreakdown={totalPaid}
                    iconClassName="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20"
                    description="Pagos confirmados"
                />
                <DashboardKpiCard
                    title="Restante por Pagar"
                    value={getMainValue(totalRemaining)}
                    icon={<AlertCircle className="h-4 w-4" />}
                    currencyBreakdown={totalRemaining}
                    iconClassName="text-amber-600 bg-amber-100 dark:bg-amber-900/20"
                    description="Pendiente de saldar"
                />
                <DashboardKpiCard
                    title="Subcontratos"
                    value={totalCount}
                    icon={<Users className="h-4 w-4" />}
                    description={`${activeCount} activos`}
                    iconClassName="text-blue-600 bg-blue-100 dark:bg-blue-900/20"
                />
            </div>

            <DataTable
                columns={columns}
                data={subcontracts}
                searchKey="description" // Or provider name? customized search logic might be needed
                searchPlaceholder="Buscar subcontratos..."
                toolbarInHeader={true}
                viewMode="grid"
                gridClassName="flex flex-col gap-2"
                renderGridItem={(item) => (
                    <SubcontractCard
                        subcontract={item}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                    />
                )}
                actions={[
                    {
                        label: "Nuevo Subcontrato",
                        icon: Plus,
                        onClick: handleCreate
                    }
                ]}
                emptyState={
                    <EmptyState
                        icon={Users}
                        title="No tienes subcontratos"
                        description="Aquí aparecerán los contratos con proveedores y subcontratistas."
                    />
                }
            />

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Eliminar Subcontrato"
                description={
                    <span>
                        ¿Estás seguro de eliminar el contrato con <strong>{subcontractToDelete?.contact?.full_name || subcontractToDelete?.contact?.company_name}</strong>?
                    </span>
                }
                confirmLabel="Eliminar"
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
}
