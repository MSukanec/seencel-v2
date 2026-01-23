"use client";

import { ContentLayout } from "@/components/layout";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList } from "lucide-react";

interface MaterialsOrdersViewProps {
    projectId: string;
    orgId: string;
}

export function MaterialsOrdersView({ projectId, orgId }: MaterialsOrdersViewProps) {
    return (
        <ContentLayout variant="wide" className="pb-6">
            <EmptyState
                icon={ClipboardList}
                title="Órdenes de Materiales"
                description="Gestiona las órdenes de compra de materiales para este proyecto."
            />
        </ContentLayout>
    );
}

