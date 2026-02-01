"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Clock, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { CalendarEvent, EVENT_COLORS } from "@/features/planner/types";
import { createCalendarEvent, updateCalendarEvent } from "@/features/planner/actions";
import { Project } from "@/types/project";

// ============================================================================
// SCHEMA
// ============================================================================

const eventFormSchema = z.object({
    title: z.string().min(1, "El título es requerido"),
    project_id: z.string().optional().nullable(),
    description: z.string().optional(),
    location: z.string().optional(),
    color: z.string().default("#3b82f6"),
    start_date: z.date(),
    start_time: z.string().optional(),
    end_date: z.date().optional().nullable(),
    end_time: z.string().optional(),
    is_all_day: z.boolean().default(false),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

// ============================================================================
// COMPONENT
// ============================================================================

interface CalendarEventFormProps {
    organizationId: string;
    projectId?: string | null;
    initialData?: CalendarEvent | null;
    defaultDate?: Date;
    onSuccess?: (event: CalendarEvent) => void;
    onOptimisticCreate?: (tempEvent: CalendarEvent) => void;
    onOptimisticUpdate?: (event: CalendarEvent) => void;
    onRollback?: () => void;
    onCancel?: () => void;
    projects?: Project[];
}

export function CalendarEventForm({
    organizationId,
    projectId,
    initialData,
    defaultDate,
    onSuccess,
    onOptimisticCreate,
    onOptimisticUpdate,
    onRollback,
    onCancel,
    projects
}: CalendarEventFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    // Determine initial values
    const getInitialValues = (): EventFormValues => {
        if (initialData) {
            const startDate = new Date(initialData.start_at);
            const endDate = initialData.end_at ? new Date(initialData.end_at) : null;

            return {
                title: initialData.title,
                project_id: initialData.project_id,
                description: initialData.description || "",
                location: initialData.location || "",
                color: initialData.color || "#3b82f6",
                start_date: startDate,
                start_time: initialData.is_all_day ? "" : format(startDate, "HH:mm"),
                end_date: endDate,
                end_time: endDate && !initialData.is_all_day ? format(endDate, "HH:mm") : "",
                is_all_day: initialData.is_all_day,
            };
        }

        const date = defaultDate || new Date();
        return {
            title: "",
            project_id: projectId || null,
            description: "",
            location: "",
            color: "#3b82f6",
            start_date: date,
            start_time: "",
            end_date: null,
            end_time: "",
            is_all_day: false,
        };
    };

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventFormSchema) as any,
        defaultValues: getInitialValues(),
    });

    const isAllDay = form.watch("is_all_day");

    async function onSubmit(values: EventFormValues) {
        setIsLoading(true);
        try {
            // Build start_at datetime
            let startAt: string;
            if (values.is_all_day) {
                startAt = new Date(values.start_date.setHours(0, 0, 0, 0)).toISOString();
            } else {
                const [hours, minutes] = (values.start_time || "00:00").split(":").map(Number);
                const startDate = new Date(values.start_date);
                startDate.setHours(hours, minutes, 0, 0);
                startAt = startDate.toISOString();
            }

            // Build end_at datetime (optional)
            let endAt: string | null = null;
            if (values.end_date) {
                if (values.is_all_day) {
                    const endDate = new Date(values.end_date);
                    endDate.setHours(23, 59, 59, 999);
                    endAt = endDate.toISOString();
                } else {
                    const [hours, minutes] = (values.end_time || "23:59").split(":").map(Number);
                    const endDate = new Date(values.end_date);
                    endDate.setHours(hours, minutes, 0, 0);
                    endAt = endDate.toISOString();
                }
            }

            if (isEditing && initialData) {
                // Optimistic update
                const optimisticEvent: CalendarEvent = {
                    ...initialData,
                    title: values.title,
                    description: values.description || null,
                    location: values.location || null,
                    color: values.color,
                    start_at: startAt,
                    end_at: endAt,
                    is_all_day: values.is_all_day,
                };
                onOptimisticUpdate?.(optimisticEvent);
                onCancel?.(); // Close modal

                const result = await updateCalendarEvent(initialData.id, {
                    title: values.title,
                    description: values.description || null,
                    location: values.location || null,
                    color: values.color,
                    start_at: startAt,
                    end_at: endAt,
                    is_all_day: values.is_all_day,
                });
                toast.success("Evento actualizado");
                onSuccess?.(result);
            } else {
                // Create optimistic event
                const tempId = `temp-${Date.now()}`;
                const tempEvent: CalendarEvent = {
                    id: tempId,
                    organization_id: organizationId,
                    project_id: values.project_id || projectId || null,
                    title: values.title,
                    description: values.description || null,
                    location: values.location || null,
                    color: values.color,
                    start_at: startAt,
                    end_at: endAt,
                    is_all_day: values.is_all_day,
                    timezone: 'America/Argentina/Buenos_Aires',
                    source_type: null,
                    source_id: null,
                    recurrence_rule: null,
                    recurrence_end_at: null,
                    parent_event_id: null,
                    status: 'scheduled',
                    created_by: null,
                    updated_by: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    deleted_at: null,
                };
                onOptimisticCreate?.(tempEvent);
                onCancel?.(); // Close modal

                const result = await createCalendarEvent({
                    organization_id: organizationId,
                    project_id: values.project_id || projectId,
                    title: values.title,
                    description: values.description || null,
                    location: values.location || null,
                    color: values.color,
                    start_at: startAt,
                    end_at: endAt,
                    is_all_day: values.is_all_day,
                });
                toast.success("Evento creado");
                onSuccess?.(result);
            }
        } catch (error) {
            console.error("Error saving event:", error);
            onRollback?.();
            toast.error(error instanceof Error ? error.message : "Error al guardar el evento");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col max-h-full min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                <div className="space-y-4">
                    {/* Title */}
                    <FormGroup label="Título" error={form.formState.errors.title?.message}>
                        <Input
                            placeholder="Reunión de proyecto..."
                            {...form.register("title")}
                        />
                    </FormGroup>

                    {/* Project Selector (Optional) */}
                    <FormGroup label="Proyecto (Opcional)">
                        <Select
                            value={form.watch("project_id") || "none"}
                            onValueChange={(val) => form.setValue("project_id", val === "none" ? null : val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar proyecto..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sin proyecto (Global)</SelectItem>
                                {projects?.map((project) => (
                                    <SelectItem key={project.id} value={project.id}>
                                        <div className="flex items-center gap-2">
                                            {project.custom_color_hex && (
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: project.custom_color_hex }}
                                                />
                                            )}
                                            {project.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    {/* All Day Toggle */}
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base text-foreground">Todo el día</Label>
                            <p className="text-sm text-muted-foreground">
                                El evento ocupa todo el día sin hora específica.
                            </p>
                        </div>
                        <Switch
                            checked={form.watch("is_all_day")}
                            onCheckedChange={(val) => form.setValue("is_all_day", val)}
                        />
                    </div>

                    {/* Start Date/Time */}
                    <div className={cn("grid gap-4", isAllDay ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
                        <FormGroup label="Fecha inicio">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !form.watch("start_date") && "text-muted-foreground"
                                        )}
                                    >
                                        {form.watch("start_date") ? (
                                            format(form.watch("start_date"), "PPP", { locale: es })
                                        ) : (
                                            <span>Seleccionar fecha</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={form.watch("start_date")}
                                        onSelect={(date) => date && form.setValue("start_date", date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </FormGroup>

                        {!isAllDay && (
                            <FormGroup label="Hora inicio">
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="time"
                                        className="pl-10"
                                        {...form.register("start_time")}
                                    />
                                </div>
                            </FormGroup>
                        )}
                    </div>

                    {/* End Date/Time */}
                    <div className={cn("grid gap-4", isAllDay ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
                        <FormGroup label="Fecha fin (opcional)">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !form.watch("end_date") && "text-muted-foreground"
                                        )}
                                    >
                                        {form.watch("end_date") ? (
                                            format(form.watch("end_date")!, "PPP", { locale: es })
                                        ) : (
                                            <span>Sin fecha fin</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={form.watch("end_date") || undefined}
                                        onSelect={(date) => form.setValue("end_date", date || null)}
                                        disabled={(date) => date < form.watch("start_date")}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </FormGroup>

                        {!isAllDay && (
                            <FormGroup label="Hora fin">
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="time"
                                        className="pl-10"
                                        {...form.register("end_time")}
                                    />
                                </div>
                            </FormGroup>
                        )}
                    </div>

                    {/* Location */}
                    <FormGroup label="Ubicación">
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Oficina, Obra, etc."
                                className="pl-10"
                                {...form.register("location")}
                            />
                        </div>
                    </FormGroup>

                    {/* Color */}
                    <FormGroup label="Color">
                        <Select
                            onValueChange={(val) => form.setValue("color", val)}
                            value={form.watch("color")}
                        >
                            <SelectTrigger>
                                <SelectValue>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: form.watch("color") }}
                                        />
                                        {EVENT_COLORS.find(c => c.value === form.watch("color"))?.name || "Azul"}
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {EVENT_COLORS.map((color) => (
                                    <SelectItem key={color.value} value={color.value}>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: color.value }}
                                            />
                                            {color.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    {/* Description */}
                    <FormGroup label="Descripción">
                        <Textarea
                            placeholder="Notas adicionales..."
                            className="min-h-[80px] resize-none"
                            {...form.register("description")}
                        />
                    </FormGroup>
                </div>
            </div>

            <FormFooter
                submitLabel={isEditing ? "Guardar" : "Crear evento"}
                isLoading={isLoading}
                onCancel={onCancel}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
