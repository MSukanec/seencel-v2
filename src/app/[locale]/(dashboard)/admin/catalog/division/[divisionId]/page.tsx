import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { FolderTree, Layers, Settings, Zap, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorDisplay } from "@/components/ui/error-display";
import { TasksDivisionGeneralView } from "@/features/tasks/views/tasks-division-general-view";
import { TasksDivisionElementsView } from "@/features/tasks/views/tasks-division-elements-view";
import { TasksDivisionKindsView } from "@/features/tasks/views/tasks-division-kinds-view";
import {
    getDivisionById,
    getAllElements,
    getDivisionElementIds,
    getDivisionKindIds,
    getTaskKinds,
    getUnits
} from "@/features/tasks/queries";

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({
    params
}: {
    params: Promise<{ divisionId: string }>
}): Promise<Metadata> {
    const { divisionId } = await params;
    const { data: division } = await getDivisionById(divisionId);
    const displayName = division?.name || "Rubro";

    return {
        title: `${displayName} | Admin Catálogo | Seencel`,
        description: `Detalle del rubro: ${displayName}`,
        robots: "noindex, nofollow",
    };
}

// ============================================================================
// Types
// ============================================================================

interface DivisionPageProps {
    params: Promise<{ divisionId: string }>;
    searchParams: Promise<{ view?: string }>;
}

// ============================================================================
// Page Component
// ============================================================================

export default async function DivisionDetailPage({ params, searchParams }: DivisionPageProps) {
    try {
        const { divisionId } = await params;
        const { view = "general" } = await searchParams;

        // Fetch all data in parallel
        const [
            { data: division },
            { data: allElements },
            { data: linkedElementIds },
            { data: allKinds },
            { data: linkedKindIds },
            { data: units }
        ] = await Promise.all([
            getDivisionById(divisionId),
            getAllElements(),
            getDivisionElementIds(divisionId),
            getTaskKinds(),
            getDivisionKindIds(divisionId),
            getUnits()
        ]);

        // 404 if division not found
        if (!division) {
            notFound();
        }

        return (
            <Tabs defaultValue={view} className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title={division.name}
                    icon={<FolderTree />}
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
                            <TabsTrigger value="elements" className="gap-2">
                                <Layers className="h-4 w-4" />
                                Elementos
                                <Badge variant="secondary" className="ml-1 text-xs">
                                    {linkedElementIds.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="kinds" className="gap-2">
                                <Zap className="h-4 w-4" />
                                Tipos de Acción
                                <Badge variant="secondary" className="ml-1 text-xs">
                                    {linkedKindIds.length}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>
                    }
                >
                    {/* General Tab */}
                    <TabsContent value="general" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksDivisionGeneralView division={division} />
                        </ContentLayout>
                    </TabsContent>

                    {/* Elements Tab */}
                    <TabsContent value="elements" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksDivisionElementsView
                                division={division}
                                allElements={allElements}
                                linkedElementIds={linkedElementIds}
                                units={units}
                            />
                        </ContentLayout>
                    </TabsContent>

                    {/* Kinds Tab */}
                    <TabsContent value="kinds" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksDivisionKindsView
                                division={division}
                                allKinds={allKinds}
                                linkedKindIds={linkedKindIds}
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
                    title="Error al cargar el rubro"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
