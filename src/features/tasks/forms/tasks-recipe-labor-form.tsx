"use client";

import { useState, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { addRecipeLabor } from "@/features/tasks/actions";

// ============================================================================
// Types
// ============================================================================

interface LaborTypeOption {
    id: string;
    name: string;
    unit_id?: string | null;
    unit_name?: string | null;
    unit_symbol?: string | null;
    category_name?: string | null;
    level_name?: string | null;
    role_name?: string | null;
}

interface TasksRecipeLaborFormProps {
    recipeId: string;
    /** Tipos de mano de obra del catálogo */
    laborTypes: LaborTypeOption[];
}

// ============================================================================
// Component
// ============================================================================

export function TasksRecipeLaborForm({
    recipeId,
    laborTypes,
}: TasksRecipeLaborFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);

    // State
    const [laborTypeId, setLaborTypeId] = useState("");
    const [quantity, setQuantity] = useState<number>(1);
    const [notes, setNotes] = useState("");


    // Derived: unit from selected labor type
    const selectedLaborType = useMemo(
        () => laborTypes.find((lt) => lt.id === laborTypeId),
        [laborTypes, laborTypeId]
    );

    // Combobox options
    const laborTypeOptions = useMemo(
        () =>
            laborTypes.map((lt) => ({
                value: lt.id,
                label: lt.name,
                searchTerms: [lt.category_name, lt.level_name, lt.role_name]
                    .filter(Boolean)
                    .join(" "),
            })),
        [laborTypes]
    );

    // ========================================================================
    // Callbacks internos (semi-autónomo)
    // ========================================================================

    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };

    const handleCancel = () => {
        closeModal();
    };

    // ========================================================================
    // Submit
    // ========================================================================

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!laborTypeId) {
            toast.error("Seleccioná un tipo de mano de obra");
            return;
        }

        if (quantity <= 0) {
            toast.error("La cantidad debe ser mayor a 0");
            return;
        }

        setIsLoading(true);
        try {
            const result = await addRecipeLabor({
                recipe_id: recipeId,
                labor_type_id: laborTypeId,
                quantity,
                unit_id: selectedLaborType?.unit_id || null,
                notes: notes.trim() || null,

            });

            if (result.success) {
                toast.success("Mano de obra agregada a la receta");
                handleSuccess();
            } else {
                toast.error(result.error || "Error al agregar mano de obra");
            }
        } catch {
            toast.error("Error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormGroup label="Tipo de Mano de Obra" required className="md:col-span-2">
                        <Combobox
                            value={laborTypeId}
                            onValueChange={setLaborTypeId}
                            options={laborTypeOptions}
                            placeholder="Seleccionar mano de obra..."
                            searchPlaceholder="Buscar tipo..."
                            emptyMessage="No se encontraron tipos de mano de obra"
                            modal={true}
                        />
                    </FormGroup>

                    <FormGroup label="Cantidad" required>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseFloat(e.target.value))}
                            min="0.001"
                            step="0.001"
                            autoFocus
                        />
                    </FormGroup>

                    <FormGroup label="Unidad">
                        <Input
                            value={selectedLaborType?.unit_symbol || selectedLaborType?.unit_name || ""}
                            disabled
                            placeholder="Se auto-completa del tipo"
                        />
                    </FormGroup>

                    <FormGroup label="Notas" className="md:col-span-2">
                        <Input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Notas opcionales..."
                        />
                    </FormGroup>


                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel="Agregar Mano de Obra"
                onCancel={handleCancel}
            />
        </form>
    );
}
