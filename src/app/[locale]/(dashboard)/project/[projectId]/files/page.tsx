import { notFound } from "next/navigation";
import { getProjectById } from "@/features/projects/queries";
import { getFiles } from "@/features/files/queries";
import { FilesPageView } from "@/features/files/views";

interface PageProps {
    params: Promise<{
        projectId: string;
        locale: string;
    }>;
}

export default async function ProjectFilesPage({ params }: PageProps) {
    const { projectId } = await params;

    // Fetch project for context and files filtered by project
    const project = await getProjectById(projectId);

    if (!project) {
        notFound();
    }

    // Get files filtered by this project
    const files = await getFiles(project.organization_id, projectId);

    return (
        <FilesPageView
            organizationId={project.organization_id}
            projectId={projectId}
            files={files}
        />
    );
}
