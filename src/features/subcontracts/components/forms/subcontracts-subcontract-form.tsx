"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FormFooter } from "@/components/shared/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/ui/currency-input";

// Schema definition matching subcontracts table
const formSchema = z.object({
    title: z.string().min(1, "El título es requerido"),
    provider_id: z.string().optional(), // Can be null if not selected initially? Schema says contact_id null foreign key, but usually required for a subcontract. Assuming optional for draft.
    amount_total: z.number().min(0).optional(),
    currency_id: z.string().optional(),
    date: z.date().optional(), // Contract date
    start_date: z.date().optional(), // Not in table schema explicitly but common. Wait, table has 'date'. Let's stick to table: 'date'.
    description: z.string().optional(), // Mapped to 'notes' or 'title' is title. Table has 'notes'.
});

type FormValues = z.infer<typeof formSchema>;

interface SubcontractsSubcontractFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: any; // To be typed properly later
    organizationId: string;
    projectId: string;
    // Data props
    providers?: { id: string; name: string }[];
    currencies?: { id: string; code: string; symbol: string }[];
}

export function SubcontractsSubcontractForm({
    onSuccess,
    onCancel,
    initialData,
    organizationId,
    projectId,
    providers = [],
    currencies = []
}: SubcontractsSubcontractFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: initialData?.title || "",
            provider_id: initialData?.contact_id || undefined,
            amount_total: initialData?.amount_total || undefined,
            currency_id: initialData?.currency_id || undefined,
            date: initialData?.date ? new Date(initialData.date) : undefined,
            description: initialData?.notes || "",
        },
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            console.log("Submitting:", { ...values, organizationId, projectId });
            // TODO: Call server action here
            // await createSubcontractAction({...});

            toast.success(isEditing ? "Subcontrato actualizado" : "Subcontrato creado", {
                description: "Los cambios se han guardado correctamente.",
            });
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("Error", {
                description: "No se pudo guardar el subcontrato.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            {/* 
               CRITICAL: Structure for Sticky Footer
               - form: flex flex-col h-full min-h-0
               - content: flex-1 overflow-y-auto
               - footer: outside content
            */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full min-h-0">
                <div className="flex-1 overflow-y-auto px-1">
                    <div className="grid grid-cols-1 gap-4 p-1">

                        {/* Title */}
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título del Contrato</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Instalación Eléctrica Torre A" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Provider */}
                        <FormField
                            control={form.control}
                            name="provider_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subcontratista / Proveedor</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar proveedor" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {providers.map((provider) => (
                                                <SelectItem key={provider.id} value={provider.id}>
                                                    {provider.name}
                                                </SelectItem>
                                            ))}
                                            {providers.length === 0 && (
                                                <div className="p-2 text-sm text-muted-foreground text-center">
                                                    No hay proveedores disponibles
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Amount */}
                            <FormField
                                control={form.control}
                                name="amount_total"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monto Total</FormLabel>
                                        <FormControl>
                                            <CurrencyInput
                                                placeholder="0.00"
                                                value={field.value}
                                                onValueChange={(vals) => field.onChange(vals?.floatValue)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Currency */}
                            <FormField
                                control={form.control}
                                name="currency_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Moneda</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Moneda" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {currencies.map((currency) => (
                                                    <SelectItem key={currency.id} value={currency.id}>
                                                        {currency.code} ({currency.symbol})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Date */}
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Fecha de Contrato</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP", { locale: es })
                                                    ) : (
                                                        <span>Seleccionar fecha</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Notes/Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas / Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detalles adicionales del contrato..."
                                            className="resize-none min-h-[100px]"
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
                    submitLabel={isEditing ? "Guardar Cambios" : "Crear Subcontrato"}
                    onCancel={onCancel}
                />
            </form>
        </Form>
    );
}
