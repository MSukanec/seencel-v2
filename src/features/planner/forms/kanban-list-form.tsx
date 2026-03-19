"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Columns3 } from "lucide-react";

import { FormTextField } from "@/components/shared/forms/fields/form-text-field";
import { ChipRow } from "@/components/shared/chips/chip-row";
import { ColorChip } from "@/components/shared/chips/chips/color-chip";
import { usePanel } from "@/stores/panel-store";
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
    /** Auto-injected by PanelStore */
    formId?: string;
}

export function KanbanListForm({ boardId, organizationId, initialData, onSuccess, onOptimisticCreate, onOptimisticUpdate, onRollback, formId }: KanbanListFormProps) {
    const [isPending, startTransition] = useTransition();
    const { closePanel, setPanelMeta } = usePanel();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            color: initialData?.color || DEFAULT_LIST_COLORS[0],
        },
    });

    const isEditing = !!initialData;

    // 🚨 OBLIGATORIO: Self-describe panel header + footer
    useEffect(() => {
        setPanelMeta({
            icon: Columns3,
            title: isEditing ? "Editar Columna" : "Nueva Columna",
            description: isEditing
                ? `Modificando detalles de la columna`
                : "Agrega una nueva columna al panel",
            size: "sm",
            footer: {
                submitLabel: isEditing ? "Guardar Cambios" : "Crear Columna",
            }
        });
    }, [isEditing, setPanelMeta]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (initialData) {
            // Optimistic update - execute immediately
            const optimisticItem: KanbanList = {
                ...initialData,
                name: values.name,
                color: values.color || null,
            };
            onOptimisticUpdate?.(optimisticItem);
            closePanel();

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
            closePanel();

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
        <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
            <div className="pt-5">
                <ChipRow className="border-b-0 pb-4">
                    <ColorChip
                        value={form.watch("color") || ""}
                        onChange={(val) => form.setValue("color", val)}
                        colors={DEFAULT_LIST_COLORS}
                    />
                </ChipRow>
            </div>

            <FormTextField
                variant="hero"
                value={form.watch("name") || ""}
                onChange={(val) => form.setValue("name", val)}
                placeholder="Nombre de la columna... (Ej: En proceso)"
                autoFocus
                size="default"
                className="border-t-0"
            />
        </form>
    );
}
