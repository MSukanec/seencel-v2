"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { ContentLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ListItem, MaterialListItem } from "@/components/shared/list-item";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { ContextSidebar } from "@/stores/sidebar-store";
import {
    Plus,
    Package,
    MoreHorizontal,
    Pencil,
    Trash2,
    Wrench,
    Upload,
} from "lucide-react";
import { ImportConfig } from "@/lib/import";
import { BulkImportModal } from "@/components/shared/import/import-modal";
import { createImportBatch, importMaterialsCatalogBatch, revertImportBatch } from "@/lib/import";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/stores/modal-store";
import { MaterialForm, type MaterialCategory, type Unit, type Material } from "@/features/materials/forms/material-form";
import { CategoryForm } from "@/features/admin/components/forms/category-form";
import { deleteMaterial, deleteMaterialsBulk } from "@/features/materials/actions";
import { createMaterialCategory, updateMaterialCategory, deleteMaterialCategory } from "@/features/admin/material-actions";
import { toast } from "sonner";
import { DeleteReplacementModal } from "@/components/shared/forms/general/delete-replacement-modal";
import { CategoryTree, CategoryItem } from "@/components/shared/category-tree";
import { MaterialCategory as MaterialCategoryType } from "../types";
import { useMultiSelect } from "@/hooks/use-multi-select";
import { CategoriesSidebar } from "../components/categories-sidebar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Extended material type with joined data from query
export interface MaterialWithDetails extends Material {
    unit_name?: string | null;
    unit_symbol?: string | null;
    category_name?: string | null;
    code?: string | null;
    org_unit_price?: number | null;
    org_price_currency_id?: string | null;
    org_price_valid_from?: string | null;
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
    providers?: { id: string; name: string }[];
    presentations?: { id: string; unit_id: string; name: string; equivalence: number }[];
}

