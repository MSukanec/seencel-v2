"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { GeneralCost, GeneralCostCategory } from "@/types/general-costs";
import { createGeneralCost, updateGeneralCost } from "@/actions/general-costs";

const formSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    description: z.string().optional(),
    category_id: z.string().min(1, "La categoría es obligatoria"),
    is_recurring: z.boolean(),
    recurrence_interval: z.string().optional(),
    expected_day: z.coerce.number().min(1).max(31).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ConceptFormDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    conceptToEdit?: GeneralCost;
    categories: GeneralCostCategory[];
    organizationId?: string;
}

export function ConceptFormDialog({
    open,
    onOpenChange,
    conceptToEdit,
    categories,
    organizationId
}: ConceptFormDialogProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            description: "",
            category_id: "",
            is_recurring: false,
            recurrence_interval: "monthly",
            expected_day: 1,
        },
    });

    const isRecurring = form.watch("is_recurring");

    useEffect(() => {
        if (conceptToEdit) {
            form.reset({
                name: conceptToEdit.name,
                description: conceptToEdit.description || "",
                category_id: conceptToEdit.category_id || "",
                is_recurring: conceptToEdit.is_recurring ?? false,
                recurrence_interval: conceptToEdit.recurrence_interval || "monthly",
                expected_day: conceptToEdit.expected_day || 1,
            });
        } else {
            form.reset({
                name: "",
                description: "",
                category_id: "",
                is_recurring: false,
                recurrence_interval: "monthly",
                expected_day: 1,
            });
        }
    }, [conceptToEdit, form, open]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!organizationId && !conceptToEdit) {
            toast.error("Error: Falta ID de organización");
            return;
        }

        startTransition(async () => {
            try {
                if (conceptToEdit) {
                    await updateGeneralCost(conceptToEdit.id, values);
                    toast.success("Concepto actualizado");
                } else {
                    await createGeneralCost({
                        ...values,
                        organization_id: organizationId!,
                    });
                    toast.success("Concepto creado");
                }
                onOpenChange?.(false);
                form.reset();
            } catch (error) {
                console.error(error);
                toast.error("Error al guardar el concepto");
            }
        });
    }

    const isEditing = !!conceptToEdit;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Concepto" : "Nuevo Concepto"}</DialogTitle>
                    <DialogDescription>
                        Define los conceptos de gasto (ej. Alquiler, Luz, Internet).
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
                                        <Input placeholder="Ej. Alquiler Local" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoría</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona una categoría" />
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="is_recurring"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm col-span-2">
                                        <div className="space-y-0.5">
                                            <FormLabel>Es Recurrente</FormLabel>
                                            <FormDescription>
                                                Activa si este gasto se repite periódicamente.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {isRecurring && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="recurrence_interval"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Frecuencia</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecciona frecuencia" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="monthly">Mensual</SelectItem>
                                                        <SelectItem value="weekly">Semanal</SelectItem>
                                                        <SelectItem value="yearly">Anual</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="expected_day"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Día del mes (aprox)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min={1} max={31} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detalles adicionales..."
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
                                {isEditing ? "Guardar Cambios" : "Crear Concepto"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
