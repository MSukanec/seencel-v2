"use client";

import { useState, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { addRecipeMaterial } from "@/features/tasks/actions";

// ============================================================================
// Types
// ============================================================================

interface CatalogMaterialOption {
    id: string;
    name: string;
    code?: string | null;
    unit_id?: string | null;
    unit_name?: string | null;
    unit_symbol?: string | null;
}

interface TasksRecipeMaterialFormProps {
    recipeId: string;
    /** Materiales del catálogo de la organización */
    materials: CatalogMaterialOption[];
}

// ============================================================================
// Component
// ============================================================================

export function TasksRecipeMaterialForm({
    recipeId,
    materials,
}: TasksRecipeMaterialFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);

    // State
    const [materialId, setMaterialId] = useState("");
    const [quantity, setQuantity] = useState<number>(1);
    const [notes, setNotes] = useState("");


    // Derived: unit from selected material
    const selectedMaterial = useMemo(
        () => materials.find((m) => m.id === materialId),
        [materials, materialId]
    );

    // Combobox options
    const materialOptions = useMemo(
        () =>
            materials.map((m) => ({
                value: m.id,
                label: m.name,
                searchTerms: m.code || undefined,
            })),
        [materials]
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

        if (!materialId) {
            toast.error("Seleccioná un material del catálogo");
            return;
        }

        if (quantity <= 0) {
            toast.error("La cantidad debe ser mayor a 0");
            return;
        }

        setIsLoading(true);
        try {
            const result = await addRecipeMaterial({
                recipe_id: recipeId,
                material_id: materialId,
                quantity,
                waste_percentage: 0,
                unit_id: selectedMaterial?.unit_id || null,
                notes: notes.trim() || null,

            });

            if (result.success) {
                toast.success("Material agregado a la receta");
                handleSuccess();
            } else {
                toast.error(result.error || "Error al agregar material");
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
                    <FormGroup label="Material" required className="md:col-span-2">
                        <Combobox
                            value={materialId}
                            onValueChange={setMaterialId}
                            options={materialOptions}
                            placeholder="Seleccionar material..."
                            searchPlaceholder="Buscar material..."
                            emptyMessage="No se encontraron materiales"
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
                            value={selectedMaterial?.unit_symbol || selectedMaterial?.unit_name || ""}
                            disabled
                            placeholder="Se auto-completa del material"
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
                submitLabel="Agregar Material"
                onCancel={handleCancel}
            />
        </form>
    );
}
