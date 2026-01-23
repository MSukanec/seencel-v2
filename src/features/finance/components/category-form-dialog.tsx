"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GeneralCostCategory } from "@/types/general-costs";
import { createGeneralCostCategory, updateGeneralCostCategory } from "@/actions/general-costs";

const formSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    description: z.string().optional(),
});

interface CategoryFormDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    categoryToEdit?: GeneralCostCategory;
    organizationId?: string; // Needed for creation
}

export function CategoryFormDialog({
    open,
    onOpenChange,
    categoryToEdit,
    organizationId
}: CategoryFormDialogProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    useEffect(() => {
        if (categoryToEdit) {
            form.reset({
                name: categoryToEdit.name,
                description: categoryToEdit.description || "",
            });
        } else {
            form.reset({
                name: "",
                description: "",
            });
        }
    }, [categoryToEdit, form, open]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!organizationId && !categoryToEdit) {
            toast.error("Error: Falta ID de organización");
            return;
        }

        startTransition(async () => {
            try {
                if (categoryToEdit) {
                    await updateGeneralCostCategory(categoryToEdit.id, values);
                    toast.success("Categoría actualizada");
                } else {
                    await createGeneralCostCategory({
                        ...values,
                        organization_id: organizationId!,
                        is_system: false,
                    });
                    toast.success("Categoría creada");
                }
                onOpenChange?.(false);
                form.reset();
            } catch (error) {
                console.error(error);
                toast.error("Error al guardar la categoría");
            }
        });
    }

    const isEditing = !!categoryToEdit;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Modifica los detalles de la categoría."
                            : "Crea una nueva categoría para agrupar tus gastos."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Oficina, Transporte..." {...field} />
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
                                            placeholder="Detalles opcionales..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Guardar Cambios" : "Crear Categoría"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

