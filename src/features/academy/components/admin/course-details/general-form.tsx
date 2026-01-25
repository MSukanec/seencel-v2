"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { updateCourseGeneral } from "@/features/academy/course-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Course } from "@/features/academy/types/course-marketing";
import { useModal } from "@/providers/modal-store";
import { FormFooter } from "@/components/shared/forms/form-footer";

const formSchema = z.object({
    title: z.string().min(2, "El título debe tener al menos 2 caracteres"),
    slug: z.string().min(2, "El slug es requerido"),
    price: z.coerce.number().min(0, "El precio no puede ser negativo"),
    status: z.string(),
    visibility: z.string(),
    instructor_id: z.string().min(1, "Debes seleccionar un instructor"),
    endorsement_title: z.string().optional(),
    endorsement_description: z.string().optional(),
    endorsement_image_path: z.string().optional().nullable(),
});

type GeneralFormValues = z.infer<typeof formSchema>;

export interface EditableCourseData {
    id: string;
    title: string;
    slug: string;
    price: number;
    status: string;
    visibility: string;
    instructorId?: string | null;
    endorsement?: {
        title: string | null;
        description: string | null;
        imagePath: string | null;
    };
}

interface GeneralFormProps {
    course: EditableCourseData;
    instructors: { id: string; name: string; avatar_path: string | null }[];
    isModal?: boolean;
}

export function GeneralForm({ course, instructors, isModal = false }: GeneralFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isPending, setIsPending] = useState(false);

    const form = useForm<GeneralFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            title: course.title,
            slug: course.slug,
            price: course.price,
            status: course.status || "available",
            visibility: course.visibility || "public",
            instructor_id: course.instructorId || "",
            endorsement_title: course.endorsement?.title || "",
            endorsement_description: course.endorsement?.description || "",
            endorsement_image_path: course.endorsement?.imagePath || null,
        },
    });

    const [uploading, setUploading] = useState(false);

    async function navigateAndUpload(file: File) {
        setUploading(true);
        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `endorsement-${Date.now()}.${fileExt}`;
            const filePath = `courses/endorsements/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Set the path in the form
            form.setValue("endorsement_image_path", filePath, { shouldDirty: true });
            toast.success("Imagen subida correctamente");
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error("Error al subir imagen");
        } finally {
            setUploading(false);
        }
    }

    // Map instructors for SearchableSelect
    const instructorOptions = instructors.map((inst) => ({
        label: inst.name,
        value: inst.id,
    }));

    async function onSubmit(values: any) {
        if (!course.id) return;
        setIsPending(true);

        try {
            const result = await updateCourseGeneral(course.id, values);
            if (result.success) {
                toast.success("Curso actualizado correctamente");
                router.refresh();
                if (isModal && closeModal) closeModal();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Ocurrió un error al guardar");
        } finally {
            setIsPending(false);
        }
    }

    const Wrapper = isModal ? "div" : Card;
    const HeaderWrapper = isModal ? "div" : CardHeader;
    const TitleWrapper = isModal ? "h3" : CardTitle;
    const ContentWrapper = isModal ? "div" : CardContent;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={isModal ? "flex flex-col h-full" : "space-y-6"}>
                <div className={isModal ? "flex-1 overflow-y-auto space-y-4" : "space-y-6"}>
                    {/* General Section */}
                    <Wrapper className={isModal ? "border-0 shadow-none p-0" : ""}>
                        {!isModal && (
                            <HeaderWrapper>
                                <TitleWrapper>Información General</TitleWrapper>
                                <CardDescription>
                                    Configura los detalles básicos del curso.
                                </CardDescription>
                            </HeaderWrapper>
                        )}
                        <ContentWrapper className={isModal ? "p-0 space-y-4" : "space-y-4"}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Título del Curso</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Master ArchiCAD..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="slug"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Slug (URL)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="master-archicad" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Identificador único en la URL.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Precio (USD)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="instructor_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Instructor</FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={instructorOptions}
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    placeholder="Seleccionar instructor..."
                                                    searchPlaceholder="Buscar instructor..."
                                                    emptyMessage="No se encontraron instructores"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estado</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar estado" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="available">Disponible</SelectItem>
                                                    <SelectItem value="coming_soon">Próximamente</SelectItem>
                                                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="visibility"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Visibilidad</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar visibilidad" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="public">Público</SelectItem>
                                                    <SelectItem value="private">Privado</SelectItem>
                                                    <SelectItem value="unlisted">No listado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </ContentWrapper>
                    </Wrapper>

                    {/* ENDORSEMENT SECTION */}
                    <Wrapper className={isModal ? "border-0 shadow-none p-0 mt-6" : ""}>
                        {!isModal && (
                            <HeaderWrapper>
                                <TitleWrapper>Respaldo Profesional (Aval)</TitleWrapper>
                                <CardDescription>
                                    Configura la tarjeta de "Avalado por..." que aparece junto al instructor.
                                </CardDescription>
                            </HeaderWrapper>
                        )}
                        <ContentWrapper className={isModal ? "p-0 space-y-6" : "space-y-6"}>
                            {/* Image Upload */}
                            <div className="space-y-2">
                                <FormLabel>Logo / Imagen del Aval</FormLabel>
                                <div className="flex items-center gap-4">
                                    {form.watch("endorsement_image_path") ? (
                                        <div className="relative w-32 h-20 rounded-md overflow-hidden border bg-zinc-900 flex items-center justify-center">
                                            <img
                                                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-assets/${form.watch("endorsement_image_path")}`}
                                                alt="Preview"
                                                className="w-full h-full object-contain p-2"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => form.setValue("endorsement_image_path", null, { shouldDirty: true })}
                                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 m-1 shadow-sm hover:bg-red-600 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-32 h-20 rounded-md bg-muted flex items-center justify-center border-dashed border-2">
                                            <ImageIcon className="text-muted-foreground h-6 w-6" />
                                        </div>
                                    )}

                                    <div>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            disabled={uploading}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) navigateAndUpload(file);
                                            }}
                                            className="w-full max-w-xs"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Recomendado: Logo horizontal o cuadrado con fondo transparente</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <FormField
                                    control={form.control}
                                    name="endorsement_title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Título del Aval</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: Avalado por Graphisoft" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="endorsement_description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descripción</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Ej: Nuestro curso cuenta con el aval de..."
                                                    className="min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </ContentWrapper>
                    </Wrapper>
                </div>

                {isModal ? (
                    <FormFooter
                        onCancel={closeModal}
                        isLoading={isPending}
                        submitLabel="Guardar Cambios"
                        className="-mx-4 -mb-4 mt-6"
                    />
                ) : (
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    );
}

