"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Tags } from "lucide-react";
import { SettingsSection } from "@/components/shared/settings-section";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { DeleteReplacementModal } from "@/components/shared/forms/general/delete-replacement-modal";
import { usePanel } from "@/stores/panel-store";
import { useRouter } from "@/i18n/routing";
import { deleteSiteLogType } from "../actions";
import { SiteLogType } from "../types";
import { SiteLogTypeListItem } from "@/components/shared/list-item/items/sitelog-type-list-item";

interface SitelogSettingsViewProps {
    organizationId: string;
    initialTypes: SiteLogType[];
}

export function SitelogSettingsView({ organizationId, initialTypes }: SitelogSettingsViewProps) {
    const { openPanel } = usePanel();
    const router = useRouter();

    const [types, setTypes] = useState<SiteLogType[]>(initialTypes);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingType, setDeletingType] = useState<SiteLogType | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Sync server data when router.refresh() delivers new props
    useEffect(() => {
        setTypes(initialTypes);
    }, [initialTypes]);

    const handleOpenCreate = useCallback(() => {
        openPanel('sitelog-type-form', {
            organizationId,
            onSuccess: () => router.refresh(),
        });
    }, [organizationId, openPanel, router]);

    const handleOpenEdit = useCallback((type: SiteLogType) => {
        openPanel('sitelog-type-form', {
            organizationId,
            initialData: type,
            onSuccess: () => router.refresh(),
        });
    }, [organizationId, openPanel, router]);

    const handleOpenDelete = (type: SiteLogType) => {
        setDeletingType(type);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async (replacementId: string | null) => {
        if (!deletingType) return;
        setIsDeleting(true);

        try {
            await deleteSiteLogType(organizationId, deletingType.id, replacementId || undefined);
            setTypes(prev => prev.filter(t => t.id !== deletingType.id));
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setDeletingType(null);
        }
    };

    return (
        <>
            <div className="space-y-6">
                <SettingsSection
                    icon={Tags}
                    title="Tipos de Bitácora"
                    description="Gestiona las categorías para clasificar tus registros de bitácora. Los tipos de sistema no se pueden modificar."
                    contentVariant="inset"
                    actions={[
                        {
                            label: "Agregar tipo",
                            icon: Plus,
                            onClick: handleOpenCreate,
                        },
                    ]}
                >
                    <div className="space-y-2.5">
                        {types.length === 0 ? (
                            <ViewEmptyState
                                mode="empty"
                                icon={Tags}
                                viewName="Tipos de Bitácora"
                                featureDescription="Los tipos de bitácora te permiten clasificar tus registros de obra por categoría. Puedes crear tipos como 'Incidente', 'Avance' o 'Inspección'."
                                onAction={handleOpenCreate}
                                actionLabel="Agregar tipo"
                                totalCount={types.length}
                            />
                        ) : (
                            types.map((type) => (
                                <SiteLogTypeListItem
                                    key={type.id}
                                    type={type}
                                    canEdit={!type.is_system}
                                    onEdit={handleOpenEdit}
                                    onDelete={handleOpenDelete}
                                />
                            ))
                        )}
                    </div>
                </SettingsSection>
            </div>

            <DeleteReplacementModal
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setDeletingType(null);
                }}
                onConfirm={handleDelete}
                itemToDelete={deletingType ? { id: deletingType.id, name: deletingType.name } : null}
                replacementOptions={types.filter(t => t.id !== deletingType?.id)}
                entityLabel="tipo de bitácora"
                title="Eliminar Tipo"
                description="Si eliminas este tipo, puedes elegir otro para reasignar los registros que lo tenían."
            />
        </>
    );
}
