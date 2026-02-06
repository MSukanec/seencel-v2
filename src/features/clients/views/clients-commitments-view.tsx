"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutGrid, List, Building2, FileText } from "lucide-react";
import { useModal } from "@/stores/modal-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { DataTableAvatarCell } from "@/components/shared/data-table/data-table-avatar-cell";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { deleteCommitmentAction } from "@/features/clients/actions";
import { CommitmentForm } from "../components/forms/commitment-form";
import { CommitmentCard } from "../components/commitments/commitment-card";
import { ProjectClientView, OrganizationFinancialData } from "../types";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ViewEmptyState } from "@/components/shared/empty-state";

// ========================================
// TYPES
// ========================================

interface CommitmentsViewProps {
    commitments: any[];
    clients: ProjectClientView[];
    payments: any[];
    financialData: OrganizationFinancialData;
    projectId?: string;
    orgId?: string;
}

type ViewMode = "grid" | "table";

// ========================================
// HELPERS
// ========================================

function naturalSort(a: string, b: string): number {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function calculatePaidAmount(commitmentId: string, payments: any[], commitment: any): number {
    const connectedPayments = payments.filter(p => p.commitment_id === commitmentId);
    const isCommitmentInBase = commitment.currency?.is_default === true;

    return connectedPayments.reduce((sum, p) => {
        if (p.currency_id === commitment.currency_id) {
            return sum + Number(p.amount);
        }
        const paymentRate = Number(p.exchange_rate) || 1;
        if (isCommitmentInBase) {
            return sum + (Number(p.amount) * paymentRate);
        } else {
            return sum + (Number(p.amount) / paymentRate);
        }
    }, 0);
}

type CommitmentStatus = "paid" | "in_progress" | "no_payments";

function getCommitmentStatus(paid: number, total: number): CommitmentStatus {
    if (paid >= total) return "paid";
    if (paid > 0) return "in_progress";
    return "no_payments";
}

function getStatusConfig(status: CommitmentStatus) {
    switch (status) {
        case "paid":
            return { label: "Pagado", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
        case "in_progress":
            return { label: "En proceso", class: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
        case "no_payments":
            return { label: "Sin pagos", class: "bg-destructive/10 text-destructive border-destructive/20" };
    }
}

// ========================================
// COMPONENT
// ========================================

export function CommitmentsView({
    commitments,
    clients,
    payments,
    financialData,
    projectId,
    orgId,
}: CommitmentsViewProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [commitmentToDelete, setCommitmentToDelete] = useState<any>(null);

    // Optimistic UI
    const {
        optimisticItems: optimisticCommitments,
        removeItem: optimisticRemove,
        isPending,
    } = useOptimisticList({
        items: commitments,
        getItemId: (c) => c.id,
    });

    // Enrich and sort data
    const enrichedData = useMemo(() => {
        return optimisticCommitments
            .map((commitment) => {
                const client = clients.find(c => c.id === commitment.client_id);
                const paidAmount = calculatePaidAmount(commitment.id, payments, commitment);
                const totalAmount = Number(commitment.amount);
                const balance = totalAmount - paidAmount;
                const status = getCommitmentStatus(paidAmount, totalAmount);

                return {
                    ...commitment,
                    clientName: client?.contact_full_name || "Cliente desconocido",
                    clientAvatar: client?.contact_avatar_url ?? undefined,
                    clientRole: client?.role_name,
                    paidAmount,
                    balance,
                    status,
                    statusConfig: getStatusConfig(status),
                    currencySymbol: commitment.currency?.symbol || "$",
                    currencyCode: commitment.currency?.code || "ARS",
                };
            })
            .sort((a, b) => {
                // Sort by unit_name then by client name
                if (a.unit_name && b.unit_name) return naturalSort(a.unit_name, b.unit_name);
                if (a.unit_name && !b.unit_name) return -1;
                if (!a.unit_name && b.unit_name) return 1;
                return (a.clientName || "").localeCompare(b.clientName || "");
            });
    }, [optimisticCommitments, clients, payments]);

    // ========================================
    // HANDLERS
    // ========================================

    const handleCreate = () => {
        openModal(
            <CommitmentForm
                clients={clients}
                financialData={financialData}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
                projectId={projectId}
                orgId={orgId}
            />,
            {
                title: "Nuevo Compromiso",
                description: "Registra un nuevo compromiso de pago para un cliente.",
            }
        );
    };

    const handleEdit = (commitment: any) => {
        openModal(
            <CommitmentForm
                key={commitment.id}
                clients={clients}
                financialData={financialData}
                initialData={commitment}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
                projectId={projectId}
                orgId={orgId}
            />,
            {
                title: "Editar Compromiso",
                description: "Modifica los detalles del compromiso.",
            }
        );
    };

    const handleDelete = (commitment: any) => {
        setCommitmentToDelete(commitment);
    };

    const confirmDelete = () => {
        if (!commitmentToDelete) return;
        const commitmentId = commitmentToDelete.id;
        setCommitmentToDelete(null);

        optimisticRemove(commitmentId, async () => {
            try {
                await deleteCommitmentAction(commitmentId);
                toast.success("Compromiso eliminado");
            } catch (error) {
                toast.error("Error al eliminar compromiso");
                router.refresh();
            }
        });
    };

    // ========================================
    // COLUMNS
    // ========================================

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "unit_name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Unidad" />,
            cell: ({ row }) => {
                const unitName = row.original.unit_name;
                return unitName ? (
                    <div className="flex items-center gap-1.5 font-medium">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{unitName}</span>
                    </div>
                ) : (
                    <span className="text-muted-foreground italic">Sin unidad</span>
                );
            },
        },
        {
            accessorKey: "clientName",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
            cell: ({ row }) => (
                <DataTableAvatarCell
                    title={row.original.clientName}
                    subtitle={row.original.clientRole}
                    src={row.original.clientAvatar}
                    fallback={row.original.clientName?.[0]}
                />
            ),
        },
        {
            accessorKey: "concept",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Concepto" />,
            cell: ({ row }) => (
                <span className="text-muted-foreground">{row.original.concept || "---"}</span>
            ),
        },
        {
            accessorKey: "amount",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Total Comprometido" />,
            cell: ({ row }) => (
                <span className="font-mono">
                    {row.original.currencySymbol} {Number(row.original.amount).toLocaleString("es-AR")}
                </span>
            ),
        },
        {
            id: "paidAmount",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Pagado" />,
            cell: ({ row }) => (
                <span className="font-mono text-muted-foreground">
                    {row.original.currencySymbol} {row.original.paidAmount.toLocaleString("es-AR")}
                </span>
            ),
        },
        {
            id: "balance",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Saldo" />,
            cell: ({ row }) => (
                <span className={`font-mono font-medium ${row.original.balance > 0 ? "text-amount-negative" : "text-amount-positive"}`}>
                    {row.original.currencySymbol} {Math.abs(row.original.balance).toLocaleString("es-AR")}
                </span>
            ),
        },
        {
            id: "status",
            header: "Estado",
            cell: ({ row }) => (
                <Badge className={row.original.statusConfig.class}>
                    {row.original.statusConfig.label}
                </Badge>
            ),
        },
    ];

    // ========================================
    // RENDER - EMPTY STATE
    // ========================================

    if (commitments.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    actions={[
                        {
                            label: "Nuevo Compromiso",
                            icon: Plus,
                            onClick: handleCreate,
                            variant: "default"
                        }
                    ]}
                />
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={FileText}
                        viewName="Compromisos"
                        featureDescription="Creá el primer compromiso de pago para comenzar."
                        onAction={handleCreate}
                        actionLabel="Nuevo Compromiso"
                    />
                </div>
            </>
        );
    }

    // ========================================
    // RENDER - CONTENT
    // ========================================

    return (
        <>
            <Toolbar
                portalToHeader
                leftActions={
                    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                        <Button
                            variant={viewMode === "grid" ? "default" : "ghost"}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setViewMode("grid")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "table" ? "default" : "ghost"}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setViewMode("table")}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                }
                actions={[
                    {
                        label: "Nuevo Compromiso",
                        icon: Plus,
                        onClick: handleCreate,
                        variant: "default"
                    }
                ]}
            />

            {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {enrichedData.map((item) => (
                        <CommitmentCard
                            key={item.id}
                            data={{
                                id: item.id,
                                client_id: item.client_id,
                                clientName: item.clientName,
                                clientAvatar: item.clientAvatar,
                                clientRole: item.clientRole,
                                unitName: item.unit_name,
                                concept: item.concept,
                                totalAmount: Number(item.amount),
                                paidAmount: item.paidAmount,
                                balance: item.balance,
                                currencySymbol: item.currencySymbol,
                                currencyCode: item.currencyCode,
                            }}
                            onEdit={() => handleEdit(item)}
                            onDelete={() => handleDelete(item)}
                        />
                    ))}
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={enrichedData}
                    enableRowSelection={false}
                    enableRowActions={true}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    pageSize={50}
                    initialSorting={[{ id: "unit_name", desc: false }]}
                />
            )}

            <DeleteConfirmationDialog
                open={!!commitmentToDelete}
                onOpenChange={(open) => !open && setCommitmentToDelete(null)}
                onConfirm={confirmDelete}
                title="¿Eliminar compromiso?"
                description={
                    <span>
                        Estás a punto de eliminar un compromiso de{" "}
                        <strong>
                            {Number(commitmentToDelete?.amount).toLocaleString()}
                        </strong>
                        . Esta acción no se puede deshacer.
                    </span>
                }
                confirmLabel="Eliminar"
                isDeleting={isPending}
            />
        </>
    );
}
