"use client";

import { useState, useTransition } from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableAvatarCell } from "@/components/shared/data-table/data-table-avatar-cell";
import { ColumnDef } from "@tanstack/react-table";
import { ProjectClientView, ClientRole } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useModal } from "@/providers/modal-store";
import { ClientForm } from "./client-form";
import { deleteClientAction } from "../actions";
import { toast } from "sonner";
import { DeleteReplacementModal } from "@/components/shared/delete-replacement-modal";
import { useOptimisticList } from "@/hooks/use-optimistic-action";


interface ClientsListTableProps {
    data: ProjectClientView[];
    roles: ClientRole[];
    orgId: string;
    projectId?: string;
}

export function ClientsListTable({ data, roles, orgId, projectId }: ClientsListTableProps) {
    const { openModal, closeModal } = useModal();
    const [isPending, startTransition] = useTransition();

    // 🚀 OPTIMISTIC UI: Instant visual updates for delete
    const {
        optimisticItems: optimisticData,
        removeItem: optimisticRemove
    } = useOptimisticList({
        items: data,
        getItemId: (client) => client.id,
    });

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<ProjectClientView | null>(null);

    const handleCreate = () => {
        openModal(
            <ClientForm
                onSuccess={closeModal}
                orgId={orgId}
                roles={roles}
                projectId={projectId}
            />,
            { title: "Agregar Cliente", description: "Vincular nuevo cliente a un proyecto" }
        );
    };

    const handleDelete = (client: ProjectClientView) => {
        setClientToDelete(client);
        setDeleteModalOpen(true);
    };

    // 🚀 OPTIMISTIC DELETE: Client disappears instantly, server in background
    const handleConfirmDelete = async (replacementId: string | null) => {
        if (!clientToDelete) return;
        const clientId = clientToDelete.id;

        // Close modal immediately
        setDeleteModalOpen(false);
        setClientToDelete(null);

        // Optimistic update - client disappears NOW
        optimisticRemove(clientId, async () => {
            try {
                await deleteClientAction(clientId);
                toast.success("Cliente eliminado correctamente");
            } catch (error) {
                toast.error("Error al eliminar el cliente");
                // React will revert the optimistic update
            }
        });
    };

    const handleEdit = (client: ProjectClientView) => {
        openModal(
            <ClientForm
                onSuccess={closeModal}
                orgId={orgId}
                roles={roles}
                projectId={projectId}
                initialData={client}
            />,
            { title: "Editar Cliente", description: "Modificar datos del cliente" }
        );
    };

    // Build replacement options (other clients in this project, excluding the one being deleted)
    const replacementOptions = optimisticData
        .filter(c => c.id !== clientToDelete?.id)
        .map(c => ({ id: c.id, name: c.contact_full_name || "Sin Nombre" }));

    const columns: ColumnDef<ProjectClientView>[] = [
        {
            accessorKey: "contact_full_name",
            header: "Cliente",
            cell: ({ row }) => (
                <DataTableAvatarCell
                    src={row.original.contact_avatar_url || row.original.contact_image_url}
                    title={row.original.contact_full_name || "Sin Nombre"}
                    subtitle={row.original.contact_company_name || row.original.contact_email}
                    fallback={row.original.contact_first_name?.[0]}
                />
            )
        },
        {
            accessorKey: "role_name",
            header: "Rol",
            cell: ({ row }) => <Badge variant="outline">{row.original.role_name || "Sin Rol"}</Badge>
        },
        {
            accessorKey: "contact_email",
            header: "Mail",
            cell: ({ row }) => row.original.contact_email || "-"
        },
        {
            accessorKey: "contact_phone",
            header: "Teléfono",
            cell: ({ row }) => row.original.contact_phone || "-"
        },
        {
            accessorKey: "notes",
            header: "Notas",
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm truncate max-w-[200px] block" title={row.original.notes || ""}>
                    {row.original.notes || "-"}
                </span>
            )
        },
    ];

    // Empty State when no clients
    if (data.length === 0) {
        return (
            <EmptyState
                icon={Users}
                title="Sin clientes"
                description="Agregá el primer cliente a este proyecto para comenzar a gestionar compromisos y pagos."
                action={
                    <Button onClick={handleCreate} size="lg">
                        <Plus className="mr-2 h-4 w-4" /> Agregar Cliente
                    </Button>
                }
            />
        );
    }

    return (
        <>
            <DataTable
                columns={columns}
                data={optimisticData}
                searchKey="contact_full_name"
                searchPlaceholder="Buscar clientes..."
                enableRowActions={true}
                toolbar={() => (
                    <Button onClick={handleCreate} size="sm">
                        <Plus className="mr-2 h-4 w-4" /> Agregar Cliente
                    </Button>
                )}
                onDelete={handleDelete}
                customActions={[
                    {
                        label: "Editar Cliente",
                        onClick: handleEdit,
                    }
                ]}
            />

            <DeleteReplacementModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setClientToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                itemToDelete={clientToDelete ? { id: clientToDelete.id, name: clientToDelete.contact_full_name || "Sin Nombre" } : null}
                replacementOptions={replacementOptions}
                entityLabel="cliente"
                description={`¿Estás seguro de que deseas eliminar a "${clientToDelete?.contact_full_name}" de este proyecto?`}
            />
        </>
    );
}
