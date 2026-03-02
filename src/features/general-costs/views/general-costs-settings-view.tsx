"use client";

/**
 * General Costs — Settings View
 * Standard 19.0 - Settings Layout with SettingsSection.
 *
 * Uses SettingsSection for two-column layout + CategoryListItem.
 * No DataTable — category management via list items.
 */

import { Plus, FolderOpen, Settings } from "lucide-react";
import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { usePanel } from "@/stores/panel-store";
import { useTableActions } from "@/hooks/use-table-actions";
import { CategoryListItem } from "@/components/shared/list-item/items/category-list-item";
import { deleteGeneralCostCategory } from "../actions";
import { GeneralCostCategory } from "../types";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────

interface SettingsViewProps {
    categories: GeneralCostCategory[];
    organizationId: string;
}

// ─── Component ───────────────────────────────────────────

export function GeneralCostsSettingsView({ categories, organizationId }: SettingsViewProps) {
    const { openPanel } = usePanel();

    // ─── Delete actions ──────────────────────────────────
    const { handleDelete, DeleteConfirmDialog } = useTableActions<GeneralCostCategory>({
        onDelete: async (item) => {
            try {
                await deleteGeneralCostCategory(item.id);
                toast.success("Categoría eliminada");
                return { success: true };
            } catch {
                toast.error("Error al eliminar la categoría");
                return { success: false };
            }
        },
        entityName: "categoría",
        entityNamePlural: "categorías",
    });

    // ─── Handlers ────────────────────────────────────────
    const handleCreate = () => {
        openPanel('general-cost-category-form', {
            organizationId,
        });
    };

    const handleEdit = (cat: GeneralCostCategory) => {
        openPanel('general-cost-category-form', {
            organizationId,
            initialData: cat,
        });
    };

    const handleDeleteWithGuard = (cat: GeneralCostCategory) => {
        if (cat.is_system) {
            toast.error("No se puede eliminar una categoría del sistema");
            return;
        }
        handleDelete(cat);
    };

    // ─── Render ──────────────────────────────────────────
    return (
        <>
            <div className="mx-auto max-w-5xl">
                <SettingsSectionContainer>
                    <SettingsSection
                        icon={FolderOpen}
                        title="Categorías"
                        description="Organizá tus gastos generales en categorías para poder filtrar y analizar mejor."
                        actions={[
                            { label: "Nueva Categoría", icon: Plus, onClick: handleCreate },
                        ]}
                    >
                        {categories.length === 0 ? (
                            <ViewEmptyState
                                mode="empty"
                                icon={Settings}
                                viewName="Categorías"
                                featureDescription="Creá categorías para organizar y filtrar tus gastos generales."
                                onAction={handleCreate}
                                actionLabel="Nueva Categoría"
                            />
                        ) : (
                            <div className="space-y-2">
                                {categories.map((cat) => (
                                    <CategoryListItem
                                        key={cat.id}
                                        category={cat}
                                        canEdit={!cat.is_system}
                                        onEdit={handleEdit}
                                        onDelete={handleDeleteWithGuard}
                                    />
                                ))}
                            </div>
                        )}
                    </SettingsSection>
                </SettingsSectionContainer>
            </div>

            <DeleteConfirmDialog />
        </>
    );
}
