"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { toast } from "sonner";

import { FormFooter } from "@/components/shared/forms/form-footer";
import { TextField, ColorField } from "@/components/shared/forms/fields";
import { useModal } from "@/stores/modal-store";
import { createList, updateList } from "@/features/planner/actions";
import { DEFAULT_LIST_COLORS, KanbanList } from "@/features/planner/types";

const formSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    color: z.string().optional(),
});

interface KanbanListFormProps {
    boardId: string;
    organizationId: string;
    initialData?: KanbanList;
    onSuccess?: (list: KanbanList) => void;
    /** Called BEFORE server response for optimistic UI */
    onOptimisticCreate?: (tempList: KanbanList) => void;
    onOptimisticUpdate?: (list: KanbanList) => void;
    onRollback?: (listId: string) => void;
}

export function KanbanListForm({ boardId, organizationId, initialData, onSuccess, onOptimisticCreate, onOptimisticUpdate, onRollback }: KanbanListFormProps) {
    const [isPending, startTransition] = useTransition();
    const { closeModal } = useModal();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            color: initialData?.color || DEFAULT_LIST_COLORS[0],
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (initialData) {
            // Optimistic update - execute immediately
            const optimisticItem: KanbanList = {
                ...initialData,
                name: values.name,
                color: values.color || null,
            };
            onOptimisticUpdate?.(optimisticItem);
            closeModal();

            startTransition(async () => {
                try {
                    const result = await updateList(initialData.id, {
                        board_id: boardId,
                        name: values.name,
                        color: values.color,
                    });
                    toast.success("Columna actualizada");
                    onSuccess?.(result);
                } catch (error) {
                    console.error(error);
                    onRollback?.(initialData.id);
                    toast.error("Error al actualizar la columna");
                }
            });
        } else {
            // Optimistic create - execute immediately
            const tempId = `temp-${Date.now()}`;
            const tempList: KanbanList = {
                id: tempId,
                board_id: boardId,
                organization_id: organizationId,
                name: values.name,
                color: values.color || null,
                position: 9999,
                limit_wip: null,
                auto_complete: false,
                is_collapsed: false,
                cards: [],
                created_at: new Date().toISOString(),
            };
            onOptimisticCreate?.(tempList);
            closeModal();

            startTransition(async () => {
                try {
                    const result = await createList({
                        board_id: boardId,
                        name: values.name,
                        color: values.color,
                    });
                    toast.success("Columna creada");
                    onSuccess?.(result);
                } catch (error) {
                    console.error(error);
                    // Remove temp item
                    onRollback?.(tempId);
                    toast.error("Error al crear la columna");
                }
            });
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col max-h-full min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
                <TextField
                    label="Nombre"
                    value={form.watch("name") || ""}
                    onChange={(val) => form.setValue("name", val)}
                    placeholder="Ej: Por hacer, En progreso, Hecho..."
                    autoFocus
                    error={form.formState.errors.name?.message}
                />

                <ColorField
                    label="Color (opcional)"
                    value={form.watch("color")}
                    onChange={(val) => form.setValue("color", val)}
                    colors={DEFAULT_LIST_COLORS}
                />
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                onCancel={closeModal}
                isLoading={isPending}
                submitLabel={initialData ? "Guardar Cambios" : "Crear Columna"}
            />
        </form>
    );
}
