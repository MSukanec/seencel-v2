import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActiveOrganizationId } from "@/actions/general-costs";
import { getIndexTypes } from "@/features/advanced/queries";
import { PageWrapper } from "@/components/layout/dashboard/shared/page-wrapper";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";
import { AdvancedIndicesView } from "@/features/advanced/views/advanced-indices-view";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Avanzado | SEENCEL",
        description: "Configuración avanzada y datos globales de la organización",
        robots: "noindex, nofollow",
    };
}

export default async function AdvancedPage() {
    const organizationId = await getActiveOrganizationId();

    if (!organizationId) {
        redirect("/auth/sign-in");
    }

    try {
        const indexTypes = await getIndexTypes(organizationId);

        return (
            <Tabs defaultValue="indices" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title="Avanzado"
                    icon={<Sparkles className="h-5 w-5" />}
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                            <TabsTrigger value="indices">Índices Económicos</TabsTrigger>
                            <TabsTrigger value="formulas">Fórmulas</TabsTrigger>
                            <TabsTrigger value="templates">Plantillas</TabsTrigger>
                        </TabsList>
                    }
                >
                    <ContentLayout variant="wide">
                        <TabsContent value="indices" className="mt-0 h-full">
                            <AdvancedIndicesView
                                organizationId={organizationId}
                                indexTypes={indexTypes}
                            />
                        </TabsContent>

                        <TabsContent value="formulas" className="mt-0 h-full flex items-center justify-center text-muted-foreground">
                            Próximamente: Fórmulas de ajuste personalizadas
                        </TabsContent>

                        <TabsContent value="templates" className="mt-0 h-full flex items-center justify-center text-muted-foreground">
                            Próximamente: Plantillas globales para proyectos
                        </TabsContent>
                    </ContentLayout>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        console.error("Error loading advanced page:", error);
        return (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                Error al cargar la configuración avanzada.
            </div>
        );
    }
}
