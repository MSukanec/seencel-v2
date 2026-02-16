"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDateForDB } from "@/lib/timezone-data";
import { Link } from "@/i18n/routing";

import { createProjectLabor, updateProjectLabor } from "../actions";
import { ProjectLaborView, LaborType, LaborStatus, LABOR_STATUS_LABELS } from "../types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FormFooter } from "@/components/shared/forms/form-footer";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

// Schema definition matching project_labor table
const formSchema = z.object({
    contact_id: z.string().min(1, "Debes seleccionar un trabajador"),
    labor_type_id: z.string().optional().nullable(),
    status: z.enum(["active", "absent", "inactive"]),
    start_date: z.date().optional().nullable(),
    end_date: z.date().optional().nullable(),
    notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface ContactOption {
    id: string;
    name: string;
    image?: string | null;
    fallback?: string;
}

interface LaborWorkerFormProps {
    initialData?: ProjectLaborView | null;
    contacts: ContactOption[];
    laborTypes: LaborType[];
    projectId?: string;
    organizationId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function LaborWorkerForm({
    initialData,
    contacts,
    laborTypes,
    projectId,
    organizationId,
    onSuccess,
    onCancel,
}: LaborWorkerFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            contact_id: initialData?.contact_id || "",
            labor_type_id: initialData?.labor_type_id || undefined,
            status: (initialData?.status as LaborStatus) || "active",
            start_date: initialData?.start_date ? new Date(initialData.start_date) : undefined,
            end_date: initialData?.end_date ? new Date(initialData.end_date) : undefined,
            notes: initialData?.notes || "",
        },
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            if (isEditing && initialData) {
                const result = await updateProjectLabor({
                    id: initialData.id,
                    project_id: projectId!,
                    contact_id: values.contact_id,
                    labor_type_id: values.labor_type_id || null,
                    status: values.status,
                    start_date: formatDateForDB(values.start_date),
                    end_date: formatDateForDB(values.end_date),
                    notes: values.notes || null,
                });

                if (!result.success) {
                    throw new Error(result.error);
                }
                toast.success("Trabajador actualizado");
            } else {
                const result = await createProjectLabor({
                    project_id: projectId!,
                    organization_id: organizationId,
                    contact_id: values.contact_id,
                    labor_type_id: values.labor_type_id || null,
                    status: values.status,
                    start_date: formatDateForDB(values.start_date),
                    end_date: formatDateForDB(values.end_date),
                    notes: values.notes || null,
                });

                if (!result.success) {
                    throw new Error(result.error);
                }
                toast.success("Trabajador agregado al proyecto");
            }
            onSuccess?.();
        } catch (error) {
            console.error(error);
            toast.error("Error", {
                description: error instanceof Error ? error.message : "No se pudo guardar el trabajador.",
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
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-4">

                        {/* ROW 1: Contact Selection */}
                        <FormField
                            control={form.control}
                            name="contact_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        Trabajador
                                        <TooltipProvider delayDuration={0}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-help">
                                                        <HelpCircle className="h-3.5 w-3.5" />
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs text-sm [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2">
                                                    Seleccioná un contacto existente de la organización.
                                                    <br />
                                                    Si no existe, podés crearlo en <Link href="/organization/contacts" target="_blank" className="font-medium">Contactos</Link>.
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </FormLabel>
                                    <Combobox
                                        options={contacts.map(c => ({
                                            value: c.id,
                                            label: c.name,
                                            image: c.image,
                                            fallback: c.fallback
                                        }))}
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        placeholder="Seleccionar trabajador"
                                        searchPlaceholder="Buscar por nombre..."
                                        emptyMessage="No se encontró el contacto."
                                        disabled={isEditing} // Can't change contact when editing
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* ROW 2: Labor Type & Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Labor Type */}
                            <FormField
                                control={form.control}
                                name="labor_type_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Trabajo</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value || undefined}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {laborTypes.map((lt) => (
                                                    <SelectItem key={lt.id} value={lt.id}>
                                                        {lt.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Status */}
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Estado" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.entries(LABOR_STATUS_LABELS).map(([value, label]) => (
                                                    <SelectItem key={value} value={value}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* ROW 3: Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Start Date */}
                            <FormField
                                control={form.control}
                                name="start_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Fecha de Inicio</FormLabel>
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
                                                    selected={field.value || undefined}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* End Date */}
                            <FormField
                                control={form.control}
                                name="end_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Fecha de Fin</FormLabel>
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
                                                            <span>Sin fecha de fin</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value || undefined}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* ROW 4: Notes */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Notas adicionales sobre el trabajador..."
                                            className="resize-none min-h-[80px]"
                                            {...field}
                                            value={field.value || ""}
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
                    submitLabel={isEditing ? "Guardar Cambios" : "Agregar Trabajador"}
                    onCancel={onCancel}
                />
            </form>
        </Form>
    );
}
