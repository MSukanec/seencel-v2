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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Ruler, Package, Clock } from "lucide-react";
import { createUnit, updateUnit } from "../actions";
import type { UnitCategory, CatalogUnit } from "../queries";

// ============================================================================
// Types
// ============================================================================

export type ApplicableTo = "task" | "material" | "labor";

interface UnitFormProps {
    organizationId: string;
    categories: UnitCategory[];
    initialData?: CatalogUnit | null;
    /** Tipos de uso por defecto cuando se crea una nueva */
    defaultApplicableTo?: ApplicableTo;
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

export function UnitForm({ organizationId, categories, initialData, defaultApplicableTo = "task" }: UnitFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    // Form state
    const [name, setName] = useState(initialData?.name || "");
    const [symbol, setSymbol] = useState(initialData?.symbol || "");
    const [applicableTo, setApplicableTo] = useState<ApplicableTo[]>(
        isEditing && initialData?.applicable_to
            ? initialData.applicable_to as ApplicableTo[]
            : [defaultApplicableTo]
    );
    const [categoryId, setCategoryId] = useState<string>(
        initialData?.unit_category_id || ""
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

        if (applicableTo.length === 0) {
            toast.error("Seleccioná al menos un uso");
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("name", name.trim());
            formData.append("symbol", symbol.trim());
            formData.append("organization_id", organizationId);
            // Send as JSON array
            formData.append("applicable_to", JSON.stringify(applicableTo));
            if (categoryId) {
                formData.append("unit_category_id", categoryId);
            }

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
                <div className="space-y-4">
                    {/* Nombre - Full width */}
                    <FormGroup label="Nombre" htmlFor="name" required>
                        <Input
                            id="name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Metro Cuadrado"
                            autoFocus
                        />
                    </FormGroup>

                    {/* Categoría y Símbolo - 2 columnas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormGroup label="Categoría" htmlFor="unit_category_id">
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>

                        <FormGroup label="Símbolo" htmlFor="symbol">
                            <Input
                                id="symbol"
                                name="symbol"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value)}
                                placeholder="Ej: m²"
                            />
                        </FormGroup>
                    </div>

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

