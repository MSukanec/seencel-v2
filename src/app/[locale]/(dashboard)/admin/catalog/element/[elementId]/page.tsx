import { notFound } from "next/navigation";
import Link from "next/link";
import { Box, Settings, Sliders, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ElementGeneralView } from "@/features/tasks/views/element-general-view";
import { ElementParametersView } from "@/features/tasks/views/element-parameters-view";
import { Badge } from "@/components/ui/badge";
import {
    getElementById,
    getTaskParameters,
    getLinkedParametersForElement
} from "@/features/tasks/queries";

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
                <TabsContent value="general" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <ElementGeneralView element={element} />
                    </ContentLayout>
                </TabsContent>

                {/* Parameters Tab */}
                <TabsContent value="parameters" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <ElementParametersView
                            element={element}
                            allParameters={allParameters}
                            linkedParameterIds={linkedParameterIds}
                        />
                    </ContentLayout>
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}
