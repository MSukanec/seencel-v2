"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/client-image-compression";
import { getStorageUrl } from "@/lib/storage-utils";
import { parseDateFromDB, formatDateForDB } from "@/lib/timezone-data";

import { Button } from "@/components/ui/button";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FormFooter } from "@/components/shared/forms/form-footer";
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
}

export function KanbanCardForm({ boardId, listId, projectId, projects = [], members = [], initialData, onSuccess, onOptimisticCreate, onOptimisticUpdate, onRollback }: KanbanCardFormProps) {
    const [isPending, startTransition] = useTransition();
    const { closeModal } = useModal();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema as any),
        defaultValues: {
            title: initialData?.title || "",
            description: initialData?.description || "",
            priority: (initialData?.priority as any) || "none",
            start_date: initialData?.start_date ? formatDateForDB(parseDateFromDB(initialData.start_date)!) : "",
            due_date: initialData?.due_date ? formatDateForDB(parseDateFromDB(initialData.due_date)!) : "",
            estimated_hours: initialData?.estimated_hours ?? null,
            assigned_to: initialData?.assigned_to || "none",
            cover_image_url: initialData?.cover_image_url || null,
            project_id: initialData?.project_id || projectId || "none",
        },
    });

    const [isUploading, setIsUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // Compress
            const compressedFile = await compressImage(file, 'project-cover');

            // Upload
            const supabase = createClient();
            const fileName = `${boardId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;

            const { error: uploadError } = await supabase.storage
                .from('kanban-covers')
                .upload(fileName, compressedFile as File);

            if (uploadError) throw uploadError;

            // Get URL
            const { data: { publicUrl } } = supabase.storage
                .from('kanban-covers')
                .getPublicUrl(fileName);

            form.setValue('cover_image_url', publicUrl);
            toast.success("Portada subida");
        } catch (error) {
            console.error(error);
            toast.error("Error al subir imagen");
        } finally {
            setIsUploading(false);
        }
    };


    async function onSubmit(values: FormValues) {
        startTransition(async () => {
            try {
                const selectedProjectId = values.project_id === "none" ? null : (values.project_id || null);

                const cardData = {
                    title: values.title,
                    description: values.description || null,
                    priority: values.priority as KanbanPriority,
                    due_date: values.due_date || null,
                    start_date: values.start_date || null,
                    estimated_hours: values.estimated_hours || null,
                    assigned_to: (values.assigned_to === "none" ? null : values.assigned_to) || null,
                    cover_image_url: values.cover_image_url || null,
                };

                if (initialData) {
                    // Optimistic update
                    const optimisticCard: KanbanCard = {
                        ...initialData,
                        ...cardData,
                    };
                    onOptimisticUpdate?.(optimisticCard);
                    closeModal();

                    const result = await updateCard(initialData.id, cardData);
                    toast.success("Tarjeta actualizada");
                    onSuccess?.(result);
                } else {
                    // Create with temporary ID for optimistic UI
                    const tempId = `temp-${Date.now()}`;
                    const tempCard: KanbanCard = {
                        id: tempId,
                        list_id: listId,
                        board_id: boardId,
                        title: cardData.title,
                        description: cardData.description,
                        position: 9999,
                        priority: cardData.priority,
                        due_date: cardData.due_date,
                        start_date: cardData.start_date,
                        is_completed: false,
                        completed_at: null,
                        is_archived: false,
                        cover_color: null,
                        cover_image_url: cardData.cover_image_url || null,
                        estimated_hours: cardData.estimated_hours,
                        actual_hours: null,
                        assigned_to: cardData.assigned_to,
                        created_at: new Date().toISOString(),
                        updated_at: null,
                        created_by: null,
                        project_id: selectedProjectId,
                    };
                    onOptimisticCreate?.(tempCard);
                    closeModal();

                    const result = await createCard({
                        board_id: boardId,
                        list_id: listId,
                        project_id: selectedProjectId,
                        ...cardData
                    });
                    toast.success("Tarjeta creada");
                    onSuccess?.(result);
                }
            } catch (error) {
                console.error(error);
                onRollback?.();
                toast.error(initialData ? "Error al actualizar la tarjeta" : "Error al crear la tarjeta");
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full min-h-0">
                <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Cover Image Section */}
                    <div className="space-y-2">
                        <FormLabel>Portada</FormLabel>
                        <div className="flex items-center gap-4">
                            {form.watch('cover_image_url') ? (
                                <div className="relative w-full h-32 rounded-lg overflow-hidden border group">
                                    <img
                                        src={form.watch('cover_image_url') || ""}
                                        alt="Cover"
                                        className="w-full h-full object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => form.setValue('cover_image_url', null)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                                    <label className="flex flex-col items-center cursor-pointer p-4 w-full">
                                        {isUploading ? (
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        ) : (
                                            <>
                                                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                                <span className="text-xs text-muted-foreground">Subir imagen</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Project Selector - Only visible when accessing from organization (not project) */}
                    {!projectId && (
                        <FormField
                            control={form.control as any}
                            name="project_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Proyecto</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || "none"}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sin proyecto" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Sin proyecto</SelectItem>
                                            {projects.map((project) => (
                                                <SelectItem key={project.id} value={project.id}>
                                                    {project.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control as any}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="¿Qué hay que hacer?"
                                            autoFocus
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control as any}
                            name="assigned_to"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Asignado a</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || "none"}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sin asignar" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Sin asignar</SelectItem>
                                            {members.map((member) => (
                                                <SelectItem key={member.id} value={member.id}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-4 w-4 rounded-full bg-muted overflow-hidden">
                                                            {member.avatar_url && (
                                                                <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
                                                            )}
                                                        </div>
                                                        {member.full_name || "Usuario"}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control as any}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descripción</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Detalles adicionales (opcional)"
                                        className="resize-none"
                                        rows={3}
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

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

                        <FormField
                            control={form.control as any}
                            name="start_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha inicio</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control as any}
                            name="due_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha límite</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control as any}
                            name="estimated_hours"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estimación (hs)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            placeholder="0"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
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

