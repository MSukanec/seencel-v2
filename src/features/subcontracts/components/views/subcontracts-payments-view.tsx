"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Wallet, Plus } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";

export function SubcontractsPaymentsView() {
    return (
        <>
            <Toolbar
                portalToHeader
                actions={[
                    {
                        label: "Nuevo Pago",
                        icon: Plus,
                        onClick: () => console.log("New Payment clicked")
                    }
                ]}
            />
            <EmptyState
                icon={Wallet}
                title="Pagos a Subcontratistas"
                description="Próximamente gestión de pagos y certificados de avance."
            />
        </>
    );
}
