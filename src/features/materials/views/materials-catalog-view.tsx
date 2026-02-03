"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ListItem } from "@/components/ui/list-item";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { ContextSidebar } from "@/providers/context-sidebar-provider";
import {
    Plus,
    Package,
    MoreHorizontal,
    Pencil,
    Trash2,
    Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/providers/modal-store";
import { MaterialForm, type MaterialCategory, type Unit, type Material } from "@/features/materials/forms/material-form";
import { CategoryForm } from "@/features/admin/components/forms/category-form";
import { deleteMaterial } from "@/features/materials/actions";
import { createMaterialCategory, updateMaterialCategory, deleteMaterialCategory } from "@/features/admin/material-actions";
import { toast } from "sonner";
import { DeleteReplacementModal } from "@/components/shared/forms/general/delete-replacement-modal";
import { CategoryTree, CategoryItem } from "@/components/shared/category-tree";
import { CategoriesSidebar } from "../components/categories-sidebar";
import { MaterialCategory as MaterialCategoryType } from "../types";

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
    const [activeTab, setActiveTab] = useState<"material" | "consumable">("material");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // Material delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState<MaterialWithDetails | null>(null);

    // Category delete modal state
    const [categoryDeleteModalOpen, setCategoryDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

    // Convert categories for sidebar
    const sidebarCategories: MaterialCategoryType[] = useMemo(() =>
        categories.map(c => ({
            id: c.id,
            name: c.name,
            parent_id: c.parent_id ?? null,
            created_at: new Date().toISOString(),
            updated_at: null,
        })),
        [categories]
    );

    // Calculate material counts per category (filtered by current tab)
    const materialCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        const filteredByType = materials.filter(m => m.material_type === activeTab);
        filteredByType.forEach(m => {
            const catId = m.category_id || "sin-categoria";
            counts[catId] = (counts[catId] || 0) + 1;
        });
        return counts;
    }, [materials, activeTab]);

    // Total for current type
    const totalForCurrentType = useMemo(() =>
        materials.filter(m => m.material_type === activeTab).length,
        [materials, activeTab]
    );


    // Filter materials by type, search and category
    const filteredMaterials = useMemo(() => {
        let filtered = materials;

        // Filter by material type (tab)
        filtered = filtered.filter(m => m.material_type === activeTab);

        // Filter by category
        if (selectedCategoryId === "sin-categoria") {
            filtered = filtered.filter(m => !m.category_id);
        } else if (selectedCategoryId !== null) {
            filtered = filtered.filter(m => m.category_id === selectedCategoryId);
        }

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(material =>
                material.name?.toLowerCase().includes(query) ||
                material.category_name?.toLowerCase().includes(query) ||
                material.unit_name?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [materials, searchQuery, selectedCategoryId, activeTab]);

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
            {/* Categories Sidebar - always visible */}
            <ContextSidebar title="Categorías">
                <CategoriesSidebar
                    categories={sidebarCategories}
                    materialCounts={materialCounts}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={setSelectedCategoryId}
                    totalMaterials={totalForCurrentType}
                />
            </ContextSidebar>

            {/* Toolbar with portal to header - uses ToolbarTabs for type toggle */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder={activeTab === 'material'
                    ? "Buscar materiales por nombre, categoría o unidad..."
                    : "Buscar insumos por nombre, categoría o unidad..."}
                leftActions={
                    <ToolbarTabs
                        value={activeTab}
                        onValueChange={(v) => setActiveTab(v as 'material' | 'consumable')}
                        options={[
                            { label: "Materiales", value: "material", icon: Package },
                            { label: "Insumos", value: "consumable", icon: Wrench },
                        ]}
                    />
                }
                actions={[{
                    label: activeTab === 'material' ? "Nuevo Material" : "Nuevo Insumo",
                    icon: Plus,
                    onClick: handleCreateMaterial,
                }]}
            />

            {/* Materials/Consumables View */}
            <div className="space-y-2">
                {filteredMaterials.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <EmptyState
                            icon={activeTab === 'material' ? Package : Wrench}
                            title="Sin resultados"
                            description={searchQuery
                                ? `No se encontraron ${activeTab === 'material' ? 'materiales' : 'insumos'} con ese criterio de búsqueda.`
                                : selectedCategoryId
                                    ? `No hay ${activeTab === 'material' ? 'materiales' : 'insumos'} en esta categoría.`
                                    : `Agregá ${activeTab === 'material' ? 'materiales' : 'insumos'} para comenzar.`
                            }
                        />
                    </div>
                ) : (
                    filteredMaterials.map((material) => (
                        <MaterialCard
                            key={material.id}
                            material={material}
                            canEdit={canEdit(material)}
                            onEdit={handleEditMaterial}
                            onDelete={handleDeleteMaterialClick}
                        />
                    ))
                )}
            </div>

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
        <ListItem variant="card">
            <ListItem.Content>
                <ListItem.Title suffix={material.unit_name ? `(${material.unit_name})` : undefined}>
                    {material.name}
                </ListItem.Title>
                <ListItem.Badges>
                    <Badge variant="secondary" className="text-xs">
                        {material.material_type === 'material' ? 'Material' : 'Insumo'}
                    </Badge>
                    {material.category_name && (
                        <Badge variant="secondary" className="text-xs">
                            {material.category_name}
                        </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                        {material.is_system ? 'Sistema' : 'Propio'}
                    </Badge>
                </ListItem.Badges>
            </ListItem.Content>

            {canEdit && (
                <ListItem.Actions>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
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
                </ListItem.Actions>
            )}
        </ListItem>
    );
}
