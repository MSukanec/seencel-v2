"use client";

import { ContentLayout } from "@/components/layout";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { LayoutDashboard } from "lucide-react";

interface MaterialsOverviewViewProps {
    projectId: string;
    orgId: string;
}

export function MaterialsOverviewView({ projectId, orgId }: MaterialsOverviewViewProps) {
    return (
        <>
            {/* Toolbar with portal to header - no search needed for overview */}
            <Toolbar portalToHeader />

            <ContentLayout variant="wide" className="pb-6">
                <EmptyState
                    icon={LayoutDashboard}
                    title="Visión General de Materiales"
                    description="Aquí podrás ver un resumen de todos los materiales, órdenes y pagos del proyecto."
                />
            </ContentLayout>
        </>
    );
}
