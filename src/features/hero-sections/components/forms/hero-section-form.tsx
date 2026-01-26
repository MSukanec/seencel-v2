"use client";

import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/client-image-compression";
import { createHeroSection, updateHeroSection, type CreateHeroSectionInput } from "@/features/hero-sections/actions";
import type { HeroSection } from "@/features/hero-sections/queries";

// ============================================================================
// TYPES
// ============================================================================

interface HeroSectionFormProps {
    initialData?: HeroSection | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function HeroSectionForm({ initialData, onSuccess, onCancel }: HeroSectionFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const isEditing = !!initialData;

    // Form state
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [mediaUrl, setMediaUrl] = useState(initialData?.media_url || '');
    const [mediaType, setMediaType] = useState(initialData?.media_type || 'image');
    const [orderIndex, setOrderIndex] = useState(initialData?.order_index || 0);
    const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

    // Primary Button
    const [primaryButtonText, setPrimaryButtonText] = useState(initialData?.primary_button_text || '');
    const [primaryButtonAction, setPrimaryButtonAction] = useState(initialData?.primary_button_action || '');

    // Secondary Button
    const [secondaryButtonText, setSecondaryButtonText] = useState(initialData?.secondary_button_text || '');
    const [secondaryButtonAction, setSecondaryButtonAction] = useState(initialData?.secondary_button_action || '');

    // Image Upload Handler
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // Determine if video or image
            const isVideo = file.type.startsWith('video/');
            const isGif = file.type === 'image/gif';

            let fileToUpload: File | Blob = file;

            // Compress images (not videos or GIFs)
            if (!isVideo && !isGif) {
                fileToUpload = await compressImage(file, 'project-cover');
            }

            // Upload to Storage
            const supabase = createClient();
            const fileName = `carousels/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;

            const { error: uploadError } = await supabase.storage
                .from('public-assets')
                .upload(fileName, fileToUpload);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('public-assets')
                .getPublicUrl(fileName);

            setMediaUrl(publicUrl);
            setMediaType(isVideo ? 'video' : isGif ? 'gif' : 'image');
            toast.success("Media subido correctamente");
        } catch (error) {
            console.error('Error uploading media:', error);
            toast.error("Error al subir el archivo");
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveMedia = () => {
        setMediaUrl('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const data: CreateHeroSectionInput = {
                section_type: 'hub_hero',
                order_index: orderIndex,
                title: title || undefined,
                description: description || undefined,
                media_url: mediaUrl || undefined,
                media_type: mediaType,
                primary_button_text: primaryButtonText || undefined,
                primary_button_action: primaryButtonAction || undefined,
                primary_button_action_type: 'route',
                secondary_button_text: secondaryButtonText || undefined,
                secondary_button_action: secondaryButtonAction || undefined,
                secondary_button_action_type: 'route',
                is_active: isActive,
            };

            let result;
            if (isEditing && initialData) {
                result = await updateHeroSection({ id: initialData.id, ...data });
            } else {
                result = await createHeroSection(data);
            }

            if (result.success) {
                toast.success(isEditing ? 'Slide actualizado' : 'Slide creado');
                onSuccess?.();
            } else {
                toast.error(result.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error saving hero section:', error);
            toast.error('Error inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Media Upload - Full Width */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium">Imagen / Video</label>
                        <div className="flex items-center gap-4">
                            {mediaUrl ? (
                                <div className="relative w-full h-40 rounded-lg overflow-hidden border group">
                                    {mediaType === 'video' ? (
                                        <video
                                            src={mediaUrl}
                                            className="w-full h-full object-cover"
                                            muted
                                            loop
                                            autoPlay
                                            playsInline
                                        />
                                    ) : (
                                        <img
                                            src={mediaUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={handleRemoveMedia}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                                    <label className="flex flex-col items-center cursor-pointer p-4 w-full">
                                        {isUploading ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        ) : (
                                            <>
                                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                                <span className="text-sm text-muted-foreground">Subir imagen o video</span>
                                                <span className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, GIF, MP4</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <FormGroup label="Título" className="md:col-span-2">
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Título del slide"
                        />
                    </FormGroup>

                    {/* Description */}
                    <FormGroup label="Descripción" className="md:col-span-2">
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descripción del slide"
                            rows={3}
                        />
                    </FormGroup>

                    {/* Order */}
                    <FormGroup label="Orden">
                        <Input
                            type="number"
                            value={orderIndex}
                            onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
                            min={0}
                        />
                    </FormGroup>

                    {/* Active Toggle */}
                    <FormGroup label="Estado">
                        <div className="flex items-center gap-3 h-10">
                            <Switch
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                            <span className="text-sm text-muted-foreground">
                                {isActive ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                    </FormGroup>

                    {/* Divider */}
                    <div className="md:col-span-2 border-t pt-4 mt-2">
                        <h4 className="text-sm font-medium text-muted-foreground mb-4">Botón Primario</h4>
                    </div>

                    {/* Primary Button Text */}
                    <FormGroup label="Texto del Botón">
                        <Input
                            value={primaryButtonText}
                            onChange={(e) => setPrimaryButtonText(e.target.value)}
                            placeholder="Ej: Comenzar"
                        />
                    </FormGroup>

                    {/* Primary Button Action */}
                    <FormGroup label="Ruta/URL">
                        <Input
                            value={primaryButtonAction}
                            onChange={(e) => setPrimaryButtonAction(e.target.value)}
                            placeholder="Ej: /organization"
                        />
                    </FormGroup>

                    {/* Divider */}
                    <div className="md:col-span-2 border-t pt-4 mt-2">
                        <h4 className="text-sm font-medium text-muted-foreground mb-4">Botón Secundario</h4>
                    </div>

                    {/* Secondary Button Text */}
                    <FormGroup label="Texto del Botón">
                        <Input
                            value={secondaryButtonText}
                            onChange={(e) => setSecondaryButtonText(e.target.value)}
                            placeholder="Ej: Saber más"
                        />
                    </FormGroup>

                    {/* Secondary Button Action */}
                    <FormGroup label="Ruta/URL">
                        <Input
                            value={secondaryButtonAction}
                            onChange={(e) => setSecondaryButtonAction(e.target.value)}
                            placeholder="Ej: /about"
                        />
                    </FormGroup>
                </div>
            </div>

            {/* Sticky Footer */}
            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading || isUploading}
                submitLabel={isEditing ? "Guardar Cambios" : "Crear Slide"}
                onCancel={onCancel}
            />
        </form>
    );
}
