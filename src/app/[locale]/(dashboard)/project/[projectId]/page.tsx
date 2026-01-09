import { ProjectDashboardClient } from "@/features/projects/components/project-dashboard-client";
import { notFound } from "next/navigation";
import { getProjectById } from "@/features/projects/queries";
import { saveLastActiveProject } from "@/features/projects/actions";

interface PageProps {
    params: Promise<{
        projectId: string;
        locale: string;
    }>;
}

export default async function ProjectDashboardPage({ params }: PageProps) {
    const { projectId } = await params;
    const project = await getProjectById(projectId);

    if (!project) {
        notFound();
    }

    // Mark this project as the last active (updates projects.last_active_at + user preferences)
    await saveLastActiveProject(projectId);

    // Use image_url directly (already a public URL from Supabase Storage)
    const imageUrl = project.image_url || null;

    return (
        <ProjectDashboardClient project={project} signedImageUrl={imageUrl} />
    );
}
