import { redirect } from "next/navigation";
import { getProjectById, getLastActiveProject } from "@/features/projects/queries";
import { getUserOrganizations } from "@/features/organization/queries";
import { getLocale } from "next-intl/server";
import { ProjectStatusProvider } from "@/features/projects/context/project-status-context";
import { InactiveProjectBanner } from "@/components/shared/inactive-project-banner";

interface LayoutProps {
    children: React.ReactNode;
    params: Promise<{
        projectId: string;
    }>;
}

export default async function ProjectLayout({ children, params }: LayoutProps) {
    const { projectId } = await params;
    const locale = await getLocale();

    // Get active organization
    const { activeOrgId } = await getUserOrganizations();

    // If no active org, redirect to organization page
    if (!activeOrgId) {
        redirect(locale === 'es' ? '/es/organizacion' : '/en/organization');
    }

    // Fetch project to validate ownership
    const project = await getProjectById(projectId);

    // If project doesn't exist, let the page handle notFound
    if (!project) {
        return children;
    }

    // CRITICAL: Validate project belongs to active organization
    if (project.organization_id !== activeOrgId) {
        // Project doesn't belong to current org - redirect to last project of current org
        const lastProjectId = await getLastActiveProject(activeOrgId);

        if (lastProjectId) {
            // Redirect to last viewed project of this org
            redirect(`/${locale}/project/${lastProjectId}`);
        } else {
            // No last project, redirect to org dashboard
            redirect(locale === 'es' ? '/es/organizacion' : '/en/organization');
        }
    }

    // Project belongs to current org, render children with status context
    return (
        <ProjectStatusProvider projectId={projectId} projectStatus={project.status}>
            <InactiveProjectBanner />
            {children}
        </ProjectStatusProvider>
    );
}
