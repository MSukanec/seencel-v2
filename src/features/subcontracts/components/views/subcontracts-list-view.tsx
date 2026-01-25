"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { useModal } from "@/providers/modal-store";
import { SubcontractsSubcontractForm } from "../forms/subcontracts-subcontract-form";

interface SubcontractsListViewProps {
    projectId: string;
    organizationId: string;
    providers: { id: string; name: string }[];
    currencies: { id: string; code: string; symbol: string }[];
}

export function SubcontractsListView({ projectId, organizationId, providers, currencies }: SubcontractsListViewProps) {
    const { openModal, closeModal } = useModal();
    // TODO: Connect to real data
    const subcontracts: any[] = [];

    const handleCreate = () => {
        openModal(
            <SubcontractsSubcontractForm
                onSuccess={closeModal}
                onCancel={closeModal}
                organizationId={organizationId}
                projectId={projectId}
                providers={providers}
                currencies={currencies}
            />,
            {
                title: "Nuevo Subcontrato",
                description: "Complete los datos para registrar un nuevo subcontrato en el proyecto.",
                size: "lg"
            }
        );
    };

    if (subcontracts.length === 0) {
        return (
            <>
                {/* TOOLBAR PORTALED TO HEADER FOR ACTIONS EVEN IN EMPTY STATE */}
                <Toolbar
                    portalToHeader
                    actions={[
                        {
                            label: "Nuevo Subcontrato",
                            icon: Plus,
                            onClick: handleCreate
                        }
                    ]}
                />
                <EmptyState
                    icon={Users}
                    title="No tienes subcontratos"
                    description="Aquí aparecerán los contratos con proveedores y subcontratistas."
                    action={
                        <Button onClick={handleCreate}>
                            <Plus className="w-4 h-4 mr-2" />
                            Crear primer subcontrato
                        </Button>
                    }
                />
            </>
        );
    }

    return (
        <div className="space-y-4">
            <Toolbar
                portalToHeader
                actions={[
                    {
                        label: "Nuevo Subcontrato",
                        icon: Plus,
                        onClick: handleCreate
                    }
                ]}
            />
            {/* List Table would go here */}
        </div>
    );
}
