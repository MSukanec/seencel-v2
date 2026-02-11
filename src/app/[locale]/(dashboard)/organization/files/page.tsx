import { redirect } from "next/navigation";
import { getDashboardData } from "@/features/organization/queries";
import { getFiles } from "@/features/files/queries";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { FileGallery } from "@/features/files/views/files-gallery-view";
import { ErrorDisplay } from "@/components/ui/error-display";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Files");
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
        const files = await getFiles(organizationId, null);

        return (
            <PageWrapper
                type="page"
                title="Archivos"
                icon={<FolderOpen />}
            >
                <ContentLayout variant="wide">
                    <FileGallery files={files} />
                </ContentLayout>
            </PageWrapper>
        );
    } catch (error) {
        return (
            <PageWrapper
                type="page"
                title="Archivos"
                icon={<FolderOpen />}
            >
                <div className="h-full w-full flex items-center justify-center">
                    <ErrorDisplay
                        title="Error al cargar archivos"
                        message={error instanceof Error ? error.message : "Error desconocido"}
                        retryLabel="Reintentar"
                    />
                </div>
            </PageWrapper>
        );
    }
}
