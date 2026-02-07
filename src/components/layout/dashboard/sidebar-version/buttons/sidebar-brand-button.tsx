"use client";

import * as React from "react";
import NextImage from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Link, useRouter } from "@/i18n/routing";
import { useLayoutStore } from "@/stores/layout-store";
import { ChevronsUpDown, Briefcase, Check, Plus, Building, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getStorageUrl } from "@/lib/storage-utils";

// ============================================================================
// BRAND BUTTON - Multi-purpose header button
// ============================================================================
// Context "home": Shows Seencel logo + name, no popover
// Context "organization/project": Shows org/project avatar + name + chevron, 
//                                  opens popover to switch PROJECTS only
//                                  (org switching is done in user profile)
// ============================================================================

// Preset colors for projects (matching the project color picker)
const PROJECT_COLORS: Record<string, string> = {
    red: '#ef4444',
    orange: '#f97316',
    amber: '#f59e0b',
    yellow: '#eab308',
    lime: '#84cc16',
    green: '#22c55e',
    emerald: '#10b981',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    sky: '#0ea5e9',
    blue: '#3b82f6',
    indigo: '#6366f1',
    violet: '#8b5cf6',
    purple: '#a855f7',
    fuchsia: '#d946ef',
    pink: '#ec4899',
    rose: '#f43f5e',
};

export interface Organization {
    id: string;
    name: string;
    logo_path?: string | null;
    isFounder?: boolean;
}

export interface Project {
    id: string;
    name: string;
    image_path?: string | null;
    color?: string | null;
    custom_color_hex?: string | null;
    use_custom_color?: boolean;
}

interface SidebarBrandButtonProps {
    /** Current view mode */
    mode: "home" | "organization" | "project";
    /** Whether sidebar is expanded */
    isExpanded?: boolean;
    /** Current organization */
    currentOrg?: Organization | null;
    /** Current project (for project mode) */
    currentProject?: Project | null;
    /** List of projects in current org */
    projects?: Project[];
    /** Called when user clicks the organization (to switch context) */
    onOrgClick?: () => void;
    /** Called when user selects a different project */
    onProjectChange?: (projectId: string) => void;
    className?: string;
}

// Helper to get project color
function getProjectColor(project: Project | null | undefined): string {
    if (!project) return '#6b7280'; // gray fallback

    // 1. Custom Hex Color
    if (project.use_custom_color && project.custom_color_hex) {
        return project.custom_color_hex;
    }

    // 2. Preset Color (Handle casing and missing keys)
    if (project.color) {
        const colorKey = project.color.toLowerCase();
        if (PROJECT_COLORS[colorKey]) {
            return PROJECT_COLORS[colorKey];
        }
        // If the color itself is a hex code (e.g. stored in color column by mistake)
        if (project.color.startsWith('#')) {
            return project.color;
        }
    }

    // 3. Fallback
    return '#6b7280'; // gray fallback
}

