"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter, usePathname } from "@/i18n/routing";
import { usePathname as useNextPathname } from "next/navigation";
import { ChevronsUpDown, Check, Plus, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayoutData } from "@/hooks/use-layout-data";
import { useActiveProjectId, useLayoutActions } from "@/stores/layout-store";
import { useThemeCustomization } from "@/stores/theme-store";

// ============================================================================
// SIDEBAR PROJECT SELECTOR
// ============================================================================
// Renders below the org selector in the sidebar.
// Shows "General" (no project context) or the active project name.
// Popover opens to the right with project list.
// ============================================================================

// Preset colors for projects
const PROJECT_COLORS: Record<string, string> = {
    red: '#ef4444', orange: '#f97316', amber: '#f59e0b', yellow: '#eab308',
    lime: '#84cc16', green: '#22c55e', emerald: '#10b981', teal: '#14b8a6',
    cyan: '#06b6d4', sky: '#0ea5e9', blue: '#3b82f6', indigo: '#6366f1',
    violet: '#8b5cf6', purple: '#a855f7', fuchsia: '#d946ef', pink: '#ec4899',
    rose: '#f43f5e',
};

interface ProjectLike {
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

function getProjectColor(project: ProjectLike | null): string {
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

interface SidebarProjectSelectorProps {
    isExpanded?: boolean;
}

export function SidebarProjectSelector({ isExpanded = true }: SidebarProjectSelectorProps) {
    const [open, setOpen] = React.useState(false);
    const pathname = useNextPathname();
    const router = useRouter();

    // Get data
    const { projects, saveProjectPreference, handleProjectChange: sidebarProjectChange } = useLayoutData();
    const activeProjectId = useActiveProjectId();
    const { setActiveProjectId } = useLayoutActions();
    const { resolveThemeForProject, resetTheme } = useThemeCustomization();

    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/)/, '');
    const isOrgRoute = pathWithoutLocale.startsWith('/organization') || pathWithoutLocale.startsWith('/organizacion');
    const isProjectDetailPage = /\/(?:organization|organizacion)\/(?:projects|proyectos)\/[^/]+/.test(pathWithoutLocale);

    // Hide if not org route
    if (!isOrgRoute) return null;

    const activeProjects = (projects || []).filter((p: ProjectLike) => !p.status || p.status === 'active' || p.status === 'planning');
    const selectedProject = activeProjectId
        ? activeProjects.find((p: ProjectLike) => p.id === activeProjectId) || null
        : null;

    const handleSelectGeneral = () => {
        setActiveProjectId(null);
        resetTheme();
        setOpen(false);
    };

    const handleSelectProject = (projectId: string) => {
        setActiveProjectId(projectId);
        saveProjectPreference(projectId);
        sidebarProjectChange(projectId);

        const project = activeProjects.find((p: ProjectLike) => p.id === projectId);
        if (project) {
            resolveThemeForProject(project);
        }

        // Context-aware redirect: if on project detail page, navigate to the new project
        if (isProjectDetailPage) {
            router.push({ pathname: '/organization/projects/[projectId]', params: { projectId } });
        }

        setOpen(false);
    };

    const handleNewProject = () => {
        setOpen(false);
        router.push('/organization/projects');
    };

    const renderProjectAvatar = (project: ProjectLike, size: 'sm' | 'md' = 'sm') => {
        const color = getProjectColor(project);
        const isMd = size === 'md';
        if (isMd) {
            // Inset/recessed circle for trigger
            return (
                <div className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center bg-black/20 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.35),inset_0_0.5px_1px_rgba(0,0,0,0.25)] border border-white/[0.04]">
                    {project.image_path ? (
                        <Avatar className="h-6 w-6 rounded-full">
                            <AvatarImage src={project.image_path} alt={project.name} className="rounded-full" />
                            <AvatarFallback delayMs={0} className="rounded-full bg-transparent font-bold text-[10px]" style={{ color }}>
                                {getInitials(project.name)}
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <span className="font-bold text-[11px]" style={{ color }}>
                            {getInitials(project.name)}
                        </span>
                    )}
                </div>
            );
        }
        // Small size for popover list
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
    };

    // Collapsed sidebar: just show icon
    if (!isExpanded) {
        return (
            <div className="flex items-center justify-center w-full">
                {selectedProject ? (
                    renderProjectAvatar(selectedProject)
                ) : (
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                )}
            </div>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-2.5 rounded-xl transition-all cursor-pointer",
                        "w-full px-2 py-1.5",
                        "bg-white/[0.03] border border-white/[0.08]",
                        "shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.2)]",
                        "hover:bg-white/[0.05] hover:border-white/[0.11]",
                        "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_3px_8px_rgba(0,0,0,0.35),0_1px_3px_rgba(0,0,0,0.25)]",
                        "text-sidebar-foreground",
                        open && "bg-white/[0.05] border-white/[0.11]"
                    )}
                >
                    {selectedProject ? (
                        <>
                            {renderProjectAvatar(selectedProject, 'md')}
                            <div className="flex flex-col items-start flex-1 min-w-0">
                                <span className="text-sm font-semibold truncate w-full text-left leading-tight">
                                    {selectedProject.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground leading-tight truncate w-full text-left">
                                    {selectedProject.status === 'active' ? 'Activo' : selectedProject.status === 'planning' ? 'Planificación' : selectedProject.status === 'completed' ? 'Completado' : 'Proyecto'}
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-black/20 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.35),inset_0_0.5px_1px_rgba(0,0,0,0.25)] border border-white/[0.04]">
                                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex flex-col items-start flex-1 min-w-0">
                                <span className="text-sm font-semibold truncate w-full text-left leading-tight text-muted-foreground">
                                    General
                                </span>
                                <span className="text-[11px] text-muted-foreground/60 leading-tight">
                                    Sin proyecto
                                </span>
                            </div>
                        </>
                    )}
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                </button>
            </PopoverTrigger>

            <PopoverContent
                side="right"
                align="start"
                sideOffset={12}
                className="w-[240px] p-0"
            >
                <div className="flex flex-col max-h-[320px]">
                    {/* Scrollable: General + projects */}
                    <div className="overflow-y-auto p-1.5 flex-1 min-h-0">
                        {/* "General" option */}
                        <button
                            onClick={handleSelectGeneral}
                            className={cn(
                                "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-secondary transition-colors",
                                !activeProjectId && "bg-secondary"
                            )}
                        >
                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 text-left">General</span>
                            {!activeProjectId && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
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
                                                "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-secondary transition-colors",
                                                isActive && "bg-secondary"
                                            )}
                                        >
                                            {renderProjectAvatar(project)}
                                            <span className="truncate flex-1 text-left">{project.name}</span>
                                            {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                                        </button>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {/* Fixed bottom: New Project */}
                    <div className="border-t p-1.5 shrink-0">
                        <button
                            onClick={handleNewProject}
                            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Nuevo Proyecto</span>
                        </button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
