import { redirect } from "next/navigation";
import { getDashboardData } from "@/features/organization/queries";
import { getFiles, getFolders, getStorageStats } from "@/features/files/queries";
import { getSidebarProjects } from "@/features/projects/queries";
import { getOrganizationPlanFeatures } from "@/actions/plans";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { FileGallery } from "@/features/files/views/files-gallery-view";
import { ErrorDisplay } from "@/components/ui/error-display";
import { StorageOverviewWidget } from "@/components/widgets/files/storage-overview-widget";

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
        const [files, folders, planFeatures, projects, storageStats] = await Promise.all([
            getFiles(organizationId, null),
            getFolders(organizationId, null),
            getOrganizationPlanFeatures(organizationId),
            getSidebarProjects(organizationId),
            getStorageStats(organizationId),
        ]);

        const maxFileSizeMb = planFeatures?.max_file_size_mb ?? 50;
        const maxStorageMb = planFeatures?.max_storage_mb ?? 500;

        const pageTitle = (
            <span className="flex items-center gap-2">
                Documentación
                <span className="text-muted-foreground font-normal text-sm">· {organization.name}</span>
            </span>
        );

        return (
            <PageWrapper
                type="page"
                title={pageTitle}
                icon={<FolderOpen />}
            >
                <ContentLayout variant="wide">
                    {files.length > 0 && (
                        <StorageOverviewWidget
                            stats={storageStats}
                            maxStorageMb={maxStorageMb}
                            folderCount={folders.length}
                        />
                    )}
                    <div className={files.length > 0 ? "mt-4" : "flex-1 flex flex-col min-h-0 h-full"}>
                        <FileGallery
                            files={files}
                            folders={folders}
                            organizationId={organizationId}
                            maxFileSizeMb={maxFileSizeMb}
                            projects={projects}
                        />
                    </div>
                </ContentLayout>
            </PageWrapper>
        );
    } catch (error) {
        return (
            <PageWrapper
                type="page"
                title="Documentación"
                icon={<FolderOpen />}
            >
                <div className="h-full w-full flex items-center justify-center">
                    <ErrorDisplay
                        title="Error al cargar documentación"
                        message={error instanceof Error ? error.message : "Error desconocido"}
                        retryLabel="Reintentar"
                    />
                </div>
            </PageWrapper>
        );
    }
}