export function MaterialsCatalogView({
    materials,
    units,
    categories,
    categoryHierarchy,
    orgId,
    isAdminMode = false,
    providers = [],
    presentations = []
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

    // Optimistic updates for materials list
    const { optimisticItems, addItem, removeItem, updateItem } = useOptimisticList({
        items: materials,
        getItemId: (m) => m.id,
    });

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
        const filteredByType = optimisticItems.filter(m => m.material_type === activeTab);
        filteredByType.forEach(m => {
            const catId = m.category_id || "sin-categoria";
            counts[catId] = (counts[catId] || 0) + 1;
        });
        return counts;
    }, [optimisticItems, activeTab]);

    // Total for current type
    const totalForCurrentType = useMemo(() =>
        optimisticItems.filter(m => m.material_type === activeTab).length,
        [optimisticItems, activeTab]
    );


    // Filter materials by type, search and category
    const filteredMaterials = useMemo(() => {
        let filtered = optimisticItems;

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
    }, [optimisticItems, searchQuery, selectedCategoryId, activeTab]);

    // Multi-select for bulk actions (must be after filteredMaterials)
    const multiSelect = useMultiSelect({
        items: filteredMaterials,
        getItemId: (m) => m.id,
    });

    // Bulk delete confirmation modal state
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

    // Bulk action handlers
    const handleBulkDelete = async () => {
        const ids = Array.from(multiSelect.selectedIds);
        const count = ids.length;

        // Optimistically remove
        ids.forEach(id => removeItem(id));
        multiSelect.clearSelection();
        setBulkDeleteModalOpen(false);

        try {
            const result = await deleteMaterialsBulk(ids, isAdminMode);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${count} material${count > 1 ? 'es' : ''} eliminado${count > 1 ? 's' : ''}`);
            }
        } catch (error) {
            toast.error("Error al eliminar materiales");
        }
    };

    // Bulk actions content for Toolbar
    const bulkActionsContent = (
        <>
            <Button variant="outline" size="sm" onClick={multiSelect.selectAll} className="gap-2">
                Seleccionar todo ({filteredMaterials.length})
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteModalOpen(true)} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Eliminar
            </Button>
        </>
    );

    // Filter by editability: in org mode, only show editable (org) materials in admin actions
    const canEdit = (material: MaterialWithDetails) => {
        if (isAdminMode) return material.is_system;
        return !material.is_system; // Org can only edit their own materials
    };

    // ========================================================================
    // Import Configuration
    // ========================================================================

    const materialsImportConfig: ImportConfig<any> = {
        entityLabel: "Materiales",
        entityId: "materials_catalog",
        columns: [
            {
                id: "name",
                label: "Nombre",
                required: true,
                example: "Cemento Portland"
            },
            {
                id: "code",
                label: "Código",
                required: false,
                example: "MAT-001",
                description: "Código interno o SKU"
            },
            {
                id: "description",
                label: "Descripción",
                required: false,
                example: "Cemento tipo I para construcción general"
            },
            {
                id: "material_type",
                label: "Tipo",
                required: false,
                example: "Material",
                description: "Material o Consumible/Insumo"
            },
            {
                id: "category_name",
                label: "Categoría",
                required: false,
                example: "Materiales de Construcción",
                foreignKey: {
                    table: 'material_categories',
                    labelField: 'name',
                    valueField: 'id',
                    fetchOptions: async () => categories.map(c => ({
                        id: c.id,
                        label: c.name
                    })),
                }
            },
            {
                id: "unit_name",
                label: "Unidad",
                required: false,
                example: "kg",
                description: "Si no existe, se crea automáticamente",
                foreignKey: {
                    table: 'units',
                    labelField: 'name',
                    valueField: 'id',
                    fetchOptions: async () => units.map(u => ({
                        id: u.id,
                        label: `${u.name} (${u.abbreviation})`
                    })),
                    allowCreate: true,
                }
            },
            {
                id: "provider_name",
                label: "Proveedor",
                required: false,
                example: "Loma Negra",
                description: "Si no existe, se crea automáticamente",
                foreignKey: {
                    table: 'contacts',
                    labelField: 'full_name',
                    valueField: 'id',
                    fetchOptions: async () => providers.map(p => ({
                        id: p.id,
                        label: p.name || 'Sin nombre'
                    })),
                    allowCreate: true,
                }
            },
            {
                id: "unit_price",
                label: "Precio Unitario",
                required: false,
                example: "150.00",
                description: "Precio por unidad"
            },
            {
                id: "currency_code",
                label: "Moneda",
                required: false,
                example: "ARS",
                description: "ARS, USD, etc. Por defecto: ARS",
                foreignKey: {
                    table: 'currencies',
                    labelField: 'code',
                    valueField: 'id',
                    fetchOptions: async () => {
                        // Get currencies from organization store (already filtered by org)
                        const { useOrganizationStore } = await import("@/stores/organization-store");
                        const currencies = useOrganizationStore.getState().currencies;
                        return (currencies || []).map((c: any) => ({
                            id: c.code, // Use code as ID so it matches the import value
                            label: `${c.name} (${c.code})`
                        }));
                    }
                }
            },
        ],
        onImport: async (records) => {
            try {
                const batch = await createImportBatch(orgId, "materials_catalog", records.length);
                const result = await importMaterialsCatalogBatch(orgId, records, batch.id);
                router.refresh();
                return {
                    success: result.success,
                    errors: result.errors,
                    batchId: batch.id,
                    created: result.created,
                };
            } catch (error: any) {
                console.error("Import error:", error);
                throw error;
            }
        },
        onRevert: async (batchId) => {
            await revertImportBatch(batchId, 'materials');
            router.refresh();
        }
    };

    const handleImport = () => {
        openModal(
            <BulkImportModal
                config={materialsImportConfig}
                organizationId={orgId}
            />,
            {
                title: "Importar Materiales",
                description: "Importa materiales desde un archivo Excel o CSV",
                size: "xl"
            }
        );
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
                providers={providers}
                presentations={presentations}
                isAdminMode={isAdminMode}
                onSuccess={(newMaterial) => {
                    closeModal();
                    // Optimistic update - add to list immediately
                    if (newMaterial) {
                        addItem(newMaterial as MaterialWithDetails);
                    }
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
                providers={providers}
                presentations={presentations}
                isAdminMode={isAdminMode}
                onSuccess={(updatedMaterial) => {
                    closeModal();
                    // Optimistic update - update in list immediately
                    if (updatedMaterial) {
                        updateItem(material.id, updatedMaterial);
                    }
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

        // Optimistic update - remove from list immediately
        removeItem(materialToDelete.id);
        setDeleteModalOpen(false);
        setMaterialToDelete(null);

        try {
            const result = await deleteMaterial(materialToDelete.id, replacementId, isAdminMode);
            if (result.error) {
                toast.error(result.error);
                // Note: React will auto-revert optimistic update on next server render
            } else {
                toast.success(replacementId
                    ? "Material reemplazado y eliminado"
                    : "Material eliminado correctamente"
                );
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

            {/* Main content with proper padding */}
            <ContentLayout variant="wide">
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
                    actions={[
                        {
                            label: activeTab === 'material' ? "Nuevo Material" : "Nuevo Insumo",
                            icon: Plus,
                            onClick: handleCreateMaterial,
                        },
                        {
                            label: "Importar",
                            icon: Upload,
                            onClick: handleImport,
                        },
                    ]}
                    selectedCount={multiSelect.selectedCount}
                    onClearSelection={multiSelect.clearSelection}
                    bulkActions={bulkActionsContent}
                />

                {/* Materials/Consumables View */}
                <div className="h-full">
                    {filteredMaterials.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
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
                        <div className="space-y-2">
                            {filteredMaterials.map((material) => (
                                <MaterialListItem
                                    key={material.id}
                                    material={material}
                                    canEdit={canEdit(material)}
                                    selected={multiSelect.isSelected(material.id)}
                                    onToggleSelect={multiSelect.toggle}
                                    onEdit={handleEditMaterial}
                                    onDelete={handleDeleteMaterialClick}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </ContentLayout>

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

            {/* Bulk Delete Confirmation Modal */}
            <AlertDialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar {multiSelect.selectedCount} material{multiSelect.selectedCount > 1 ? 'es' : ''}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Los materiales seleccionados serán eliminados permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

