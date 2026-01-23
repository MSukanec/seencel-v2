"use server";

import { getOrganizationProjects } from "@/features/projects/queries";

export async function fetchProjectsAction(organizationId: string) {
    if (!organizationId) return [];
    try {
        const projects = await getOrganizationProjects(organizationId);
        return projects;
    } catch (error) {
        console.error("Error fetching projects for selector:", error);
        return [];
    }
}

