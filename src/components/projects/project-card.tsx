"use client";

import { Project } from "@/types/project";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Calendar, Building2, Hammer, ImageOff, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectCardProps {
    project: Project;
    className?: string;
    onEdit?: (project: Project) => void;
    onDelete?: (project: Project) => void;
}

// Spanish translations for status
const STATUS_LABELS: Record<string, string> = {
    "active": "Activo",
    "completed": "Completado",
    "paused": "Pausado",
    "cancelled": "Cancelado",
    "Activo": "Activo",
    "Finalizado": "Completado",
    "Detenido": "Pausado",
    "Cancelado": "Cancelado",
};

/**
 * ProjectCard - A beautiful card component for displaying project information
 * Features a hero image with gradient overlay, project name, and key metadata badges
 */
export function ProjectCard({ project, className, onEdit, onDelete }: ProjectCardProps) {
    const locale = useLocale();

    // Get accent color for the card
    const accentColor = project.use_custom_color && project.custom_color_hex
        ? project.custom_color_hex
        : project.color || "hsl(var(--primary))";

    const location = [project.city, project.country].filter(Boolean).join(", ");

    // Construct image URL from bucket + path, or use direct image_url
    const imageUrl = project.image_bucket && project.image_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${project.image_bucket}/${project.image_path}`
        : project.image_url;

    // Get translated status
    const statusLabel = STATUS_LABELS[project.status] || project.status;

    const handleActionClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <Link href={`/${locale}/project/${project.id}`} className="block group">
            <Card className={cn(
                "relative overflow-hidden rounded-xl border-0 shadow-lg",
                "transition-all duration-300 ease-out",
                "hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1",
                "bg-card",
                className
            )}>
                {/* Hero Image Section - 1.5x taller (h-60 instead of h-40) */}
                <div className="relative h-60 w-full overflow-hidden">
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

                    {/* Status Badge - Top Right - Uses project color */}
                    <Badge
                        className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 border-0 shadow-lg"
                        style={{
                            backgroundColor: `color-mix(in srgb, ${accentColor} 25%, transparent)`,
                            color: accentColor,
                            backdropFilter: "blur(8px)",
                        }}
                    >
                        {statusLabel}
                    </Badge>

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
                    {/* Info Chips */}
                    <div className="flex flex-wrap gap-2 flex-1">
                        {project.project_type_name && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1">
                                <Building2 className="h-3 w-3" />
                                <span>{project.project_type_name}</span>
                            </div>
                        )}
                        {project.project_modality_name && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1">
                                <Hammer className="h-3 w-3" />
                                <span>{project.project_modality_name}</span>
                            </div>
                        )}
                        {project.start_date && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(project.start_date).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}</span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons - Visible on Hover */}
                    {(onEdit || onDelete) && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1" onClick={handleActionClick}>
                            {onEdit && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => onEdit(project)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => onDelete(project)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </Link>
    );
}

