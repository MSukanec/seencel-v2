"use client";

import { useState, useEffect } from "react";
import { Plus, Tags } from "lucide-react";
import { SettingsSection } from "@/components/shared/settings-section";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { DeleteReplacementModal } from "@/components/shared/forms/general/delete-replacement-modal";
import { useModal } from "@/stores/modal-store";
import { deleteSiteLogType } from "../actions";
import { SiteLogType } from "../types";
import { SiteLogTypeForm } from "../forms/sitelog-type-form";
import { SiteLogTypeListItem } from "@/components/shared/list-item/items/sitelog-type-list-item";

interface SitelogSettingsViewProps {
    organizationId: string;
    initialTypes: SiteLogType[];
}

export function SitelogSettingsView({ organizationId, initialTypes }: SitelogSettingsViewProps) {
    const { openModal } = useModal();

    const [types, setTypes] = useState<SiteLogType[]>(initialTypes);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingType, setDeletingType] = useState<SiteLogType | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Sync server data when router.refresh() delivers new props
    useEffect(() => {
        setTypes(initialTypes);
    }, [initialTypes]);

    const handleOpenCreate = () => {
        openModal(
            <SiteLogTypeForm
                organizationId={organizationId}
            />,
            {
                title: "Crear Tipo",
                description: "Define un nuevo tipo para clasificar tus registros.",
                size: 'md'
            }
        );
    };

    const handleOpenEdit = (type: SiteLogType) => {
        openModal(
            <SiteLogTypeForm
                organizationId={organizationId}
                initialData={type}
            />,
            {
                title: "Editar Tipo",
                description: "Modifica el nombre de este tipo de bitácora.",
                size: 'md'
            }
        );
    };

    const handleOpenDelete = (type: SiteLogType) => {
        setDeletingType(type);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async (replacementId: string | null) => {
        if (!deletingType) return;
        setIsDeleting(true);

        try {
            await deleteSiteLogType(deletingType.id, replacementId || undefined);
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
                    actions={[
                        {
                            label: "Agregar tipo",
                            icon: Plus,
                            onClick: handleOpenCreate,
                        },
                    ]}
                >
                    <div className="space-y-2">
                        {types.length === 0 ? (
                            <ViewEmptyState
                                mode="empty"
                                icon={Tags}
                                viewName="Tipos de Bitácora"
                                featureDescription="Los tipos de bitácora te permiten clasificar tus registros de obra por categoría. Puedes crear tipos como 'Incidente', 'Avance' o 'Inspección'."
                                onAction={handleOpenCreate}
                                actionLabel="Agregar tipo"
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
