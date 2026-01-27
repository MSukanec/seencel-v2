"use client";

import { EmptyState } from "@/components/ui/empty-state";
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
            <EmptyState
                icon={Scale}
                title="Balances"
                description="Esta sección mostrará el balance de capital de cada participante. Próximamente."
            />
        </div>
    );
}
