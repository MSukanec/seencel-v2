"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { toast } from "sonner";

import { FormFooter } from "@/components/shared/forms/form-footer";
import { TextField, NotesField, ColorField } from "@/components/shared/forms/fields";
import { useModal } from "@/stores/modal-store";
import { createBoard, updateBoard } from "@/features/planner/actions";
import { DEFAULT_LIST_COLORS, KanbanBoard } from "@/features/planner/types";

const formSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    description: z.string().optional(),
    color: z.string().optional(),
});

interface KanbanBoardFormProps {
    organizationId: string;
    projectId?: string | null;
    initialData?: KanbanBoard;
    onSuccess?: (newBoard?: any) => void;
    /** Optimistic: instantly add temp board before server responds */
    onOptimisticCreate?: (tempBoard: KanbanBoard) => void;
    /** Optimistic: instantly update board before server responds */
    onOptimisticUpdate?: (updatedBoard: KanbanBoard) => void;
    /** Rollback on server error */
    onRollback?: () => void;
}

export function KanbanBoardForm({ organizationId, projectId, initialData, onSuccess, onOptimisticCreate, onOptimisticUpdate, onRollback }: KanbanBoardFormProps) {
    const [isPending, startTransition] = useTransition();
    const { closeModal } = useModal();
    const isEditing = !!initialData;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            color: initialData?.color || "#84cc16", // Lime green - SEENCEL brand
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (isEditing && initialData) {
            // Optimistic edit — update UI immediately
            const optimisticBoard: KanbanBoard = {
                ...initialData,
                name: values.name,
                description: values.description || null,
                color: values.color || null,
            };
            onOptimisticUpdate?.(optimisticBoard);
            closeModal();

            startTransition(async () => {
                try {
                    const resultBoard = await updateBoard(initialData.id, {
                        name: values.name,
                        description: values.description,
                        color: values.color,
                    });
                    toast.success("Panel actualizado");
                    onSuccess?.(resultBoard);
                } catch (error) {
                    console.error(error);
                    onRollback?.();
                    toast.error("Error al actualizar");
                }
            });
        } else {
            // Optimistic create — execute immediately OUTSIDE startTransition
            if (onOptimisticCreate) {
                const tempBoard: KanbanBoard = {
                    id: `temp-${Date.now()}`,
                    name: values.name,
                    description: values.description || null,
                    color: values.color || "#84cc16",
                    organization_id: organizationId,
                    project_id: projectId || null,
                    icon: null,
                    default_list_id: null,
                    is_template: false,
                    template_id: null,
                    settings: {},
                    is_archived: false,
                    is_deleted: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    created_by: null,
                    updated_by: null,
                };
                onOptimisticCreate(tempBoard);
            }

            startTransition(async () => {
                try {
                    const resultBoard = await createBoard({
                        name: values.name,
                        description: values.description,
                        organization_id: organizationId,
                        project_id: projectId,
                        color: values.color,
                    });
                    toast.success("Panel creado");
                    onSuccess?.(resultBoard);
                } catch (error) {
                    console.error(error);
                    onRollback?.();
                    toast.error("Error al crear el panel");
                }
            });
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col max-h-full min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
                <TextField
                    label="Nombre del Panel"
                    value={form.watch("name") || ""}
                    onChange={(val) => form.setValue("name", val)}
                    placeholder="Ej: Sprint 1, Roadmap Q1, Ideas..."
                    autoFocus
                    error={form.formState.errors.name?.message}
                />

                <NotesField
                    label="Descripción"
                    value={form.watch("description") || ""}
                    onChange={(val) => form.setValue("description", val)}
                    placeholder="¿Para qué es este tablero? (opcional)"
                    rows={2}
                />

                <ColorField
                    label="Color del Panel"
                    value={form.watch("color")}
                    onChange={(val) => form.setValue("color", val)}
                    colors={DEFAULT_LIST_COLORS}
                    allowNone={false}
                />
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                onCancel={closeModal}
                isLoading={isPending}
                submitLabel={isEditing ? "Guardar Cambios" : "Crear Panel"}
            />
        </form>
    );
}
