import { requireAuthContext } from "@/lib/auth";
import { getProjectById } from "@/features/projects/queries";
import { notFound, redirect } from "next/navigation";
import { ProjectDetailShell } from "./project-detail-shell";

// ============================================================================
// Server Layout — auth + data fetch, delegates rendering to client shell
// ============================================================================

export default async function ProjectDetailLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ projectId: string }>;
}) {
    const { orgId } = await requireAuthContext();
    if (!orgId) redirect("/");

    const { projectId } = await params;
    const project = await getProjectById(projectId);
    if (!project) notFound();

    const displayName = project.name || "Proyecto";
    const truncatedName = displayName.length > 60
        ? displayName.slice(0, 57) + "..."
        : displayName;

    return (
        <ProjectDetailShell projectName={truncatedName}>
            {children}
        </ProjectDetailShell>
    );
}
