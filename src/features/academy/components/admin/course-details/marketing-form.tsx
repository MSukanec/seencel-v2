"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { updateCourseMarketing } from "@/features/academy/course-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Course } from "@/features/academy/types/course-marketing";
import { Plus, Trash2, GripVertical } from "lucide-react";

const formSchema = z.object({
    badge_text: z.string().optional(),
    preview_video_id: z.string().optional(),
    image_path: z.string().optional(),
    duration: z.string().optional(),
    level: z.string().optional(),
    language: z.string().optional(),
    certificate: z.boolean().default(true),
    masterclasses: z.array(z.object({
        id: z.string().optional(), // generated on client if new
        title: z.string().min(1, "El título es requerido"),
        videoUrl: z.string().url("Debe ser una URL válida"),
        duration: z.string().optional(), // User can input or we default
    })).optional(),
});

interface MarketingFormProps {
    course: Course;
    details: any; // landing_sections.details
}

export function MarketingForm({ course, details }: MarketingFormProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    // Initial masterclasses from prop (if exists in details or course)
    // Note: details passed here IS course_details.landing_sections.details
    // We need access to landing_sections.masterclasses.
    // The parent page passed 'course.details' as 'details'.
    // course.masterclasses is likely populated by getCourseById from landing_sections.
    const initialMasterclasses = course.masterclasses || [];

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            badge_text: (course as any).badgeText || "", // Handle mapped name or raw
            preview_video_id: course.heroVideo || "",
            image_path: course.heroImage || "",
            duration: details.duration || "0 horas",
            level: details.level || "Todos los niveles",
            language: details.language || "Español",
            certificate: details.certificate !== false,
            masterclasses: initialMasterclasses.map(mc => ({
                id: mc.id,
                title: mc.title,
                videoUrl: mc.videoUrl || "",
                duration: mc.duration || "",
            })),
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "masterclasses",
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!course.id) return;
        setIsPending(true);

        const landingDetails = {
            duration: values.duration,
            level: values.level,
            language: values.language,
            certificate: values.certificate,
            requirements: details.requirements || [], // Preserve existing
        };

        // Construct masterclasses array with IDs if missing
        const masterclasses = values.masterclasses?.map(mc => ({
            id: mc.id || crypto.randomUUID(),
            title: mc.title,
            videoUrl: mc.videoUrl,
            duration: mc.duration || "10 min", // Default if empty
            thumbnail: "" // Not handling thumbnail upload yet
        }));

        try {
            const result = await updateCourseMarketing(course.id, {
                image_path: values.image_path || null,
                badge_text: values.badge_text || null,
                preview_video_id: values.preview_video_id || null,
                landing_sections: {
                    details: landingDetails,
                    masterclasses: masterclasses
                }
            });
            if (result.success) {
                toast.success("Marketing actualizado correctamente");
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Ocurrió un error al guardar");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Landing Page & Marketing</CardTitle>
                        <CardDescription>
                            Personaliza la apariencia y el contenido de venta del curso.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="image_path"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Imagen Hero (Path o URL)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="courses/my-course/hero.jpg" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Ruta en Storage o URL externa.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="preview_video_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ID Video Preview (YouTube/Vimeo)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123456789" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="badge_text"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Texto del Badge (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nuevo, Best Seller..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="border-t pt-4 mt-4">
                            <h4 className="text-sm font-semibold mb-3">Detalles del Curso</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="duration"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Duración</FormLabel>
                                            <FormControl>
                                                <Input placeholder="10 horas" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="level"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nivel</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Intermedio" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="language"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Idioma</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Español" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="mt-4">
                                <FormField
                                    control={form.control}
                                    name="certificate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Certificado incluido</FormLabel>
                                                <FormDescription>
                                                    Indica si el curso incluye certificado al finalizar.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Masterclasses / Videos Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Videos Destacados / Masterclasses</CardTitle>
                            <CardDescription>
                                Agrega videos de YouTube o Vimeo para mostrar como contenido gratuito.
                            </CardDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ title: "", videoUrl: "", duration: "" })}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Agregar Video
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {fields.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4 italic">
                                No hay videos agregados.
                            </p>
                        )}
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-4 items-start border p-4 rounded-lg bg-muted/20">
                                <div className="mt-3 cursor-grab text-muted-foreground">
                                    <GripVertical className="h-4 w-4" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                    <FormField
                                        control={form.control}
                                        name={`masterclasses.${index}.title`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Título</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Título del video..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex gap-2">
                                        <FormField
                                            control={form.control}
                                            name={`masterclasses.${index}.videoUrl`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel className="text-xs">URL (YouTube/Vimeo)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`masterclasses.${index}.duration`}
                                            render={({ field }) => (
                                                <FormItem className="w-24">
                                                    <FormLabel className="text-xs">Duración</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="10m" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="mt-8 text-destructive hover:text-destructive/90"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </div>
            </form>
        </Form >
    );
}

