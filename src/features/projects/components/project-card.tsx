"use client";

import { Project } from "@/types/project";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, Building2, Hammer, ImageOff, Pencil, Trash2, MoreHorizontal } from "lucide-react";
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
 * ProjectCard — Silestone-inspired card where the image palette INFUSES the
 * entire card: footer background, badge colors, gradient overlay, swatch bar.
 * Each card should look dramatically different, like marble swatch samples.
 */
export function ProjectCard({ project, className, onEdit, onDelete }: ProjectCardProps) {
    const locale = useLocale();
    const t = useTranslations('Project.status');
    const { actions } = useLayoutStore();

    const palette = project.image_palette;
    const hasPalette = !!(palette && (palette.primary || palette.secondary || palette.background || palette.accent));

    // Project dot color — always the project's own color
    const dotColor = (project.use_custom_color && project.custom_color_hex)
        || project.color
        || null;

    const location = [project.city, project.country].filter(Boolean).join(", ");

    // Construct image URL
    const imageUrl = project.image_bucket && project.image_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${project.image_bucket}/${project.image_path}`
        : project.image_url;

    // Translated status
    const statusKey = (project.status?.toLowerCase() || 'active') as string;
    const statusLabel = t(statusKey) || project.status;

    const handleActionClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleCardClick = () => {
        actions.setActiveContext("project");
        actions.setActiveProjectId(project.id);
    };

    // ── Palette-driven design tokens ──────────────────────────────────────────
    // IMPORTANT: Palette colors from images are often LIGHT (sky, white walls).
    // We mix them with dark bases to tint without breaking the dark theme.
    const swatchColors = hasPalette
        ? [palette.primary, palette.secondary, palette.accent, palette.background].filter(Boolean)
        : [];

    // Footer bg: palette tints a dark base — uses accent (3rd swatch = most characteristic)
    const footerBg = hasPalette && palette.accent
        ? `color-mix(in oklch, ${palette.accent} 30%, #1a1a1a)`
        : undefined;

    // Badge styling: palette.primary darkened for bg, lightened for text
    const badgeBg = hasPalette && palette.primary
        ? `color-mix(in oklch, ${palette.primary} 20%, #1a1a1a)`
        : "rgba(255,255,255,0.08)";
    const badgeColor = hasPalette && palette.primary
        ? `color-mix(in oklch, ${palette.primary} 60%, white)`
        : undefined;

    // Hero gradient: dark base tinted with accent (3rd swatch = most characteristic color)
    const gradientOverlay = hasPalette && palette.accent
        ? [
            `linear-gradient(to top,`,
            `color-mix(in oklch, ${palette.accent} 35%, #0a0a0a) 0%,`,
            `color-mix(in oklch, ${palette.accent} 20%, rgba(0,0,0,0.7)) 30%,`,
            `transparent 70%)`,
        ].join(" ")
        : "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 35%, transparent 70%)";

    // Card border: subtle palette tint
    const cardBorder = hasPalette && palette.primary
        ? `1px solid color-mix(in oklch, ${palette.primary} 25%, transparent)`
        : undefined;

    return (
        <Link
            href={`/${locale}/project/${project.id}`}
            className="block group"
            onClick={handleCardClick}
        >
            <Card
                className={cn(
                    "relative overflow-hidden rounded-xl shadow-lg",
                    "transition-all duration-300 ease-out",
                    "hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1",
                    !hasPalette && "border-0 bg-card",
                    hasPalette && "border-0",
                    className
                )}
                style={{
                    border: cardBorder,
                }}
            >
                {/* Hero Image Section */}
                <div className="relative h-72 w-full overflow-hidden">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={project.name}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                            <ImageOff className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                    )}

                    {/* Gradient Overlay — heavily tinted with palette */}
                    <div
                        className="absolute inset-0"
                        style={{ background: gradientOverlay }}
                    />

                    {/* Project Name + Color Dot */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center gap-2">
                            {dotColor && (
                                <span
                                    className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/30 shadow-lg"
                                    style={{ backgroundColor: dotColor }}
                                />
                            )}
                            <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
                                {project.name}
                            </h3>
                        </div>
                        {location && (
                            <p className={cn(
                                "text-xs text-white/70 mt-1 flex items-center gap-1",
                                dotColor && "ml-5"
                            )}>
                                <MapPin className="h-3 w-3" />
                                {location}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Palette Swatch Bar ─────────────────────────── */}
                {swatchColors.length > 0 && (
                    <div className="flex h-2">
                        {swatchColors.map((color, i) => (
                            <div
                                key={i}
                                className="flex-1"
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                )}

                {/* ── Footer — palette-infused ──────────────────── */}
                <div
                    className="p-4 flex items-center justify-between"
                    style={{
                        backgroundColor: footerBg,
                    }}
                >
                    <div className="flex flex-wrap gap-2 flex-1">
                        {/* Status Badge — palette-tinted */}
                        <div
                            className="flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1"
                            style={{
                                backgroundColor: badgeBg,
                                color: badgeColor,
                            }}
                        >
                            <span>{statusLabel}</span>
                        </div>
                        {project.project_type_name && (
                            <div
                                className="flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1"
                                style={{
                                    backgroundColor: badgeBg,
                                    color: badgeColor,
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
                                    backgroundColor: badgeBg,
                                    color: badgeColor,
                                }}
                            >
                                <Hammer className="h-3 w-3" />
                                <span>{project.project_modality_name}</span>
                            </div>
                        )}
                    </div>

                    {/* Action Menu */}
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
