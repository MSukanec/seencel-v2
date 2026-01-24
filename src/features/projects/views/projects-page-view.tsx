"use client";

import { FolderKanban } from "lucide-react";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { ProjectsList } from "../components/projects-list";
import { Project } from "@/types/project";

// ============================================================================
// PROJECTS PAGE VIEW
// ============================================================================
// Shared view for Projects list in Organization context
// Uses PageWrapper + ContentLayout with ProjectsList component
// ============================================================================

interface ProjectsPageViewProps {
    organizationId: string;
    projects: Project[];
    lastActiveProjectId?: string | null;
}

export function ProjectsPageView({
    organizationId,
    projects,
    lastActiveProjectId
}: ProjectsPageViewProps) {
    return (
        <PageWrapper
            type="page"
            title="Proyectos"
            icon={<FolderKanban />}
        >
            <ContentLayout variant="wide">
                <ProjectsList
                    projects={projects}
                    organizationId={organizationId}
                    lastActiveProjectId={lastActiveProjectId}
                />
            </ContentLayout>
        </PageWrapper>
    );
}
