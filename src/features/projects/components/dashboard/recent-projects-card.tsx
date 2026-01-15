"use client";

import { LayoutGrid, ArrowRight, Briefcase } from "lucide-react";
import { Link } from "@/i18n/routing";
import { ProjectCard } from "@/features/projects/components/project-card";
import { cn } from "@/lib/utils";

export function RecentProjectsCard({ projects, className }: { projects: any[], className?: string }) {
    const recentProjects = projects.slice(0, 3);

    return (
        <div className={cn("rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col h-full", className)}>
            {/* Header */}
            <div className="p-6 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <LayoutGrid className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Proyectos Recientes</h3>
                        <p className="text-xs text-muted-foreground">Los últimos 3 proyectos activos</p>
                    </div>
                </div>
                <Link
                    href="/organization/projects"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                    Ver Todos
                    <ArrowRight className="h-3 w-3" />
                </Link>
            </div>

            {/* Content */}
            <div className="p-6 flex-1">
                {recentProjects.length === 0 ? (
                    <div className="text-center py-8 h-full flex flex-col items-center justify-center">
                        <Briefcase className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
                        <p className="text-sm text-muted-foreground">Sin proyectos activos.</p>
                        <Link
                            href="/organization/projects"
                            className="text-xs text-primary hover:underline mt-2 inline-block"
                        >
                            Crear un proyecto
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentProjects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
