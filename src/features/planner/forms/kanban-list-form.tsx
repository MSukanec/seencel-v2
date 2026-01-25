"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { useModal } from "@/providers/modal-store";
import { createList, updateList } from "@/features/planner/actions";
import { DEFAULT_LIST_COLORS, KanbanList } from "@/features/planner/types";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    color: z.string().optional(),
});

interface KanbanListFormProps {
    boardId: string;
    initialData?: KanbanList;
    onSuccess?: () => void;
}

export function KanbanListForm({ boardId, initialData, onSuccess }: KanbanListFormProps) {
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
        startTransition(async () => {
            try {
                if (initialData) {
                    await updateList(initialData.id, {
                        board_id: boardId,
                        name: values.name,
                        color: values.color,
                    });
                    toast.success("Columna actualizada");
                } else {
                    await createList({
                        board_id: boardId,
                        name: values.name,
                        color: values.color,
                    });
                    toast.success("Columna creada");
                }
                onSuccess?.();
            } catch (error) {
                console.error(error);
                toast.error(initialData ? "Error al actualizar la columna" : "Error al crear la columna");
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
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ej: Por hacer, En progreso, Hecho..."
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
                    name="color"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Color (opcional)</FormLabel>
                            <div className="flex flex-wrap gap-3 p-1">
                                {DEFAULT_LIST_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={cn(
                                            "w-7 h-7 rounded-full transition-all",
                                            "hover:scale-110 hover:shadow-md",
                                            selectedColor === color && "ring-2 ring-offset-2 ring-primary"
                                        )}
                                        style={{ backgroundColor: color }}
                                        onClick={() => field.onChange(color)}
                                    />
                                ))}
                                {/* No color option */}
                                <button
                                    type="button"
                                    className={cn(
                                        "w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/30",
                                        "hover:scale-110 hover:border-muted-foreground/50 transition-all",
                                        !selectedColor && "ring-2 ring-offset-2 ring-primary"
                                    )}
                                    onClick={() => field.onChange("")}
                                    title="Sin color"
                                />
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormFooter
                    className="-mx-4 -mb-4 mt-6"
                    onCancel={closeModal}
                    isLoading={isPending}
                    submitLabel={initialData ? "Guardar Cambios" : "Crear Columna"}
                />
            </form>
        </Form>
    );
}

