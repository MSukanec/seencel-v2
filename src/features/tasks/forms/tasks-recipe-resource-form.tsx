"use client";

import { useState, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { addRecipeMaterial, addRecipeLabor } from "@/features/tasks/actions";

// ============================================================================
// Types
// ============================================================================

type ResourceType = "material" | "labor";

interface CatalogMaterialOption {
    id: string;
    name: string;
    code?: string | null;
    unit_id?: string | null;
    unit_name?: string | null;
    unit_symbol?: string | null;
}

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

interface TasksRecipeResourceFormProps {
    recipeId: string;
    /** Catalog materials for combobox */
    materials: CatalogMaterialOption[];
    /** Catalog labor types for combobox */
    laborTypes: LaborTypeOption[];
    /** Pre-selected resource type (optional) */
    defaultResourceType?: ResourceType;
}

// ============================================================================
// Component
// ============================================================================

export function TasksRecipeResourceForm({
    recipeId,
    materials,
    laborTypes,
    defaultResourceType = "material",
}: TasksRecipeResourceFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);

    // State
    const [resourceType, setResourceType] = useState<ResourceType>(defaultResourceType);
    const [selectedId, setSelectedId] = useState("");
    const [quantity, setQuantity] = useState<number>(1);
    const [notes, setNotes] = useState("");
    const [isOptional, setIsOptional] = useState(false);

    // Reset selection when resource type changes
    const handleResourceTypeChange = (value: ResourceType) => {
        setResourceType(value);
        setSelectedId("");
    };

    // ========================================================================
    // Derived data
    // ========================================================================

    const selectedMaterial = useMemo(
        () => (resourceType === "material" ? materials.find((m) => m.id === selectedId) : null),
        [materials, selectedId, resourceType]
    );

    const selectedLaborType = useMemo(
        () => (resourceType === "labor" ? laborTypes.find((lt) => lt.id === selectedId) : null),
        [laborTypes, selectedId, resourceType]
    );

    const unitDisplay = resourceType === "material"
        ? selectedMaterial?.unit_symbol || selectedMaterial?.unit_name || ""
        : selectedLaborType?.unit_symbol || selectedLaborType?.unit_name || "";

    // Combobox options — memoized per type
    const materialOptions = useMemo(
        () => materials.map((m) => ({
            value: m.id,
            label: m.name,
            searchTerms: m.code || undefined,
        })),
        [materials]
    );

    const laborOptions = useMemo(
        () => laborTypes.map((lt) => ({
            value: lt.id,
            label: lt.name,
            searchTerms: [lt.category_name, lt.level_name, lt.role_name]
                .filter(Boolean)
                .join(" "),
        })),
        [laborTypes]
    );

    const comboboxOptions = resourceType === "material"
        ? materialOptions
        : laborOptions;

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };

    const handleCancel = () => {
        closeModal();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedId) {
            const messages: Record<ResourceType, string> = {
                material: "Seleccioná un material del catálogo",
                labor: "Seleccioná un tipo de mano de obra",
            };
            toast.error(messages[resourceType]);
            return;
        }

        if (quantity <= 0) {
            toast.error("La cantidad debe ser mayor a 0");
            return;
        }

        setIsLoading(true);
        try {
            if (resourceType === "material") {
                const result = await addRecipeMaterial({
                    recipe_id: recipeId,
                    material_id: selectedId,
                    quantity,
                    waste_percentage: 0,
                    unit_id: selectedMaterial?.unit_id || null,
                    notes: notes.trim() || null,
                    is_optional: isOptional,
                });
                if (result.success) {
                    toast.success("Material agregado a la receta");
                    handleSuccess();
                } else {
                    toast.error(result.error || "Error al agregar material");
                }
            } else {
                // Labor
                const result = await addRecipeLabor({
                    recipe_id: recipeId,
                    labor_type_id: selectedId,
                    quantity,
                    unit_id: selectedLaborType?.unit_id || null,
                    notes: notes.trim() || null,
                    is_optional: isOptional,
                });
                if (result.success) {
                    toast.success("Mano de obra agregada a la receta");
                    handleSuccess();
                } else {
                    toast.error(result.error || "Error al agregar mano de obra");
                }
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

    const labels: Record<ResourceType, { combobox: string; placeholder: string; search: string; empty: string; optional: string; submit: string }> = {
        material: {
            combobox: "Material",
            placeholder: "Seleccionar material...",
            search: "Buscar material...",
            empty: "No se encontraron materiales",
            optional: "Material opcional",
            submit: "Agregar Material",
        },
        labor: {
            combobox: "Tipo de Mano de Obra",
            placeholder: "Seleccionar mano de obra...",
            search: "Buscar tipo...",
            empty: "No se encontraron tipos de mano de obra",
            optional: "Mano de obra opcional",
            submit: "Agregar Mano de Obra",
        },
    };

    const l = labels[resourceType];

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Resource Type Selector */}
                    <FormGroup label="Tipo de Recurso" required className="md:col-span-2">
                        <Select value={resourceType} onValueChange={handleResourceTypeChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="material">Material</SelectItem>
                                <SelectItem value="labor">Mano de Obra</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    {/* Resource Combobox */}
                    <FormGroup
                        label={l.combobox}
                        required
                        className="md:col-span-2"
                    >
                        <Combobox
                            value={selectedId}
                            onValueChange={setSelectedId}
                            options={comboboxOptions}
                            placeholder={l.placeholder}
                            searchPlaceholder={l.search}
                            emptyMessage={l.empty}
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
                            value={unitDisplay}
                            disabled
                            placeholder="Se auto-completa"
                        />
                    </FormGroup>

                    <FormGroup label="Notas" className="md:col-span-2">
                        <Input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Notas opcionales..."
                        />
                    </FormGroup>

                    <div className="flex items-center gap-2 md:col-span-2">
                        <input
                            type="checkbox"
                            id="is_optional_resource"
                            checked={isOptional}
                            onChange={(e) => setIsOptional(e.target.checked)}
                            className="rounded"
                        />
                        <label htmlFor="is_optional_resource" className="text-sm">
                            {l.optional}
                        </label>
                    </div>
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={l.submit}
                onCancel={handleCancel}
            />
        </form>
    );
}
