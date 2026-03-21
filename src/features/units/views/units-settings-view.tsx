"use client";

import { useState, useMemo } from "react";
import { Plus, Ruler } from "lucide-react";
import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";
import { PageIntro } from "@/components/layout";
import { DeleteDialog } from "@/components/shared/forms/general/delete-dialog";
import { UnitListItem } from "@/components/shared/list-item/items/unit-list-item";
import { toast } from "sonner";
import { usePanel } from "@/stores/panel-store";
import { useRouter } from "@/i18n/routing";
import { useOptimisticList } from "@/hooks/use-optimistic-action";

import { deleteUnit } from "../actions";
import type { CatalogUnit } from "../queries";

interface UnitsSettingsViewProps {
    units: CatalogUnit[];
    orgId: string;
    isAdminMode?: boolean;
}

export function UnitsSettingsView({
    units,
    orgId,
    isAdminMode = false,
}: UnitsSettingsViewProps) {
    const router = useRouter();
    const { openPanel } = usePanel();

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<CatalogUnit | null>(null);

    // Optimistic list for instant UI updates
    const { optimisticItems, removeItem } = useOptimisticList({
        items: units,
        getItemId: (u) => u.id,
    });

    // Check if item can be edited
    const canEditItem = (item: CatalogUnit) => {
        if (isAdminMode) return item.is_system;
        return !item.is_system; // Org can only edit their own units
    };

    const handleOpenCreate = () => {
        openPanel('unit-form', {
            organizationId: orgId,
        });
    };

    const handleOpenEdit = (unit: CatalogUnit) => {
        if (!canEditItem(unit)) {
            toast.error("No podés editar unidades del sistema");
            return;
        }
        openPanel('unit-form', {
            organizationId: orgId,
            initialData: unit,
        });
    };

    const handleDeleteClick = (unit: CatalogUnit) => {
        if (!canEditItem(unit)) {
            toast.error("No podés eliminar unidades del sistema");
            return;
        }
        setDeletingItem(unit);
        setIsDeleteDialogOpen(true);
    };

    // 🚀 OPTIMISTIC: Delete unit
    const handleDeleteConfirm = async () => {
        if (!deletingItem) return;

        const unitId = deletingItem.id;
        const unitName = deletingItem.name;

        // 1. Close modal and clear state IMMEDIATELY
        setIsDeleteDialogOpen(false);
        setDeletingItem(null);

        // 2. Optimistically remove from UI
        removeItem(unitId, async () => {
            try {
                const result = await deleteUnit(unitId);
                if (!result.success) {
                    toast.error(result.error || "Error al eliminar");
                    router.refresh(); // Rollback by refreshing
                    return;
                }
                toast.success(`"${unitName}" eliminada correctamente`);
            } catch {
                toast.error("Error inesperado al eliminar");
                router.refresh(); // Rollback by refreshing
            }
        });
    };

    return (
        <div className="space-y-6">
            <PageIntro
                icon={Ruler}
                title="Unidades"
                description="Configurá las unidades de medida permitidas para cuantificar recursos y tareas en la organización."
            />
            <SettingsSectionContainer>
                <SettingsSection
                    contentVariant="inset"
                    icon={Ruler}
                    title="Unidades de Medida"
                    description="Catálogo de unidades disponibles."
                actions={[
                    { label: "Nueva Unidad", icon: Plus, onClick: handleOpenCreate },
                ]}
            >
                {optimisticItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No hay unidades configuradas.</p>
                ) : (
                    <div className="space-y-2.5">
                        {optimisticItems.map((unit) => (
                            <UnitListItem
                                key={unit.id}
                                unit={unit}
                                canEdit={canEditItem(unit)}
                                onEdit={handleOpenEdit}
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </div>
                )}
            </SettingsSection>

            <DeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsDeleteDialogOpen(false);
                        setDeletingItem(null);
                    }
                }}
                onConfirm={handleDeleteConfirm}
                title="Eliminar Unidad"
                description={`¿Estás seguro de que querés eliminar "${deletingItem?.name}"? Esta acción no se puede deshacer.`}
            />
        </SettingsSectionContainer>
        </div>
    );
}
