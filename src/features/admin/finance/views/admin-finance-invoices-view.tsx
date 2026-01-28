"use client";

import { FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Admin Finance Invoices View
 * Placeholder - transaction history
 */
export function AdminFinanceInvoicesView() {
    return (
        <div className="h-full flex items-center justify-center">
            <EmptyState
                icon={FileText}
                title="Historial de Facturas"
                description="Registro de todas las transacciones generadas. Próximamente."
            />
        </div>
    );
}
