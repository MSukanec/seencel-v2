"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { toast } from "sonner";
import { createLaborCategory, updateLaborCategory } from "../actions";
import { LaborCategory } from "../types";

// ==========================================
// Schema
// ==========================================

const formSchema = z.object({
    name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
    description: z.string().max(500, "Máximo 500 caracteres").optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ==========================================
// Props
// ==========================================

interface LaborCategoryFormProps {
    initialData?: LaborCategory | null;
    organizationId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

// ==========================================
// Component
// ==========================================

export function LaborCategoryForm({
    initialData,
    organizationId,
    onSuccess,
    onCancel,
}: LaborCategoryFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
        },
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            if (isEditing && initialData) {
                const result = await updateLaborCategory({
                    id: initialData.id,
                    name: values.name,
                    description: values.description || null,
                });

                if (!result.success) {
                    toast.error("Error al actualizar categoría", {
                        description: result.error,
                    });
                    return;
                }

                toast.success("Categoría actualizada", {
                    description: `"${values.name}" se actualizó correctamente.`,
                });
            } else {
                const result = await createLaborCategory({
                    organization_id: organizationId,
                    name: values.name,
                    description: values.description || null,
                });

                if (!result.success) {
                    toast.error("Error al crear categoría", {
                        description: result.error,
                    });
                    return;
                }

                toast.success("Categoría creada", {
                    description: `"${values.name}" se agregó correctamente.`,
                });
            }

            onSuccess?.();
        } catch (error) {
            console.error("Error submitting category form:", error);
            toast.error("Error inesperado", {
                description: "Ocurrió un error al procesar la solicitud.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full min-h-0">
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-4">
                        {/* Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ej: Oficial, Ayudante, Maestro Mayor..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Descripción opcional de la categoría..."
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <FormFooter
                    className="-mx-4 -mb-4 mt-6"
                    isLoading={isLoading}
                    submitLabel={isEditing ? "Guardar Cambios" : "Crear Categoría"}
                    onCancel={onCancel}
                />
            </form>
        </Form>
    );
}
