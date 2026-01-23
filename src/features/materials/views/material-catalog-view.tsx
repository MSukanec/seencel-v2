"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import {
    Plus,
    Package,
    MoreHorizontal,
    Pencil,
    Trash2,
    FolderTree
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/providers/modal-store";
import { SystemMaterialForm } from "@/features/admin/components/forms/system-material-form";
import { CategoryForm } from "@/features/admin/components/forms/category-form";
import { deleteSystemMaterial, createMaterialCategory, updateMaterialCategory, deleteMaterialCategory } from "@/features/admin/material-actions";
import { toast } from "sonner";
import { DeleteReplacementModal } from "@/components/shared/delete-replacement-modal";
import { CategoryTree, CategoryItem } from "@/components/shared/category-tree";
import type { SystemMaterial, MaterialCategory, Unit, MaterialCategoryNode } from "@/features/admin/queries";

export interface MaterialCatalogViewProps {
    materials: SystemMaterial[];
    units: Unit[];
    categories: MaterialCategory[];
    categoryHierarchy: MaterialCategoryNode[];
}

export function MaterialCatalogView({ materials, units, categories, categoryHierarchy }: MaterialCatalogViewProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();
    const [activeTab, setActiveTab] = useState<"materials" | "categories">("materials");
    const [searchQuery, setSearchQuery] = useState("");

    // Material delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState<SystemMaterial | null>(null);

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

    // ========================================================================
    // Material Handlers
    // ========================================================================

    const handleCreateMaterial = () => {
        openModal(
            <SystemMaterialForm
                units={units}
                categories={categories}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
            />,
            {
                title: "Nuevo Material de Sistema",
                description: "Crear un material disponible para todas las organizaciones",
                size: "md"
            }
        );
    };

    const handleEditMaterial = (material: SystemMaterial) => {
        openModal(
            <SystemMaterialForm
                initialData={material}
                units={units}
                categories={categories}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
            />,
            {
                title: "Editar Material",
                description: "Modifica los datos de este material del sistema",
                size: "md"
            }
        );
    };

    const handleDeleteMaterialClick = (material: SystemMaterial) => {
        setMaterialToDelete(material);
        setDeleteModalOpen(true);
    };

    const handleConfirmDeleteMaterial = async (replacementId: string | null) => {
        if (!materialToDelete) return;

        try {
            const result = await deleteSystemMaterial(materialToDelete.id, replacementId);
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
    // Category Handlers
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
            .filter(m => m.id !== materialToDelete.id)
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
            {/* Full-width Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
                <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="materials" className="gap-2">
                        <Package className="h-4 w-4" />
                        Materiales
                        <Badge variant="secondary" className="ml-1">{materials.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="gap-2">
                        <FolderTree className="h-4 w-4" />
                        Categorías
                        <Badge variant="secondary" className="ml-1">{categoryHierarchy.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                {/* Materials Tab */}
                <TabsContent value="materials" className="space-y-4 mt-0">
                    {/* Toolbar */}
                    <Card>
                        <CardContent className="py-3">
                            <Toolbar
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                                searchPlaceholder="Buscar materiales por nombre, categoría o unidad..."
                            // mobileActionClick={handleCreateMaterial} - Deprecated
                            >
                                <Button size="sm" onClick={handleCreateMaterial}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nuevo Material
                                </Button>
                            </Toolbar>
                        </CardContent>
                    </Card>

                    {/* Materials Grid */}
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
                                    onEdit={handleEditMaterial}
                                    onDelete={handleDeleteMaterialClick}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Categories Tab */}
                <TabsContent value="categories" className="space-y-4 mt-0">
                    {/* Toolbar */}
                    <Card>
                        <CardContent className="py-3">
                            <Toolbar searchPlaceholder="Buscar categorías...">
                                <Button size="sm" onClick={() => handleCreateCategory(null)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nueva Categoría
                                </Button>
                            </Toolbar>
                        </CardContent>
                    </Card>

                    {/* Category Tree */}
                    <CategoryTree
                        items={categoryItems}
                        onAddClick={handleCreateCategory}
                        onEditClick={handleEditCategory}
                        onDeleteClick={handleDeleteCategoryClick}
                        emptyMessage="No hay categorías de materiales"
                    />
                </TabsContent>
            </Tabs>

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
                title="Eliminar Material del Sistema"
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
    material: SystemMaterial;
    onEdit: (material: SystemMaterial) => void;
    onDelete: (material: SystemMaterial) => void;
}

function MaterialCard({ material, onEdit, onDelete }: MaterialCardProps) {
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

                        {/* Badges Row: Type + Category */}
                        <div className="flex flex-wrap gap-1.5">
                            <Badge className="text-xs bg-primary text-primary-foreground">
                                {material.material_type === 'material' ? 'Material' : 'Insumo'}
                            </Badge>
                            {material.category_name && (
                                <Badge className="text-xs bg-primary text-primary-foreground">
                                    {material.category_name}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
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
                </div>
            </CardContent>
        </Card>
    );
}

