
"use client";

import { DataTable } from "@/components/ui/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ProjectClientView, ClientRole } from "../types";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useModal } from "@/providers/modal-store";
import { ClientForm } from "./client-form";
import { deleteClientAction } from "../actions";
import { toast } from "sonner";
import { useTransition } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

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
            cell: ({ row }) => {
                const client = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={client.contact_avatar_url || undefined} />
                            <AvatarFallback>{client.contact_first_name?.[0]}{client.contact_last_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium">{client.contact_full_name}</span>
                            <span className="text-xs text-muted-foreground">{client.contact_company_name}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "project_id", // Just displaying project ID or fetching project name? 
            // View doesn't have project_name, so we might need to fetch it or cross join in the view.
            // For now, let's skip or show ID. Wait, I added project:projects(name) in getClientCommitments but NOT in getClients query (it uses view directly).
            // NOTE: Ideally update `projectClientsView` SQL to include project name or join client-side.
            // Since I cannot change DB schema randomly, I will accept I might not show Project Name here unless I update the query.
            // actually, let's just show role for now.
            header: "Rol",
            accessorFn: (row) => row.role_name || "Sin rol",
            cell: ({ row }) => <Badge variant="outline">{row.original.role_name || "Default"}</Badge>
        },
        {
            accessorKey: "status",
            header: "Estado",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                return (
                    <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                        {status}
                    </Badge>
                );
            }
        },
        {
            accessorKey: "contact_email",
            header: "Email",
        },
        {
            accessorKey: "contact_phone",
            header: "Teléfono",
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const client = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(client.id)}
                            >
                                Copiar ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(client)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <div /> {/* Search placeholder handled by Datatable usually or add here */}
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Agregar Cliente
                </Button>
            </div>
            <DataTable
                columns={columns}
                data={data}
                searchKey="contact_full_name" // Basic search
            />
        </div>
    );
}
