"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { TextField, NotesField } from "@/components/shared/forms/fields";
import { createConstructionSystem, updateConstructionSystem } from "../actions";
import { TaskConstructionSystem } from "../types";

// ============================================================================
// Types
// ============================================================================

interface TasksSystemFormProps {
    initialData?: TaskConstructionSystem | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function TasksSystemForm({ initialData, onSuccess, onCancel }: TasksSystemFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(initialData?.name || "");
    const [code, setCode] = useState(initialData?.code || "");
    const [category, setCategory] = useState(initialData?.category || "");
    const [template, setTemplate] = useState(initialData?.expression_template || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const templateRef = useRef<HTMLInputElement>(null);
    const isEditing = !!initialData;

    // ========================================================================
    // Handlers
    // ========================================================================

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
        if (isEditing) formData.set("id", initialData.id);
        formData.set("name", name);
        formData.set("code", code);
        formData.set("category", category);
        formData.set("expression_template", template);
        formData.set("description", description);

        try {
            const result = isEditing
                ? await updateConstructionSystem(formData)
                : await createConstructionSystem(formData);

            if (result.error) {
                toast.error(result.error);
                setIsLoading(false);
                return;
            }

            toast.success(isEditing ? "Sistema actualizado" : "Sistema creado");
            onSuccess?.();
        } catch (error) {
            console.error("Error submitting construction system:", error);
            toast.error("Error al guardar el sistema constructivo");
            setIsLoading(false);
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                    {/* Name */}
                    <TextField
                        label="Nombre"
                        value={name}
                        onChange={setName}
                        placeholder="ej: Estructura, Mampostería, Revestimientos"
                        className="col-span-2"
                        autoFocus
                    />

                    {/* Code */}
                    <TextField
                        label="Código"
                        required={false}
                        value={code}
                        onChange={(v) => setCode(v.toUpperCase())}
                        placeholder="ej: EST, MAM, REV"
                    />

                    {/* Category */}
                    <TextField
                        label="Categoría"
                        required={false}
                        value={category}
                        onChange={setCategory}
                        placeholder="ej: Obra Gruesa, Terminaciones"
                    />

                    {/* Expression Template */}
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

                    {/* Description */}
                    <NotesField
                        label="Descripción"
                        value={description}
                        onChange={setDescription}
                        placeholder="Descripción del sistema constructivo..."
                        className="col-span-2"
                    />
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar Cambios" : "Crear Sistema"}
                onCancel={onCancel}
            />
        </form>
    );
}
