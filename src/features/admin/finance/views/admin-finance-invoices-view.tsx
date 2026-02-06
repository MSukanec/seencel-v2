"use client";

import { FileText } from "lucide-react";
import { ViewEmptyState } from "@/components/shared/empty-state";

/**
 * Admin Finance Invoices View
 * Placeholder - transaction history
 */
export function AdminFinanceInvoicesView() {
    return (
        <div className="h-full flex items-center justify-center">
            <ViewEmptyState
                mode="empty"
                icon={FileText}
                viewName="Historial de Facturas"
                featureDescription="Registro de todas las transacciones generadas."
                comingSoon
            />
        </div>
    );
}
