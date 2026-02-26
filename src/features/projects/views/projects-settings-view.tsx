"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, MoreHorizontal, Monitor, Building2, Layers, FolderCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";
import { ListItem } from "@/components/shared/list-item";
import { DeleteReplacementModal } from "@/components/shared/forms/general/delete-replacement-modal";
import { toast } from "sonner";
import { usePanel } from "@/stores/panel-store";
import {
    createProjectType,
    updateProjectType,
    deleteProjectType,
    createProjectModality,
    updateProjectModality,
    deleteProjectModality,
} from "@/features/projects/actions";



// ─── Shared Types ─────────────────────────────────────────────

interface SettingsItem {
    id: string;
    name: string;
    is_system: boolean;
    organization_id: string | null;
}

interface ProjectsSettingsViewProps {
    organizationId: string;
    initialTypes: SettingsItem[];
    initialModalities: SettingsItem[];
}

// ─── Main Settings View ───────────────────────────────────────

export function ProjectsSettingsView({
    organizationId,
    initialTypes,
    initialModalities,
}: ProjectsSettingsViewProps) {
    return (
        <SettingsSectionContainer>
            <TypesSection organizationId={organizationId} initialTypes={initialTypes} />
            <ModalitiesSection organizationId={organizationId} initialModalities={initialModalities} />
        </SettingsSectionContainer>
    );
}

// ─── Types Section ────────────────────────────────────────────

function TypesSection({ organizationId, initialTypes }: { organizationId: string; initialTypes: SettingsItem[] }) {
    const t = useTranslations("Project.settings.types");
    const { openPanel } = usePanel();
    const [types, setTypes] = useState<SettingsItem[]>(initialTypes);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<SettingsItem | null>(null);

    // 🚀 OPTIMISTIC: Create type
    const handleCreate = (data: { name: string }) => {
        const tempId = `temp-${Date.now()}`;
        const optimisticItem: SettingsItem = {
            id: tempId,
            name: data.name,
            is_system: false,
            organization_id: organizationId,
        };

        // 1. Update UI immediately
        setTypes(prev => [...prev, optimisticItem].sort((a, b) => a.name.localeCompare(b.name)));

        // 2. Server call in background
        createProjectType(organizationId, data.name)
            .then(result => {
                if (result.error) {
                    setTypes(prev => prev.filter(t => t.id !== tempId));
                    toast.error(result.error);
                } else if (result.data) {
                    setTypes(prev => prev.map(t => t.id === tempId ? result.data! : t));
                }
            })
            .catch(() => {
                setTypes(prev => prev.filter(t => t.id !== tempId));
                toast.error("Error inesperado al crear tipo");
            });
    };

    // 🚀 OPTIMISTIC: Edit type
    const handleEdit = (type: SettingsItem, data: { name: string }) => {
        const previousItem = type;
        const optimisticItem: SettingsItem = { ...type, name: data.name };

        // 1. Update UI immediately
        setTypes(prev => prev.map(t =>
            t.id === type.id ? optimisticItem : t
        ).sort((a, b) => a.name.localeCompare(b.name)));

        // 2. Server call in background
        updateProjectType(type.id, organizationId, data.name)
            .then(result => {
                if (result.error) {
                    setTypes(prev => prev.map(t => t.id === type.id ? previousItem : t));
                    toast.error(result.error);
                } else if (result.data) {
                    setTypes(prev => prev.map(t => t.id === type.id ? result.data! : t));
                }
            })
            .catch(() => {
                setTypes(prev => prev.map(t => t.id === type.id ? previousItem : t));
                toast.error("Error inesperado al editar tipo");
            });
    };

    // 🚀 OPTIMISTIC: Delete type
    const handleDelete = async (replacementId: string | null) => {
        if (!deletingItem) return;
        const deletedItem = deletingItem;

        // 1. Update UI immediately
        setTypes(prev => prev.filter(t => t.id !== deletedItem.id));
        setIsDeleteDialogOpen(false);
        setDeletingItem(null);

        // 2. Server call in background
        try {
            const result = await deleteProjectType(deletedItem.id, replacementId || undefined);
            if (!result.success) {
                setTypes(prev => [...prev, deletedItem].sort((a, b) => a.name.localeCompare(b.name)));
                toast.error(result.error || "Error al eliminar tipo");
            }
        } catch {
            setTypes(prev => [...prev, deletedItem].sort((a, b) => a.name.localeCompare(b.name)));
            toast.error("Error inesperado al eliminar tipo");
        }
    };

    const handleOpenCreate = () => {
        openPanel('projects-type-form', {
            organizationId,
            onSubmit: handleCreate,
        });
    };

    const handleOpenEdit = (type: SettingsItem) => {
        openPanel('projects-type-form', {
            organizationId,
            initialData: type,
            onSubmit: (data: { name: string }) => handleEdit(type, data),
        });
    };

    return (
        <>
            <SettingsSection
                icon={Layers}
                title={t("title")}
                description={t("description")}
                actions={[
                    { label: t("add"), icon: Plus, onClick: handleOpenCreate },
                ]}
            >
                {types.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">{t("empty")}</p>
                ) : (
                    <div className="space-y-2">
                        {types.map((type) => (
                            <SettingsListItem
                                key={type.id}
                                item={type}
                                labels={{
                                    system: t("system"),
                                    organization: t("organization"),
                                    edit: t("edit"),
                                    delete: t("delete"),
                                    actions: t("actions"),
                                }}
                                onEdit={handleOpenEdit}
                                onDelete={(item) => { setDeletingItem(item); setIsDeleteDialogOpen(true); }}
                            />
                        ))}
                    </div>
                )}
            </SettingsSection>

            <DeleteReplacementModal
                isOpen={isDeleteDialogOpen}
                onClose={() => { setIsDeleteDialogOpen(false); setDeletingItem(null); }}
                onConfirm={handleDelete}
                itemToDelete={deletingItem}
                replacementOptions={types.filter(t => t.id !== deletingItem?.id)}
                entityLabel={t("modal.deleteConfirm.entityLabel") || "tipo de proyecto"}
                title={t("modal.deleteConfirm.title")}
                description={t("modal.deleteConfirm.description")}
            />
        </>
    );
}

