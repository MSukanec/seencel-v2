import { ProjectDashboardClient } from "@/features/projects/components/project-dashboard-client";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectById } from "@/features/projects/queries";

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

    // Generate signed URL for the hero image if it exists
    let signedImageUrl = null;
    if (project.project_data?.image_bucket && project.project_data?.image_path) {
        const supabase = await createClient();
        const { data } = await supabase
            .storage
            .from(project.project_data.image_bucket)
            .createSignedUrl(project.project_data.image_path, 3600); // 1 hour

        if (data?.signedUrl) {
            signedImageUrl = data.signedUrl;
        }
    }

    return (
        <ProjectDashboardClient project={project} signedImageUrl={signedImageUrl} />
    );
}
