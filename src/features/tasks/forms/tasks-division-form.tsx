"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { TextField, NotesField } from "@/components/shared/forms/fields";
import { Combobox } from "@/components/ui/combobox";
import { createTaskDivision, updateTaskDivision } from "../actions";
import { TaskDivision } from "../types";

// ============================================================================
// Types
// ============================================================================

interface TasksDivisionFormProps {
    initialData?: TaskDivision | null;
    divisions: TaskDivision[];
    isAdminMode?: boolean;
    /** Pre-selects a parent when creating a new sub-division */
    defaultParentId?: string | null;
    /** Called immediately with optimistic data before server call */
    onOptimisticCreate?: (item: TaskDivision) => void;
    /** Called immediately with updated data before server call */
    onOptimisticUpdate?: (item: TaskDivision) => void;
}

// ============================================================================
// Component (Semi-Autónomo)
// ============================================================================

export function TasksDivisionForm({
    initialData,
    divisions,
    isAdminMode = false,
    defaultParentId = null,
    onOptimisticCreate,
    onOptimisticUpdate,
}: TasksDivisionFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const isEditing = !!initialData?.id;

    // Form state
    const [name, setName] = useState(initialData?.name ?? "");
    const [code, setCode] = useState(initialData?.code ?? "");
    const [parentId, setParentId] = useState(initialData?.parent_id ?? defaultParentId ?? "_none");
    const [description, setDescription] = useState(initialData?.description ?? "");

    // Build combobox options for parent selection (filter out self and children)
    const parentComboboxOptions = [
        { value: "_none", label: "Sin padre (raíz)" },
        ...divisions
            .filter(d => {
                if (!initialData) return true;
                if (d.id === initialData.id) return false;
                return d.parent_id !== initialData.id;
            })
            .map(d => ({ value: d.id, label: d.name })),
    ];

    // Callbacks internos (patrón semi-autónomo)
    const handleCancel = () => {
        closeModal();
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("El nombre del rubro es requerido");
            return;
        }

        const formData = new FormData();
        formData.set("name", name.trim());
        formData.set("code", code.trim());
        formData.set("description", description.trim());
        formData.set("parent_id", parentId === "_none" ? "" : parentId);

        if (isAdminMode) {
            formData.set("is_admin_mode", "true");
        }

        if (isEditing && initialData?.id) {
            formData.set("id", initialData.id);
        }

        // ✅ OPTIMISTIC: Build optimistic item and notify parent immediately
        const effectiveParentId = parentId === "_none" ? null : parentId;

        if (!isEditing && onOptimisticCreate) {
            const optimisticItem: TaskDivision = {
                id: `temp-${Date.now()}`,
                name: name.trim(),
                code: code.trim() || undefined,
                description: description.trim() || undefined,
                parent_id: effectiveParentId,
                order: 999999,
                is_system: isAdminMode,
                organization_id: undefined,
            };
            onOptimisticCreate(optimisticItem);
        } else if (isEditing && onOptimisticUpdate && initialData) {
            const updatedItem: TaskDivision = {
                ...initialData,
                name: name.trim(),
                code: code.trim() || undefined,
                description: description.trim() || undefined,
                parent_id: effectiveParentId,
            };
            onOptimisticUpdate(updatedItem);
        }

        closeModal();
        toast.success(isEditing ? "¡Rubro actualizado!" : "¡Rubro creado!");

        // 🔄 BACKGROUND: Submit to server
        try {
            const result = isEditing
                ? await updateTaskDivision(formData)
                : await createTaskDivision(formData);

            if (result.error) {
                toast.error(result.error);
            }
            // Always refresh to get real server data
            router.refresh();
        } catch (error: any) {
            console.error("Division form error:", error);
            toast.error("Error al guardar: " + error.message);
            router.refresh(); // Refresh to rollback optimistic state
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                    {/* Nombre del Rubro: full width */}
                    <TextField
                        value={name}
                        onChange={setName}
                        label="Nombre del Rubro"
                        placeholder="Ej: Mampostería"
                        autoFocus
                        className="md:col-span-12"
                    />

                    {/* Rubro Padre: 8 cols */}
                    <div className="md:col-span-8">
                        <FormGroup label="Rubro Padre (opcional)">
                            <Combobox
                                value={parentId}
                                onValueChange={setParentId}
                                options={parentComboboxOptions}
                                placeholder="Sin padre (raíz)"
                                searchPlaceholder="Buscar rubro..."
                                emptyMessage="No se encontraron rubros."
                            />
                        </FormGroup>
                    </div>

                    {/* Código: 4 cols */}
                    <TextField
                        value={code}
                        onChange={setCode}
                        label="Código"
                        placeholder="Ej: MAM"
                        required={false}
                        className="md:col-span-4"
                    />

                    {/* Descripción: full width */}
                    <NotesField
                        value={description}
                        onChange={setDescription}
                        label="Descripción"
                        placeholder="Descripción del rubro..."
                        className="md:col-span-12"
                    />

                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                submitLabel={isEditing ? "Guardar Cambios" : "Crear Rubro"}
                onCancel={handleCancel}
            />
        </form>
    );
}
