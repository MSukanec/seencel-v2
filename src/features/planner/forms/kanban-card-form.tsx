"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useCallback } from "react";
import { toast } from "sonner";
import { parseDateFromDB, formatDateForDB } from "@/lib/timezone-data";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { DateField, NotesField, TextField, UploadField, AssignedToField } from "@/components/shared/forms/fields";
import { ActiveProjectField } from "@/components/shared/forms/fields/active-project-field";
import type { UploadedFile } from "@/hooks/use-file-upload";
import { useModal } from "@/stores/modal-store";
import { createCard, updateCard } from "@/features/planner/actions";
import { PRIORITY_CONFIG, KanbanPriority, KanbanCard, KanbanMember } from "@/features/planner/types";
import { Project } from "@/types/project";

interface FormValues {
    title: string;
    description?: string | null;
    priority: KanbanPriority | 'none';
    start_date?: string | null;
    due_date?: string | null;
    estimated_hours: number | null | undefined;
    assigned_to?: string | null;
    cover_image_url?: string | null;
    project_id?: string | null;
}

const formSchema = z.object({
    title: z.string().min(1, "El título es obligatorio"),
    description: z.string().optional().nullable(),
    priority: z.enum(['urgent', 'high', 'medium', 'low', 'none']),
    start_date: z.string().optional().nullable(),
    due_date: z.string().optional().nullable(),
    estimated_hours: z.preprocess((val) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string' && val !== "") return Number(val);
        return null;
    }, z.number().min(0).optional().nullable()),
    assigned_to: z.string().optional().nullable(),
    cover_image_url: z.string().optional().nullable(),
    project_id: z.string().optional().nullable(),
});

interface KanbanCardFormProps {
    organizationId: string;
    boardId: string;
    listId: string;
    projectId?: string | null;
    projects?: Project[];
    members?: KanbanMember[];
    initialData?: KanbanCard;
    onSuccess?: (card: KanbanCard) => void;
    /** Called BEFORE server response for optimistic UI */
    onOptimisticCreate?: (tempCard: KanbanCard) => void;
    onOptimisticUpdate?: (card: KanbanCard) => void;
    onRollback?: () => void;
    /** Whether the organization can invite members (Teams plan) */
    isTeamsEnabled?: boolean;
}

