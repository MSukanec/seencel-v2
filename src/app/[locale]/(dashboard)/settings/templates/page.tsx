import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { getOrganizationProjects } from "@/features/projects/queries";
import { getOrganizationPdfTheme } from "@/features/organization/actions/pdf-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailContentTabs } from "@/components/shared/detail-content-tabs";
import { BrandPdfTemplates } from "@/features/organization/components/brand/brand-pdf-templates";
import { ReportsBuilderView } from "@/features/reports/views/reports-builder-view";
import { ErrorDisplay } from "@/components/ui/error-display";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Plantillas | Seencel",
        description: "Plantillas de documentos PDF e informes de la organización",
        robots: "noindex, nofollow",
    };
}

export default async function TemplatesPage() {
    const { orgId: organizationId } = await requireAuthContext();

    try {
        // Fetch data needed for Reports tab
        const [rawProjects, pdfThemeResult] = await Promise.all([
            getOrganizationProjects(organizationId),
            getOrganizationPdfTheme(),
        ]);

        const projects = rawProjects.map(p => ({ id: p.id, name: p.name, status: p.status || 'active' }));
        const pdfTheme = pdfThemeResult.data;
        const logoUrl = pdfThemeResult.logoUrl;
        const companyInfo = pdfThemeResult.demoData;

        return (
            <Tabs defaultValue="pdf" syncUrl="view" className="h-full flex flex-col">
                <DetailContentTabs>
                    <TabsList>
                        <TabsTrigger value="pdf">Documentos PDF</TabsTrigger>
                        <TabsTrigger value="reports">Informes</TabsTrigger>
                    </TabsList>
                </DetailContentTabs>

                <div className="flex-1 h-full overflow-hidden">
                    <TabsContent value="pdf" className="mt-0 h-full">
                        <BrandPdfTemplates />
                    </TabsContent>

                    <TabsContent value="reports" className="mt-0 h-full">
                        <ReportsBuilderView
                            organizationId={organizationId}
                            projects={projects}
                            pdfTheme={pdfTheme}
                            logoUrl={logoUrl}
                            companyInfo={companyInfo}
                        />
                    </TabsContent>
                </div>
            </Tabs>
        );
    } catch (error) {
        console.error("Error loading templates page:", error);
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar plantillas"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
