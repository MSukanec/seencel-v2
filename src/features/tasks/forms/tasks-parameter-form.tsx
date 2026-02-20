"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { TextField, NotesField, SwitchField, SelectField, type SelectOption } from "@/components/shared/forms/fields";
import { createTaskParameter, updateTaskParameter } from "../actions";
import { TaskParameter, ParameterType } from "../types";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

interface TasksParameterFormProps {
    initialData?: TaskParameter | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const PARAMETER_TYPE_OPTIONS: SelectOption[] = [
    { value: "text", label: "Texto" },
    { value: "number", label: "Número" },
    { value: "select", label: "Selección" },
    { value: "boolean", label: "Sí/No" },
    { value: "material", label: "Material" },
];

// ============================================================================
// Component
// ============================================================================

export function TasksParameterForm({ initialData, onSuccess, onCancel }: TasksParameterFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [label, setLabel] = useState(initialData?.label ?? "");
    const [slug, setSlug] = useState(initialData?.slug ?? "");
    const [type, setType] = useState<string>(initialData?.type ?? "number");
    const [isRequired, setIsRequired] = useState(initialData?.is_required ?? true);
    const [template, setTemplate] = useState(initialData?.expression_template ?? "");
    const [description, setDescription] = useState(initialData?.description ?? "");
    const templateRef = useRef<HTMLInputElement>(null);
    const isEditing = !!initialData?.id;

    // Auto-generate slug from label (only for new params)
    const handleLabelChange = (value: string) => {
        setLabel(value);
        if (!isEditing) {
            setSlug(value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""));
        }
    };

    // Insert {value} at cursor position in expression template
    const insertValue = () => {
        const input = templateRef.current;
        if (!input) return;
        const start = input.selectionStart ?? template.length;
        const end = input.selectionEnd ?? template.length;
        const next = template.slice(0, start) + "{value}" + template.slice(end);
        setTemplate(next);
        requestAnimationFrame(() => {
            input.focus();
            const pos = start + 7;
            input.setSelectionRange(pos, pos);
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData();
        formData.set("label", label);
        formData.set("slug", slug);
        formData.set("type", type);
        formData.set("is_required", isRequired ? "true" : "false");
        formData.set("expression_template", template);
        formData.set("description", description);

        try {
            const result = isEditing
                ? await updateTaskParameter(initialData.id, formData)
                : await createTaskParameter(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(isEditing ? "Parámetro actualizado" : "Parámetro creado");
                onSuccess?.();
            }
        } catch (error) {
            toast.error("Error inesperado");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                    {/* Nombre → auto-genera slug */}
                    <TextField
                        label="Nombre"
                        value={label}
                        onChange={handleLabelChange}
                        placeholder="ej: Tipo de Mortero"
                        autoFocus
                    />

                    {/* Slug */}
                    <FormGroup label="Slug" required helpText="Identificador para fórmulas (sin espacios)">
                        <Input
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="tipo_mortero"
                            pattern="^[a-z][a-z0-9_]*$"
                            title="Solo letras minúsculas, números y guiones bajos"
                            required
                        />
                    </FormGroup>

                    {/* Tipo + Obligatorio en la misma fila */}
                    <SelectField
                        label="Tipo"
                        value={type}
                        onChange={setType}
                        options={PARAMETER_TYPE_OPTIONS}
                        placeholder="Seleccionar tipo"
                    />

                    <SwitchField
                        label="¿Obligatorio?"
                        value={isRequired}
                        onChange={setIsRequired}
                        description={isRequired ? "Sí" : "No"}
                    />

                    {/* Expression template — ancho completo, entre Tipo y Descripción */}
                    <FormGroup label="Template de expresión" required={false} className="col-span-2">
                        <div className="flex items-center gap-2">
                            <Input
                                ref={templateRef}
                                placeholder="de {value}"
                                value={template}
                                onChange={(e) => setTemplate(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={insertValue}
                                className="shrink-0 rounded-md border border-dashed border-muted-foreground/40 px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary cursor-pointer"
                                title="Insertar {value} en la posición del cursor"
                            >
                                {"{value}"}
                            </button>
                        </div>
                    </FormGroup>

                    {/* Descripción — ancho completo */}
                    <NotesField
                        label="Descripción"
                        value={description}
                        onChange={setDescription}
                        placeholder="Descripción opcional del parámetro..."
                        className="col-span-2"
                    />
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar Cambios" : "Crear Parámetro"}
                onCancel={onCancel}
            />
        </form>
    );
}
