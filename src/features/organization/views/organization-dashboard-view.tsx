"use client";

import { ContentLayout } from "@/components/layout";
import { DashboardWidgetGrid } from "@/components/widgets/grid";
import { WIDGET_REGISTRY, DEFAULT_ORG_LAYOUT } from "@/components/widgets/registry";
import { useDashboardEditStore } from "@/stores/dashboard-edit-store";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { DashboardCustomizeButton } from "@/components/widgets/grid/dashboard-customize-button";
import type { WidgetLayoutItem } from "@/components/widgets/grid/types";

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
    /** Server-fetched saved layout for this user+org. null = use default. */
    savedLayout?: WidgetLayoutItem[] | null;
    /** Whether the custom dashboard feature is enabled by the current plan */
    isCustomDashboardEnabled?: boolean;
}

export function OrganizationDashboardView({ prefetchedData, savedLayout, isCustomDashboardEnabled = true }: OrganizationDashboardViewProps) {
    const isEditing = useDashboardEditStore((s) => s.isEditing);

    return (
        <ContentLayout variant="wide">
            {/* Toolbar: auto-injects 📖 Docs icon + renders ⚙️ Personalizar icon */}
            <Toolbar portalToHeader>
                <DashboardCustomizeButton isEnabled={isCustomDashboardEnabled} />
            </Toolbar>

            <DashboardWidgetGrid
                registry={WIDGET_REGISTRY}
                layout={DEFAULT_ORG_LAYOUT}
                isEditing={isEditing}
                storageKey="org_dashboard"
                prefetchedData={prefetchedData}
                savedLayout={savedLayout}
            />
        </ContentLayout>
    );
}
