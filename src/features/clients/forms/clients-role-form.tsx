"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { createClientRoleAction, updateClientRoleAction } from "@/features/clients/actions";
import { ClientRole } from "../types";

interface RoleFormProps {
    orgId: string;
    initialData?: ClientRole;
    onSuccess: () => void;
}

export function RoleForm({ orgId, initialData, onSuccess }: RoleFormProps) {
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
