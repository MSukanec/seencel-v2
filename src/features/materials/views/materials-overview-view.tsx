"use client";

import { ContentLayout } from "@/components/layout";
import { EmptyState } from "@/components/ui/empty-state";
import { LayoutDashboard } from "lucide-react";

interface MaterialsOverviewViewProps {
    projectId: string;
    orgId: string;
}

export function MaterialsOverviewView({ projectId, orgId }: MaterialsOverviewViewProps) {
    return (
        <ContentLayout variant="wide" className="pb-6">
            <EmptyState
                icon={LayoutDashboard}
                title="Visión General de Materiales"
                description="Aquí podrás ver un resumen de todos los materiales, órdenes y pagos del proyecto."
            />
        </ContentLayout>
    );
}

