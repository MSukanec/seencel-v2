"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createInstructor, updateInstructor } from "@/features/academy/actions";

const formSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    title: z.string().min(1, "El título es obligatorio"),
    bio: z.string().optional(),
    avatar_path: z.string().nullable().optional(),
    credentials: z.array(z.string()),
    linkedin_url: z.string().url().optional().or(z.literal("")),
    youtube_url: z.string().url().optional().or(z.literal("")),
    instagram_url: z.string().url().optional().or(z.literal("")),
});

interface InstructorFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    instructor?: any;
}

export function InstructorForm({ open, onOpenChange, instructor }: InstructorFormProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Credentials local state
    const [credentialInput, setCredentialInput] = useState("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            title: "",
            bio: "",
            avatar_path: null,
            credentials: [],
            linkedin_url: "",
            youtube_url: "",
            instagram_url: "",
        },
    });

    useEffect(() => {
        if (instructor) {
            form.reset({
                name: instructor.name,
                title: instructor.title || "",
                bio: instructor.bio || "",
                avatar_path: instructor.avatar_path,
                credentials: instructor.credentials || [],
                linkedin_url: instructor.linkedin_url || "",
                youtube_url: instructor.youtube_url || "",
                instagram_url: instructor.instagram_url || "",
            });
        } else {
            form.reset({
                name: "",
                title: "",
                bio: "",
                avatar_path: null,
                credentials: [],
                linkedin_url: "",
                youtube_url: "",
                instagram_url: "",
            });
        }
    }, [instructor, form, open]);

    async function navigateAndUpload(file: File) {
        setUploading(true);
        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `instructor-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Set the path in the form
            form.setValue("avatar_path", filePath, { shouldDirty: true });
            toast.success("Imagen subida correctamente");
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error("Error al subir imagen");
        } finally {
            setUploading(false);
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsPending(true);
        try {
            const payload = {
                ...values,
                bio: values.bio || "",
                avatar_path: values.avatar_path || null,
            };

            let res;
            if (instructor) {
                res = await updateInstructor(instructor.id, payload);
            } else {
                res = await createInstructor(payload);
            }

            if (res.success) {
                toast.success(instructor ? "Instructor actualizado" : "Instructor creado");
                onOpenChange(false);
                router.refresh();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("Error inesperado: " + (error instanceof Error ? error.message : "Desconocido"));
        } finally {
            setIsPending(false);
        }
    }

    const addCredential = () => {
        if (credentialInput.trim()) {
            const current = form.getValues("credentials");
            form.setValue("credentials", [...current, credentialInput.trim()]);
            setCredentialInput("");
        }
    };

    const removeCredential = (index: number) => {
        const current = form.getValues("credentials");
        form.setValue("credentials", current.filter((_, i) => i !== index));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{instructor ? "Editar Instructor" : "Nuevo Instructor"}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre completo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Ana García" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título / Profesión</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Arquitecta Senior" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Biografía</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Breve descripción del instructor..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Avatar Upload */}
                        <div className="space-y-2">
                            <FormLabel>Foto de Perfil</FormLabel>
                            <div className="flex items-center gap-4">
                                {form.watch("avatar_path") ? (
                                    <div className="relative w-20 h-20 rounded-full overflow-hidden border">
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-assets/${form.watch("avatar_path")}`}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => form.setValue("avatar_path", null)}
                                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-dashed border-2">
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
                                    <p className="text-xs text-muted-foreground mt-1">Recomendado: 400x400px</p>
                                </div>
                            </div>
                        </div>

                        {/* Credentials Manager */}
                        <div className="space-y-2">
                            <FormLabel>Credenciales / Logros</FormLabel>
                            <div className="flex gap-2">
                                <Input
                                    value={credentialInput}
                                    onChange={(e) => setCredentialInput(e.target.value)}
                                    placeholder="Ej: Master en BIM Management"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCredential())}
                                />
                                <Button type="button" variant="outline" onClick={addCredential}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <ul className="space-y-1 mt-2">
                                {form.watch("credentials").map((cred, idx) => (
                                    <li key={idx} className="flex items-center gap-2 bg-muted/50 p-2 rounded text-sm group">
                                        <span className="flex-1">{cred}</span>
                                        <button type="button" onClick={() => removeCredential(idx)} className="text-muted-foreground hover:text-red-500">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="linkedin_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>LinkedIn URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://linkedin.com/in/..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="youtube_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>YouTube URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://youtube.com/..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="instagram_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Instagram URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://instagram.com/..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending || uploading}>
                                {isPending ? "Guardando..." : "Guardar Instructor"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

