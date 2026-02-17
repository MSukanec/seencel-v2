"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableAvatarCell } from "@/components/shared/data-table/data-table-avatar-cell";
import { ColumnDef } from "@tanstack/react-table";
import { ProjectClientView, ClientRole } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { useModal } from "@/stores/modal-store";
import { ClientForm } from "../components/forms/client-form";
import { deleteClientAction } from "../actions";
import { toast } from "sonner";
import { DeleteReplacementModal } from "@/components/shared/forms/general/delete-replacement-modal";
import { useOptimisticList } from "@/hooks/use-optimistic-action";

import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";

// ========================================
// TYPES
// ========================================

interface ClientsListViewProps {
    data: ProjectClientView[];
    roles: ClientRole[];
    orgId: string;
    projectId?: string;
}

// ========================================
// COMPONENT
// ========================================

export function ClientsListView({
    data,
    roles,
    orgId,
    projectId,
}: ClientsListViewProps) {
    const router = useRouter();
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

    // ========================================
    // HANDLERS
    // ========================================

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



    // Replacement options for delete modal
    const replacementOptions = optimisticData
        .filter(c => c.id !== clientToDelete?.id)
        .map(c => ({ id: c.id, name: c.contact_full_name || "Sin Nombre" }));

    // ========================================
    // COLUMNS
    // ========================================

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

    // ========================================
    // RENDER - EMPTY STATE
    // ========================================

    if (data.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    actions={[
                        {
                            label: "Agregar Cliente",
                            icon: Plus,
                            onClick: handleCreate,
                            variant: "default"
                        }
                    ]}
                />
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={Users}
                        viewName="Clientes"
                        featureDescription="Agregá el primer cliente a este proyecto para comenzar a gestionar sus compromisos, pagos y facturación."
                        onAction={handleCreate}
                        actionLabel="Agregar Cliente"
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
                actions={[
                    {
                        label: "Agregar Cliente",
                        icon: Plus,
                        onClick: handleCreate,
                        variant: "default"
                    }
                ]}
            />

            <DataTable
                columns={columns}
                data={optimisticData}
                enableRowActions={true}
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
