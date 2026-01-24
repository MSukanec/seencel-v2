import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FolderTree, Layers, Settings, Zap, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { DivisionGeneralView } from "@/features/tasks/views/division-general-view";
import { DivisionElementsView } from "@/features/tasks/views/division-elements-view";
import { DivisionKindsView } from "@/features/tasks/views/division-kinds-view";
import { Badge } from "@/components/ui/badge";
import {
    getDivisionById,
    getAllElements,
    getDivisionElementIds,
    getDivisionKindIds,
    getTaskKinds,
    getUnits
} from "@/features/tasks/queries";

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
                <TabsContent value="general" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <DivisionGeneralView division={division} />
                    </ContentLayout>
                </TabsContent>

                {/* Elements Tab */}
                <TabsContent value="elements" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <DivisionElementsView
                            division={division}
                            allElements={allElements}
                            linkedElementIds={linkedElementIds}
                            units={units}
                        />
                    </ContentLayout>
                </TabsContent>

                {/* Kinds Tab */}
                <TabsContent value="kinds" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <DivisionKindsView
                            division={division}
                            allKinds={allKinds}
                            linkedKindIds={linkedKindIds}
                        />
                    </ContentLayout>
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}
