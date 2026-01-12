"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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
    const currentProject = projects.find(p => p.id === currentProjectId);

    // Effect to ensure we always have a project if available (though URL should handle this)
    // This is purely visual fallback or for initial load edge cases
    useEffect(() => {
        if (!currentProjectId && projects.length > 0) {
            const firstId = projects[0].id;
            const newPath = basePath.replace("[projectId]", firstId);
            router.replace(newPath);
        }
    }, [currentProjectId, projects, basePath, router]);

    const handleProjectChange = (projectId: string) => {
        if (projectId === currentProjectId) return;
        const newPath = basePath.replace("[projectId]", projectId);
        router.push(newPath);
    };

    if (projects.length === 0) return null;

    // Fallback for visual display if currentProject is somehow missing but ID exists (unlikely) 
    // or if purely waiting for redirect.
    const displayProject = currentProject || projects[0];

    return (
        <Select value={currentProjectId || displayProject?.id} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-[260px] h-9 bg-background border-border">
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
            <SelectContent align="end">
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
            </SelectContent>
        </Select>
    );
}
