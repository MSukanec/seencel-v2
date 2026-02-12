"use client";

import { Project } from "@/types/project";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, Calendar, Building2, Hammer, ImageOff, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useLayoutStore } from "@/stores/layout-store";

interface ProjectCardProps {
    project: Project;
    className?: string;
    onEdit?: (project: Project) => void;
    onDelete?: (project: Project) => void;
}

/**
 * ProjectCard - A beautiful card component for displaying project information
 * Features a hero image with gradient overlay, project name, and key metadata badges
 */
export function ProjectCard({ project, className, onEdit, onDelete }: ProjectCardProps) {
    const locale = useLocale();
    const t = useTranslations('Project.status');
    const { actions } = useLayoutStore();

    /**
     * Adjusts color lightness to ensure good contrast on dark backgrounds.
     * Converts hex to HSL, ensures minimum lightness, then converts back.
     */
    const ensureContrast = (hexColor: string, minLightness = 55): string => {
        // Skip if not a hex color
        if (!hexColor?.startsWith('#')) return hexColor;

        // Convert hex to RGB
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;

        // Convert RGB to HSL
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        // Adjust lightness if too dark (for dark mode contrast)
        const currentL = l * 100;
        if (currentL >= minLightness) return hexColor; // Already bright enough

        const newL = minLightness / 100;

        // Convert HSL back to RGB
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = newL < 0.5 ? newL * (1 + s) : newL + s - newL * s;
        const p = 2 * newL - q;
        const newR = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
        const newG = Math.round(hue2rgb(p, q, h) * 255);
        const newB = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    };

    // Get accent color for the card - prioritize extracted palette
    const palette = project.image_palette;
    const rawAccentColor = palette?.primary
        || (project.use_custom_color && project.custom_color_hex)
        || project.color
        || "hsl(var(--primary))";

    // Ensure the color has enough contrast for dark mode
    const accentColor = ensureContrast(rawAccentColor, 50);

    const location = [project.city, project.country].filter(Boolean).join(", ");

    // Construct image URL from bucket + path, or use direct image_url
    const imageUrl = project.image_bucket && project.image_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${project.image_bucket}/${project.image_path}`
        : project.image_url;

    // Get translated status using next-intl
    const statusKey = (project.status?.toLowerCase() || 'active') as string;
    const statusLabel = t(statusKey) || project.status;

    const handleActionClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleCardClick = () => {
        // Update store immediately when card is clicked
        actions.setActiveContext("project");
        actions.setActiveProjectId(project.id);
    };

    return (
        <Link
            href={`/${locale}/project/${project.id}`}
            className="block group"
            onClick={handleCardClick}
        >
            <Card className={cn(
                "relative overflow-hidden rounded-xl border-0 shadow-lg",
                "transition-all duration-300 ease-out",
                "hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1",
                "bg-card",
                className
            )}>
                {/* Hero Image Section - 1.5x taller (h-80) */}
                <div className="relative h-80 w-full overflow-hidden">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={project.name}
                            fill
                            unoptimized
                            className="object-cover"
                        />
                    ) : (
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 15%, var(--background))` }}
                        >
                            <ImageOff className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Project Name - Bottom of Image */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
                            {project.name}
                        </h3>
                        {location && (
                            <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {location}
                            </p>
                        )}
                    </div>

                    {/* Accent Color Bar */}
                    <div
                        className="absolute bottom-0 left-0 right-0 h-1"
                        style={{ backgroundColor: accentColor }}
                    />
                </div>

                {/* Footer Section */}
                <div className="p-4 flex items-center justify-between">
                    {/* Info Chips - Status badge first, then type/modality/date */}
                    <div className="flex flex-wrap gap-2 flex-1">
                        {/* Status Badge - Uses accent color */}
                        <div
                            className="flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1"
                            style={{
                                backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                                color: accentColor,
                            }}
                        >
                            <span>{statusLabel}</span>
                        </div>
                        {project.project_type_name && (
                            <div
                                className="flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1"
                                style={{
                                    backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                                    color: accentColor,
                                }}
                            >
                                <Building2 className="h-3 w-3" />
                                <span>{project.project_type_name}</span>
                            </div>
                        )}
                        {project.project_modality_name && (
                            <div
                                className="flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1"
                                style={{
                                    backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                                    color: accentColor,
                                }}
                            >
                                <Hammer className="h-3 w-3" />
                                <span>{project.project_modality_name}</span>
                            </div>
                        )}
                    </div>

                    {/* Action Menu - Always Visible */}
                    {(onEdit || onDelete) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={handleActionClick}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                {onEdit && (
                                    <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(project);
                                    }}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Editar
                                    </DropdownMenuItem>
                                )}
                                {onDelete && (
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(project);
                                        }}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Eliminar
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </Card>
        </Link>
    );
}
