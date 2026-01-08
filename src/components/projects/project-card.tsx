"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Calendar, Building2, Hammer, ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";

interface ProjectCardProps {
    project: {
        id: string;
        name: string;
        status: string;
        image_url?: string | null;
        image_bucket?: string | null;
        image_path?: string | null;
        project_type_name?: string | null;
        project_modality_name?: string | null;
        city?: string | null;
        country?: string | null;
        start_date?: string | null;
        color?: string | null;
        custom_color_hex?: string | null;
        use_custom_color?: boolean;
    };
    className?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    "Activo": { bg: "bg-emerald-500/20", text: "text-emerald-400" },
    "Finalizado": { bg: "bg-blue-500/20", text: "text-blue-400" },
    "Detenido": { bg: "bg-amber-500/20", text: "text-amber-400" },
    "Cancelado": { bg: "bg-red-500/20", text: "text-red-400" },
};

/**
 * ProjectCard - A beautiful card component for displaying project information
 * Features a hero image with gradient overlay, project name, and key metadata badges
 */
export function ProjectCard({ project, className }: ProjectCardProps) {
    const locale = useLocale();
    const statusStyle = STATUS_COLORS[project.status] || { bg: "bg-muted", text: "text-muted-foreground" };

    // Get accent color for the card
    const accentColor = project.use_custom_color && project.custom_color_hex
        ? project.custom_color_hex
        : project.color || "hsl(var(--primary))";

    const location = [project.city, project.country].filter(Boolean).join(", ");

    // Construct image URL from bucket + path, or use direct image_url
    const imageUrl = project.image_bucket && project.image_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${project.image_bucket}/${project.image_path}`
        : project.image_url;

    return (
        <Link href={`/${locale}/project/${project.id}`} className="block group">
            <Card className={cn(
                "relative overflow-hidden rounded-xl border-0 shadow-lg",
                "transition-all duration-300 ease-out",
                "hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1",
                "bg-card",
                className
            )}>
                {/* Hero Image Section */}
                <div className="relative h-40 w-full overflow-hidden">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={project.name}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
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

                    {/* Status Badge - Top Right */}
                    <Badge
                        className={cn(
                            "absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 border-0",
                            statusStyle.bg,
                            statusStyle.text
                        )}
                    >
                        {project.status}
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

                {/* Metadata Section */}
                <div className="p-4 space-y-3">
                    {/* Info Chips */}
                    <div className="flex flex-wrap gap-2">
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
                </div>
            </Card>
        </Link>
    );
}
