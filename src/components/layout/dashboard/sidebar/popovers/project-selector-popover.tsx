"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "@/i18n/routing";
import { Check, FolderKanban, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayoutData } from "@/hooks/use-layout-data";
import { useActiveProjectId, useLayoutActions } from "@/stores/layout-store";
import { useThemeCustomization } from "@/stores/theme-store";
import { usePathname as useNextPathname } from "next/navigation";

// ============================================================================
// PROJECT SELECTOR POPOVER — Content + Logic
// ============================================================================
// Contains: project list, "General" option, project switching, theme resolution.
// Used by: SidebarProjectSelector (composes trigger + this popover content).
// ============================================================================

const PROJECT_COLORS: Record<string, string> = {
    red: '#ef4444', orange: '#f97316', amber: '#f59e0b', yellow: '#eab308',
    lime: '#84cc16', green: '#22c55e', emerald: '#10b981', teal: '#14b8a6',
    cyan: '#06b6d4', sky: '#0ea5e9', blue: '#3b82f6', indigo: '#6366f1',
    violet: '#8b5cf6', purple: '#a855f7', fuchsia: '#d946ef', pink: '#ec4899',
    rose: '#f43f5e',
};

export interface ProjectLike {
    id: string;
    name: string;
    color?: string | null;
    custom_color_hex?: string | null;
    use_custom_color?: boolean;
    image_path?: string | null;
    status?: string | null;
    image_palette?: {
        primary?: string;
        secondary?: string;
        accent?: string;
        background?: string;
    } | null;
    use_palette_theme?: boolean;
}

export function getProjectColor(project: ProjectLike | null): string {
    if (!project) return '#6b7280';
    if (project.use_custom_color && project.custom_color_hex) return project.custom_color_hex;
    if (project.color) {
        const key = project.color.toLowerCase();
        if (PROJECT_COLORS[key]) return PROJECT_COLORS[key];
        if (project.color.startsWith('#')) return project.color;
    }
    return '#6b7280';
}

function getInitials(name: string) {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "??";
}

export function renderProjectAvatar(project: ProjectLike, size: 'sm' | 'md' = 'sm') {
    const color = getProjectColor(project);
    const isMd = size === 'md';
    if (isMd) {
        return (
            project.image_path ? (
                <Avatar className="h-8 w-8 rounded-full shrink-0">
                    <AvatarImage src={project.image_path} alt={project.name} className="rounded-full" />
                    <AvatarFallback delayMs={0} className="rounded-full bg-primary/10 font-bold text-[10px]" style={{ color }}>
                        {getInitials(project.name)}
                    </AvatarFallback>
                </Avatar>
            ) : (
                <div className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center bg-primary/10">
                    <span className="font-bold text-[11px]" style={{ color }}>
                        {getInitials(project.name)}
                    </span>
                </div>
            )
        );
    }
    return (
        <Avatar className="h-5 w-5 rounded-full shrink-0">
            {project.image_path && (
                <AvatarImage src={project.image_path} alt={project.name} className="rounded-full" />
            )}
            <AvatarFallback
                delayMs={0}
                className="rounded-full font-bold text-[8px]"
                style={{
                    backgroundColor: `${color}25`,
                    color: color,
                    border: `1px solid ${color}40`
                }}
            >
                {getInitials(project.name)}
            </AvatarFallback>
        </Avatar>
    );
}

interface ProjectSelectorPopoverProps {
    onClose: () => void;
}

export function ProjectSelectorPopover({ onClose }: ProjectSelectorPopoverProps) {
    const pathname = useNextPathname();
    const router = useRouter();
    const { projects, saveProjectPreference, handleProjectChange: sidebarProjectChange } = useLayoutData();
    const activeProjectId = useActiveProjectId();
    const { setActiveProjectId } = useLayoutActions();
    const { resolveThemeForProject, resetTheme } = useThemeCustomization();

    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/)/, '');
    const isProjectDetailPage = /\/(?:organization|organizacion)\/(?:projects|proyectos)\/[^/]+/.test(pathWithoutLocale);

    const activeProjects = (projects || []).filter((p: ProjectLike) => !p.status || p.status === 'active' || p.status === 'planning');

    const handleSelectGeneral = () => {
        setActiveProjectId(null);
        resetTheme();
        onClose();
    };

    const handleSelectProject = (projectId: string) => {
        setActiveProjectId(projectId);
        saveProjectPreference(projectId);
        sidebarProjectChange(projectId);

        const project = activeProjects.find((p: ProjectLike) => p.id === projectId);
        if (project) {
            resolveThemeForProject(project);
        }

        if (isProjectDetailPage) {
            router.push({ pathname: '/organization/projects/[projectId]', params: { projectId } });
        }

        onClose();
    };

    const handleNewProject = () => {
        onClose();
        router.push('/organization/projects');
    };

    return (
        <div className="flex flex-col max-h-[320px]">
            {/* Scrollable: General + projects */}
            <div className="overflow-y-auto p-1.5 flex-1 min-h-0">
                {/* "General" option */}
                <button
                    onClick={handleSelectGeneral}
                    className={cn(
                        "flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded-md hover:bg-secondary transition-colors",
                        !activeProjectId && "bg-secondary"
                    )}
                >
                    <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1 text-left">General</span>
                    {!activeProjectId && <Check className="h-3 w-3 text-muted-foreground shrink-0" />}
                </button>

                {/* Project list */}
                {activeProjects.length > 0 && (
                    <>
                        <div className="border-t my-1" />
                        {activeProjects.map((project: ProjectLike) => {
                            const isActive = activeProjectId === project.id;
                            return (
                                <button
                                    key={project.id}
                                    onClick={() => handleSelectProject(project.id)}
                                    className={cn(
                                        "flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded-md hover:bg-secondary transition-colors",
                                        isActive && "bg-secondary"
                                    )}
                                >
                                    {renderProjectAvatar(project)}
                                    <span className="truncate flex-1 text-left">{project.name}</span>
                                    {isActive && <Check className="h-3 w-3 text-muted-foreground shrink-0" />}
                                </button>
                            );
                        })}
                    </>
                )}
            </div>

            {/* Fixed bottom: Manage Projects */}
            <div className="border-t p-1.5 shrink-0">
                <button
                    onClick={handleNewProject}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Gestionar proyectos</span>
                </button>
            </div>
        </div>
    );
}
