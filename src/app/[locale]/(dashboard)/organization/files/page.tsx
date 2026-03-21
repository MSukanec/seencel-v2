import { redirect } from "next/navigation";
import { getDashboardData } from "@/features/organization/queries";
import { getFiles, getSavedViews } from "@/features/files/queries";
import { getSidebarProjects } from "@/features/projects/queries";
import { getOrganizationPlanFeatures } from "@/actions/plans";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { FileGallery } from "@/features/files/views/files-gallery-view";
import { ErrorDisplay } from "@/components/ui/error-display";
import { FolderOpen } from "lucide-react";

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Files" });
    return {
        title: `${t("title")} | SEENCEL`,
        description: t("title"),
        robots: "noindex, nofollow",
    };
}

export default async function OrganizationFilesPage() {
    const dashboardData = await getDashboardData();

    if ('error' in dashboardData || !dashboardData.organization) {
        redirect("/organization");
    }

    const organization = dashboardData.organization as { id: string; name: string };
    const organizationId = organization.id;

    try {
        const [files, planFeatures, projects, savedViews] = await Promise.all([
            getFiles(organizationId, null),
            getOrganizationPlanFeatures(organizationId),
            getSidebarProjects(organizationId),
            getSavedViews(organizationId, 'files'),
        ]);

        const maxFileSizeMb = planFeatures?.max_file_size_mb ?? 50;

        return (
            <PageWrapper title="Archivos" icon={<FolderOpen />}>
                <ContentLayout variant="wide">
                    <FileGallery
                        files={files}
                        organizationId={organizationId}
                        maxFileSizeMb={maxFileSizeMb}
                        projects={projects}
                        savedViews={savedViews}
                    />
                </ContentLayout>
            </PageWrapper>
        );
    } catch (error) {
        return (
            <PageWrapper title="Archivos" icon={<FolderOpen />}>
                <ContentLayout variant="wide">
                    <div className="h-full w-full flex items-center justify-center">
                        <ErrorDisplay
                            title="Error al cargar archivos"
                            message={error instanceof Error ? error.message : "Error desconocido"}
                            retryLabel="Reintentar"
                        />
                    </div>
                </ContentLayout>
            </PageWrapper>
        );
    }
}
