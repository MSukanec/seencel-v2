
"use client";

import { ClientRole } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useTransition } from "react";
import { createClientRoleAction } from "../actions"; // We need to create this action
import { toast } from "sonner";
import { useModal } from "@/providers/modal-store";
import { Plus } from "lucide-react";

interface ClientSettingsProps {
    roles: ClientRole[];
    orgId: string;
}

export function ClientSettings({ roles, orgId }: ClientSettingsProps) {
    const { openModal, closeModal } = useModal();

    const handleCreateRole = () => {
        openModal(
            <CreateRoleForm orgId={orgId} onSuccess={closeModal} />,
            { title: "Crear Nuevo Rol" }
        );
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Roles de Cliente</CardTitle>
                            <CardDescription>
                                Define tipos de clientes para segmentar tu cartera (ej. VIP, Regular, Corporativo).
                            </CardDescription>
                        </div>
                        <Button onClick={handleCreateRole}>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Rol
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {roles.map((role) => (
                            <div key={role.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-medium">{role.name}</p>
                                    <p className="text-sm text-muted-foreground">{role.description || "Sin descripción"}</p>
                                </div>
                                {role.is_default && (
                                    <span className="text-xs bg-secondary px-2 py-1 rounded">Default</span>
                                )}
                            </div>
                        ))}
                        {roles.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No hay roles definidos.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Configuración del Portal</CardTitle>
                    <CardDescription>
                        Ajustes globales para el portal de clientes (Próximamente).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Aquí podrás configurar qué módulos ven tus clientes cuando acceden a su portal.
                        Esta funcionalidad está en desarrollo.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

function CreateRoleForm({ orgId, onSuccess }: { orgId: string, onSuccess: () => void }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            try {
                await createClientRoleAction({ organization_id: orgId, name, description });
                toast.success("Rol creado");
                onSuccess();
            } catch (error) {
                toast.error("Error al crear el rol");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="name">Nombre del Rol</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej. VIP"
                    required
                />
            </div>
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="description">Descripción</Label>
                <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción opcional"
                />
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Guardando..." : "Guardar Rol"}
                </Button>
            </div>
        </form>
    );
}
