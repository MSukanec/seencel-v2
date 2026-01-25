"use client";
// Force rebuild


import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createSubcontractAction, updateSubcontractAction } from "../../actions";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { Link } from "@/i18n/routing";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";


import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FormFooter } from "@/components/shared/forms/form-footer";
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

// Schema definition matching subcontracts table
const formSchema = z.object({
    title: z.string().min(1, "El título es requerido"),
    provider_id: z.string().min(1, "Debes seleccionar un proveedor"),
    amount_total: z.number().min(0).optional(),
    currency_id: z.string().min(1, "La moneda es requerida"),
    date: z.date().optional(),
    start_date: z.date().optional(),
    description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SubcontractsSubcontractFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: any; // To be typed properly later
    organizationId: string;
    projectId: string;
    // Data props
    providers?: { id: string; name: string; image?: string | null; fallback?: string }[];
    currencies?: { id: string; code: string; symbol: string; name: string }[];
    defaultCurrencyId?: string | null;
}

export function SubcontractsSubcontractForm({
    onSuccess,
    onCancel,
    initialData,
    organizationId,
    projectId,
    providers = [],
    currencies = [],
    defaultCurrencyId
}: SubcontractsSubcontractFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: initialData?.title || "",
            provider_id: initialData?.contact_id || initialData?.provider_id || undefined,
            amount_total: initialData?.amount_total || undefined,
            currency_id: initialData?.currency_id || defaultCurrencyId || undefined,
            date: initialData?.date ? new Date(initialData.date) : undefined,
            description: initialData?.notes || "",
        },
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            if (isEditing && initialData) {
                await updateSubcontractAction({
                    id: initialData.id,
                    project_id: projectId,
                    organization_id: organizationId,
                    contact_id: values.provider_id || null, // Ensure null if undefined
                    title: values.title,
                    amount_total: values.amount_total,
                    currency_id: values.currency_id,
                    date: values.date,
                    notes: values.description,
                    status: initialData.status
                });
                toast.success("Subcontrato actualizado");
            } else {
                await createSubcontractAction({
                    project_id: projectId,
                    organization_id: organizationId,
                    contact_id: values.provider_id || null,
                    title: values.title,
                    amount_total: values.amount_total,
                    currency_id: values.currency_id,
                    date: values.date,
                    notes: values.description,
                    status: 'draft'
                });
                toast.success("Subcontrato creado");
            }
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

                        {/* ROW 1: Date & Provider */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            {/* Provider */}
                            <FormField
                                control={form.control}
                                name="provider_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5">
                                            Subcontratista / Proveedor
                                            <TooltipProvider delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-help">
                                                            <HelpCircle className="h-3.5 w-3.5" />
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs text-sm [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2">
                                                        Puedes seleccionar cualquier contacto de la organización.
                                                        <br />
                                                        Si no existe, puedes crearlo en <Link href="/organization/contacts" target="_blank" className="font-medium">Contactos</Link>.
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </FormLabel>
                                        <Combobox
                                            options={providers.map(p => ({
                                                value: p.id,
                                                label: p.name,
                                                image: p.image,
                                                fallback: p.fallback
                                            }))}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="Seleccionar proveedor"
                                            searchPlaceholder="Buscar proveedor..."
                                            emptyMessage="No se encontró el proveedor."
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* ROW 2: Title */}
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

                        {/* ROW 3: Amount & Currency */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Currency */}
                            <FormField
                                control={form.control}
                                name="currency_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Moneda</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Moneda" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {currencies.map((currency) => (
                                                    <SelectItem key={currency.id} value={currency.id}>
                                                        {currency.name} ({currency.symbol})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Amount */}
                            <FormField
                                control={form.control}
                                name="amount_total"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monto Total</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                {...field}
                                                onChange={e => field.onChange(e.target.valueAsNumber)}
                                                value={field.value || ''}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* ROW 4: Notes/Description */}
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