export function SidebarBrandButton({
    mode,
    isExpanded = false,
    currentOrg,
    currentProject,
    projects = [],
    onOrgClick,
    onProjectChange,
    className
}: SidebarBrandButtonProps) {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    // Read preference from store at TOP LEVEL
    const showProjectAvatar = useLayoutStore(state => state.sidebarProjectAvatars);

    // Determine what to show
    const isHome = mode === "home";
    const isOrg = mode === "organization";
    const isProject = mode === "project";

    // Get initials for org/project
    const getInitials = (name: string) =>
        name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "??";

    // Normalize project data: Ensure we use the object from the list to guarantee we have all metadata (colors, etc)
    const effectiveProject = isProject && currentProject
        ? (projects.find(p => p.id === currentProject.id) || currentProject)
        : currentProject;

    // Render avatar for organization (with optional founder badge)
    const renderOrgAvatar = (org: Organization | null | undefined, size: "sm" | "md" = "md") => {
        const sizeClass = size === "sm" ? "h-5 w-5" : "h-7 w-7";
        const textSize = size === "sm" ? "text-[8px]" : "text-[10px]";
        const showFounderBadge = org?.isFounder && size === "md";

        // Resolve relative logo_path to full URL
        const logoSrc = org?.logo_path
            ? (org.logo_path.startsWith('http') ? org.logo_path : getStorageUrl(org.logo_path, 'public-assets'))
            : null;

        return (
            <div className="relative">
                <Avatar className={cn(sizeClass, "rounded-lg")}>
                    {logoSrc && (
                        <AvatarImage src={logoSrc} alt={org?.name || ""} />
                    )}
                    <AvatarFallback className={cn(textSize, "rounded-lg bg-primary/10 text-primary font-semibold")}>
                        {getInitials(org?.name || "")}
                    </AvatarFallback>
                </Avatar>
                {/* Founder Crown Badge */}
                {showFounderBadge && (
                    <div className="absolute -top-1.5 -right-1.5 animate-pulse">
                        <Crown className="h-4 w-4 text-amber-500 fill-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                    </div>
                )}
            </div>
        );
    };

    // Render avatar for project (with color)
    const renderProjectAvatar = (project: Project | null | undefined, size: "sm" | "md" = "md") => {
        const sizeClass = size === "sm" ? "h-5 w-5" : "h-7 w-7";
        const textSize = size === "sm" ? "text-[8px]" : "text-[10px]";
        const color = getProjectColor(project);

        // Increase background opacity for better visibility
        const bgOpacity = color === '#6b7280' ? '30' : '25'; // More visible for default gray

        return (
            <Avatar key={project?.id} className={cn(sizeClass, "rounded-lg")}>
                {showProjectAvatar && project?.image_path && (
                    <AvatarImage src={project.image_path} alt={project?.name || ""} />
                )}
                <AvatarFallback
                    delayMs={0}
                    className={cn(textSize, "rounded-lg font-bold")}
                    style={{
                        backgroundColor: `${color}${bgOpacity}`,
                        color: color,
                        // Add subtle border for light colors
                        border: `1px solid ${color}40`
                    }}
                >
                    {getInitials(project?.name || "")}
                </AvatarFallback>
            </Avatar>
        );
    };


    const buttonContent = (
        <button
            className={cn(
                "group relative flex items-center w-full rounded-lg transition-all duration-200",
                "hover:bg-secondary/50 text-muted-foreground hover:text-foreground",
                "p-0 h-8",
                open && "bg-secondary/50",
                className
            )}
        >
            {/* Logo/Avatar - Same size as user avatar (h-7 w-7) */}
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
                {isHome ? (
                    <NextImage
                        src="/logo.png"
                        alt="SEENCEL"
                        width={20}
                        height={20}
                        className="object-contain"
                    />
                ) : isProject ? (
                    renderProjectAvatar(effectiveProject)
                ) : (
                    renderOrgAvatar(currentOrg)
                )}
            </div>

            {/* Name */}
            <span className={cn(
                "font-bold tracking-tight text-foreground/90 whitespace-nowrap overflow-hidden transition-all duration-150 ease-in-out truncate text-left",
                isHome ? "text-lg" : "text-sm font-semibold",
                isExpanded ? "flex-1 opacity-100 pl-2" : "w-0 opacity-0 pl-0"
            )}>
                {isHome ? "SEENCEL" : isProject ? currentProject?.name : currentOrg?.name}
            </span>

            {/* Chevron - Only for org/project modes */}
            {!isHome && (
                <div className={cn(
                    "flex items-center justify-center shrink-0 text-muted-foreground transition-all duration-150",
                    isExpanded ? "w-8 opacity-100" : "w-0 opacity-0"
                )}>
                    <ChevronsUpDown className="h-4 w-4" />
                </div>
            )}
        </button>
    );

    // In home mode, just return the button wrapped in Link
    if (isHome) {
        return (
            <Link href="/organization" className="flex items-center w-full">
                {buttonContent}
            </Link>
        );
    }

    // In org/project mode, wrap with Popover (shows PROJECTS only)
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {buttonContent}
            </PopoverTrigger>

            <PopoverContent
                side="bottom"
                align="start"
                sideOffset={8}
                className="w-[224px] p-2"
            >
                {/* Organization Button - Clickable to change context */}
                <button
                    onClick={() => {
                        onOrgClick?.();
                        setOpen(false);
                    }}
                    className={cn(
                        "flex items-center gap-2 w-full px-2 py-2 mb-1 rounded-md transition-colors",
                        "hover:bg-secondary",
                        mode === "organization" && "bg-secondary"
                    )}
                >
                    {renderOrgAvatar(currentOrg, "sm")}
                    <div className="flex flex-col min-w-0 flex-1 text-left">
                        <span className="text-xs text-muted-foreground">Organización</span>
                        <span className="text-sm font-medium truncate">{currentOrg?.name}</span>
                    </div>
                    {mode === "organization" && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                </button>

                {/* Projects Section */}
                <div>
                    <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <Briefcase className="h-3 w-3" />
                        Proyectos
                    </div>
                    <ScrollArea className="max-h-[200px]">
                        {projects.length === 0 ? (
                            <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                                No hay proyectos
                            </div>
                        ) : (
                            projects.map((project) => {
                                const isActiveProject = mode === "project" && currentProject?.id === project.id;
                                return (
                                    <button
                                        key={project.id}
                                        onClick={() => {
                                            onProjectChange?.(project.id);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 w-full px-2 py-2 text-sm rounded-md hover:bg-secondary transition-colors",
                                            isActiveProject && "bg-secondary"
                                        )}
                                    >
                                        {renderProjectAvatar(project, "sm")}
                                        <span className="truncate flex-1 text-left">{project.name}</span>
                                        {isActiveProject && (
                                            <Check className="h-4 w-4 text-primary shrink-0" />
                                        )}
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

