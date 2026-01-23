"use client";

import { useState, useTransition } from "react";
import { ClientRole } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createClientRoleAction, updateClientRoleAction, deleteClientRoleAction } from "../actions";
import { toast } from "sonner";
import { useModal } from "@/providers/modal-store";
import { Plus, Monitor, Building2, MoreHorizontal, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { FormFooter } from "@/components/shared/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { DeleteReplacementModal } from "@/components/shared/delete-replacement-modal";

interface ClientSettingsProps {
    roles: ClientRole[];
    orgId: string;
}

export function ClientSettings({ roles, orgId }: ClientSettingsProps) {
    const { openModal, closeModal } = useModal();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<ClientRole | null>(null);

    const handleCreateRole = () => {
        openModal(
            <RoleForm orgId={orgId} onSuccess={closeModal} />,
            {
                title: "Crear Nuevo Rol",
                description: "Define un nuevo tipo de clasificación para tus clientes."
            }
        );
    };

    const handleEditRole = (role: ClientRole) => {
        openModal(
            <RoleForm orgId={orgId} initialData={role} onSuccess={closeModal} />,
            {
                title: "Editar Rol",
                description: "Modifica el nombre o descripción de este rol."
            }
        );
    };

    const handleDeleteClick = (role: ClientRole) => {
        setRoleToDelete(role);
        setDeleteModalOpen(true);
    };

    const replacementOptions = roles
        .filter(r => r.id !== roleToDelete?.id)
        .map(r => ({ id: r.id, name: r.name }));

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1.5">
                        <CardTitle>Roles de Cliente</CardTitle>
                        <CardDescription>
                            Define tipos de clientes para segmentar tu cartera (ej. VIP, Regular, Corporativo).
                        </CardDescription>
                    </div>
                    <Button onClick={handleCreateRole}>
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Rol
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Nombre</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="w-[150px]">Tipo</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No hay roles definidos. Crea uno para comenzar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                roles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">{role.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{role.description || "-"}</TableCell>
                                        <TableCell>
                                            {role.is_system ? (
                                                <Badge variant="system" icon={<Monitor className="h-3 w-3" />}>Sistema</Badge>
                                            ) : (
                                                <Badge variant="organization" icon={<Building2 className="h-3 w-3" />}>Personalizada</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {!role.is_system && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menú</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEditRole(role)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteClick(role)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <DeleteReplacementModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setRoleToDelete(null);
                }}
                entityLabel="rol de cliente"
                itemToDelete={roleToDelete ? { id: roleToDelete.id, name: roleToDelete.name } : null}
                replacementOptions={replacementOptions}
                onConfirm={async (replacementId) => {
                    if (roleToDelete) {
                        try {
                            await deleteClientRoleAction(roleToDelete.id, replacementId || undefined);
                            toast.success("Rol eliminado correctamente");
                        } catch (error) {
                            toast.error("Error al eliminar rol");
                            throw error;
                        }
                    }
                }}
            />
        </div>
    );
}

interface RoleFormProps {
    orgId: string;
    initialData?: ClientRole;
    onSuccess: () => void;
}

function RoleForm({ orgId, initialData, onSuccess }: RoleFormProps) {
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [isPending, startTransition] = useTransition();

    const isEdit = !!initialData;

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();

        startTransition(async () => {
            try {
                if (isEdit) {
                    await updateClientRoleAction({
                        id: initialData!.id,
                        organization_id: orgId,
                        name,
                        description
                    });
                    toast.success("Rol actualizado");
                } else {
                    await createClientRoleAction({ organization_id: orgId, name, description });
                    toast.success("Rol creado");
                }
                onSuccess();
            } catch (error) {
                toast.error(isEdit ? "Error al actualizar" : "Error al crear");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
            <div className="flex-1 space-y-4">
                <FormGroup label="Nombre del Rol" htmlFor="name" required>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ej. VIP"
                        autoFocus
                    />
                </FormGroup>

                <FormGroup label="Descripción" htmlFor="description">
                    <Input
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descripción opcional"
                    />
                </FormGroup>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                onCancel={onSuccess}
                onSubmit={handleSubmit}
                isLoading={isPending}
                submitLabel={isEdit ? "Actualizar Rol" : "Guardar Rol"}
            />
        </form>
    );
}

