"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, Briefcase, Check, Plus, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getStorageUrl } from "@/lib/storage-utils";
import { useSidebarData } from "@/hooks/use-sidebar-data";
import { useLayoutStore, useActiveProjectId, useLayoutActions } from "@/stores/layout-store";

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

// ============================================================================
// HEADER ORG/PROJECT SELECTOR
// ============================================================================

export function HeaderOrgProjectSelector() {
    const [open, setOpen] = React.useState(false);
    const pathname = usePathname();

    // Get data from the same hook used by sidebar
    const { currentOrg, projects, saveProjectPreference, handleProjectChange: sidebarProjectChange } = useSidebarData();
    const showProjectAvatar = useLayoutStore(s => s.sidebarProjectAvatars);
    const activeProjectId = useActiveProjectId();
    const { setActiveProjectId } = useLayoutActions();

    // Only show in org/project routes
    const isOrgOrProject = pathname.includes('/organization') || pathname.includes('/organizacion') ||
        pathname.includes('/project') || pathname.includes('/proyecto');

    if (!isOrgOrProject || !currentOrg) return null;

    const activeProjects = (projects || []).filter((p: ProjectLike) => !p.status || p.status === 'active');
    const selectedProject = activeProjectId
        ? activeProjects.find(p => p.id === activeProjectId) || null
        : null;

    const logoSrc = currentOrg?.logo_path
        ? (currentOrg.logo_path.startsWith('http') ? currentOrg.logo_path : getStorageUrl(currentOrg.logo_path, 'public-assets'))
        : null;

    const handleSelectOrg = () => {
        setActiveProjectId(null);
        setOpen(false);
    };

    const handleSelectProject = (projectId: string) => {
        setActiveProjectId(projectId);
        saveProjectPreference(projectId);
        sidebarProjectChange(projectId);
        setOpen(false);
    };

    const renderProjectAvatar = (project: ProjectLike | null, size: "sm" | "xs" = "sm") => {
        const sizeClass = size === "xs" ? "h-4 w-4" : "h-5 w-5";
        const textSize = size === "xs" ? "text-[7px]" : "text-[8px]";
        const color = getProjectColor(project);

        return (
            <Avatar className={cn(sizeClass, "rounded")}>
                {showProjectAvatar && project?.image_path && (
                    <AvatarImage src={project.image_path} alt={project?.name || ""} />
                )}
                <AvatarFallback
                    delayMs={0}
                    className={cn(textSize, "rounded font-bold")}
                    style={{
                        backgroundColor: `${color}25`,
                        color: color,
                        border: `1px solid ${color}40`
                    }}
                >
                    {getInitials(project?.name || "")}
                </AvatarFallback>
            </Avatar>
        );
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-2 h-8 px-2.5 rounded-md transition-colors",
                        "hover:bg-secondary/80 text-foreground",
                        "border border-border/50",
                        open && "bg-secondary/80"
                    )}
                >
                    {/* Context label */}
                    <span className="text-xs text-muted-foreground/70 mr-0.5">Contexto:</span>

                    {/* Org avatar */}
                    <div className="relative">
                        <Avatar className="h-5 w-5 rounded">
                            {logoSrc && <AvatarImage src={logoSrc} alt={currentOrg.name} />}
                            <AvatarFallback className="text-[8px] rounded bg-primary/10 text-primary font-semibold">
                                {getInitials(currentOrg.name)}
                            </AvatarFallback>
                        </Avatar>
                        {currentOrg.isFounder && (
                            <Crown className="absolute -top-1 -right-1 h-2.5 w-2.5 text-amber-500 fill-amber-400" />
                        )}
                    </div>

                    {/* Active selection name */}
                    <span className="text-sm font-medium whitespace-nowrap">
                        {selectedProject ? selectedProject.name : currentOrg.name}
                    </span>

                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>
            </PopoverTrigger>

            <PopoverContent
                side="bottom"
                align="end"
                sideOffset={8}
                className="w-[240px] p-2"
            >
                {/* Organization option — clickeable */}
                <button
                    onClick={handleSelectOrg}
                    className={cn(
                        "flex items-center gap-2 w-full px-2 py-2 mb-1 rounded-md hover:bg-secondary transition-colors",
                        !activeProjectId && "bg-secondary"
                    )}
                >
                    <Avatar className="h-5 w-5 rounded">
                        {logoSrc && <AvatarImage src={logoSrc} alt={currentOrg.name} />}
                        <AvatarFallback className="text-[8px] rounded bg-primary/10 text-primary font-semibold">
                            {getInitials(currentOrg.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 flex-1 text-left">
                        <span className="text-xs text-muted-foreground">Organización</span>
                        <span className="text-sm font-medium truncate">{currentOrg.name}</span>
                    </div>
                    {!activeProjectId && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>

                {/* Projects Section */}
                <div>
                    <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <Briefcase className="h-3 w-3" />
                        Proyectos activos
                    </div>
                    <ScrollArea className="max-h-[200px]">
                        {activeProjects.length === 0 ? (
                            <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                                No hay proyectos
                            </div>
                        ) : (
                            activeProjects.map((project: ProjectLike) => {
                                const isActive = activeProjectId === project.id;
                                return (
                                    <button
                                        key={project.id}
                                        onClick={() => handleSelectProject(project.id)}
                                        className={cn(
                                            "flex items-center gap-2 w-full px-2 py-2 text-sm rounded-md hover:bg-secondary transition-colors",
                                            isActive && "bg-secondary"
                                        )}
                                    >
                                        {renderProjectAvatar(project)}
                                        <span className="truncate flex-1 text-left">{project.name}</span>
                                        {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                                    </button>
                                );
                            })
                        )}
                    </ScrollArea>

                    {/* New Project Button */}
                    <Link
                        href="/organization/projects"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 w-full px-2 py-2 text-sm rounded-md hover:bg-secondary transition-colors text-muted-foreground mt-1"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Nuevo proyecto</span>
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}
