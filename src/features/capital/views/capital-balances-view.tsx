"use client";

import { ViewEmptyState } from "@/components/shared/empty-state";
import { Scale } from "lucide-react";

interface CapitalBalancesViewProps {
    participants: any[];
    movements: any[];
}

export function CapitalBalancesView({
    participants,
    movements,
}: CapitalBalancesViewProps) {
    return (
        <div className="h-full flex items-center justify-center">
            <ViewEmptyState
                mode="empty"
                icon={Scale}
                viewName="Balances"
                featureDescription="Esta sección mostrará el balance de capital de cada participante."
                comingSoon
            />
        </div>
    );
}
