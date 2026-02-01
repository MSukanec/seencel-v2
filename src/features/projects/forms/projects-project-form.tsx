"use client";

import { FormFooter } from "@/components/shared/forms/form-footer";

import { createProject, updateProject } from "@/features/projects/actions";

import { useDrawer } from "@/providers/drawer-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SingleImageDropzone } from "@/components/ui/single-image-dropzone";
import { ColorPicker } from "@/components/ui/color-picker";
import { FormGroup } from "@/components/ui/form-group";

import { getProjectTypes, getProjectModalities } from "@/features/projects/actions";
import { ProjectType, ProjectModality } from "@/types/project";

// Optimization & Upload
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/client-image-compression";
import { extractColorsFromImage } from "@/features/customization/lib/color-extraction";
import { toast } from "sonner";

interface ProjectsProjectFormProps {
    mode: 'create' | 'edit';
    initialData?: any;
    organizationId: string;
    onCancel?: () => void;
    onSuccess?: () => void;
}

export function ProjectsProjectForm({ mode, initialData, organizationId, onCancel, onSuccess }: ProjectsProjectFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const t = useTranslations('Project.form');

    // Data states
    const [types, setTypes] = useState<ProjectType[]>([]);
    const [modalities, setModalities] = useState<ProjectModality[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!organizationId) return;
            const [typesData, modalitiesData] = await Promise.all([
                getProjectTypes(organizationId),
                getProjectModalities(organizationId)
            ]);
            setTypes(typesData);
            setModalities(modalitiesData);
        };
        fetchData();
    }, [organizationId]);

    // States for new fields
    const [file, setFile] = useState<File | undefined>();
    const [color, setColor] = useState(initialData?.color || "#007AFF");
    const [extractedPalette, setExtractedPalette] = useState<{
        primary: string;
        secondary: string;
        background: string;
        accent: string;
    } | null>(initialData?.image_palette || null);
    const [isExtractingColors, setIsExtractingColors] = useState(false);

    // Handle file selection and extract colors immediately
    const handleFileChange = async (newFile: File | undefined) => {
        setFile(newFile);
        if (!newFile) {
            setExtractedPalette(null);
            return;
        }

        // Extract colors immediately for preview
        setIsExtractingColors(true);
        try {
            const colors = await extractColorsFromImage(newFile, 4);
            if (colors.length >= 4) {
                setExtractedPalette({
                    primary: colors[0].hex,
                    secondary: colors[1].hex,
                    background: colors.reduce((lightest, c) =>
                        c.oklch.l > lightest.oklch.l ? c : lightest
                    ).hex,
                    accent: colors.reduce((darkest, c) =>
                        c.oklch.l < darkest.oklch.l ? c : darkest
                    ).hex,
                });
            }
        } catch (e) {
            console.warn("Could not extract palette:", e);
        } finally {
            setIsExtractingColors(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading("Procesando...", { duration: Infinity }); // Persist loading toast

        try {
            const formData = new FormData(e.currentTarget);
            formData.append('organization_id', organizationId);

            if (mode === 'edit' && initialData?.id) {
                formData.append('id', initialData.id);
            }

            // --- IMAGE OPTIMIZATION & UPLOAD ---
            if (file) {
                try {
                    toast.loading("Optimizando imagen...", { id: toastId });

                    const compressedFile = await compressImage(file, 'project-cover');

                    toast.loading("Subiendo a la nube...", { id: toastId });

                    const supabase = createClient();
                    const fileExt = compressedFile.name.split('.').pop();
                    // Bucket: social-assets
                    // Path: cover/projects/{orgId}/{timestamp}
                    const fileName = `cover/projects/${organizationId}/${Date.now()}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('social-assets')
                        .upload(fileName, compressedFile);

                    if (uploadError) throw new Error("Error al subir imagen: " + uploadError.message);

                    const { data: { publicUrl } } = supabase.storage
                        .from('social-assets')
                        .getPublicUrl(fileName);

                    formData.append('image_url', publicUrl);

                    // Use already extracted palette if available
                    if (extractedPalette) {
                        formData.append('image_palette', JSON.stringify(extractedPalette));
                    }

                    // We don't send the raw 'image' file to server action anymore
                    formData.delete('image');

                } catch (imgError: any) {
                    console.error("Image process error:", imgError);
                    toast.error("Error procesando imagen: " + imgError.message, { id: toastId });
                    setIsLoading(false);
                    return;
                }
            }
            // -----------------------------------

            // Append Color data
            formData.append('color', color);

            toast.loading(mode === 'create' ? "Creando proyecto..." : "Guardando cambios...", { id: toastId });

            let result;
            if (mode === 'create') {
                result = await createProject(formData);
            } else {
                result = await updateProject(formData);
            }

            if (result.error) {
                console.error("Project Action Error:", result.error);
                toast.error(result.error, { id: toastId });
            } else {
                toast.success(mode === 'create' ? "¡Proyecto creado!" : "¡Cambios guardados!", { id: toastId });
                onSuccess?.();
            }
        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error("Error inesperado: " + error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            {/* Scrollable Content Body - No internal padding, uses System p-4 */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                    {/* Name: 50% width on desktop */}
                    <div className="md:col-span-6">
                        <FormGroup label={t('name')} htmlFor="name">
                            <Input
                                id="name"
                                name="name"
                                placeholder={t('namePlaceholder')}
                                defaultValue={initialData?.name}
                                required
                            />
                        </FormGroup>
                    </div>

                    {/* Status: 50% width on desktop */}
                    <div className="md:col-span-6">
                        <FormGroup label={t('status')} htmlFor="status">
                            <Select name="status" defaultValue={initialData?.status || "active"}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">{t('statusActive')}</SelectItem>
                                    <SelectItem value="completed">{t('statusCompleted')}</SelectItem>
                                    <SelectItem value="planning">{t('statusPlanning')}</SelectItem>
                                    <SelectItem value="inactive">{t('statusInactive')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormGroup>
                    </div>

                    {/* Type: 50% width on desktop */}
                    <div className="md:col-span-6">
                        <FormGroup label={t('type')} htmlFor="type">
                            <Select name="project_type_id" defaultValue={initialData?.project_type_id || types.find(x => x.name === initialData?.project_type_name)?.id}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('typePlaceholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {types.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>
                    </div>

                    {/* Modality: 50% width on desktop */}
                    <div className="md:col-span-6">
                        <FormGroup label={t('modality')} htmlFor="modality">
                            <Select name="project_modality_id" defaultValue={initialData?.project_modality_id || modalities.find(x => x.name === initialData?.project_modality_name)?.id}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('modalityPlaceholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {modalities.map((modality) => (
                                        <SelectItem key={modality.id} value={modality.id}>
                                            {modality.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>
                    </div>

                    {/* Image Upload: 100% width on desktop */}
                    <div className="md:col-span-12">
                        <FormGroup label={t('mainImage')}>
                            <SingleImageDropzone
                                height={200}
                                value={file ?? initialData?.image_url}
                                onChange={handleFileChange}
                                className="w-full"
                                dropzoneLabel={t('dropzoneText')}
                            />
                        </FormGroup>

                        {/* Extracted Palette Preview */}
                        {(extractedPalette || isExtractingColors) && (
                            <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border">
                                <p className="text-xs text-muted-foreground mb-2">Paleta extraída de la imagen:</p>
                                {isExtractingColors ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        Extrayendo colores...
                                    </div>
                                ) : extractedPalette && (
                                    <div className="flex gap-2">
                                        {Object.entries(extractedPalette).map(([key, hex]) => (
                                            <div
                                                key={key}
                                                className="w-8 h-8 rounded-lg shadow-sm ring-1 ring-white/10"
                                                style={{ backgroundColor: hex }}
                                                title={`${key}: ${hex}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Color Picker: 100% width on desktop */}
                    <div className="md:col-span-12">
                        <FormGroup label={t('projectColor')}>
                            <ColorPicker
                                color={color}
                                onChange={(newColor) => setColor(newColor)}
                            />
                        </FormGroup>
                    </div>
                </div>
            </div>

            <FormFooter
                onCancel={onCancel}
                cancelLabel={t('cancel')}
                submitLabel={isLoading
                    ? (mode === 'create' ? t('creating') : t('saving'))
                    : (mode === 'create' ? t('createTitle') : t('save'))
                }
                isLoading={isLoading}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
