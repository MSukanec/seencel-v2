"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLessonMarker, updateLessonMarker } from "@/features/academy/student-actions";
import { LessonMarker } from "@/features/academy/types";
import { usePanel } from "@/stores/panel-store";
import { FormGroup } from "@/components/ui/form-group";
import { FormNotesField } from "@/components/shared/forms/fields/form-notes-field";
import { Clock } from "lucide-react";
import { toast } from "sonner";

const markerSchema = z.object({
    body: z.string().min(1, "El comentario es requerido").max(500, "Máximo 500 caracteres")
});

type MarkerFormValues = z.infer<typeof markerSchema>;

interface MarkerFormProps {
    mode: "create" | "edit";
    lessonId: string;
    timeSec?: number;
    initialData?: LessonMarker;
    onSuccess?: (marker?: LessonMarker) => void;
    formId?: string;
}

export function MarkerForm({ mode, lessonId, timeSec = 0, initialData, onSuccess, formId }: MarkerFormProps) {
    const { closePanel, setPanelMeta, setSubmitting } = usePanel();

    const form = useForm<MarkerFormValues>({
        resolver: zodResolver(markerSchema),
        defaultValues: {
            body: initialData?.body || ""
        }
    });

    useEffect(() => {
        setPanelMeta({
            title: mode === "create" ? "Agregar Marcador" : "Editar Marcador",
            description: mode === "create" ? "Guardá un momento importante de esta lección con un comentario" : "Modificá el comentario de este marcador",
            icon: Clock,
            size: "md",
            footer: {
                submitLabel: mode === "create" ? "Guardar Marcador" : "Actualizar",
            }
        });
    }, [mode, setPanelMeta]);

    const formattedTime = timeSec >= 3600 
           ? `${Math.floor(timeSec / 3600)} h ${Math.floor((timeSec % 3600) / 60)} min ${Math.floor(timeSec % 60)} s`
           : timeSec >= 60 
           ? `${Math.floor(timeSec / 60)} min ${Math.floor(timeSec % 60)} s`
           : `${Math.floor(timeSec)} s`;

    const onSubmit = async (values: MarkerFormValues) => {
        setSubmitting(true);
        try {
            if (mode === "create") {
                const result = await createLessonMarker(lessonId, values.body, timeSec);
                if (result.success) {
                    toast.success("Marcador guardado");
                    onSuccess?.(result.marker as LessonMarker);
                    closePanel();
                } else {
                    toast.error(result.error || "Error al guardar el marcador");
                }
            } else if (initialData) {
                const result = await updateLessonMarker(initialData.id, values.body);
                if (result.success) {
                    toast.success("Marcador actualizado");
                    onSuccess?.({ ...initialData, body: values.body });
                    closePanel();
                } else {
                    toast.error(result.error || "Error al actualizar el marcador");
                }
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-lg px-3 py-2 border border-primary/20">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>Marcador en <span className="font-semibold">{formattedTime}</span></span>
                </div>

                <FormGroup label="Comentario" required>
                    <div className="min-h-[100px] rounded-lg border border-border/50 bg-muted/30 px-3 py-2 focus-within:ring-1 focus-within:ring-ring focus-within:border-border transition-colors">
                        <FormNotesField
                            value={form.watch("body")}
                            onChange={(v) => form.setValue("body", v, { shouldValidate: true })}
                            placeholder="Ecribe un comentario para este marcador..."
                            rows={3}
                            className="bg-transparent"
                        />
                    </div>
                    {form.formState.errors.body && (
                        <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.body.message}
                        </p>
                    )}
                </FormGroup>
            </div>
        </form>
    );
}

