"use client";

/**
 * Planner — Unified Item Form (Panel)
 * Hybrid Chip Form — Linear-inspired
 *
 * Handles both events and tasks in a single form.
 * Layout:
 * ┌─────────────────────────────────┐
 * │ Header (icon + title + desc)    │ ← setPanelMeta
 * ├─────────────────────────────────┤
 * │ ChipRow: Project, Dates, Time  │
 * │          Location, Color,       │
 * │          Priority, AssignedTo   │
 * │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
 * │ Title (borderless, prominent)   │ ← Main field
 * │ Notes (borderless)             │
 * │ Cover Image (dropzone)         │
 * ├─────────────────────────────────┤
 * │ Footer (cancel + submit)        │ ← Panel footer
 * └─────────────────────────────────┘
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarDays, ImageIcon, X, Loader2, User } from "lucide-react";
import { usePanel } from "@/stores/panel-store";
import { useFileUpload, type UploadedFile } from "@/hooks/use-file-upload";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { toast } from "sonner";
import { FormHeroField } from "@/components/shared/forms/fields/form-hero-field";
import { FormNotesField } from "@/components/shared/forms/fields/form-notes-field";
import {
    ChipRow,
    DateTimeRangeChip,
    ColorChip,
    LocationChip,
    ProjectChip,
    SelectChip,
} from "@/components/shared/chips";
import { cn } from "@/lib/utils";

import { PlannerItem, PRIORITY_CONFIG, PlannerMember } from "@/features/planner/types";
import { createItem, updateItem } from "@/features/planner/actions";


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
    priority: z.string().default("none"),
    assigned_to: z.string().optional().nullable(),
    cover_image_url: z.string().optional().nullable(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

// ============================================================================
// PRIORITY OPTIONS
// ============================================================================

const PRIORITY_OPTIONS = Object.entries(PRIORITY_CONFIG).map(([key, config]) => ({
    value: key,
    label: config.label,
}));

// ============================================================================
// COMPONENT
// ============================================================================

interface CalendarEventFormProps {
    organizationId: string;
    projectId?: string | null;
    initialData?: PlannerItem | null;
    defaultDate?: Date;
    /** Board ID for auto-assigning kanban position */
    boardId?: string | null;
    /** List ID for auto-assigning kanban column */
    listId?: string | null;
    /** Available members for assignment */
    members?: PlannerMember[];
    /** Whether Teams plan is enabled (for assignment chip) */
    isTeamsEnabled?: boolean;
    onSuccess?: (item: PlannerItem) => void;
    onOptimisticCreate?: (tempItem: PlannerItem) => void;
    onOptimisticUpdate?: (item: PlannerItem) => void;
    onRollback?: () => void;
    onCancel?: () => void;
    formId?: string;
}

