"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, usePathname } from "next/navigation";
import { ProjectSelector } from "@/components/layout/project-selector";
import { fetchProjectsAction } from "@/features/projects/actions/fetch-projects";
import { cn } from "@/lib/utils";

interface Project {
    id: string;
    name: string;
    slug?: string;
    color?: string | null;
    image_url?: string | null;
}

import { useOrganization } from "@/context/organization-context";

export function ProjectSelectorWrapper({ className }: { className?: string }) {
    const params = useParams();
    const pathname = usePathname();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isPending, startTransition] = useTransition();
    const { activeOrgId } = useOrganization();

    // Check if we are in a project context
    // The path usually starts with /[locale]/project/[projectId]
    // or we can rely on params.projectId
    const projectId = params?.projectId as string | undefined;

    useEffect(() => {
        // Only fetch if we have an active org and we are seemingly in a project context (or if we just want to have them ready)
        // Optimization: Only fetch if we are in a route that needs it, OR fetch once per session?
        // For now, fetch if we detect a projectId param, or if we want it available.
        // User requested "headers de PROYECTOS".

        if (activeOrgId && projectId) {
            startTransition(async () => {
                try {
                    console.log("Wrapper: Fetching projects for", activeOrgId);
                    const fetched = await fetchProjectsAction(activeOrgId);
                    console.log("Wrapper: Fetched projects count:", fetched.length);
                    setProjects(fetched);
                } catch (err) {
                    console.error("Wrapper: Fetch error", err);
                }
            });
        }
    }, [activeOrgId, projectId]);

    // Debug output (Temporary)
    // console.log("ProjectSelectorWrapper Params:", { activeOrgId, projectId, projectsCount: projects.length });

    if (!projectId || !activeOrgId) {
        // console.log("ProjectSelectorWrapper: Missing params", { projectId, activeOrgId });
        return null;
    }

    return (
        <div className={cn("mr-4 hidden md:block z-50 pointer-events-auto relative", className)}>
            {/* DEBUG INDICATOR */}
            {/* <div className="text-xs text-red-500 absolute top-0 left-0 bg-white z-[100]">
                Debug: O={activeOrgId?.substring(0,4)} P={projectId?.substring(0,4)} C={projects.length}
            </div> */}

            <ProjectSelector
                projects={projects}
                currentProjectId={projectId}
                basePath="/project/[projectId]"
            />
        </div>
    );
}
