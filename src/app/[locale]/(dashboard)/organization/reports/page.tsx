import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActiveOrganizationId } from "@/actions/general-costs";
import { getOrganizationProjects } from "@/features/projects/queries";
import { PageWrapper } from "@/components/layout/dashboard/shared/page-wrapper";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileChartColumn } from "lucide-react";
import { ReportsBuilderView } from "@/features/reports/views/reports-builder-view";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Informes | SEENCEL",
        description: "Generá informes personalizados con datos de tu organización",
        robots: "noindex, nofollow",
    };
}

export default async function ReportsPage() {
    const organizationId = await getActiveOrganizationId();

    if (!organizationId) {
        redirect("/auth/sign-in");
    }

    try {
        // Fetch projects for the report builder
        const rawProjects = await getOrganizationProjects(organizationId);
        const projects = rawProjects.map(p => ({ id: p.id, name: p.name, status: p.status || 'active' }));

        return (
            <Tabs defaultValue="builder" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title="Informes"
                    icon={<FileChartColumn className="h-5 w-5" />}
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                            <TabsTrigger value="builder">Constructor</TabsTrigger>
                            <TabsTrigger value="saved">Guardados</TabsTrigger>
                        </TabsList>
                    }
                >
                    <ContentLayout variant="wide">
                        <TabsContent value="builder" className="mt-0 h-full">
                            <ReportsBuilderView
                                organizationId={organizationId}
                                projects={projects}
                            />
                        </TabsContent>

                        <TabsContent value="saved" className="mt-0 h-full flex items-center justify-center text-muted-foreground">
                            Próximamente: Plantillas de informes guardadas
                        </TabsContent>
                    </ContentLayout>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        console.error("Error loading reports page:", error);
        return (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                Error al cargar la página de informes.
            </div>
        );
    }
}
