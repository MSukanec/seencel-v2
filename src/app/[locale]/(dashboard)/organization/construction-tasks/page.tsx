import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ClipboardList } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";

import { ConstructionTasksView } from "@/features/construction-tasks/views/construction-tasks-view";
import { TasksCatalogView } from "@/features/tasks/views/tasks-catalog-view";
import { ConstructionTasksSettingsView } from "@/features/construction-tasks/views/construction-tasks-settings-view";
import { getOrganizationConstructionTasks, getOrganizationConstructionDependencies } from "@/features/construction-tasks/queries";
import { getUserOrganizations } from "@/features/organization/queries";
import { getOrganizationTasks, getTasksGroupedByDivision, getTaskDivisions, getUnits, getTaskActions, getTaskElements } from "@/features/tasks/queries";

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    return {
        title: `Tareas de Construcción | SEENCEL`,
        description: "Gestión de tareas de construcción",
        robots: "noindex, nofollow",
    };
}

// ============================================================================
// Types
// ============================================================================

interface PageProps {
    params: Promise<{
        locale: string;
    }>;
    searchParams: Promise<{ view?: string }>;
}

// ============================================================================
// Page Component
// ============================================================================

export default async function OrganizationConstructionTasksPage({ params, searchParams }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    try {
        const resolvedSearchParams = await searchParams;
        const defaultTab = resolvedSearchParams.view || "tasks";

        const { activeOrgId } = await getUserOrganizations();

        if (!activeOrgId) {
            redirect("/");
        }

        // Fetch ALL org construction tasks and catalog data in parallel
        const [
            tasks,
            initialDependencies,
            catalogResult,
            catalogGroupedTasks,
            divisionsResult,
            unitsResult,
            actionsResult,
            elementsResult
        ] = await Promise.all([
            getOrganizationConstructionTasks(),
            getOrganizationConstructionDependencies(),
            getOrganizationTasks(activeOrgId),
            getTasksGroupedByDivision(activeOrgId),
            getTaskDivisions(),
            getUnits(),
            getTaskActions(),
            getTaskElements()
        ]);

        // Flatten catalog tasks for the form selector
        const catalogTasks = (catalogResult.data || []).map(t => ({
            id: t.id,
            name: t.name,
            custom_name: t.custom_name,
            unit_name: t.unit_name,
            division_name: t.division_name,
            code: t.code,
        }));

        // Check if catalog data is available
        const hasCatalogData = catalogGroupedTasks.length > 0 || divisionsResult.data.length > 0;

        return (
            <Tabs defaultValue={defaultTab} syncUrl="view" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title="Tareas de Construcción"
                    icon={<ClipboardList />}
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                            <TabsTrigger value="tasks">Tareas</TabsTrigger>
                            {hasCatalogData && (
                                <TabsTrigger value="catalog">Catálogo</TabsTrigger>
                            )}
                            <TabsTrigger value="settings">Ajustes</TabsTrigger>
                        </TabsList>
                    }
                >
                    <TabsContent value="tasks" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <ConstructionTasksView
                                organizationId={activeOrgId}
                                tasks={tasks}
                                initialDependencies={initialDependencies}
                                catalogTasks={catalogTasks}
                            />
                        </ContentLayout>
                    </TabsContent>

                    {hasCatalogData && (
                        <TabsContent value="catalog" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                            <ContentLayout variant="wide">
                                <TasksCatalogView
                                    groupedTasks={catalogGroupedTasks}
                                    orgId={activeOrgId}
                                    units={unitsResult.data}
                                    divisions={divisionsResult.data}
                                    kinds={actionsResult.data}
                                    elements={elementsResult.data}
                                    isAdminMode={false}
                                />
                            </ContentLayout>
                        </TabsContent>
                    )}

                    <TabsContent value="settings" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ConstructionTasksSettingsView
                            organizationId={activeOrgId}
                        />
                    </TabsContent>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar las tareas"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
