import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { ContentLayout } from "@/components/layout";
import { getStorageStats } from "@/features/files/queries";
import { getOrganizationPlanFeatures } from "@/actions/plans";
import { FilesSettingsView } from "@/features/files/views/files-settings-view";
import { ErrorDisplay } from "@/components/ui/error-display";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Ajustes de Almacenamiento | Seencel",
        description: "Almacenamiento y configuración de archivos",
        robots: "noindex, nofollow",
    };
}

export default async function FilesSettingsPage() {
    const { orgId } = await requireAuthContext();

    try {
        const [storageStats, planFeatures] = await Promise.all([
            getStorageStats(orgId),
            getOrganizationPlanFeatures(orgId),
        ]);

        const maxStorageMb = planFeatures?.max_storage_mb ?? 500;

        return (
            <ContentLayout variant="narrow">
                <FilesSettingsView
                    stats={storageStats}
                    maxStorageMb={maxStorageMb}
                />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <ContentLayout variant="narrow">
                <div className="h-full w-full flex items-center justify-center">
                    <ErrorDisplay
                        title="Error al cargar ajustes"
                        message={error instanceof Error ? error.message : "Error desconocido"}
                        retryLabel="Reintentar"
                    />
                </div>
            </ContentLayout>
        );
    }
}
