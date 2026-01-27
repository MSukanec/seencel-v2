"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, Clock } from "lucide-react";
import type { BlockConfig } from "../../views/reports-builder-view";

interface ProjectSummaryBlockProps {
    config: BlockConfig;
    projects: { id: string; name: string; status: string }[];
}

const STATUS_COLORS: Record<string, string> = {
    active: "bg-green-500/10 text-green-600",
    paused: "bg-yellow-500/10 text-yellow-600",
    completed: "bg-blue-500/10 text-blue-600",
    archived: "bg-gray-500/10 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
    active: "Activo",
    paused: "Pausado",
    completed: "Completado",
    archived: "Archivado",
};

export function ProjectSummaryBlock({ config, projects }: ProjectSummaryBlockProps) {
    const { title, projectIds } = config;

    // Filter selected projects or show all
    const selectedProjects = projectIds && projectIds.length > 0
        ? projects.filter(p => projectIds.includes(p.id))
        : projects.slice(0, 3); // Show first 3 by default

    return (
        <div className="space-y-3">
            {title && (
                <h4 className="font-semibold text-sm">{title}</h4>
            )}

            {selectedProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                    No hay proyectos seleccionados
                </p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedProjects.map((project) => (
                        <Card key={project.id} className="bg-muted/30">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Building2 className="h-4 w-4 text-primary" />
                                        </div>
                                        <h5 className="font-medium text-sm truncate">
                                            {project.name}
                                        </h5>
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className={STATUS_COLORS[project.status] || STATUS_COLORS.active}
                                    >
                                        {STATUS_LABELS[project.status] || project.status}
                                    </Badge>
                                </div>

                                {/* Mock metrics */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <TrendingUp className="h-3 w-3" />
                                        <span>75% avance</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span>45 días rest.</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
