import { notFound } from "next/navigation";
import { getProjectById } from "@/features/projects/queries";
import { getFiles } from "@/features/files/queries";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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

interface PageProps {
    params: Promise<{
        projectId: string;
        locale: string;
    }>;
}

export default async function ProjectFilesPage({ params }: PageProps) {
    const { projectId } = await params;

    // Fetch project for context
    const project = await getProjectById(projectId);

    if (!project) {
        notFound();
    }

    try {
        const files = await getFiles(project.organization_id, projectId);

        const pageTitle = (
            <span className="flex items-center gap-2">
                Archivos
                <span className="text-muted-foreground font-normal text-sm">· {project.name}</span>
            </span>
        );

        return (
            <PageWrapper
                type="page"
                title={pageTitle}
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
