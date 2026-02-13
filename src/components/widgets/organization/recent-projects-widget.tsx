"use client";

import { useEffect, useState } from "react";
import { getRecentProjects, RecentProject } from "@/actions/widget-actions";
import { WidgetProps } from "@/components/widgets/grid/types";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetEmptyState } from "@/components/widgets/grid/widget-empty-state";
import { MapPin, ImageOff, FolderKanban } from "lucide-react";
import Image from "next/image";
import { useLayoutStore } from "@/stores/layout-store";

// ============================================================================
// RECENT PROJECTS WIDGET
// ============================================================================
// Shows the 2 most recently active projects as hero image cards.
// Autonomous: fetches its own data via server action.
// ============================================================================

export function RecentProjectsWidget({ size, initialData }: WidgetProps) {
    const [projects, setProjects] = useState<RecentProject[] | null>(
        initialData ?? null
    );
    const { actions } = useLayoutStore();

    // Only fetch client-side if no initialData was provided (fallback for dynamic adds)
    useEffect(() => {
        if (initialData) return;
        getRecentProjects(2).then((data) => {
            setProjects(data);
        });
    }, [initialData]);

    const handleClick = (projectId: string) => {
        actions.setActiveContext("organization");
        actions.setActiveProjectId(projectId);
    };

    return (
        <div className="h-full flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                <div className="p-1.5 rounded-md bg-primary/10">
                    <FolderKanban className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold leading-none">
                        Proyectos Activos Recientes
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        Tus proyectos activos más recientes
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3">
                {projects === null ? (
                    <RecentProjectsSkeleton />
                ) : projects.length === 0 ? (
                    <WidgetEmptyState
                        icon={FolderKanban}
                        title="Sin proyectos"
                        description="Creá tu primer proyecto para empezar"
                        href="/organization/projects"
                        actionLabel="Ver proyectos"
                    />
                ) : (
                    <div className="flex flex-col gap-3 h-full">
                        {projects.map((project) => (
                            <ProjectHeroCard
                                key={project.id}
                                project={project}
                                onClick={() => handleClick(project.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// PROJECT HERO CARD (image + gradient + name + location)
// ============================================================================

function ProjectHeroCard({
    project,
    onClick,
}: {
    project: RecentProject;
    onClick: () => void;
}) {
    const imageUrl = project.image_bucket && project.image_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${project.image_bucket}/${project.image_path}`
        : project.image_url;

    const accentColor = project.image_palette?.primary
        || (project.use_custom_color && project.custom_color_hex)
        || project.color
        || "hsl(var(--primary))";

    const location = [project.city, project.country].filter(Boolean).join(", ");

    return (
        <div
            role="button"
            tabIndex={0}
            className="block group flex-1 cursor-pointer"
            onClick={onClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
        >
            <div className="relative w-full h-full min-h-[100px] rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
                {/* Image or Fallback */}
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
                        <ImageOff className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Name & Location */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
                        {project.name}
                    </h3>
                    {location && (
                        <p className="text-[11px] text-white/70 mt-0.5 flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />
                            {location}
                        </p>
                    )}
                </div>

                {/* Accent Bar */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: accentColor as string }}
                />
            </div>
        </div>
    );
}

// ============================================================================
// SKELETON
// ============================================================================

function RecentProjectsSkeleton() {
    return (
        <div className="flex flex-col gap-3 h-full">
            {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="flex-1 w-full min-h-[100px] rounded-xl" />
            ))}
        </div>
    );
}
