"use client";

import { ContentLayout } from "@/components/layout";
import { DashboardWidgetGrid } from "@/components/widgets/grid";
import { WIDGET_REGISTRY, DEFAULT_ORG_LAYOUT } from "@/components/widgets/registry";
import { useDashboardEditStore } from "@/stores/dashboard-edit-store";

// ============================================================================
// ORGANIZATION DASHBOARD VIEW
// ============================================================================
// Dashboard principal de la organización con widgets BentoGrid.
// Los widgets reciben datos pre-fetched del server para carga instantánea.
// El modo edición se controla desde el botón en el header via store global.
// ============================================================================

interface OrganizationDashboardViewProps {
    /** Server-prefetched widget data keyed by widget ID */
    prefetchedData?: Record<string, any>;
}

export function OrganizationDashboardView({ prefetchedData }: OrganizationDashboardViewProps) {
    const isEditing = useDashboardEditStore((s) => s.isEditing);

    return (
        <ContentLayout variant="wide">
            <DashboardWidgetGrid
                registry={WIDGET_REGISTRY}
                layout={DEFAULT_ORG_LAYOUT}
                isEditing={isEditing}
                storageKey="seencel_org_layout_v4"
                prefetchedData={prefetchedData}
            />
        </ContentLayout>
    );
}
