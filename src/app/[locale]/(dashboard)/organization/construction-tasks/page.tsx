import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";

import { ConstructionTasksView } from "@/features/construction-tasks/views/construction-tasks-view";
import { getOrganizationConstructionTasks, getOrganizationConstructionDependencies } from "@/features/construction-tasks/queries";
import { requireAuthContext } from "@/lib/auth";
import { getOrganizationTasks, getUnits } from "@/features/tasks/queries";

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: `Tareas de Construcción | SEENCEL`,
        description: "Gestión de tareas de construcción",
        robots: "noindex, nofollow",
    };
}

// ============================================================================
// Page Component
// ============================================================================

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function ConstructionTasksPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    try {
        const { orgId } = await requireAuthContext();

        const [tasks, initialDependencies, catalogResult, unitsResult] = await Promise.all([
            getOrganizationConstructionTasks(),
            getOrganizationConstructionDependencies(),
            getOrganizationTasks(orgId),
            getUnits(),
        ]);

        // Flatten catalog tasks for the form selector
        const catalogTasks = (catalogResult.data || []).map(t => ({
            id: t.id,
            name: t.name,
            custom_name: t.custom_name,
            unit_name: t.unit_name,
            unit_symbol: t.unit_symbol,
            division_name: t.division_name,
            code: t.code,
            status: t.status,
        }));

        return (
            <ContentLayout variant="wide">
                <ConstructionTasksView
                    organizationId={orgId}
                    tasks={tasks}
                    initialDependencies={initialDependencies}
                    catalogTasks={catalogTasks}
                    units={unitsResult.data as any}
                />
            </ContentLayout>
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
