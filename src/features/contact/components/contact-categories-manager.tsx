"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, MoreHorizontal, Monitor, Building2, Tags } from "lucide-react";
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
import { useModal } from "@/stores/modal-store";
import { deleteContactCategory } from "@/actions/contacts";
import { ContactCategory } from "@/types/contact";
import { ContactCategoryForm } from "./contact-category-form";
import { toast } from "sonner";

interface ContactCategoriesManagerProps {
    organizationId: string;
    initialCategories: ContactCategory[];
}

export function ContactCategoriesManager({ organizationId, initialCategories }: ContactCategoriesManagerProps) {
    const { openModal } = useModal();
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
        openModal(
            <ContactCategoryForm
                organizationId={organizationId}
                onSuccess={handleCreate}
            />,
            {
                title: "Crear Categoría",
                description: "Define una nueva categoría para clasificar tus contactos.",
                size: 'md'
            }
        );
    };

    const handleOpenEdit = (category: ContactCategory) => {
        openModal(
            <ContactCategoryForm
                organizationId={organizationId}
                initialData={category}
                onSuccess={handleEdit}
            />,
            {
                title: "Editar Categoría",
                description: "Modifica el nombre de esta categoría de contacto.",
                size: 'md'
            }
        );
    };

    return (
        <>
            <SettingsSectionContainer>
                <SettingsSection
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
                        <div className="space-y-2">
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
        </>
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

    return (
        <ListItem variant="card">
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

            <ListItem.Actions>
                {!isSystem && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Acciones</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(category)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(category)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </ListItem.Actions>
        </ListItem>
    );
}
