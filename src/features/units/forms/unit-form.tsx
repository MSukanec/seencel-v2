"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
import { createUnit, updateUnit } from "../actions";

// ============================================================================
// Types
// ============================================================================

export interface Unit {
    id: string;
    name: string;
    symbol: string | null;
    applicable_to: string[];
    organization_id: string | null;
    is_system: boolean;
}

interface UnitFormProps {
    organizationId: string;
    initialData?: Unit | null;
}

// ============================================================================
// Component
// ============================================================================

export function UnitForm({ organizationId, initialData }: UnitFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    // Form state
    const [name, setName] = useState(initialData?.name || "");
    const [symbol, setSymbol] = useState(initialData?.symbol || "");

    // Callbacks internos
    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };

    const handleCancel = () => {
        closeModal();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("El nombre es requerido");
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("name", name.trim());
            formData.append("symbol", symbol.trim());
            formData.append("organization_id", organizationId);

            if (isEditing && initialData) {
                formData.append("id", initialData.id);
                const result = await updateUnit(formData);
                if (!result.success) {
                    toast.error(result.error || "Error al guardar");
                    return;
                }
                toast.success("Unidad actualizada correctamente");
            } else {
                const result = await createUnit(formData);
                if (!result.success) {
                    toast.error(result.error || "Error al crear");
                    return;
                }
                toast.success("Unidad creada correctamente");
            }

            handleSuccess();
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nombre */}
                    <FormGroup label="Nombre" htmlFor="name" required>
                        <Input
                            id="name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Metro Cúbico"
                            autoFocus
                        />
                    </FormGroup>

                    {/* Símbolo */}
                    <FormGroup label="Símbolo" htmlFor="symbol">
                        <Input
                            id="symbol"
                            name="symbol"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            placeholder="Ej: m³"
                        />
                    </FormGroup>
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar Cambios" : "Crear Unidad"}
                onCancel={handleCancel}
            />
        </form>
    );
}
