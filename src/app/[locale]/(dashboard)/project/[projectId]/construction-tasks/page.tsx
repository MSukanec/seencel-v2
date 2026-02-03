import type { Metadata } from "next";
import { ConstructionTasksPageView } from "@/features/construction-tasks/views";
import { getProjectConstructionTasks } from "@/features/construction-tasks/queries";
import { getUserOrganizations } from "@/features/organization/queries";
import { getProjectById } from "@/features/projects/queries";
import { getTasksGroupedByDivision, getTaskDivisions, getUnits, getTaskKinds } from "@/features/tasks/queries";
import { notFound, redirect } from "next/navigation";

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
            ? `Tareas - ${project.name} | Seencel`
            : "Tareas | Seencel",
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
    searchParams: Promise<{ view?: string }>;
}

// ============================================
// PAGE COMPONENT
// ============================================
export default async function ConstructionTasksPage({ params, searchParams }: PageProps) {
    const { projectId } = await params;
    const resolvedSearchParams = await searchParams;
    const defaultTab = resolvedSearchParams.view || "tasks";

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

    // Fetch construction tasks and catalog data in parallel
    const [
        tasks,
        catalogGroupedTasks,
        divisionsResult,
        unitsResult,
        kindsResult
    ] = await Promise.all([
        getProjectConstructionTasks(projectId),
        getTasksGroupedByDivision(activeOrgId),
        getTaskDivisions(),
        getUnits(),
        getTaskKinds()
    ]);

    return (
        <ConstructionTasksPageView
            projectId={projectId}
            organizationId={activeOrgId}
            tasks={tasks}
            defaultTab={defaultTab}
            catalogGroupedTasks={catalogGroupedTasks}
            catalogUnits={unitsResult.data}
            catalogDivisions={divisionsResult.data}
            catalogKinds={kindsResult.data}
        />
    );
}

