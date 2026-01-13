"use client";

import { useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectSeparator } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Project {
    id: string;
    name: string;
    slug?: string;
    color?: string | null;
    image_url?: string | null;
}

interface ProjectSelectorProps {
    projects: Project[];
    currentProjectId: string;
    /** Base path pattern to navigate to when switching projects. 
     * Use [projectId] as placeholder, e.g. "/project/[projectId]/clients" 
     */
    basePath: string;
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

export function ProjectSelector({ projects, currentProjectId, basePath }: ProjectSelectorProps) {
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const locale = params?.locale as string;

    console.log("ProjectSelector: Render", { count: projects.length, current: currentProjectId });

    // Find current project object
    const currentProject = projects.find(p => p.id === currentProjectId);

    // Fallback logic for display if currentProject is somehow missing
    const displayProject = currentProject || (projects.length > 0 ? projects[0] : null);

    // Effect to ensure we always have a project if available
    useEffect(() => {
        if (!currentProjectId && projects.length > 0) {
            const firstId = projects[0].id;
            const rawPath = basePath.replace("[projectId]", firstId);
            // Ensure locale is included if missing from basePath
            const newPath = (locale && !rawPath.startsWith(`/${locale}`))
                ? `/${locale}${rawPath}`
                : rawPath;

            router.replace(newPath);
        }
    }, [currentProjectId, projects, basePath, router, locale]);

    const handleProjectChange = (value: string) => {
        if (value === "__NEW_PROJECT__") {
            const projectsPath = `/organization/projects`;
            const newPath = (locale && !projectsPath.startsWith(`/${locale}`))
                ? `/${locale}${projectsPath}`
                : projectsPath;
            router.push(newPath);
            return;
        }

        const projectId = value;
        if (projectId === currentProjectId) return;

        // Preserves current path, just swap ID
        if (pathname && pathname.includes(currentProjectId)) {
            const newPath = pathname.replace(currentProjectId, projectId);
            router.push(newPath);
        } else {
            // Fallback to basePath logic if for some reason ID is not in path
            const rawPath = basePath.replace("[projectId]", projectId);
            const newPath = (locale && !rawPath.startsWith(`/${locale}`))
                ? `/${locale}${rawPath}`
                : rawPath;

            router.push(newPath);
        }
    };

    if (projects.length === 0) return null;

    return (
        <Select value={currentProjectId || displayProject?.id} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-full h-9 bg-background border-border">
                <div className="flex items-center gap-2 w-full overflow-hidden">
                    <Avatar className="h-5 w-5 rounded-md border border-border/50">
                        <AvatarImage src={displayProject?.image_url || undefined} alt={displayProject?.name} />
                        <AvatarFallback
                            className={cn(
                                "text-[9px] font-bold rounded-md bg-primary/10 text-primary",
                                displayProject?.color && `bg-[${displayProject.color}]/10 text-[${displayProject.color}]`
                            )}
                            style={displayProject?.color ? {
                                backgroundColor: `${displayProject.color}20`,
                                color: displayProject.color
                            } : undefined}
                        >
                            {displayProject ? getInitials(displayProject.name) : "??"}
                        </AvatarFallback>
                    </Avatar>
                    <span className="truncate flex-1 text-left text-sm font-medium">
                        {displayProject?.name || "Seleccionar proyecto"}
                    </span>
                </div>
            </SelectTrigger>
            <SelectContent align="end" position="popper" sideOffset={4} className="z-[9999] w-[var(--radix-select-trigger-width)]">
                {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 rounded-md border border-border/50">
                                <AvatarImage src={project.image_url || undefined} alt={project.name} />
                                <AvatarFallback
                                    className="text-[9px] font-bold rounded-md"
                                    style={project.color ? {
                                        backgroundColor: `${project.color}20`,
                                        color: project.color
                                    } : undefined}
                                >
                                    {getInitials(project.name)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{project.name}</span>
                        </div>
                    </SelectItem>
                ))}

                <SelectSeparator />

                <SelectItem value="__NEW_PROJECT__" className="text-muted-foreground focus:text-foreground cursor-pointer">
                    <div className="flex items-center gap-2 font-medium">
                        <Plus className="h-4 w-4" />
                        <span>Crear Nuevo Proyecto</span>
                    </div>
                </SelectItem>
            </SelectContent>
        </Select>
    );
}
