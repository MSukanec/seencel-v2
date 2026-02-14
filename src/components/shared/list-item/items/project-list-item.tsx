"use client";

import { memo } from "react";
import { Project } from "@/types/project";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MapPin,
    Building2,
    Hammer,
    ImageOff,
    Pencil,
    Trash2,
    MoreHorizontal,
    ExternalLink,
    Activity,
    CheckCircle,
    Clock,
    CircleOff,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { parseDateFromDB } from "@/lib/timezone-data";
import { Link } from "@/i18n/routing";

// ============================================================================
// Types
// ============================================================================

interface ProjectListItemProps {
    project: Project;
    className?: string;
    onClick?: () => void;
    onEdit?: (project: Project) => void;
    onDelete?: (project: Project) => void;
}

// ============================================================================
// Helpers
// ============================================================================

const STATUS_CONFIG: Record<string, { icon: typeof Activity; label: string }> = {
    active: { icon: Activity, label: "Activo" },
    completed: { icon: CheckCircle, label: "Completado" },
    planning: { icon: Clock, label: "Planificación" },
    inactive: { icon: CircleOff, label: "Inactivo" },
};

// ============================================================================
// Component
// ============================================================================

export const ProjectListItem = memo(function ProjectListItem({
    project,
    className,
    onClick,
    onEdit,
    onDelete,
}: ProjectListItemProps) {
    const detailHref = `/organization/projects/${project.id}` as any;
    const t = useTranslations("Project.status");

    const palette = project.image_palette;
    const hasPalette = !!(palette && (palette.primary || palette.secondary || palette.background || palette.accent));

    // Project dot color
    const dotColor = (project.use_custom_color && project.custom_color_hex) || project.color || null;

    const location = [project.city, project.country].filter(Boolean).join(", ");

    // Construct image URL
    const imageUrl = project.image_bucket && project.image_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${project.image_bucket}/${project.image_path}`
        : project.image_url;

    // Translated status
    const statusKey = (project.status?.toLowerCase() || "active") as string;
    const statusLabel = t(statusKey) || project.status;
    const StatusIcon = STATUS_CONFIG[statusKey]?.icon || Activity;

    // Date
    const createdDate = project.created_at ? parseDateFromDB(project.created_at) : null;

    // ── Palette-driven tokens (same as card) ──────────────────────────────
    const swatchColors = hasPalette
        ? [palette.primary, palette.secondary, palette.accent, palette.background].filter(Boolean)
        : [];

    // Badge styling
    const badgeBg = hasPalette && palette.primary
        ? `color-mix(in oklch, ${palette.primary} 20%, #1a1a1a)`
        : "rgba(255,255,255,0.08)";
    const badgeColor = hasPalette && palette.primary
        ? `color-mix(in oklch, ${palette.primary} 60%, white)`
        : undefined;

    // Gradient overlay — uses accent (3rd swatch = most characteristic/deep color)
    const gradientOverlay = hasPalette && palette.accent
        ? [
            `linear-gradient(to right,`,
            `color-mix(in oklch, ${palette.accent} 50%, #0a0a0a) 0%,`,
            `color-mix(in oklch, ${palette.accent} 30%, rgba(0,0,0,0.85)) 40%,`,
            `rgba(0,0,0,0.6) 70%,`,
            `transparent 100%)`,
        ].join(" ")
        : "linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.4) 70%, transparent 100%)";

    // Card border
    const cardBorder = hasPalette && palette.primary
        ? `1px solid color-mix(in oklch, ${palette.primary} 20%, transparent)`
        : undefined;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            className={cn(
                "relative overflow-hidden rounded-xl cursor-pointer group",
                "h-[100px] w-full",
                "transition-all duration-200 ease-out",
                "hover:brightness-110 hover:shadow-lg",
                !hasPalette && "bg-card border border-border",
                className
            )}
            style={{
                border: cardBorder,
            }}
        >
            {/* Background Image — fills entire item */}
            {imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={project.name}
                    fill
                    unoptimized
                    className="object-cover"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-end pr-8 bg-muted/10">
                    <ImageOff className="h-8 w-8 text-muted-foreground/15" />
                </div>
            )}

            {/* Gradient overlay — left to right (content readable on left) */}
            <div
                className="absolute inset-0"
                style={{ background: gradientOverlay }}
            />

            {/* Content Layer */}
            <div className="relative z-10 h-full flex items-center px-5 gap-4">
                {/* Left: Name + Location */}
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                        {dotColor && (
                            <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/30 shadow"
                                style={{ backgroundColor: dotColor }}
                            />
                        )}
                        <h3 className="text-sm font-semibold text-white leading-tight truncate">
                            {project.name}
                        </h3>
                    </div>
                    {location && (
                        <p className={cn(
                            "text-xs text-white/60 flex items-center gap-1",
                            dotColor && "ml-[18px]"
                        )}>
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{location}</span>
                        </p>
                    )}
                    {createdDate && (
                        <p className={cn(
                            "text-xs text-white/40",
                            dotColor && "ml-[18px]"
                        )}>
                            {format(createdDate, "dd MMM yyyy", { locale: es })}
                        </p>
                    )}
                </div>

                {/* Center: Badges */}
                <div className="hidden md:flex items-center gap-2 shrink-0">
                    {/* Status */}
                    <div
                        className="flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1"
                        style={{ backgroundColor: badgeBg, color: badgeColor }}
                    >
                        <StatusIcon className="h-3 w-3" />
                        <span>{statusLabel}</span>
                    </div>

                    {/* Type */}
                    {project.project_type_name && (
                        <div
                            className="flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1"
                            style={{ backgroundColor: badgeBg, color: badgeColor }}
                        >
                            <Building2 className="h-3 w-3" />
                            <span>{project.project_type_name}</span>
                        </div>
                    )}

                    {/* Modality */}
                    {project.project_modality_name && (
                        <div
                            className="flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1"
                            style={{ backgroundColor: badgeBg, color: badgeColor }}
                        >
                            <Hammer className="h-3 w-3" />
                            <span>{project.project_modality_name}</span>
                        </div>
                    )}
                </div>

                {/* Right: Date + Actions */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* Action Menu */}
                    {(onEdit || onDelete) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                }} asChild>
                                    <Link href={detailHref}>
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Editar
                                    </Link>
                                </DropdownMenuItem>
                                {onEdit && (
                                    <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(project);
                                    }}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edición Rápida
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
            </div>

            {/* Swatch Bar — bottom edge */}
            {swatchColors.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 flex h-1 z-10">
                    {swatchColors.map((color, i) => (
                        <div
                            key={i}
                            className="flex-1"
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});
