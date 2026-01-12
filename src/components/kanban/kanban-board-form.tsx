"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { toast } from "sonner";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormFooter } from "@/components/global/form-footer";
import { useModal } from "@/providers/modal-store";
import { createBoard, updateBoard } from "@/features/kanban/actions";
import { DEFAULT_LIST_COLORS, KanbanBoard } from "@/features/kanban/types";
import { cn } from "@/lib/utils";

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
}

export function KanbanBoardForm({ organizationId, projectId, initialData, onSuccess }: KanbanBoardFormProps) {
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
        startTransition(async () => {
            try {
                let resultBoard;

                if (isEditing && initialData) {
                    resultBoard = await updateBoard(initialData.id, {
                        name: values.name,
                        description: values.description,
                        color: values.color,
                    });
                    toast.success("Tablero actualizado");
                } else {
                    resultBoard = await createBoard({
                        name: values.name,
                        description: values.description,
                        organization_id: organizationId,
                        project_id: projectId,
                        color: values.color,
                    });
                    toast.success("Tablero creado");
                }

                onSuccess?.(resultBoard);
            } catch (error) {
                console.error(error);
                toast.error(isEditing ? "Error al actualizar" : "Error al crear el tablero");
            }
        });
    }

    const selectedColor = form.watch("color");

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre del Tablero</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ej: Sprint 1, Roadmap Q1, Ideas..."
                                    autoFocus
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="¿Para qué es este tablero? (opcional)"
                                    className="resize-none"
                                    rows={2}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Color del Tablero</FormLabel>
                            <FormDescription>
                                Este color aparecerá en la lista de tableros
                            </FormDescription>
                            <div className="flex flex-wrap gap-3 p-1 mt-2">
                                {DEFAULT_LIST_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={cn(
                                            "w-8 h-8 rounded-lg transition-all",
                                            "hover:scale-110 hover:shadow-md",
                                            selectedColor === color && "ring-2 ring-offset-2 ring-primary scale-110"
                                        )}
                                        style={{ backgroundColor: color }}
                                        onClick={() => field.onChange(color)}
                                    />
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormFooter
                    className="-mx-4 -mb-4 mt-6"
                    onCancel={closeModal}
                    isLoading={isPending}
                    submitLabel={isEditing ? "Guardar Cambios" : "Crear Tablero"}
                />
            </form>
        </Form>
    );
}
