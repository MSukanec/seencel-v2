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
import { createSystemLaborCategory, updateSystemLaborCategory } from "../actions";

// ==========================================
// Schema
// ==========================================

const formSchema = z.object({
    name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
    description: z.string().max(500, "Máximo 500 caracteres").optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ==========================================
// Types
// ==========================================

interface LaborCategoryData {
    id: string;
    name: string;
    description: string | null;
    is_system: boolean;
}

interface SystemLaborCategoryFormProps {
    initialData?: LaborCategoryData | null;
    onSuccess?: (category: LaborCategoryData) => void;
    onCancel?: () => void;
}

// ==========================================
// Component
// ==========================================

export function SystemLaborCategoryForm({
    initialData,
    onSuccess,
    onCancel,
}: SystemLaborCategoryFormProps) {
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
                const result = await updateSystemLaborCategory({
                    id: initialData.id,
                    name: values.name,
                    description: values.description || null,
                });

                if (!result.success) {
                    toast.error("Error al actualizar", { description: result.error });
                    return;
                }

                onSuccess?.({
                    ...initialData,
                    name: values.name,
                    description: values.description || null,
                });
            } else {
                const result = await createSystemLaborCategory({
                    name: values.name,
                    description: values.description || null,
                });

                if (!result.success) {
                    toast.error("Error al crear", { description: result.error });
                    return;
                }

                onSuccess?.({
                    id: result.data!.id,
                    name: values.name,
                    description: values.description || null,
                    is_system: true,
                });
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("Error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full min-h-0">
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Albañilería, Electricidad..." {...field} />
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
                                            placeholder="Descripción opcional..."
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
                    submitLabel={isEditing ? "Guardar" : "Crear"}
                    onCancel={onCancel}
                />
            </form>
        </Form>
    );
}
