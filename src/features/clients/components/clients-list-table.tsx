"use client";

import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableAvatarCell } from "@/components/shared/data-table/data-table-avatar-cell";
import { ColumnDef } from "@tanstack/react-table";
import { ProjectClientView, ClientRole } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useModal } from "@/providers/modal-store";
import { ClientForm } from "./client-form";
import { deleteClientAction } from "../actions";
import { toast } from "sonner";
import { useTransition } from "react";


interface ClientsListTableProps {
    data: ProjectClientView[];
    roles: ClientRole[];
    orgId: string;
    projectId?: string;
}

export function ClientsListTable({ data, roles, orgId, projectId }: ClientsListTableProps) {
    const { openModal, closeModal } = useModal();
    const [isPending, startTransition] = useTransition();

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
        const confirmDelete = confirm(`¿Seguro que deseas eliminar a ${client.contact_full_name} de este proyecto?`);
        if (!confirmDelete) return;

        startTransition(async () => {
            try {
                await deleteClientAction(client.id);
                toast.success("Cliente eliminado");
            } catch (error) {
                toast.error("Error al eliminar");
            }
        });
    };

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

    return (
        <DataTable
            columns={columns}
            data={data}
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
                    label: "Copiar ID",
                    onClick: (client) => navigator.clipboard.writeText(client.id),
                }
            ]}
        />
    );
}
