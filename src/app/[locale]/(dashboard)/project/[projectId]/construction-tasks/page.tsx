import type { Metadata } from "next";
import { ConstructionTasksView } from "@/features/construction-tasks/views";
import { getProjectConstructionTasks } from "@/features/construction-tasks/queries";
import { getUserOrganizations } from "@/features/organization/queries";
import { getProjectById } from "@/features/projects/queries";
import { notFound, redirect } from "next/navigation";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { ClipboardList } from "lucide-react";

// ============================================
// METADATA (SEO)
// ============================================
export async function generateMetadata({
    params,
}: {
    params: Promise<{ projectId: string; locale: string }>;
}): Promise<Metadata> {
    const { projectId } = await params;
    const project = await getProjectById(projectId);

    return {
        title: project
            ? `Tareas - ${project.name} | SEENCEL`
            : "Tareas | SEENCEL",
        description: "Gestión de tareas de construcción del proyecto",
        robots: "noindex, nofollow",
    };
}

// ============================================
// PAGE PROPS
// ============================================
interface PageProps {
    params: Promise<{
        projectId: string;
    }>;
}

// ============================================
// PAGE COMPONENT
// ============================================
export default async function ConstructionTasksPage({ params }: PageProps) {
    const { projectId } = await params;
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        redirect("/");
    }

    // Validate project exists and belongs to org
    const project = await getProjectById(projectId);

    if (!project) {
        notFound();
    }

    if (project.organization_id !== activeOrgId) {
        notFound();
    }

    // Fetch construction tasks
    const tasks = await getProjectConstructionTasks(projectId);

    return (
        <PageWrapper
            type="page"
            title="Tareas"
            icon={<ClipboardList />}
        >
            <ContentLayout variant="wide">
                <ConstructionTasksView
                    projectId={projectId}
                    organizationId={activeOrgId}
                    tasks={tasks}
                />
            </ContentLayout>
        </PageWrapper>
    );
}
