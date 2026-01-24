"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";
import {
    Plus,
    Package,
    MoreHorizontal,
    Pencil,
    Trash2,
    FolderTree,
    Monitor,
    Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/providers/modal-store";
import { MaterialForm, type MaterialCategory, type Unit, type Material } from "@/features/materials/components/forms/material-form";
import { CategoryForm } from "@/features/admin/components/forms/category-form";
import { deleteMaterial } from "@/features/materials/actions";
import { createMaterialCategory, updateMaterialCategory, deleteMaterialCategory } from "@/features/admin/material-actions";
import { toast } from "sonner";
import { DeleteReplacementModal } from "@/components/shared/delete-replacement-modal";
import { CategoryTree, CategoryItem } from "@/components/shared/category-tree";

// Extended material type with joined data from query
export interface MaterialWithDetails extends Material {
    unit_name?: string | null;
    category_name?: string | null;
}

// Category hierarchy node
export interface MaterialCategoryNode {
    id: string;
    name: string;
    parent_id: string | null;
    children?: MaterialCategoryNode[];
}

export interface MaterialsCatalogViewProps {
    materials: MaterialWithDetails[];
    units: Unit[];
    categories: MaterialCategory[];
    categoryHierarchy: MaterialCategoryNode[];
    orgId: string;
    isAdminMode?: boolean;
}

export function MaterialsCatalogView({
    materials,
    units,
    categories,
    categoryHierarchy,
    orgId,
    isAdminMode = false
}: MaterialsCatalogViewProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();
    const [activeTab, setActiveTab] = useState<"materials" | "categories">("materials");
    const [searchQuery, setSearchQuery] = useState("");

    // Material delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState<MaterialWithDetails | null>(null);

    // Category delete modal state
    const [categoryDeleteModalOpen, setCategoryDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);


    // Filter materials by search
    const filteredMaterials = materials.filter(material => {
        const query = searchQuery.toLowerCase();
        return (
            material.name?.toLowerCase().includes(query) ||
            material.category_name?.toLowerCase().includes(query) ||
            material.unit_name?.toLowerCase().includes(query)
        );
    });

    // Filter by editability: in org mode, only show editable (org) materials in admin actions
    const canEdit = (material: MaterialWithDetails) => {
        if (isAdminMode) return material.is_system;
        return !material.is_system; // Org can only edit their own materials
    };

    // ========================================================================
    // Material Handlers
    // ========================================================================

    const handleCreateMaterial = () => {
        openModal(
            <MaterialForm
                mode="create"
                organizationId={orgId}
                units={units}
                categories={categories}
                isAdminMode={isAdminMode}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
            />,
            {
                title: isAdminMode ? "Nuevo Material de Sistema" : "Nuevo Material",
                description: isAdminMode
                    ? "Crear un material disponible para todas las organizaciones"
                    : "Agregar un material personalizado al catálogo de tu organización",
                size: "md"
            }
        );
    };

    const handleEditMaterial = (material: MaterialWithDetails) => {
        if (!canEdit(material)) {
            toast.error("No puedes editar materiales del sistema");
            return;
        }

        openModal(
            <MaterialForm
                mode="edit"
                organizationId={orgId}
                initialData={material}
                units={units}
                categories={categories}
                isAdminMode={isAdminMode}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
            />,
            {
                title: "Editar Material",
                description: "Modifica los datos de este material",
                size: "md"
            }
        );
    };

    const handleDeleteMaterialClick = (material: MaterialWithDetails) => {
        if (!canEdit(material)) {
            toast.error("No puedes eliminar materiales del sistema");
            return;
        }
        setMaterialToDelete(material);
        setDeleteModalOpen(true);
    };

    const handleConfirmDeleteMaterial = async (replacementId: string | null) => {
        if (!materialToDelete) return;

        try {
            const result = await deleteMaterial(materialToDelete.id, replacementId, isAdminMode);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(replacementId
                    ? "Material reemplazado y eliminado"
                    : "Material eliminado correctamente"
                );
                router.refresh();
            }
        } catch (error) {
            toast.error("Error al eliminar el material");
        }
    };

    // ========================================================================
    // Category Handlers (Admin only)
    // ========================================================================

    const handleCreateCategory = (parentId: string | null = null) => {
        openModal(
            <CategoryForm
                parentId={parentId}
                onSubmit={async (name, pId) => {
                    const result = await createMaterialCategory(name, pId);
                    if (!result.error) {
                        toast.success("Categoría creada");
                        router.refresh();
                    }
                    return result;
                }}
                onSuccess={() => closeModal()}
            />,
            {
                title: parentId ? "Nueva Subcategoría" : "Nueva Categoría",
                description: parentId
                    ? "Crear una subcategoría dentro de la categoría seleccionada"
                    : "Crear una nueva categoría de materiales",
                size: "sm"
            }
        );
    };

    const handleEditCategory = (category: CategoryItem) => {
        openModal(
            <CategoryForm
                initialData={category}
                onSubmit={async (name, pId) => {
                    const result = await updateMaterialCategory(category.id, name, pId);
                    if (!result.error) {
                        toast.success("Categoría actualizada");
                        router.refresh();
                    }
                    return result;
                }}
                onSuccess={() => closeModal()}
            />,
            {
                title: "Editar Categoría",
                description: "Modifica el nombre de la categoría",
                size: "sm"
            }
        );
    };

    const handleDeleteCategoryClick = (category: CategoryItem) => {
        setCategoryToDelete(category);
        setCategoryDeleteModalOpen(true);
    };

    const handleConfirmDeleteCategory = async (replacementId: string | null) => {
        if (!categoryToDelete) return;

        try {
            const result = await deleteMaterialCategory(categoryToDelete.id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Categoría eliminada");
                router.refresh();
            }
        } catch (error) {
            toast.error("Error al eliminar la categoría");
        }
    };

    // Replacement options
    const materialReplacementOptions = materialToDelete
        ? materials
            .filter(m => m.id !== materialToDelete.id && canEdit(m))
            .map(m => ({ id: m.id, name: m.name }))
        : [];

    const categoryReplacementOptions = categoryToDelete
        ? categoryHierarchy
            .filter(c => c.id !== categoryToDelete.id)
            .map(c => ({ id: c.id, name: c.name || "Sin nombre" }))
        : [];

    // Convert hierarchy to CategoryItem for tree
    const categoryItems: CategoryItem[] = categoryHierarchy.map(c => ({
        id: c.id,
        name: c.name,
        parent_id: c.parent_id
    }));

    return (
        <>
            {/* Toolbar with portal to header - uses ToolbarTabs for view toggle */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder={activeTab === 'materials'
                    ? "Buscar materiales por nombre, categoría o unidad..."
                    : "Buscar categorías..."}
                leftActions={
                    <ToolbarTabs
                        value={activeTab}
                        onValueChange={(v) => setActiveTab(v as 'materials' | 'categories')}
                        options={[
                            { label: "Materiales", value: "materials", icon: Package },
                            { label: "Categorías", value: "categories", icon: FolderTree },
                        ]}
                    />
                }
                actions={activeTab === 'materials'
                    ? [{
                        label: "Nuevo Material",
                        icon: Plus,
                        onClick: handleCreateMaterial,
                    }]
                    : isAdminMode
                        ? [{
                            label: "Nueva Categoría",
                            icon: Plus,
                            onClick: () => handleCreateCategory(null),
                        }]
                        : []
                }
            />

            {/* Materials View */}
            {activeTab === 'materials' && (
                <div className="space-y-4">
                    {filteredMaterials.length === 0 ? (
                        <Card>
                            <CardContent className="py-12">
                                <div className="text-center text-muted-foreground">
                                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium">No se encontraron materiales</p>
                                    <p className="text-sm">
                                        {searchQuery ? "Probá con otro término de búsqueda" : "Agregá materiales para comenzar"}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {filteredMaterials.map((material) => (
                                <MaterialCard
                                    key={material.id}
                                    material={material}
                                    canEdit={canEdit(material)}
                                    onEdit={handleEditMaterial}
                                    onDelete={handleDeleteMaterialClick}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Categories View */}
            {activeTab === 'categories' && (
                <div className="space-y-4">
                    {isAdminMode ? (
                        <CategoryTree
                            items={categoryItems}
                            onAddClick={handleCreateCategory}
                            onEditClick={handleEditCategory}
                            onDeleteClick={handleDeleteCategoryClick}
                            emptyMessage="No hay categorías de materiales"
                        />
                    ) : (
                        <Card>
                            <CardContent className="py-12">
                                <div className="text-center text-muted-foreground">
                                    <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium">Categorías del Sistema</p>
                                    <p className="text-sm">
                                        Las categorías son gestionadas por el administrador del sistema
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Material Delete Modal */}
            <DeleteReplacementModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setMaterialToDelete(null);
                }}
                onConfirm={handleConfirmDeleteMaterial}
                itemToDelete={materialToDelete ? { id: materialToDelete.id, name: materialToDelete.name } : null}
                replacementOptions={materialReplacementOptions}
                entityLabel="material"
                title={isAdminMode ? "Eliminar Material del Sistema" : "Eliminar Material"}
                description={`Estás a punto de eliminar "${materialToDelete?.name}". Este material puede estar siendo usado en productos o presupuestos.`}
            />

            {/* Category Delete Modal */}
            <DeleteReplacementModal
                isOpen={categoryDeleteModalOpen}
                onClose={() => {
                    setCategoryDeleteModalOpen(false);
                    setCategoryToDelete(null);
                }}
                onConfirm={handleConfirmDeleteCategory}
                itemToDelete={categoryToDelete ? { id: categoryToDelete.id, name: categoryToDelete.name || "Sin nombre" } : null}
                replacementOptions={categoryReplacementOptions}
                entityLabel="categoría"
                title="Eliminar Categoría"
                description={`Estás a punto de eliminar "${categoryToDelete?.name}". Los materiales de esta categoría quedarán sin categoría asignada.`}
            />
        </>
    );
}

// ============================================================================
// Material Card Component
// ============================================================================

interface MaterialCardProps {
    material: MaterialWithDetails;
    canEdit: boolean;
    onEdit: (material: MaterialWithDetails) => void;
    onDelete: (material: MaterialWithDetails) => void;
}

function MaterialCard({ material, canEdit, onEdit, onDelete }: MaterialCardProps) {
    return (
        <Card className="group hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                        {/* Name (with unit) */}
                        <h3 className="font-medium text-sm leading-tight">
                            {material.name}
                            {material.unit_name && (
                                <span className="text-muted-foreground font-normal ml-1">({material.unit_name})</span>
                            )}
                        </h3>

                        {/* Badges Row: Type + Category + System/Org indicator */}
                        <div className="flex flex-wrap gap-1.5">
                            <Badge className="text-xs bg-primary text-primary-foreground">
                                {material.material_type === 'material' ? 'Material' : 'Insumo'}
                            </Badge>
                            {material.category_name && (
                                <Badge className="text-xs bg-primary text-primary-foreground">
                                    {material.category_name}
                                </Badge>
                            )}
                            {material.is_system ? (
                                <Badge variant="system" className="text-xs gap-1">
                                    <Monitor className="h-3 w-3" />
                                    Sistema
                                </Badge>
                            ) : (
                                <Badge variant="organization" className="text-xs gap-1">
                                    <Building2 className="h-3 w-3" />
                                    Propio
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Actions - only show if can edit */}
                    {canEdit && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                >
                                    <span className="sr-only">Acciones</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(material)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onDelete(material)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
