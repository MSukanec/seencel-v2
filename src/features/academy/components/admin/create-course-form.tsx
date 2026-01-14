"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { createCourse } from "@/features/academy/course-actions";
import { useModal } from "@/providers/modal-store";
import { FormFooter } from "@/components/shared/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";

// Simple slugify helper (same as before)
function simpleSlugify(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

const formSchema = z.object({
    title: z.string().min(2, "El título debe tener al menos 2 caracteres"),
    slug: z.string().min(2, "El slug es requerido"),
    price: z.coerce.number().min(0, "El precio no puede ser negativo"),
    instructor_id: z.string().min(1, "Debes seleccionar un instructor"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateCourseFormProps {
    instructors: { id: string; name: string; avatar_path: string | null }[];
}

export function CreateCourseForm({ instructors }: CreateCourseFormProps) {
    const { closeModal } = useModal(); // We use global modal
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            title: "",
            slug: "",
            price: 0,
            instructor_id: "",
        },
    });

    // Auto-generate slug from title
    const title = form.watch("title");
    useEffect(() => {
        if (title) {
            const slug = simpleSlugify(title);
            // Only update slug if user hasn't manually edited it differently (simple check: if it matches old title slug)
            // For now, just auto-update as nice-to-have, unless field is dirty?
            // Let's just update perfectly matches standard.
            const currentSlug = form.getValues("slug");
            const isManual = currentSlug !== "" && currentSlug !== simpleSlugify(title.slice(0, -1)); // rough heuristic, maybe just overwrite
            // Better: just overwrite if it looks like we are typing fresh.
            form.setValue("slug", slug, { shouldValidate: true });
        }
    }, [title, form]);

    async function onSubmit(values: FormValues) {
        setIsLoading(true);
        try {
            const result = await createCourse(values);

            if (result.success) {
                toast.success("Curso creado correctamente");
                closeModal();
                router.refresh(); // Refresh list
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsLoading(false);
        }
    }

    const instructorOptions = instructors.map((inst) => ({
        label: inst.name,
        value: inst.id,
    }));

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4">
                <FormGroup
                    label="Título del Curso"
                    htmlFor="title"
                    error={form.formState.errors.title?.message}
                    required
                >
                    <Input
                        id="title"
                        placeholder="Ej: Curso Avanzado de..."
                        {...form.register("title")}
                    />
                </FormGroup>

                <FormGroup
                    label="Slug (URL)"
                    htmlFor="slug"
                    error={form.formState.errors.slug?.message}
                    required
                >
                    <Input
                        id="slug"
                        placeholder="ej-curso-avanzado"
                        {...form.register("slug")}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Identificador único para la URL del curso.</p>
                </FormGroup>

                <div className="grid grid-cols-2 gap-4">
                    <FormGroup
                        label="Precio (USD)"
                        htmlFor="price"
                        error={form.formState.errors.price?.message}
                    >
                        <Input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            {...form.register("price")}
                        />
                    </FormGroup>

                    <FormGroup
                        label="Instructor"
                        htmlFor="instructor_id"
                        error={form.formState.errors.instructor_id?.message}
                        required
                    >
                        {/* We use Combobox, need controlled wrapper */}
                        <Combobox
                            options={instructorOptions}
                            value={form.watch("instructor_id")}
                            onValueChange={(val) => form.setValue("instructor_id", val, { shouldValidate: true })}
                            placeholder="Seleccionar..."
                            searchPlaceholder="Buscar instructor..."
                        />
                        {/* Hidden input for validation if needed, but watch handles it */}
                    </FormGroup>
                </div>
            </div>

            <FormFooter
                onCancel={closeModal}
                isLoading={isLoading}
                submitLabel="Crear Curso"
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
