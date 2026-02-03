"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { addTaskLabor } from "@/features/tasks/actions";

// ============================================================================
// Types
// ============================================================================

interface AvailableLaborType {
    id: string;
    name: string;
    unit_name: string | null;
}

interface TasksLaborFormProps {
    taskId: string;
    availableLaborTypes: AvailableLaborType[];
    isAdminMode?: boolean;
    onSuccess?: () => void;
    onCancel?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function TasksLaborForm({
    taskId,
    availableLaborTypes,
    isAdminMode = false,
    onSuccess,
    onCancel,
}: TasksLaborFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLaborTypeId, setSelectedLaborTypeId] = useState<string>("");
    const [quantity, setQuantity] = useState("1");

    // Transform labor types for combobox - show name + unit
    const laborTypeOptions = availableLaborTypes.map((l) => ({
        value: l.id,
        label: `${l.name}${l.unit_name ? ` (${l.unit_name})` : ""}`,
    }));

    const selectedLaborType = availableLaborTypes.find(l => l.id === selectedLaborTypeId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedLaborTypeId) {
            toast.error("Seleccioná un tipo de mano de obra");
            return;
        }

        const parsedQuantity = parseFloat(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            toast.error("Ingresá una cantidad válida");
            return;
        }

        setIsLoading(true);
        try {
            const result = await addTaskLabor(
                taskId,
                selectedLaborTypeId,
                parsedQuantity,
                isAdminMode
            );

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Mano de obra agregada a la receta");
                onSuccess?.();
            }
        } catch (error) {
            toast.error("Error al agregar mano de obra");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                    <FormGroup label="Tipo de Mano de Obra">
                        <Combobox
                            options={laborTypeOptions}
                            value={selectedLaborTypeId}
                            onValueChange={setSelectedLaborTypeId}
                            placeholder="Buscar tipo..."
                            searchPlaceholder="Escribí para buscar..."
                            emptyMessage="No se encontraron tipos de mano de obra"
                        />
                    </FormGroup>

                    <FormGroup
                        label={`Cantidad${selectedLaborType?.unit_name ? ` (${selectedLaborType.unit_name})` : ""}`}
                    >
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Ej: 1"
                            min="0.01"
                            step="0.01"
                        />
                    </FormGroup>
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel="Agregar Mano de Obra"
                onCancel={onCancel}
            />
        </form>
    );
}
