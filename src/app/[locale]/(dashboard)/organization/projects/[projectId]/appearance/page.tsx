import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { getProjectById } from "@/features/projects/queries";
import { notFound, redirect } from "next/navigation";
import { ProjectAppearanceView } from "@/features/projects/views/details/project-appearance-view";

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({
    params
}: {
    params: Promise<{ projectId: string }>
}): Promise<Metadata> {
    const { projectId } = await params;
    const project = await getProjectById(projectId);
    const displayName = project?.name || "Proyecto";

    return {
        title: `Apariencia | ${displayName} | Seencel`,
        description: `Apariencia del proyecto: ${displayName}`,
        robots: "noindex, nofollow",
    };
}

// ============================================================================
// Page Component — Appearance Tab
// ============================================================================

interface ProjectAppearancePageProps {
    params: Promise<{ projectId: string }>;
}

export default async function ProjectAppearancePage({ params }: ProjectAppearancePageProps) {
    const { projectId } = await params;
    const { orgId } = await requireAuthContext();
    if (!orgId) redirect("/");

    const project = await getProjectById(projectId);
    if (!project) notFound();

    return (
        <ProjectAppearanceView project={project} />
    );
}
