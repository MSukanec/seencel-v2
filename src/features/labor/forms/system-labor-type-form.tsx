"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { toast } from "sonner";
import { createSystemLaborType, updateSystemLaborType } from "../actions";

// ==========================================
// Schema
// ==========================================

const formSchema = z.object({
    name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
    description: z.string().max(500, "Máximo 500 caracteres").optional(),
    labor_category_id: z.string().min(1, "El oficio es requerido"),
    labor_level_id: z.string().min(1, "El nivel es requerido"),
    labor_role_id: z.string().optional(),
    unit_id: z.string().min(1, "La unidad es requerida"),
});

type FormValues = z.infer<typeof formSchema>;

// ==========================================
// Types
// ==========================================

interface LaborCategory {
    id: string;
    name: string;
}

interface LaborLevel {
    id: string;
    name: string;
}

interface LaborRole {
    id: string;
    name: string;
}

interface Unit {
    id: string;
    name: string;
}

interface LaborTypeData {
    id: string;
    name: string;
    description: string | null;
    labor_category_id: string;
    labor_level_id: string;
    labor_role_id: string | null;
    unit_id: string;
    category_name: string | null;
    level_name: string | null;
    role_name: string | null;
    unit_name: string | null;
    // Note: labor_types is a global system table, no is_system column
}

interface SystemLaborTypeFormProps {
    initialData?: LaborTypeData | null;
    categories: LaborCategory[];
    levels: LaborLevel[];
    roles: LaborRole[];
    units: Unit[];
    onSuccess?: (laborType: LaborTypeData) => void;
    onCancel?: () => void;
}

// ==========================================
// Component
// ==========================================

export function SystemLaborTypeForm({
    initialData,
    categories,
    levels,
    roles,
    units,
    onSuccess,
    onCancel,
}: SystemLaborTypeFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            labor_category_id: initialData?.labor_category_id || "",
            labor_level_id: initialData?.labor_level_id || "",
            labor_role_id: initialData?.labor_role_id || "__NONE__",
            unit_id: initialData?.unit_id || "",
        },
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const category = categories.find(c => c.id === values.labor_category_id);
            const level = levels.find(l => l.id === values.labor_level_id);
            const roleId = (values.labor_role_id && values.labor_role_id !== "__NONE__") ? values.labor_role_id : null;
            const role = roleId ? roles.find(r => r.id === roleId) : null;
            const unit = units.find(u => u.id === values.unit_id);

            if (isEditing && initialData) {
                const result = await updateSystemLaborType({
                    id: initialData.id,
                    name: values.name,
                    description: values.description || null,
                    labor_category_id: values.labor_category_id,
                    labor_level_id: values.labor_level_id,
                    labor_role_id: values.labor_role_id === "__NONE__" ? null : values.labor_role_id || null,
                    unit_id: values.unit_id,
                });

                if (!result.success) {
                    toast.error("Error al actualizar", { description: result.error });
                    return;
                }

                onSuccess?.({
                    ...initialData,
                    name: values.name,
                    description: values.description || null,
                    labor_category_id: values.labor_category_id,
                    labor_level_id: values.labor_level_id,
                    labor_role_id: roleId,
                    unit_id: values.unit_id,
                    category_name: category?.name || null,
                    level_name: level?.name || null,
                    role_name: role?.name || null,
                    unit_name: unit?.name || null,
                });
            } else {
                const result = await createSystemLaborType({
                    name: values.name,
                    description: values.description || null,
                    labor_category_id: values.labor_category_id,
                    labor_level_id: values.labor_level_id,
                    labor_role_id: values.labor_role_id === "__NONE__" ? null : values.labor_role_id || null,
                    unit_id: values.unit_id,
                });

                if (!result.success) {
                    toast.error("Error al crear", { description: result.error });
                    return;
                }

                onSuccess?.({
                    id: result.data!.id,
                    name: values.name,
                    description: values.description || null,
                    labor_category_id: values.labor_category_id,
                    labor_level_id: values.labor_level_id,
                    labor_role_id: roleId,
                    unit_id: values.unit_id,
                    category_name: category?.name || null,
                    level_name: level?.name || null,
                    role_name: role?.name || null,
                    unit_name: unit?.name || null,
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
                        {/* Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Oficial Albañil, Medio Oficial Electricista..." {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Nombre descriptivo del tipo de mano de obra
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Category (Oficio) */}
                        <FormField
                            control={form.control}
                            name="labor_category_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Oficio *</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar oficio..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Level (Nivel) */}
                        <FormField
                            control={form.control}
                            name="labor_level_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nivel *</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar nivel..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {levels.map((lvl) => (
                                                <SelectItem key={lvl.id} value={lvl.id}>
                                                    {lvl.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Role (Rol) - Optional */}
                        <FormField
                            control={form.control}
                            name="labor_role_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rol (opcional)</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar rol..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="__NONE__">Sin rol específico</SelectItem>
                                            {roles.map((role) => (
                                                <SelectItem key={role.id} value={role.id}>
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Unit */}
                        <FormField
                            control={form.control}
                            name="unit_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unidad de medida *</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar unidad..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {units.map((unit) => (
                                                <SelectItem key={unit.id} value={unit.id}>
                                                    {unit.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Generalmente HORA para mano de obra
                                    </FormDescription>
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
                                            placeholder="Descripción opcional..."
                                            className="resize-none"
                                            rows={2}
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
