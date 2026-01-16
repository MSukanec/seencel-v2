
"use client";

import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableAvatarCell } from "@/components/shared/data-table/data-table-avatar-cell";
import { ColumnDef } from "@tanstack/react-table";
import { ClientCommitment, ProjectClientView } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useModal } from "@/providers/modal-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CommitmentForm } from "./commitment-form";
import { deleteCommitmentAction } from "@/features/clients/actions";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";


// ------------------------------------------------------------------------
// TABLE
// ------------------------------------------------------------------------

interface ClientCommitmentsTableProps {
    data: any[];
    clients: ProjectClientView[];
    payments?: any[]; // Passed from parent
    financialData: any;
    projectId?: string;
    orgId?: string;
}

export function ClientCommitmentsTable({
    data,
    clients,
    payments = [],
    financialData,
    projectId,
    orgId
}: ClientCommitmentsTableProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const [commitmentToDelete, setCommitmentToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
                description: "Registra un nuevo compromiso de pago para un cliente."
            }
        );
    };

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "client.contact.full_name",
            header: "Cliente",
            cell: ({ row }) => {
                const commitment = row.original;
                // Look up the full client details from the passed 'clients' prop to get the role
                const fullClient = clients.find(c => c.id === commitment.client_id);
                const clientName = fullClient?.contact_full_name || commitment.client?.contact?.full_name || "N/A";
                const clientRole = fullClient?.role_name || "Sin rol";

                return (
                    <DataTableAvatarCell
                        title={clientName}
                        subtitle={clientRole}
                        src={fullClient?.contact_avatar_url}
                        fallback={clientName[0]}
                    />
                );
            }
        },
        {
            id: "concept",
            header: "Concepto",
            cell: ({ row }) => {
                const concept = row.original.concept || row.original.unit_description;
                return (
                    <span className="text-muted-foreground">
                        {concept || "---"}
                    </span>
                );
            }
        },
        {
            accessorKey: "description",
            header: "Descripción",
            cell: ({ row }) => {
                return (
                    <span className="text-muted-foreground italic truncate max-w-[200px] block" title={row.original.description}>
                        {row.original.description || "---"}
                    </span>
                );
            }
        },
        {
            accessorKey: "amount",
            header: "Total Comprometido",
            cell: ({ row }) => {
                const amount = Number(row.original.amount);
                const currency = row.original.currency?.symbol || "$";
                const rate = row.original.exchange_rate;

                return (
                    <div className="flex flex-col">
                        <span className="font-mono font-medium">{currency} {amount.toLocaleString()}</span>
                        {rate && (
                            <span className="text-xs text-muted-foreground">
                                Cotiz: {rate}
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            id: "paid",
            header: "Pagado a la fecha",
            cell: ({ row }) => {
                const commitment = row.original;
                const commitmentCurrencyCode = commitment.currency?.code || "ARS"; // Fallback to base
                const connectedPayments = payments.filter(p => p.commitment_id === commitment.id);

                const paidAmount = connectedPayments.reduce((sum, p) => {
                    // 1. Same Currency -> Add Face Value
                    if (p.currency_id === commitment.currency_id) {
                        return sum + Number(p.amount);
                    }

                    // 2. Different Currency -> specialized logic
                    // If Target (Commitment) is ARS (Base):
                    // Payment (USD) -> functional_amount is ARS value.
                    if (commitmentCurrencyCode !== 'USD') {
                        return sum + (p.functional_amount || 0);
                    }

                    // If Target (Commitment) is USD:
                    // Payment (ARS) -> functional_amount is ARS. Need to divide by rate.
                    // We use commitment.exchange_rate as the reference "Deal Rate" if generic conversion unavailable
                    const rate = commitment.exchange_rate || 1;
                    return sum + ((p.functional_amount || 0) / rate);
                }, 0);

                const currencySymbol = commitment.currency?.symbol || "$";

                return (
                    <span className="font-mono text-muted-foreground">
                        {currencySymbol} {paidAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                );
            }
        },
        {
            id: "balance",
            header: "Saldo",
            cell: ({ row }) => {
                const commitment = row.original;
                const commitmentCurrencyCode = commitment.currency?.code || "ARS";
                const connectedPayments = payments.filter(p => p.commitment_id === commitment.id);

                const paidAmount = connectedPayments.reduce((sum, p) => {
                    if (p.currency_id === commitment.currency_id) {
                        return sum + Number(p.amount);
                    }
                    if (commitmentCurrencyCode !== 'USD') {
                        return sum + (p.functional_amount || 0);
                    }
                    const rate = commitment.exchange_rate || 1;
                    return sum + ((p.functional_amount || 0) / rate);
                }, 0);

                const total = Number(commitment.amount);
                const balance = total - paidAmount;
                const currencySymbol = commitment.currency?.symbol || "$";

                return (
                    <span className={cn(
                        "font-mono font-bold",
                        balance > 0 ? "text-orange-600" : "text-green-600"
                    )}>
                        {currencySymbol} {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                );
            }
        }
    ];

    return (
        <>
            <DataTable
                columns={columns}
                data={data}
                searchKey="client.contact.full_name"
                searchPlaceholder="Buscar por cliente..."
                enableRowActions={true}
                toolbar={() => (
                    <Button onClick={handleCreate} size="sm">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Compromiso
                    </Button>
                )}
                onDelete={(row) => {
                    setCommitmentToDelete(row);
                }}
                onEdit={(row) => {
                    openModal(
                        <CommitmentForm
                            key={row.id}
                            clients={clients}
                            financialData={financialData}
                            initialData={row}
                            onSuccess={() => {
                                closeModal();
                                router.refresh();
                            }}
                            projectId={projectId}
                            orgId={orgId}
                        />,
                        {
                            title: "Editar Compromiso",
                            description: "Modifica los detalles del compromiso."
                        }
                    );
                }}
            />

            <DeleteConfirmationDialog
                open={!!commitmentToDelete}
                onOpenChange={(open) => !open && setCommitmentToDelete(null)}
                onConfirm={async () => {
                    if (!commitmentToDelete) return;
                    setIsDeleting(true);
                    try {
                        await deleteCommitmentAction(commitmentToDelete.id);
                        toast.success("Compromiso eliminado");
                        router.refresh();
                    } catch (error) {
                        toast.error("Error al eliminar compromiso");
                    } finally {
                        setIsDeleting(false);
                        setCommitmentToDelete(null);
                    }
                }}
                title="¿Eliminar compromiso?"
                description={
                    <span>
                        Estás a punto de eliminar un compromiso de <strong>{Number(commitmentToDelete?.amount).toLocaleString()}</strong>. Esta acción no se puede deshacer.
                    </span>
                }
                confirmLabel="Eliminar"
                isDeleting={isDeleting}
            />
        </>
    );
}