export function KanbanCardForm({ organizationId, boardId, listId, projectId, projects = [], members = [], initialData, onSuccess, onOptimisticCreate, onOptimisticUpdate, onRollback, isTeamsEnabled = false }: KanbanCardFormProps) {
    const [isPending, startTransition] = useTransition();
    const { closeModal } = useModal();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema as any),
        defaultValues: {
            title: initialData?.title || "",
            description: initialData?.description || "",
            priority: (initialData?.priority as any) || "none",
            start_date: initialData?.start_at ? formatDateForDB(parseDateFromDB(initialData.start_at)!) : "",
            due_date: initialData?.due_at ? formatDateForDB(parseDateFromDB(initialData.due_at)!) : "",
            estimated_hours: initialData?.estimated_hours ?? null,
            assigned_to: initialData?.assigned_to || "none",
            cover_image_url: initialData?.cover_image_url || null,
            project_id: initialData?.project_id || projectId || "none",
        },
    });

    // Convert cover_image_url string to UploadedFile for UploadField
    const coverUrl = form.watch('cover_image_url');
    const coverValue: UploadedFile | null = coverUrl
        ? { id: 'existing-cover', url: coverUrl, path: '', name: 'Portada', type: 'image/jpeg', size: 0, bucket: 'kanban-covers' }
        : null;

    const handleCoverChange = useCallback((file: UploadedFile | UploadedFile[] | null) => {
        // Defer to avoid "Cannot update component while rendering" error
        queueMicrotask(() => {
            if (file && !Array.isArray(file)) {
                form.setValue('cover_image_url', file.url);
            } else {
                form.setValue('cover_image_url', null);
            }
        });
    }, [form]);


    async function onSubmit(values: FormValues) {
        const selectedProjectId = values.project_id === "none" ? null : (values.project_id || null);

        const cardData = {
            title: values.title,
            description: values.description || null,
            priority: values.priority as KanbanPriority,
            due_at: values.due_date || null,
            start_at: values.start_date || null,
            estimated_hours: null,
            assigned_to: (values.assigned_to === "none" ? null : values.assigned_to) || null,
            cover_image_url: values.cover_image_url || null,
        };

        if (initialData) {
            // Optimistic update - execute immediately
            const optimisticCard: KanbanCard = {
                ...initialData,
                ...cardData,
            };
            onOptimisticUpdate?.(optimisticCard);
            closeModal();

            startTransition(async () => {
                try {
                    const result = await updateCard(initialData.id, cardData);
                    toast.success("Tarjeta actualizada");
                    onSuccess?.(result);
                } catch (error) {
                    console.error(error);
                    onRollback?.();
                    toast.error("Error al actualizar la tarjeta");
                }
            });
        } else {
            // Optimistic create - execute immediately
            const tempId = `temp-${Date.now()}`;
            const tempCard: KanbanCard = {
                id: tempId,
                organization_id: organizationId,
                item_type: 'task',
                list_id: listId,
                board_id: boardId,
                title: cardData.title,
                description: cardData.description,
                color: null,
                position: 9999,
                status: 'todo',
                priority: cardData.priority,
                start_at: cardData.start_at,
                due_at: cardData.due_at,
                end_at: null,
                is_all_day: true,
                timezone: 'America/Argentina/Buenos_Aires',
                is_completed: false,
                completed_at: null,
                is_archived: false,
                archived_at: null,
                is_deleted: false,
                deleted_at: null,
                cover_color: null,
                cover_image_url: cardData.cover_image_url || null,
                estimated_hours: cardData.estimated_hours,
                actual_hours: null,
                assigned_to: cardData.assigned_to,
                location: null,
                recurrence_rule: null,
                recurrence_end_at: null,
                parent_item_id: null,
                source_type: null,
                source_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: null,
                updated_by: null,
                project_id: selectedProjectId,
            };
            onOptimisticCreate?.(tempCard);
            closeModal();

            startTransition(async () => {
                try {
                    const result = await createCard({
                        organization_id: organizationId,
                        item_type: 'task',
                        board_id: boardId,
                        list_id: listId,
                        project_id: selectedProjectId,
                        ...cardData
                    });
                    toast.success("Tarjeta creada");
                    onSuccess?.(result);
                } catch (error) {
                    console.error(error);
                    onRollback?.();
                    toast.error("Error al crear la tarjeta");
                }
            });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full min-h-0">
                <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Project Selector - Only visible when accessing from organization (not project) */}
                    {!projectId && (
                        <ActiveProjectField
                            value={form.watch("project_id") === "none" ? "" : (form.watch("project_id") || "")}
                            onChange={(val) => form.setValue("project_id", val || "none")}
                            projects={projects.map(p => ({
                                id: p.id,
                                name: p.name,
                                color: p.custom_color_hex || null,
                                image_url: p.image_url || null,
                            }))}
                            label="Proyecto"
                            required={false}
                            allowNone
                            noneLabel="Sin proyecto"
                            placeholder="Seleccionar proyecto..."
                        />
                    )}

                    {/* Título */}
                    <TextField
                        label="Título"
                        value={form.watch("title") || ""}
                        onChange={(val) => form.setValue("title", val)}
                        placeholder="¿Qué hay que hacer?"
                        autoFocus
                        required
                    />

                    {/* Prioridad / Asignado a */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control as any}
                            name="priority"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Prioridad</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                                                <SelectItem key={key} value={key}>
                                                    <span className={config.color}>
                                                        {config.label}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <AssignedToField
                            value={form.watch("assigned_to")}
                            onChange={(val) => form.setValue("assigned_to", val)}
                            members={members}
                            isTeamsEnabled={isTeamsEnabled}
                        />
                    </div>

                    {/* Fecha inicio / Fecha límite */}
                    <div className="grid grid-cols-2 gap-4">
                        <DateField
                            label="Fecha inicio"
                            value={form.watch("start_date") ? parseDateFromDB(form.watch("start_date")!) ?? undefined : undefined}
                            onChange={(date) => form.setValue("start_date", date ? formatDateForDB(date) : null)}
                            required={false}
                        />

                        <DateField
                            label="Fecha límite"
                            value={form.watch("due_date") ? parseDateFromDB(form.watch("due_date")!) ?? undefined : undefined}
                            onChange={(date) => form.setValue("due_date", date ? formatDateForDB(date) : null)}
                            required={false}
                        />
                    </div>

                    {/* Descripción */}
                    <NotesField
                        label="Descripción"
                        value={form.watch("description") || ""}
                        onChange={(val) => form.setValue("description", val || null)}
                        placeholder="Detalles adicionales (opcional)"
                        rows={3}
                    />

                    {/* Portada */}
                    <UploadField
                        label="Portada"
                        mode="single-image"
                        value={coverValue}
                        onChange={handleCoverChange}
                        bucket="kanban-covers"
                        folderPath={`${boardId}`}
                        compressionPreset="project-cover"
                        required={false}
                    />
                </div>

                <div className="flex items-center gap-2 mt-6">
                    <div className="flex-1">
                        <FormFooter
                            className="-mx-4 -mb-4"
                            onCancel={closeModal}
                            isLoading={isPending}
                            submitLabel={initialData ? "Guardar Cambios" : "Crear Tarjeta"}
                        />
                    </div>
                </div>
            </form>
        </Form>
    );
}

