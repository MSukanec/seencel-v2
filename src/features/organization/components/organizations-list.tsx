"use client";

import { useState, useTransition } from "react";
import { OrganizationListItem, type OrganizationListItemData } from "@/components/shared/list-item/items/organization-list-item";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { switchOrganization } from "../actions";
import { deleteOrganization } from "../actions/delete-organization";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface OrganizationsListProps {
    organizations: OrganizationListItemData[];
    activeOrgId: string | null;
    currentUserId: string;
}

export function OrganizationsList({
    organizations: initialOrganizations,
    activeOrgId,
    currentUserId,
}: OrganizationsListProps) {
    const t = useTranslations('Settings.Organization');
    const [organizations, setOrganizations] = useState(initialOrganizations);
    const [deleteTarget, setDeleteTarget] = useState<OrganizationListItemData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSwitching, startSwitchTransition] = useTransition();

    const handleSwitch = (org: OrganizationListItemData) => {
        startSwitchTransition(async () => {
            try {
                await switchOrganization(org.id);
            } catch (error) {
                console.error("Failed to switch:", error);
            }
        });
    };

    const handleDeleteRequest = (org: OrganizationListItemData) => {
        setDeleteTarget(org);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);

        const orgToDelete = deleteTarget;

        // Optimistic: remove from list immediately
        setOrganizations(prev => prev.filter(o => o.id !== orgToDelete.id));
        setDeleteTarget(null);

        try {
            const result = await deleteOrganization(orgToDelete.id);
            if (!result.success) {
                // Rollback
                setOrganizations(prev => [...prev, orgToDelete]);
                toast.error(result.error || "Error al eliminar la organización");
            } else {
                toast.success(`"${orgToDelete.name}" eliminada correctamente`);
            }
        } catch (error) {
            // Rollback
            setOrganizations(prev => [...prev, orgToDelete]);
            toast.error("Error inesperado al eliminar la organización");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="grid gap-4">
                {organizations.map((org) => (
                    <OrganizationListItem
                        key={org.id}
                        organization={org}
                        isActive={org.id === activeOrgId}
                        isOwner={org.owner_id === currentUserId}
                        switchLabel={t('switch')}
                        activeLabel={t('current')}
                        onSwitch={handleSwitch}
                        onDelete={handleDeleteRequest}
                    />
                ))}
            </div>

            {/* Dangerous delete confirmation - requires typing org name */}
            <DeleteConfirmationDialog
                open={!!deleteTarget}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Eliminar Organización"
                description={
                    <>
                        Estás a punto de eliminar <strong>{deleteTarget?.name}</strong>.
                        Esta acción eliminará todos los proyectos, datos financieros, miembros y configuraciones asociadas.
                        Esta acción no se puede deshacer.
                    </>
                }
                validationText={deleteTarget?.name}
                validationPrompt="Escribí {text} para confirmar:"
                confirmLabel="Eliminar Organización"
                isDeleting={isDeleting}
            />
        </>
    );
}
