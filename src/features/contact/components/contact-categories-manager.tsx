"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Monitor, Building2, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageIntro } from "@/components/layout";
import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";
import { BookUser } from "lucide-react";
import { ListItem, type ListItemContextMenuAction } from "@/components/shared/list-item";
import { DeleteReplacementModal } from "@/components/shared/forms/general/delete-replacement-modal";
import { usePanel } from "@/stores/panel-store";
import { deleteContactCategory } from "@/actions/contacts";
import { ContactCategory } from "@/types/contact";
import { toast } from "sonner";

interface ContactCategoriesManagerProps {
    organizationId: string;
    initialCategories: ContactCategory[];
}

export function ContactCategoriesManager({ organizationId, initialCategories }: ContactCategoriesManagerProps) {
    const { openPanel } = usePanel();
    const [categories, setCategories] = useState<ContactCategory[]>(initialCategories);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState<ContactCategory | null>(null);

    // 🚀 OPTIMISTIC: Create category
    const handleCreate = (newCategory: ContactCategory) => {
        setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
    };

    // 🚀 OPTIMISTIC: Edit category
    const handleEdit = (updatedCategory: ContactCategory) => {
        setCategories(prev => prev.map(c =>
            c.id === updatedCategory.id ? updatedCategory : c
        ).sort((a, b) => a.name.localeCompare(b.name)));
    };

    // 🚀 OPTIMISTIC: Delete category
    const handleDelete = async (replacementId: string | null) => {
        if (!deletingCategory) return;
        const deletedItem = deletingCategory;

        // 1. Update UI immediately
        setCategories(prev => prev.filter(c => c.id !== deletedItem.id));
        setIsDeleteDialogOpen(false);
        setDeletingCategory(null);

        // 2. Server call in background
        try {
            await deleteContactCategory(deletedItem.id, replacementId || undefined);
        } catch {
            setCategories(prev => [...prev, deletedItem].sort((a, b) => a.name.localeCompare(b.name)));
            toast.error("Error inesperado al eliminar categoría");
        }
    };

    const handleOpenCreate = () => {
        openPanel('contact-category-form', {
            organizationId,
            onSuccess: handleCreate,
        });
    };

    const handleOpenEdit = (category: ContactCategory) => {
        openPanel('contact-category-form', {
            organizationId,
            initialData: category,
            onSuccess: handleEdit,
        });
    };

    return (
        <div className="space-y-6">
            <PageIntro
                icon={BookUser}
                title="Contactos"
                description="Administrá la libreta de direcciones y categorías para organizar mejor a tus clientes y proveedores."
            />
            <SettingsSectionContainer>
                <SettingsSection
                    contentVariant="inset"
                    icon={Tags}
                    title="Categorías de Contacto"
                    description="Las categorías te permiten clasificar y organizar tus contactos según su relación con tu empresa: clientes, proveedores, subcontratistas, arquitectos, y más. Usá las categorías para filtrar contactos rápidamente y mantener tu directorio organizado."
                    actions={[
                        { label: "Nueva Categoría", icon: Plus, onClick: handleOpenCreate },
                    ]}
                >
                    {categories.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">No hay categorías definidas. Creá una para empezar a organizar tus contactos.</p>
                    ) : (
                        <div className="space-y-2.5">
                            {categories.map((category) => (
                                <CategoryListItem
                                    key={category.id}
                                    category={category}
                                    onEdit={handleOpenEdit}
                                    onDelete={(cat) => { setDeletingCategory(cat); setIsDeleteDialogOpen(true); }}
                                />
                            ))}
                        </div>
                    )}
                </SettingsSection>
            </SettingsSectionContainer>

            <DeleteReplacementModal
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setDeletingCategory(null);
                }}
                onConfirm={handleDelete}
                itemToDelete={deletingCategory ? { id: deletingCategory.id, name: deletingCategory.name } : null}
                replacementOptions={categories.filter(c => c.id !== deletingCategory?.id)}
                entityLabel="categoría de contacto"
                title="Eliminar Categoría"
                description="Si eliminás esta categoría, podés elegir otra para reasignar los contactos que la tenían."
            />
        </div>
    );
}

// ─── Category List Item ──────────────────────────────────────────

interface CategoryListItemProps {
    category: ContactCategory;
    onEdit: (category: ContactCategory) => void;
    onDelete: (category: ContactCategory) => void;
}

function CategoryListItem({ category, onEdit, onDelete }: CategoryListItemProps) {
    const isSystem = !category.organization_id;

    // Context menu actions (only for non-system items) — same pattern as Projects settings
    const contextMenuActions = useMemo((): ListItemContextMenuAction[] | undefined => {
        if (isSystem) return undefined;
        return [
            {
                label: "Editar",
                icon: <Pencil className="h-3.5 w-3.5" />,
                onClick: () => onEdit(category),
            },
            {
                label: "Eliminar",
                icon: <Trash2 className="h-3.5 w-3.5" />,
                onClick: () => onDelete(category),
                variant: "destructive" as const,
            },
        ];
    }, [category, isSystem, onEdit, onDelete]);

    return (
        <ListItem variant="row" contextMenuActions={contextMenuActions}>
            <ListItem.Content>
                <ListItem.Title>{category.name}</ListItem.Title>
            </ListItem.Content>

            <ListItem.Trailing>
                {isSystem ? (
                    <Badge variant="system" icon={<Monitor className="h-3 w-3" />}>
                        Sistema
                    </Badge>
                ) : (
                    <Badge variant="organization" icon={<Building2 className="h-3 w-3" />}>
                        Organización
                    </Badge>
                )}
            </ListItem.Trailing>
        </ListItem>
    );
}

