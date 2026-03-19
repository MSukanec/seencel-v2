"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { usePanel } from "@/stores/panel-store";
import { FormGroup } from "@/components/ui/form-group";
import { TextField } from "@/components/shared/forms/fields";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Ruler, Package, Clock } from "lucide-react";
import { createUnit, updateUnit } from "../actions";
import type { CatalogUnit } from "../queries";

// ============================================================================
// Types
// ============================================================================

export type ApplicableTo = "task" | "material" | "labor";

interface UnitFormProps {
    organizationId: string;
    initialData?: CatalogUnit | null;
    /** Tipos de uso por defecto cuando se crea una nueva */
    defaultApplicableTo?: ApplicableTo;
    /** Inyectado por PanelProvider */
    formId?: string;
}

// ============================================================================
// Constants
// ============================================================================

const APPLICABLE_TO_OPTIONS: { value: ApplicableTo; label: string; icon: typeof Ruler }[] = [
    { value: "task", label: "Tareas", icon: Ruler },
    { value: "material", label: "Materiales", icon: Package },
    { value: "labor", label: "Mano de Obra", icon: Clock },
];

// ============================================================================
// Component
// ============================================================================

export function UnitForm({ organizationId, initialData, defaultApplicableTo = "task", formId }: UnitFormProps) {
    const router = useRouter();
    const { closePanel, setPanelMeta, setSubmitting, completePanel } = usePanel();
    const isEditing = !!initialData;

    // Form state
    const [name, setName] = useState(initialData?.name || "");
    const [symbol, setSymbol] = useState(initialData?.symbol || "");
    const [applicableTo, setApplicableTo] = useState<ApplicableTo[]>(
        isEditing && initialData?.applicable_to
            ? initialData.applicable_to as ApplicableTo[]
            : [defaultApplicableTo]
    );

    // Callbacks internos
    const handleSuccess = () => {
        closePanel();
        router.refresh(); // TODO: If we use optimistic updates, this might not be needed. But we refresh the cache.
    };

    const handleCancel = () => {
        closePanel();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("El nombre es requerido");
            return;
        }

        if (applicableTo.length === 0) {
            toast.error("Seleccioná al menos un uso");
            return;
        }

        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("name", name.trim());
            formData.append("symbol", symbol.trim());
            formData.append("organization_id", organizationId);
            // Send as JSON array
            formData.append("applicable_to", JSON.stringify(applicableTo));

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
            setSubmitting(false);
        }
    };

    // Update panel metadata and footer
    useEffect(() => {
        setPanelMeta({
            title: isEditing ? "Editar Unidad" : "Nueva Unidad",
            description: isEditing ? "Modificar los datos de esta unidad." : "Creá una nueva unidad de medida.",
            icon: Ruler,
            footer: {
                submitLabel: isEditing ? "Guardar Cambios" : "Crear Unidad",
                cancelLabel: "Cancelar",
            }
        });
    }, [isEditing, setPanelMeta]);

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" id={formId}>
                    {/* Nombre - Full width */}
                    <TextField
                        label="Nombre"
                        value={name}
                        onChange={setName}
                        placeholder="Ej: Metro Cuadrado"
                        required
                        autoFocus
                    />

                    {/* Símbolo */}
                    <TextField
                        label="Símbolo"
                        value={symbol}
                        onChange={setSymbol}
                        placeholder="Ej: m²"
                    />

                    {/* Uso - Toggle Group multi-select */}
                    <FormGroup label="Uso" htmlFor="applicable_to" required>
                        <ToggleGroup
                            type="multiple"
                            value={applicableTo}
                            onValueChange={(value) => setApplicableTo(value as ApplicableTo[])}
                            variant="outline"
                            className="justify-start"
                        >
                            {APPLICABLE_TO_OPTIONS.map((opt) => (
                                <ToggleGroupItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="gap-2"
                                >
                                    <opt.icon className="h-4 w-4" />
                                    {opt.label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </FormGroup>
        </form>
    );
}

