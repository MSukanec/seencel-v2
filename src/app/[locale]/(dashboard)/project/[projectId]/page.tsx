import { ProjectDashboardClient } from "@/features/projects/components/project-dashboard-client";
import { notFound } from "next/navigation";
import { getProjectById } from "@/features/projects/queries";
import { saveLastActiveProject } from "@/features/projects/actions";
import { LayoutDashboard } from "lucide-react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";

interface PageProps {
    params: Promise<{
        projectId: string;
        locale: string;
    }>;
}

export default async function ProjectDashboardPage({ params }: PageProps) {
    const { projectId } = await params;

    // Note: Org validation is handled in layout.tsx
    const project = await getProjectById(projectId);

    if (!project) {
        notFound();
    }

    // Mark this project as the last active (updates projects.last_active_at + user preferences)
    await saveLastActiveProject(projectId);

    // Use image_url directly (already a public URL from Supabase Storage)
    const imageUrl = project.image_url || null;

    return (
        <PageWrapper type="dashboard" icon={<LayoutDashboard />}>
            <ContentLayout variant="wide">
                <ProjectDashboardClient project={project} signedImageUrl={imageUrl} />
            </ContentLayout>
        </PageWrapper>
    );
}
