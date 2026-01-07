import { ProjectDetailsClient } from "@/features/projects/components/project-details-client";
import { getProjectById } from "@/features/projects/queries";
import { getProjectFiles } from "@/features/projects/file-queries";
import { saveLastActiveProject } from "@/features/projects/actions";
import { ProjectFilesClient } from "@/features/projects/components/project-files-client";
import { notFound } from "next/navigation";
import { HeaderTitleUpdater } from "@/components/layout/header-title-updater";

interface PageProps {
    params: Promise<{
        projectId: string;
        locale: string;
    }>;
}

export default async function ProjectDetailsPage({ params }: PageProps) {
    const { projectId } = await params;

    // Fetch project for title context and files for content
    const [project, files] = await Promise.all([
        getProjectById(projectId),
        getProjectFiles(projectId)
    ]);

    // Track this as the last active project for the user
    if (project) {
        await saveLastActiveProject(projectId);
    }

    if (!project) {
        notFound();
    }

    return (
        <div className="flex flex-col h-full">
            <HeaderTitleUpdater title={
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    Proyecto <span className="text-muted-foreground/40">/</span> <span className="text-foreground font-medium">{project.name}</span> <span className="text-muted-foreground/40">/</span> <span className="text-foreground font-medium">Información</span>
                </span>
            } />
            <ProjectDetailsClient project={project} />
        </div>
    );
}
