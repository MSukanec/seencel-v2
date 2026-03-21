import type { Metadata } from "next";
import { Building } from "lucide-react";
import { requireAuthContext } from "@/lib/auth";
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { getProjectLocations } from "@/features/projects/queries";
import { ProjectsLocationView } from "@/features/projects/views/projects-location-view";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Ubicación | Proyectos | Seencel",
        robots: "noindex, nofollow",
    };
}

export default async function ProjectsLocationPage() {
    const { orgId } = await requireAuthContext();

    try {
        const locations = await getProjectLocations(orgId);

        return (
            <ContentLayout variant="full">
                <ProjectsLocationView
                    locations={locations}
                    organizationId={orgId}
                />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <ContentLayout variant="wide">
                <div className="h-full w-full flex items-center justify-center">
                    <ErrorDisplay
                        title="Error al cargar ubicaciones"
                        message={error instanceof Error ? error.message : "Error desconocido"}
                        retryLabel="Reintentar"
                    />
                </div>
            </ContentLayout>
        );
    }
}