// ─── Modalities Section ───────────────────────────────────────

function ModalitiesSection({ organizationId, initialModalities }: { organizationId: string; initialModalities: SettingsItem[] }) {
    const t = useTranslations("Project.settings.modalities");
    const { openPanel } = usePanel();
    const [modalities, setModalities] = useState<SettingsItem[]>(initialModalities);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<SettingsItem | null>(null);

    // 🚀 OPTIMISTIC: Create modality
    const handleCreate = (data: { name: string }) => {
        const tempId = `temp-${Date.now()}`;
        const optimisticItem: SettingsItem = {
            id: tempId,
            name: data.name,
            is_system: false,
            organization_id: organizationId,
        };

        // 1. Update UI immediately
        setModalities(prev => [...prev, optimisticItem].sort((a, b) => a.name.localeCompare(b.name)));

        // 2. Server call in background
        createProjectModality(organizationId, data.name)
            .then(result => {
                if (result.error) {
                    setModalities(prev => prev.filter(m => m.id !== tempId));
                    toast.error(result.error);
                } else if (result.data) {
                    setModalities(prev => prev.map(m => m.id === tempId ? result.data! : m));
                }
            })
            .catch(() => {
                setModalities(prev => prev.filter(m => m.id !== tempId));
                toast.error("Error inesperado al crear modalidad");
            });
    };

    // 🚀 OPTIMISTIC: Edit modality
    const handleEdit = (modality: SettingsItem, data: { name: string }) => {
        const previousItem = modality;
        const optimisticItem: SettingsItem = { ...modality, name: data.name };

        // 1. Update UI immediately
        setModalities(prev => prev.map(m =>
            m.id === modality.id ? optimisticItem : m
        ).sort((a, b) => a.name.localeCompare(b.name)));

        // 2. Server call in background
        updateProjectModality(modality.id, organizationId, data.name)
            .then(result => {
                if (result.error) {
                    setModalities(prev => prev.map(m => m.id === modality.id ? previousItem : m));
                    toast.error(result.error);
                } else if (result.data) {
                    setModalities(prev => prev.map(m => m.id === modality.id ? result.data! : m));
                }
            })
            .catch(() => {
                setModalities(prev => prev.map(m => m.id === modality.id ? previousItem : m));
                toast.error("Error inesperado al editar modalidad");
            });
    };

    // 🚀 OPTIMISTIC: Delete modality
    const handleDelete = async (replacementId: string | null) => {
        if (!deletingItem) return;
        const deletedItem = deletingItem;

        // 1. Update UI immediately
        setModalities(prev => prev.filter(m => m.id !== deletedItem.id));
        setIsDeleteDialogOpen(false);
        setDeletingItem(null);

        // 2. Server call in background
        try {
            const result = await deleteProjectModality(deletedItem.id, replacementId || undefined);
            if (!result.success) {
                setModalities(prev => [...prev, deletedItem].sort((a, b) => a.name.localeCompare(b.name)));
                toast.error(result.error || "Error al eliminar modalidad");
            }
        } catch {
            setModalities(prev => [...prev, deletedItem].sort((a, b) => a.name.localeCompare(b.name)));
            toast.error("Error inesperado al eliminar modalidad");
        }
    };

    const handleOpenCreate = () => {
        openPanel('projects-modality-form', {
            organizationId,
            onSubmit: handleCreate,
        });
    };

    const handleOpenEdit = (modality: SettingsItem) => {
        openPanel('projects-modality-form', {
            organizationId,
            initialData: modality,
            onSubmit: (data: { name: string }) => handleEdit(modality, data),
        });
    };

    return (
        <>
            <SettingsSection
                icon={FolderCog}
                title={t("title")}
                description={t("description")}
                actions={[
                    { label: t("add"), icon: Plus, onClick: handleOpenCreate },
                ]}
            >
                {modalities.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">{t("empty")}</p>
                ) : (
                    <div className="space-y-2">
                        {modalities.map((modality) => (
                            <SettingsListItem
                                key={modality.id}
                                item={modality}
                                labels={{
                                    system: t("system"),
                                    organization: t("organization"),
                                    edit: t("edit"),
                                    delete: t("delete"),
                                    actions: t("actions"),
                                }}
                                onEdit={handleOpenEdit}
                                onDelete={(item) => { setDeletingItem(item); setIsDeleteDialogOpen(true); }}
                            />
                        ))}
                    </div>
                )}
            </SettingsSection>

            <DeleteReplacementModal
                isOpen={isDeleteDialogOpen}
                onClose={() => { setIsDeleteDialogOpen(false); setDeletingItem(null); }}
                onConfirm={handleDelete}
                itemToDelete={deletingItem}
                replacementOptions={modalities.filter(m => m.id !== deletingItem?.id)}
                entityLabel={t("modal.deleteConfirm.entityLabel") || "modalidad"}
                title={t("modal.deleteConfirm.title")}
                description={t("modal.deleteConfirm.description")}
            />
        </>
    );
}

// ─── Reusable Settings List Item ─────────────────────────────

interface SettingsListItemProps {
    item: SettingsItem;
    labels: {
        system: string;
        organization: string;
        edit: string;
        delete: string;
        actions: string;
    };
    onEdit: (item: SettingsItem) => void;
    onDelete: (item: SettingsItem) => void;
}

function SettingsListItem({ item, labels, onEdit, onDelete }: SettingsListItemProps) {
    return (
        <ListItem variant="card">
            <ListItem.Content>
                <ListItem.Title>{item.name}</ListItem.Title>
            </ListItem.Content>

            <ListItem.Trailing>
                {item.is_system ? (
                    <Badge variant="system" icon={<Monitor className="h-3 w-3" />}>
                        {labels.system}
                    </Badge>
                ) : (
                    <Badge variant="organization" icon={<Building2 className="h-3 w-3" />}>
                        {labels.organization}
                    </Badge>
                )}
            </ListItem.Trailing>

            <ListItem.Actions>
                {!item.is_system && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">{labels.actions}</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                {labels.edit}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(item)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {labels.delete}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </ListItem.Actions>
        </ListItem>
    );
}
