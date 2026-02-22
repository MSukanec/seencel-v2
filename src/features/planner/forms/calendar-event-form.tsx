"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { parseDateFromDB, formatDateTimeForDB } from "@/lib/timezone-data";

import { FormFooter } from "@/components/shared/forms/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DateField, NotesField, TimeField, TextField, SwitchField } from "@/components/shared/forms/fields";
import { ActiveProjectField, type ActiveProject } from "@/components/shared/forms/fields/active-project-field";

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
            const startDate = parseDateFromDB(initialData.start_at) ?? new Date();
            const endDate = initialData.end_at ? parseDateFromDB(initialData.end_at) ?? null : null;

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
                startAt = formatDateTimeForDB(new Date(values.start_date.setHours(0, 0, 0, 0))) ?? new Date().toISOString();
            } else {
                const [hours, minutes] = (values.start_time || "00:00").split(":").map(Number);
                const startDate = new Date(values.start_date);
                startDate.setHours(hours, minutes, 0, 0);
                startAt = formatDateTimeForDB(startDate) ?? new Date().toISOString();
            }

            // Build end_at datetime (optional)
            let endAt: string | null = null;
            if (values.end_date) {
                if (values.is_all_day) {
                    const endDate = new Date(values.end_date);
                    endDate.setHours(23, 59, 59, 999);
                    endAt = formatDateTimeForDB(endDate);
                } else {
                    const [hours, minutes] = (values.end_time || "23:59").split(":").map(Number);
                    const endDate = new Date(values.end_date);
                    endDate.setHours(hours, minutes, 0, 0);
                    endAt = formatDateTimeForDB(endDate);
                }
            }

            if (isEditing && initialData) {
                // Optimistic update
                const optimisticEvent: CalendarEvent = {
                    ...initialData,
                    title: values.title,
                    project_id: values.project_id || null,
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
                    project_id: values.project_id || null,
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
                    item_type: 'event',
                    title: values.title,
                    description: values.description || null,
                    location: values.location || null,
                    color: values.color,
                    start_at: startAt,
                    due_at: null,
                    end_at: endAt,
                    is_all_day: values.is_all_day,
                    timezone: 'America/Argentina/Buenos_Aires',
                    status: 'todo',
                    priority: 'none',
                    is_completed: false,
                    completed_at: null,
                    estimated_hours: null,
                    actual_hours: null,
                    assigned_to: null,
                    source_type: null,
                    source_id: null,
                    recurrence_rule: null,
                    recurrence_end_at: null,
                    parent_item_id: null,
                    cover_image_url: null,
                    cover_color: null,
                    board_id: null,
                    list_id: null,
                    position: 0,
                    is_archived: false,
                    archived_at: null,
                    is_deleted: false,
                    deleted_at: null,
                    created_by: null,
                    updated_by: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                onOptimisticCreate?.(tempEvent);
                onCancel?.(); // Close modal

                const result = await createCalendarEvent({
                    organization_id: organizationId,
                    item_type: 'event',
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
                    <TextField
                        label="Título"
                        value={form.watch("title") || ""}
                        onChange={(val) => form.setValue("title", val)}
                        placeholder="Reunión de proyecto..."
                        error={form.formState.errors.title?.message}
                    />

                    {/* Project + Color (inline) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ActiveProjectField
                            value={form.watch("project_id") || ""}
                            onChange={(val) => form.setValue("project_id", val || null)}
                            projects={(projects || []).map(p => ({
                                id: p.id,
                                name: p.name,
                                color: p.custom_color_hex || null,
                                image_url: p.image_url || null,
                            }))}
                            label="Proyecto (Opcional)"
                            required={false}
                            allowNone
                            noneLabel="Sin proyecto (Global)"
                            placeholder="Seleccionar proyecto..."
                        />

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
                    </div>

                    {/* All Day Toggle */}
                    <SwitchField
                        label="Todo el día"
                        description="El evento ocupa todo el día sin hora específica."
                        value={form.watch("is_all_day")}
                        onChange={(val) => form.setValue("is_all_day", val)}
                    />

                    {/* Start Date/Time */}
                    <div className={cn("grid gap-4", isAllDay ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
                        <DateField
                            label="Fecha inicio"
                            value={form.watch("start_date")}
                            onChange={(date) => date && form.setValue("start_date", date)}
                        />

                        {!isAllDay && (
                            <TimeField
                                label="Hora inicio"
                                value={form.watch("start_time") || "00:00"}
                                onChange={(val) => form.setValue("start_time", val)}
                            />
                        )}
                    </div>

                    {/* End Date/Time */}
                    <div className={cn("grid gap-4", isAllDay ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
                        <DateField
                            label="Fecha fin (opcional)"
                            value={form.watch("end_date") || undefined}
                            onChange={(date) => form.setValue("end_date", date || null)}
                            required={false}
                            placeholder="Sin fecha fin"
                        />

                        {!isAllDay && (
                            <TimeField
                                label="Hora fin"
                                value={form.watch("end_time") || "00:00"}
                                onChange={(val) => form.setValue("end_time", val)}
                            />
                        )}
                    </div>

                    {/* Location */}
                    <TextField
                        label="Ubicación"
                        value={form.watch("location") || ""}
                        onChange={(val) => form.setValue("location", val)}
                        placeholder="Oficina, Obra, etc."
                        icon={MapPin}
                        required={false}
                    />

                    {/* Description */}
                    <NotesField
                        label="Descripción"
                        value={form.watch("description") || ""}
                        onChange={(val) => form.setValue("description", val)}
                        placeholder="Notas adicionales..."
                        rows={3}
                    />
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
