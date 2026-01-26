"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, GripVertical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useModal } from "@/providers/modal-store";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { HeroSectionForm } from "./forms/hero-section-form";
import { deleteHeroSection, toggleHeroSectionActive } from "@/features/hero-sections/actions";
import type { HeroSection } from "@/features/hero-sections/queries";
import { HeroCarousel, type HeroSlide } from "@/components/shared/hero-carousel";

// ============================================================================
// TYPES
// ============================================================================

interface CarouselManagementViewProps {
    slides: HeroSection[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CarouselManagementView({ slides }: CarouselManagementViewProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const [localSlides, setLocalSlides] = useState(slides);

    // Sync state with props when data changes (after router.refresh)
    useEffect(() => {
        setLocalSlides(slides);
    }, [slides]);

    const handleCreate = () => {
        openModal(
            <HeroSectionForm
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
                onCancel={closeModal}
            />,
            {
                title: "Crear Nuevo Slide",
                description: "Completá los campos para agregar un slide al carousel del HUB.",
                size: 'lg'
            }
        );
    };

    const handleEdit = (slide: HeroSection) => {
        openModal(
            <HeroSectionForm
                initialData={slide}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
                onCancel={closeModal}
            />,
            {
                title: "Editar Slide",
                description: "Modificá los datos del slide seleccionado.",
                size: 'lg'
            }
        );
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este slide?')) return;

        const result = await deleteHeroSection(id);
        if (result.success) {
            setLocalSlides(prev => prev.filter(s => s.id !== id));
            toast.success('Slide eliminado');
        } else {
            toast.error(result.error || 'Error al eliminar');
        }
    };

    const handleToggleActive = async (slide: HeroSection) => {
        const result = await toggleHeroSectionActive(slide.id, !slide.is_active);
        if (result.success) {
            setLocalSlides(prev => prev.map(s =>
                s.id === slide.id ? { ...s, is_active: !s.is_active } : s
            ));
            toast.success(slide.is_active ? 'Slide desactivado' : 'Slide activado');
        } else {
            toast.error(result.error || 'Error');
        }
    };

    // Transform to HeroSlide format for preview
    const previewSlides: HeroSlide[] = localSlides
        .filter(s => s.is_active)
        .map(s => ({
            id: s.id,
            title: s.title,
            description: s.description,
            mediaUrl: s.media_url,
            mediaType: s.media_type as any,
            primaryButton: s.primary_button_text ? {
                text: s.primary_button_text,
                action: s.primary_button_action || '',
                actionType: (s.primary_button_action_type as any) || 'route',
            } : null,
            secondaryButton: s.secondary_button_text ? {
                text: s.secondary_button_text,
                action: s.secondary_button_action || '',
                actionType: (s.secondary_button_action_type as any) || 'route',
            } : null,
        }));

    // Empty State
    if (localSlides.length === 0) {
        return (
            <>
                {/* Toolbar teleports to header */}
                <Toolbar
                    portalToHeader
                    actions={[
                        { label: "Crear Slide", icon: Plus, onClick: handleCreate, variant: "default" }
                    ]}
                />

                <div className="h-full flex items-center justify-center">
                    <EmptyState
                        icon={Sparkles}
                        title="Sin slides en el carousel"
                        description="Creá tu primer slide para mostrar contenido destacado en el HUB."
                    />
                </div>
            </>
        );
    }

    return (
        <>
            {/* Toolbar teleports to header */}
            <Toolbar
                portalToHeader
                actions={[
                    { label: "Crear Slide", icon: Plus, onClick: handleCreate, variant: "default" }
                ]}
            />

            <div className="space-y-6">
                {/* Preview */}
                {previewSlides.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Vista Previa</h4>
                        <HeroCarousel slides={previewSlides} autoPlay={false} />
                    </div>
                )}

                {/* Slides List */}
                <div className="border rounded-lg divide-y">
                    {localSlides.map((slide) => (
                        <div
                            key={slide.id}
                            className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                        >
                            {/* Drag Handle (future) */}
                            <GripVertical className="h-4 w-4 text-muted-foreground/50" />

                            {/* Order Badge */}
                            <Badge variant="outline" className="w-8 h-8 flex items-center justify-center p-0">
                                {slide.order_index}
                            </Badge>

                            {/* Media Preview */}
                            <div className="w-16 h-10 rounded bg-muted overflow-hidden shrink-0">
                                {slide.media_url ? (
                                    <img
                                        src={slide.media_url}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                        Sin
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                    {slide.title || '(Sin título)'}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                    {slide.description || '(Sin descripción)'}
                                </p>
                            </div>

                            {/* Status */}
                            <Badge variant={slide.is_active ? "default" : "secondary"}>
                                {slide.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleToggleActive(slide)}
                                    title={slide.is_active ? 'Desactivar' : 'Activar'}
                                >
                                    {slide.is_active ? (
                                        <ToggleRight className="h-4 w-4 text-primary" />
                                    ) : (
                                        <ToggleLeft className="h-4 w-4" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(slide)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(slide.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