export function CalendarEventForm({
    organizationId,
    projectId,
    initialData,
    defaultDate,
    boardId,
    listId,
    members = [],
    isTeamsEnabled = false,
    onSuccess,
    onOptimisticCreate,
    onOptimisticUpdate,
    onRollback,
    onCancel,
    formId,
}: CalendarEventFormProps) {
    const { closePanel, setPanelMeta } = usePanel();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    // 🚨 OBLIGATORIO: Self-describe panel header + footer
    useEffect(() => {
        setPanelMeta({
            icon: CalendarDays,
            title: isEditing ? "Editar Actividad" : "Nueva Actividad",
            description: isEditing
                ? `Modificando "${initialData?.title || 'actividad'}"`
                : "Completá los campos para crear una nueva actividad",
            size: "md",
            footer: {
                submitLabel: isEditing ? "Guardar" : "Crear actividad",
            }
        });
    }, [isEditing, setPanelMeta, initialData?.title]);

    // ── Form state ───────────────────────────────────────────────────
    const getInitialValues = (): EventFormValues => {
        if (initialData) {
            const startDate = initialData.start_at ? new Date(initialData.start_at) : new Date();
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
                priority: initialData.priority || "none",
                assigned_to: initialData.assigned_to || null,
                cover_image_url: initialData.cover_image_url || null,
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
            priority: "none",
            assigned_to: null,
            cover_image_url: null,
        };
    };

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventFormSchema) as any,
        defaultValues: getInitialValues(),
    });

    const isAllDay = form.watch("is_all_day");

    // ── Cover Image Upload ───────────────────────────────────────────
    const [coverImage, setCoverImage] = useState<UploadedFile | null>(
        initialData?.cover_image_url
            ? { id: "existing", url: initialData.cover_image_url, path: "", name: "", type: "image/*", size: 0, bucket: "social-assets" }
            : null
    );

    const {
        activeUploads,
        completedFiles,
        addFiles,
        removeFile,
        initFiles,
        clearAll,
    } = useFileUpload({
        bucket: "social-assets",
        folderPath: `cover/planner/${organizationId}`,
        maxSizeMB: 10,
        compressionPreset: "project-cover",
        onFilesChange: (files) => {
            const url = files.length > 0 ? files[files.length - 1].url : null;
            setCoverImage(files.length > 0 ? files[files.length - 1] : null);
            form.setValue("cover_image_url", url);
        },
    });

    // Sync existing image on mount
    useEffect(() => {
        if (coverImage && completedFiles.length === 0) {
            initFiles([coverImage]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (files) => addFiles(files.slice(0, 1)),
        maxSize: 10 * 1024 * 1024,
        accept: { "image/*": [] },
        multiple: false,
    });

    const hasImage = completedFiles.length > 0;
    const isUploading = activeUploads.length > 0;

    // ── Member options for chip ──────────────────────────────────────
    const memberOptions = useMemo(() =>
        members.map(m => ({
            value: m.id,
            label: m.full_name || "Sin nombre",
            icon: <User className="h-3.5 w-3.5 text-muted-foreground" />,
        })),
        [members]
    );

    // ── Submit ───────────────────────────────────────────────────────
    async function onSubmit(values: EventFormValues) {
        setIsLoading(true);
        try {
            // Build start_at datetime
            let startAt: string;
            if (values.is_all_day) {
                const d = new Date(values.start_date);
                d.setHours(0, 0, 0, 0);
                startAt = d.toISOString();
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

            const assignedTo = values.assigned_to === "none" ? null : (values.assigned_to || null);

            if (isEditing && initialData) {
                // Optimistic update
                const optimisticEvent: PlannerItem = {
                    ...initialData,
                    title: values.title,
                    project_id: values.project_id || null,
                    description: values.description || null,
                    location: values.location || null,
                    color: values.color,
                    start_at: startAt,
                    end_at: endAt,
                    is_all_day: values.is_all_day,
                    priority: values.priority as any,
                    assigned_to: assignedTo,
                    cover_image_url: values.cover_image_url || null,
                };
                onOptimisticUpdate?.(optimisticEvent);
                closePanel();

                const result = await updateItem(initialData.id, {
                    title: values.title,
                    project_id: values.project_id || null,
                    description: values.description || null,
                    location: values.location || null,
                    color: values.color,
                    start_at: startAt,
                    end_at: endAt,
                    is_all_day: values.is_all_day,
                    priority: values.priority as any,
                    assigned_to: assignedTo,
                    cover_image_url: values.cover_image_url || null,
                });
                toast.success("Actividad actualizada");
                onSuccess?.(result);
            } else {
                // Create optimistic item
                const tempId = `temp-${Date.now()}`;
                const tempEvent: PlannerItem = {
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
                    priority: (values.priority as any) || 'none',
                    is_completed: false,
                    completed_at: null,
                    estimated_hours: null,
                    actual_hours: null,
                    assigned_to: assignedTo,
                    source_type: null,
                    source_id: null,
                    recurrence_rule: null,
                    recurrence_end_at: null,
                    parent_item_id: null,
                    cover_image_url: values.cover_image_url || null,
                    cover_color: null,
                    board_id: boardId || null,
                    list_id: listId || null,
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
                closePanel();

                const result = await createItem({
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
                    priority: values.priority as any,
                    assigned_to: assignedTo,
                    cover_image_url: values.cover_image_url || null,
                    // Kanban positioning — auto-assigned by action if not provided
                    board_id: boardId || undefined,
                    list_id: listId || undefined,
                });
                toast.success("Actividad creada");
                onSuccess?.(result);
            }
        } catch (error) {
            console.error("Error saving item:", error);
            onRollback?.();
            toast.error(error instanceof Error ? error.message : "Error al guardar la actividad");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
            {/* ── Chips: Dates + metadata ─────────────── */}
            <ChipRow>
                <ProjectChip
                    value={form.watch("project_id") ?? null}
                    onChange={(val) => form.setValue("project_id", val)}
                    allowNone
                    noneLabel="Sin proyecto (Global)"
                />
                <DateTimeRangeChip
                    startDate={form.watch("start_date")}
                    endDate={form.watch("end_date") || null}
                    startTime={form.watch("start_time") || "00:00"}
                    endTime={form.watch("end_time") || "00:00"}
                    isAllDay={isAllDay}
                    onStartDateChange={(d) => d && form.setValue("start_date", d)}
                    onEndDateChange={(d) => form.setValue("end_date", d)}
                    onStartTimeChange={(t) => form.setValue("start_time", t)}
                    onEndTimeChange={(t) => form.setValue("end_time", t)}
                    onAllDayChange={(val) => form.setValue("is_all_day", val)}
                />
                <LocationChip
                    value={form.watch("location") || ""}
                    onChange={(val) => form.setValue("location", val)}
                />
                <ColorChip
                    value={form.watch("color")}
                    onChange={(val) => form.setValue("color", val)}
                />
                <SelectChip
                    value={form.watch("priority") || "none"}
                    onChange={(val) => form.setValue("priority", val)}
                    options={PRIORITY_OPTIONS}
                    emptyLabel="Prioridad"
                    searchPlaceholder="Buscar prioridad..."
                    popoverWidth={180}
                />
                {memberOptions.length > 0 && (
                    <SelectChip
                        value={form.watch("assigned_to") || ""}
                        onChange={(val) => form.setValue("assigned_to", val || null)}
                        options={memberOptions}
                        icon={<User className="h-3.5 w-3.5 text-muted-foreground" />}
                        emptyLabel="Asignar"
                        searchPlaceholder="Buscar miembro..."
                        popoverWidth={220}
                    />
                )}
            </ChipRow>

            {/* ── Hero: Title ─────────────────────────── */}
            <FormHeroField
                value={form.watch("title") || ""}
                onChange={(val) => form.setValue("title", val)}
                placeholder="Nombre de la actividad..."
                autoFocus
            />

            {/* ── Notes (borderless, below hero) ──────── */}
            <FormNotesField
                value={form.watch("description") || ""}
                onChange={(val) => form.setValue("description", val)}
                placeholder="Notas adicionales..."
            />

            {/* ── Cover Image ─────────────────────────── */}
            <div className="-mx-5 mt-4">
                {isUploading ? (
                    <div className="flex items-center justify-center gap-2 py-8 bg-muted/30">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Subiendo imagen...</span>
                    </div>
                ) : hasImage ? (
                    <div className="group relative w-full aspect-[16/7] overflow-hidden cursor-pointer" {...getRootProps()}>
                        <input {...getInputProps()} />
                        <Image
                            src={completedFiles[completedFiles.length - 1].url}
                            alt="Portada de la actividad"
                            fill
                            className="object-cover"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(completedFiles[completedFiles.length - 1].id);
                                }}
                                className="p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        {...getRootProps()}
                        className={cn(
                            "relative w-full aspect-[16/7] overflow-hidden cursor-pointer transition-all group/dropzone",
                            "mx-4 rounded-lg border border-dashed border-border/50 group-hover/dropzone:border-border/70",
                            isDragActive ? "bg-primary/5 border-primary/30" : "bg-transparent"
                        )}
                        style={{ width: "calc(100% - 2rem)" }}
                    >
                        <input {...getInputProps()} />
                        {/* Soft ambient glow */}
                        <div
                            className="absolute inset-0 opacity-[0.025] group-hover/dropzone:opacity-[0.05] transition-opacity duration-500"
                            style={{
                                background: `
                                    radial-gradient(ellipse 80% 60% at 50% 50%, currentColor 0%, transparent 70%),
                                    radial-gradient(ellipse 40% 80% at 20% 60%, currentColor 0%, transparent 60%),
                                    radial-gradient(ellipse 40% 80% at 80% 40%, currentColor 0%, transparent 60%)
                                `,
                            }}
                        />
                        {/* Center content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                            <ImageIcon className="h-8 w-8 text-muted-foreground/15 group-hover/dropzone:text-muted-foreground/30 transition-colors duration-300" />
                            <span className="text-xs text-muted-foreground/15 group-hover/dropzone:text-muted-foreground/30 transition-colors duration-300">
                                Agregar portada
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </form>
    );
}
