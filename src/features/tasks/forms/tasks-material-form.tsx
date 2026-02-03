"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { addTaskMaterial } from "@/features/tasks/actions";

// ============================================================================
// Types
// ============================================================================

interface AvailableMaterial {
    id: string;
    name: string;
    unit_name: string | null;
}

interface TasksMaterialFormProps {
    taskId: string;
    availableMaterials: AvailableMaterial[];
    isAdminMode?: boolean;
    onSuccess?: () => void;
    onCancel?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function TasksMaterialForm({
    taskId,
    availableMaterials,
    isAdminMode = false,
    onSuccess,
    onCancel,
}: TasksMaterialFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
    const [amount, setAmount] = useState("");

    // Transform materials for combobox - show name + unit
    const materialOptions = availableMaterials.map((m) => ({
        value: m.id,
        label: `${m.name}${m.unit_name ? ` (${m.unit_name})` : ""}`,
    }));

    const selectedMaterial = availableMaterials.find(m => m.id === selectedMaterialId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedMaterialId) {
            toast.error("Seleccioná un material");
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error("Ingresá una cantidad válida");
            return;
        }

        setIsLoading(true);
        try {
            const result = await addTaskMaterial(
                taskId,
                selectedMaterialId,
                parsedAmount,
                isAdminMode
            );

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Material agregado a la receta");
                onSuccess?.();
            }
        } catch (error) {
            toast.error("Error al agregar material");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                    <FormGroup label="Material">
                        <Combobox
                            options={materialOptions}
                            value={selectedMaterialId}
                            onValueChange={setSelectedMaterialId}
                            placeholder="Buscar material..."
                            searchPlaceholder="Escribí para buscar..."
                            emptyMessage="No se encontraron materiales"
                        />
                    </FormGroup>

                    <FormGroup
                        label={`Cantidad${selectedMaterial?.unit_name ? ` (${selectedMaterial.unit_name})` : ""}`}
                    >
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Ej: 1.5"
                            min="0.001"
                            step="0.001"
                        />
                    </FormGroup>
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel="Agregar Material"
                onCancel={onCancel}
            />
        </form>
    );
}
