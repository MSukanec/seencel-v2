"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { ChevronDown, Check, Plus, Building2, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLayoutData } from "@/hooks/use-layout-data";
import { useActiveProjectId, useLayoutActions } from "@/stores/layout-store";
import { useThemeCustomization } from "@/stores/theme-store";
import { switchOrganization, fetchUserOrganizationsLight } from "@/features/organization/actions";

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

// ============================================================================
// LIGHTWEIGHT ORG TYPE
// ============================================================================

interface LightOrg {
    id: string;
    name: string;
    logo_url: string | null;
}

// ============================================================================
// ORG SELECTOR (Breadcrumb segment)
// ============================================================================

function OrgSelector({ currentOrg }: { currentOrg: { id: string; name: string; logo_url?: string | null } }) {
    const [open, setOpen] = React.useState(false);
    const [orgs, setOrgs] = React.useState<LightOrg[]>([]);
    const [loaded, setLoaded] = React.useState(false);
    const [isSwitching, setIsSwitching] = React.useState(false);
    const router = useRouter();

    // Fetch orgs lazily when popover opens
    React.useEffect(() => {
        if (open && !loaded) {
            fetchUserOrganizationsLight().then(data => {
                setOrgs(data);
                setLoaded(true);
            });
        }
    }, [open, loaded]);

    const handleSelectOrg = async (orgId: string) => {
        if (orgId === currentOrg.id) {
            setOpen(false);
            return;
        }
        setOpen(false);
        setIsSwitching(true);
        try {
            await switchOrganization(orgId);
        } catch {
            // switchOrganization does a redirect, so this is expected
        }
    };

    const handleNewOrg = () => {
        setOpen(false);
        router.push('/workspace-setup');
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-1.5 h-7 px-2 rounded-md transition-colors",
                        "hover:bg-secondary/80 text-foreground",
                        open && "bg-secondary/80"
                    )}
                >
                    <Avatar className="h-4 w-4 rounded">
                        {currentOrg.logo_url && <AvatarImage src={currentOrg.logo_url} alt={currentOrg.name} />}
                        <AvatarFallback className="text-[7px] rounded bg-primary/10 text-primary font-semibold">
                            {getInitials(currentOrg.name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium whitespace-nowrap">
                        {currentOrg.name}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                </button>
            </PopoverTrigger>

            <PopoverContent
                side="bottom"
                align="start"
                sideOffset={8}
                className="w-[240px] p-0"
            >
                <div className="flex flex-col max-h-[320px]">
                    {/* Scrollable org list */}
                    <div className="overflow-y-auto p-1.5 flex-1 min-h-0">
                        {!loaded ? (
                            <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                                Cargando...
                            </div>
                        ) : (
                            orgs.map((org) => {
                                const isActive = org.id === currentOrg.id;
                                return (
                                    <button
                                        key={org.id}
                                        disabled={isSwitching}
                                        onClick={() => handleSelectOrg(org.id)}
                                        className={cn(
                                            "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-secondary transition-colors",
                                            isActive && "bg-secondary",
                                            isSwitching && "opacity-50 cursor-wait"
                                        )}
                                    >
                                        <Avatar className="h-5 w-5 rounded shrink-0">
                                            {org.logo_url && <AvatarImage src={org.logo_url} alt={org.name} />}
                                            <AvatarFallback className="text-[8px] rounded bg-primary/10 text-primary font-semibold">
                                                {getInitials(org.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="truncate flex-1 text-left">{org.name}</span>
                                        {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Fixed bottom: New Org */}
                    <div className="border-t p-1.5 shrink-0">
                        <button
                            onClick={handleNewOrg}
                            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Nueva Organización</span>
                        </button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

// ============================================================================
// PROJECT SELECTOR (Breadcrumb segment)
// ============================================================================

function ProjectSelector({
    projects,
    onProjectChange,
}: {
    projects: ProjectLike[];
    onProjectChange: (projectId: string | null) => void;
}) {
    const [open, setOpen] = React.useState(false);
    const activeProjectId = useActiveProjectId();
    const router = useRouter();
    const showProjectAvatar = true;

    const activeProjects = (projects || []).filter((p) => !p.status || p.status === 'active');
    const selectedProject = activeProjectId
        ? activeProjects.find(p => p.id === activeProjectId) || null
        : null;

    const handleSelectGeneral = () => {
        onProjectChange(null);
        setOpen(false);
    };

    const handleSelectProject = (projectId: string) => {
        onProjectChange(projectId);
        setOpen(false);
    };

    const handleNewProject = () => {
        setOpen(false);
        router.push('/organization/projects');
    };

    const renderProjectAvatar = (project: ProjectLike) => {
        const color = getProjectColor(project);
        return (
            <Avatar className="h-4 w-4 rounded">
                {showProjectAvatar && project.image_path && (
                    <AvatarImage src={project.image_path} alt={project.name} />
                )}
                <AvatarFallback
                    delayMs={0}
                    className="text-[7px] rounded font-bold"
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

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-1.5 h-7 px-2 rounded-md transition-colors",
                        "hover:bg-secondary/80 text-foreground",
                        open && "bg-secondary/80"
                    )}
                >
                    {selectedProject ? (
                        <>
                            {renderProjectAvatar(selectedProject)}
                            <span className="text-sm font-medium whitespace-nowrap">
                                {selectedProject.name}
                            </span>
                        </>
                    ) : (
                        <>
                            <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium whitespace-nowrap text-muted-foreground">
                                General
                            </span>
                        </>
                    )}
                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                </button>
            </PopoverTrigger>

            <PopoverContent
                side="bottom"
                align="start"
                sideOffset={8}
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
                                {activeProjects.map((project) => {
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

// ============================================================================
// HEADER BREADCRUMB SELECTOR (Exported)
// ============================================================================

export function HeaderOrgProjectSelector() {
    const pathname = usePathname();

    // Get org/project data
    const { currentOrg, projects, saveProjectPreference, handleProjectChange: sidebarProjectChange } = useLayoutData();
    const activeProjectId = useActiveProjectId();
    const { setActiveProjectId } = useLayoutActions();
    const { resolveThemeForProject, resetTheme } = useThemeCustomization();
    const router = useRouter();

    // ── Org-only route prefixes (project selector HIDDEN) ──
    const ORG_ONLY_PREFIXES = [
        '/organization/settings', '/organizacion/configuracion',
        '/organization/contacts', '/organizacion/contactos',
        '/organization/catalog', '/organizacion/catalogo',
        '/organization/reports', '/organizacion/informes',
        '/organization/projects', '/organizacion/proyectos',
        '/organization/team', '/organizacion/equipo',
        '/organization/capital', '/organizacion/capital',
    ];

    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/)/, '');
    const isOrgRoute = pathWithoutLocale.startsWith('/organization') || pathWithoutLocale.startsWith('/organizacion');

    const isProjectDetailPage = /\/(?:organization|organizacion)\/(?:projects|proyectos)\/[^/]+/.test(pathWithoutLocale);
    const isQuoteDetailPage = /\/(?:organization|organizacion)\/(?:quotes|cotizaciones)\/[^/]+/.test(pathWithoutLocale);

    const isOrgOnly = !isProjectDetailPage && ORG_ONLY_PREFIXES.some(prefix =>
        pathWithoutLocale === prefix || pathWithoutLocale.startsWith(prefix + '/')
    );

    // Hide completely if not an org route or no current org
    if (!isOrgRoute || !currentOrg) return null;

    // Determine which selectors to show
    const showProjectSelector = !isOrgOnly && !isQuoteDetailPage;

    const activeProjects = (projects || []).filter((p: ProjectLike) => !p.status || p.status === 'active');

    const handleProjectChange = (projectId: string | null) => {
        if (projectId === null) {
            setActiveProjectId(null);
            resetTheme();
            return;
        }

        setActiveProjectId(projectId);
        saveProjectPreference(projectId);
        sidebarProjectChange(projectId);

        const project = activeProjects.find((p: ProjectLike) => p.id === projectId);
        if (project) {
            resolveThemeForProject(project);
        }

        // Context-aware redirect: if on project detail page, navigate to the new project
        const isOnProjectDetail = /\/(?:organization|organizacion)\/(?:projects|proyectos)\/([^/]+)/.test(pathname);
        if (isOnProjectDetail) {
            router.push({ pathname: '/organization/projects/[projectId]', params: { projectId } });
        }
    };

    return (
        <div className="flex items-center gap-0">
            {/* Org Selector — always visible */}
            <OrgSelector currentOrg={currentOrg} />

            {/* Breadcrumb separator + Project Selector */}
            {showProjectSelector && (
                <>
                    <span className="text-muted-foreground/40 text-sm select-none mx-0.5">/</span>
                    <ProjectSelector
                        projects={activeProjects}
                        onProjectChange={handleProjectChange}
                    />
                </>
            )}
        </div>
    );
}
