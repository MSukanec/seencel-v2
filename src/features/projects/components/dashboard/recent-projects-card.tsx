"use client";

import { LayoutGrid, ArrowRight, Briefcase } from "lucide-react";
import { Link } from "@/i18n/routing";
import { ProjectCard } from "@/features/projects/components/project-card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import type { DashboardProject } from "@/features/organization/types";

interface RecentProjectsCardProps {
    projects: DashboardProject[];
    className?: string;
}

export function RecentProjectsCard({ projects, className }: RecentProjectsCardProps) {
    const recentProjects = projects.slice(0, 3);

    return (
        <DashboardCard
            title="Proyectos Recientes"
            description="Los últimos 3 proyectos activos"
            icon={<LayoutGrid className="w-4 h-4" />}
            className={className}
            headerAction={
                <Link
                    href="/organization/projects"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                    Ver Todos
                    <ArrowRight className="h-3 w-3" />
                </Link>
            }
        >
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
                        <ProjectCard key={project.id} project={project as any} />
                    ))}
                </div>
            )}
        </DashboardCard>
    );
}

