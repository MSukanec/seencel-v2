"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { PageWrapper, RouteTab } from "@/components/layout";
import { BackButton } from "@/components/shared/back-button";

/**
 * Client layout shell for project detail pages.
 *
 * Renders PageWrapper with project name header, breadcrumb,
 * back button, and routeTabs for sub-page navigation.
 */
export function ProjectDetailShell({
    projectName,
    children,
}: {
    projectName: string;
    children: React.ReactNode;
}) {
    const params = useParams<{ projectId: string }>();
    const projectId = params.projectId;

    const routeTabs: RouteTab[] = useMemo(() => [
        { value: "general", label: "Perfil", href: `/organization/projects/${projectId}` },
        { value: "participants", label: "Participantes", href: `/organization/projects/${projectId}/participants` },
        { value: "appearance", label: "Apariencia", href: `/organization/projects/${projectId}/appearance`, guard: {
            fallbackEnabled: false,
            featureName: "Apariencia del Proyecto",
            requiredPlan: "PRO",
        } },
    ], [projectId]);

    return (
        <PageWrapper
            title={projectName}
            backButton={
                <BackButton fallbackHref="/organization/projects" />
            }
            parentLabel="Proyectos"
            routeTabs={routeTabs}
        >
            {children}
        </PageWrapper>
    );
}
