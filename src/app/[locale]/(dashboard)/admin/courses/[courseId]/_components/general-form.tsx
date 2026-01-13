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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { updateCourseGeneral } from "@/features/courses/course-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Course } from "@/components/course/mock-course-data";

const formSchema = z.object({
    title: z.string().min(2, "El título debe tener al menos 2 caracteres"),
    slug: z.string().min(2, "El slug es requerido"),
    price: z.coerce.number().min(0, "El precio no puede ser negativo"),
    status: z.string(),
    visibility: z.string(),
    instructor_id: z.string().min(1, "Debes seleccionar un instructor"),
});

interface GeneralFormProps {
    course: Course;
    instructors: { id: string; name: string; avatar_path: string | null }[];
}

export function GeneralForm({ course, instructors }: GeneralFormProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        // @ts-ignore
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: course.title,
            slug: course.slug,
            price: course.price,
            status: course.status || "available",
            visibility: course.visibility || "public",
            instructor_id: course.instructorId || "",
        },
    });

    // Map instructors for SearchableSelect
    const instructorOptions = instructors.map((inst) => ({
        label: inst.name,
        value: inst.id,
    }));

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!course.id) return;
        setIsPending(true);

        try {
            const result = await updateCourseGeneral(course.id, values);
            if (result.success) {
                toast.success("Curso actualizado correctamente");
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
                        <CardTitle>Información General</CardTitle>
                        <CardDescription>
                            Configura los detalles básicos del curso.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                                            <SearchableSelect
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
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
