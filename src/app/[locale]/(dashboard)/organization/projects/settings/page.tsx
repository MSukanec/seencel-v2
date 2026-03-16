import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { getProjectTypes, getProjectModalities } from "@/features/projects/actions";
import { ProjectsSettingsView } from "@/features/projects/views/projects-settings-view";
import { ErrorDisplay } from "@/components/ui/error-display";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Ajustes de Proyectos | Seencel",
        description: "Configuración de tipos y modalidades de proyecto",
        robots: "noindex, nofollow",
    };
}

export default async function ProjectsSettingsPage() {
    const { orgId } = await requireAuthContext();

    try {
        const [projectTypes, projectModalities] = await Promise.all([
            getProjectTypes(orgId),
            getProjectModalities(orgId),
        ]);

        return (
            <PageWrapper title="Proyectos">
                <ContentLayout variant="settings">
                    <ProjectsSettingsView
                        organizationId={orgId}
                        initialTypes={projectTypes}
                        initialModalities={projectModalities}
                    />
                </ContentLayout>
            </PageWrapper>
        );
    } catch (error) {
        return (
            <PageWrapper title="Proyectos">
                <ContentLayout variant="settings">
                    <div className="h-full w-full flex items-center justify-center">
                        <ErrorDisplay
                            title="Error al cargar ajustes"
                            message={error instanceof Error ? error.message : "Error desconocido"}
                            retryLabel="Reintentar"
                        />
                    </div>
                </ContentLayout>
            </PageWrapper>
        );
    }
}
