"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLessonMarker, updateLessonMarker } from "@/actions/courses";
import { LessonMarker } from "@/types/courses";
import { useModal } from "@/providers/modal-store";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Textarea } from "@/components/ui/textarea";
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
}

export function MarkerForm({ mode, lessonId, timeSec = 0, initialData, onSuccess }: MarkerFormProps) {
    const { closeModal } = useModal();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<MarkerFormValues>({
        resolver: zodResolver(markerSchema),
        defaultValues: {
            body: initialData?.body || ""
        }
    });

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const onSubmit = async (values: MarkerFormValues) => {
        setIsSubmitting(true);
        try {
            if (mode === "create") {
                const result = await createLessonMarker(lessonId, values.body, timeSec);
                if (result.success) {
                    toast.success("Marcador guardado");
                    onSuccess?.(result.marker as LessonMarker);
                    closeModal();
                } else {
                    toast.error(result.error || "Error al guardar el marcador");
                }
            } else if (initialData) {
                const result = await updateLessonMarker(initialData.id, values.body);
                if (result.success) {
                    toast.success("Marcador actualizado");
                    onSuccess?.({ ...initialData, body: values.body });
                    closeModal();
                } else {
                    toast.error(result.error || "Error al actualizar el marcador");
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4">
                {mode === "create" && (
                    <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                        Marcador en <span className="font-mono font-medium">{formatTime(timeSec)}</span>
                    </div>
                )}

                <FormGroup label="Comentario" required>
                    <Textarea
                        {...form.register("body")}
                        placeholder="Escribe un comentario para este marcador..."
                        className="min-h-[100px] resize-none"
                        autoFocus
                    />
                    {form.formState.errors.body && (
                        <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.body.message}
                        </p>
                    )}
                </FormGroup>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isSubmitting}
                submitLabel={mode === "create" ? "Guardar Marcador" : "Actualizar"}
                onCancel={closeModal}
            />
        </form>
    );
}

