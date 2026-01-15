
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

    const handleCreate = () => {
        openModal(
            <CommitmentForm
                clients={clients}
                financialData={financialData}
                onSuccess={closeModal}
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
            accessorKey: "amount",
            header: "Total Comprometido",
            cell: ({ row }) => {
                const amount = Number(row.original.amount);
                const currency = row.original.currency?.symbol || "$";
                return <span className="font-mono font-medium">{currency} {amount.toLocaleString()}</span>
            }
        },
        {
            id: "paid",
            header: "Pagado a la fecha",
            cell: ({ row }) => {
                const commitmentId = row.original.id;
                // Filter payments linked to this commitment OR (heuristic) payments for this client with same currency if commitment_id not strict?
                // Strict linkage is better: payments.commitment_id === row.original.id
                // But initially payments might not be strictly linked if created loosely. 
                // Let's assume strict link if available, or if we want to show 'paid so far' for this deal.
                // Re-reading logic: Payments usually link to a commitment or schedule.
                // Fallback: If no direct link, maybe we don't show it? Or we show general client payments?
                // For this component "Commitments View", user likely wants to see progress of THAT commitment.
                // So filter by commitment_id.

                // NOTE: payments array might be ClientPaymentView[]
                const connectedPayments = payments.filter(p => p.commitment_id === commitmentId);
                const paidAmount = connectedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
                const currency = row.original.currency?.symbol || "$";

                return (
                    <span className="font-mono text-muted-foreground">
                        {currency} {paidAmount.toLocaleString()}
                    </span>
                );
            }
        },
        {
            id: "balance",
            header: "Saldo",
            cell: ({ row }) => {
                const commitmentId = row.original.id;
                const connectedPayments = payments.filter(p => p.commitment_id === commitmentId);
                const paidAmount = connectedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
                const total = Number(row.original.amount);
                const balance = total - paidAmount;
                const currency = row.original.currency?.symbol || "$";

                // Color logic: Red if balance > 0? Or neutral?
                // Usually balance > 0 means they owe money.
                return (
                    <span className={cn(
                        "font-mono font-bold",
                        balance > 0 ? "text-orange-600" : "text-green-600"
                    )}>
                        {currency} {balance.toLocaleString()}
                    </span>
                );
            }
        }
    ];

    return (
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
                // TODO: Implement delete action
                if (confirm("¿Eliminar este compromiso?")) {
                    toast.info("Función de eliminar pendiente de implementación final")
                }
            }}
            onEdit={(row) => {
                // TODO: Implement edit action
                toast.info("Función de editar pendiente de implementación final")
            }}
        />
    );
}
