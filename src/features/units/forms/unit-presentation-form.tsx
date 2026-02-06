"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createUnitPresentation, updateUnitPresentation } from "../actions";

// ============================================================================
// Types
// ============================================================================

export interface Unit {
    id: string;
    name: string;
    symbol: string | null;
}

export interface UnitPresentation {
    id: string;
    unit_id: string;
    unit_name: string | null;
    name: string;
    equivalence: number;
    organization_id: string | null;
    is_system: boolean;
}

interface UnitPresentationFormProps {
    organizationId: string;
    units: Unit[];
    initialData?: UnitPresentation | null;
}

// ============================================================================
// Component
// ============================================================================

export function UnitPresentationForm({
    organizationId,
    units,
    initialData
}: UnitPresentationFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    // Form state
    const [name, setName] = useState(initialData?.name || "");
    const [unitId, setUnitId] = useState(initialData?.unit_id || "");
    const [equivalence, setEquivalence] = useState(
        initialData?.equivalence?.toString() || ""
    );

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

        if (!unitId) {
            toast.error("Seleccioná una unidad base");
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("name", name.trim());
            formData.append("unit_id", unitId);
            formData.append("equivalence", equivalence);
            formData.append("organization_id", organizationId);

            if (isEditing && initialData) {
                formData.append("id", initialData.id);
                const result = await updateUnitPresentation(formData);
                if (!result.success) {
                    toast.error(result.error || "Error al guardar");
                    return;
                }
                toast.success("Presentación actualizada correctamente");
            } else {
                const result = await createUnitPresentation(formData);
                if (!result.success) {
                    toast.error(result.error || "Error al crear");
                    return;
                }
                toast.success("Presentación creada correctamente");
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
                    {/* Nombre - Full width */}
                    <FormGroup label="Nombre" htmlFor="name" required className="md:col-span-2">
                        <Input
                            id="name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Bolsa 25kg"
                            autoFocus
                        />
                    </FormGroup>

                    {/* Unidad */}
                    <FormGroup label="Unidad" htmlFor="unit_id" required>
                        <Select value={unitId} onValueChange={setUnitId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar unidad" />
                            </SelectTrigger>
                            <SelectContent>
                                {units.map((unit) => (
                                    <SelectItem key={unit.id} value={unit.id}>
                                        {unit.name} {unit.symbol ? `(${unit.symbol})` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    {/* Equivalencia */}
                    <FormGroup
                        label="Equivalencia"
                        htmlFor="equivalence"
                        required
                    >
                        <Input
                            id="equivalence"
                            name="equivalence"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={equivalence}
                            onChange={(e) => setEquivalence(e.target.value)}
                            placeholder="Ej: 25"
                        />
                    </FormGroup>
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar Cambios" : "Crear Presentación"}
                onCancel={handleCancel}
            />
        </form>
    );
}
