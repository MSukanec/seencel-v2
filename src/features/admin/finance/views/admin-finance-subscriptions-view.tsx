"use client";

import { Wallet } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Admin Finance Subscriptions View
 * Placeholder - monitor MRR/ARR and subscription status
 */
export function AdminFinanceSubscriptionsView() {
    return (
        <div className="h-full flex items-center justify-center">
            <EmptyState
                icon={Wallet}
                title="Suscripciones Activas"
                description="Monitor de MRR/ARR y estado de suscripciones. Próximamente."
            />
        </div>
    );
}
