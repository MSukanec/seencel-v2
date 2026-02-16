"use client";

import { Wallet } from "lucide-react";
import { ViewEmptyState } from "@/components/shared/empty-state";

/**
 * Admin Finance Subscriptions View
 * Placeholder - monitor MRR/ARR and subscription status
 */
export function AdminFinanceSubscriptionsView() {
    return (
        <div className="h-full flex items-center justify-center">
            <ViewEmptyState
                mode="empty"
                icon={Wallet}
                viewName="Suscripciones Activas"
                featureDescription="Monitor de MRR/ARR y estado de suscripciones."
            />
        </div>
    );
}
