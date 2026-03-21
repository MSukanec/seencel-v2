import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";

import { TasksCatalogView } from "@/features/tasks/views/tasks-catalog-view";
import { requireAuthContext } from "@/lib/auth";
import { getTasksGroupedByDivision, getTaskDivisions, getUnits, getTaskActions, getTaskElements } from "@/features/tasks/queries";

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: `Catálogo de Tareas | SEENCEL`,
        description: "Catálogo de tareas de construcción",
        robots: "noindex, nofollow",
    };
}

// ============================================================================
// Page Component
// ============================================================================

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function ConstructionTasksCatalogPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    try {
        const { orgId } = await requireAuthContext();

        const [catalogGroupedTasks, divisionsResult, unitsResult, actionsResult, elementsResult] = await Promise.all([
            getTasksGroupedByDivision(orgId),
            getTaskDivisions(),
            getUnits(),
            getTaskActions(),
            getTaskElements(),
        ]);

        return (
            <ContentLayout variant="wide">
                <TasksCatalogView
                    groupedTasks={catalogGroupedTasks}
                    orgId={orgId}
                    units={unitsResult.data}
                    divisions={divisionsResult.data}
                    kinds={actionsResult.data}
                    elements={elementsResult.data}
                    isAdminMode={false}
                />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar el catálogo"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
