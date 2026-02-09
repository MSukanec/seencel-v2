import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Box, Settings, Sliders, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorDisplay } from "@/components/ui/error-display";
import { TasksElementGeneralView } from "@/features/tasks/views/tasks-element-general-view";
import { TasksElementParametersView } from "@/features/tasks/views/tasks-element-parameters-view";
import {
    getElementById,
    getTaskParameters,
    getLinkedParametersForElement
} from "@/features/tasks/queries";

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({
    params
}: {
    params: Promise<{ elementId: string }>
}): Promise<Metadata> {
    const { elementId } = await params;
    const { data: element } = await getElementById(elementId);
    const displayName = element?.name || "Elemento";

    return {
        title: `${displayName} | Admin Catálogo | Seencel`,
        description: `Detalle del elemento: ${displayName}`,
        robots: "noindex, nofollow",
    };
}

// ============================================================================
// Types
// ============================================================================

interface ElementPageProps {
    params: Promise<{ elementId: string }>;
    searchParams: Promise<{ view?: string }>;
}

// ============================================================================
// Page Component
// ============================================================================

export default async function ElementDetailPage({ params, searchParams }: ElementPageProps) {
    try {
        const { elementId } = await params;
        const { view = "general" } = await searchParams;

        // Fetch all data in parallel
        const [
            { data: element },
            { data: allParameters },
            { data: linkedParameterIds }
        ] = await Promise.all([
            getElementById(elementId),
            getTaskParameters(),
            getLinkedParametersForElement(elementId)
        ]);

        // 404 if element not found
        if (!element) {
            notFound();
        }

        return (
            <Tabs defaultValue={view} className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title={element.name}
                    icon={<Box />}
                    backButton={
                        <Button variant="ghost" size="icon" asChild className="mr-2">
                            <Link href="/admin/catalog">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                    }
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                            <TabsTrigger value="general" className="gap-2">
                                <Settings className="h-4 w-4" />
                                General
                            </TabsTrigger>
                            <TabsTrigger value="parameters" className="gap-2">
                                <Sliders className="h-4 w-4" />
                                Parámetros
                                <Badge variant="secondary" className="ml-1 text-xs">
                                    {linkedParameterIds.length}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>
                    }
                >
                    {/* General Tab */}
                    <TabsContent value="general" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksElementGeneralView element={element} />
                        </ContentLayout>
                    </TabsContent>

                    {/* Parameters Tab */}
                    <TabsContent value="parameters" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksElementParametersView
                                element={element}
                                allParameters={allParameters}
                                linkedParameterIds={linkedParameterIds}
                            />
                        </ContentLayout>
                    </TabsContent>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar el elemento"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
