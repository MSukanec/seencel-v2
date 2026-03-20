"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { ContentLayout, PageHeaderActionPortal } from "@/components/layout";
import { ToolbarTabs } from "@/components/layout/dashboard/toolbar/toolbar-tabs";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { ContextSidebar } from "@/stores/sidebar-store";
import {
    Plus, Package, MoreHorizontal, Wrench, LayoutGrid, Monitor, Building2,
    Upload, History, Download,
} from "lucide-react";
import { ImportConfig } from "@/lib/import";
import { BulkImportModal } from "@/components/shared/import/import-modal";
import { ImportHistoryModal } from "@/components/shared/import/import-history-modal";
import { createImportBatch, importMaterialsCatalogBatch, revertImportBatch } from "@/lib/import";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useModal } from "@/stores/modal-store";
import { usePanel } from "@/stores/panel-store";
import { type MaterialCategory, type Unit, type Material } from "@/features/materials/forms/material-form";
import { deleteMaterial, deleteMaterialsBulk } from "@/features/materials/actions";
import { createMaterialCategory, updateMaterialCategory, deleteMaterialCategory } from "@/features/admin/material-actions";
import { toast } from "sonner";
import { DeleteReplacementModal } from "@/components/shared/forms/general/delete-replacement-modal";
import { CategoryItem } from "@/components/shared/category-tree";
import { MaterialCategory as MaterialCategoryType } from "../types";
import { CategoriesSidebar } from "../components/categories-sidebar";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ToolbarCard } from "@/components/shared/toolbar-controls";
import { useTableFilters } from "@/hooks/use-table-filters";
import { getMaterialColumns } from "@/features/materials/tables/materials-columns";
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

export interface MaterialWithDetails extends Material {
    unit_name?: string | null;
    unit_symbol?: string | null;
    category_name?: string | null;
    code?: string | null;
    org_unit_price?: number | null;
    org_price_currency_id?: string | null;
    org_price_valid_from?: string | null;
    organization_name?: string | null;
    organization_logo_url?: string | null;
}

export interface MaterialCategoryNode {
    id: string;
    name: string;
    parent_id: string | null;
    children?: MaterialCategoryNode[];
}

export interface MaterialsCatalogViewProps {
    materials: MaterialWithDetails[];
    allMaterials?: MaterialWithDetails[]; // All materials (system + org) for admin scope filter
    units: Unit[];
    categories: MaterialCategory[];
    categoryHierarchy: MaterialCategoryNode[];
    orgId: string;
    isAdminMode?: boolean;
    providers?: { id: string; name: string }[];
}

export function MaterialsCatalogView({
    materials,
    allMaterials,
    units,
    categories,
    categoryHierarchy,
    orgId,
    isAdminMode = false,
    providers = []
}: MaterialsCatalogViewProps) {
    const router = useRouter();
    const { openModal } = useModal();
    const { openPanel, closePanel } = usePanel();
    const [activeTab, setActiveTab] = useState<"all" | "material" | "consumable">("all");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // Sidebar state for admin origin filtering
    const [sidebarOrigin, setSidebarOrigin] = useState<"system" | "own">("system");

    // Flatten lists if necessary 
    const sourceMaterials = useMemo(() => {
        if (!isAdminMode || !allMaterials) return materials;
        // In admin mode, we can show everything together
        return allMaterials;
    }, [isAdminMode, materials, allMaterials]);

    const { optimisticItems, addItem, removeItem, updateItem } = useOptimisticList({
        items: sourceMaterials,
        getItemId: (m) => m.id,
    });

    const filters = useTableFilters({
        facets: isAdminMode ? [
            {
                key: "origin",
                title: "Origen",
                icon: Monitor,
                options: [
                    { label: "Sistema", value: "system" },
                    { label: "Organizaciones", value: "organization" },
                ],
            }
        ] : []
    });

    const originFilter = useMemo(() => {
        const originValues = filters.facetValues["origin"];
        if (!originValues || originValues.size === 0 || originValues.size === 2) return "all";
        if (originValues.has("system")) return "system";
        if (originValues.has("organization")) return "organization";
        return "all";
    }, [filters.facetValues]);

    const filteredMaterials = useMemo(() => {
        let filtered = optimisticItems;

        if (originFilter === "system") filtered = filtered.filter(m => m.is_system);
        else if (originFilter === "organization") filtered = filtered.filter(m => !m.is_system);

        if (activeTab !== "all") {
            filtered = filtered.filter(m => m.material_type === activeTab);
        }

        if (selectedCategoryId === "sin-categoria") {
            filtered = filtered.filter(m => !m.category_id);
        } else if (selectedCategoryId !== null) {
            filtered = filtered.filter(m => m.category_id === selectedCategoryId);
        }

        if (filters.searchQuery.trim()) {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(material =>
                material.name?.toLowerCase().includes(query) ||
                material.category_name?.toLowerCase().includes(query) ||
                material.unit_name?.toLowerCase().includes(query) ||
                material.code?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [optimisticItems, originFilter, activeTab, selectedCategoryId, filters.searchQuery]);


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
        const filteredByType = activeTab === 'all'
            ? optimisticItems
            : optimisticItems.filter(m => m.material_type === activeTab);
        filteredByType.forEach(m => {
            const catId = m.category_id || "sin-categoria";
            counts[catId] = (counts[catId] || 0) + 1;
        });
        return counts;
    }, [optimisticItems, activeTab]);

    const totalForCurrentType = useMemo(() =>
        activeTab === 'all'
            ? optimisticItems.length
            : optimisticItems.filter(m => m.material_type === activeTab).length,
        [optimisticItems, activeTab]
    );

    // ========================================================================
    // actions 
    // ========================================================================
    const canEdit = useCallback((material: MaterialWithDetails) => {
        if (isAdminMode) return material.is_system;
        return !material.is_system; // Org can only edit their own materials
    }, [isAdminMode]);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState<MaterialWithDetails | null>(null);

    // Bulk Delete State
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
    const [materialsToBulkDelete, setMaterialsToBulkDelete] = useState<MaterialWithDetails[]>([]);
    const [resetSelectionFn, setResetSelectionFn] = useState<(() => void) | null>(null);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const handleDelete = useCallback((material: MaterialWithDetails) => {
        if (!canEdit(material)) {
            toast.error("No puedes eliminar materiales del sistema");
            return;
        }
        setMaterialToDelete(material);
        setDeleteModalOpen(true);
    }, [canEdit]);

    const handleBulkDelete = useCallback((materials: MaterialWithDetails[], resetSelection: () => void) => {
        const editableMaterials = materials.filter(canEdit);
        if (editableMaterials.length === 0) {
            toast.error("Ninguno de los materiales seleccionados puede ser eliminado.");
            resetSelection();
            return;
        }
        if (editableMaterials.length < materials.length) {
            toast.warning(`Se omitieron ${materials.length - editableMaterials.length} materiales del sistema que no pueden eliminarse.`);
        }
        setMaterialsToBulkDelete(editableMaterials);
        setResetSelectionFn(() => resetSelection);
        setBulkDeleteModalOpen(true);
    }, [canEdit]);

    const handleConfirmBulkDelete = async () => {
        setIsBulkDeleting(true);
        const ids = materialsToBulkDelete.map(m => m.id);
        try {
            const result = await deleteMaterialsBulk(ids, isAdminMode);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${materialsToBulkDelete.length} materiales eliminados`);
                ids.forEach(id => removeItem(id));
                resetSelectionFn?.();
                router.refresh();
            }
        } catch (error) {
            toast.error("Error al eliminar los materiales masivamente");
        } finally {
            setIsBulkDeleting(false);
            setBulkDeleteModalOpen(false);
            setMaterialsToBulkDelete([]);
            setResetSelectionFn(null);
        }
    };

    const handleConfirmCustomDeleteMaterial = async (replacementId: string | null) => {
        if (!materialToDelete) return;
        removeItem(materialToDelete.id);
        setDeleteModalOpen(false);
        try {
            const result = await deleteMaterial(materialToDelete.id, replacementId, isAdminMode);
            if (result.error) {
                toast.error(result.error);
                router.refresh(); // rollback
            } else {
                toast.success(replacementId ? "Material reemplazado y eliminado" : "Material eliminado correctamente");
            }
        } catch (error) {
            toast.error("Error al eliminar el material");
        } finally {
            setMaterialToDelete(null);
        }
    };


    const handleCreateMaterial = () => {
        openPanel(
            'material-form',
            {
                mode: "create",
                organizationId: orgId,
                units,
                categories,
                providers,
                isAdminMode,
                onSuccess: (newMaterial: any) => {
                    closePanel();
                    if (newMaterial) addItem(newMaterial as MaterialWithDetails);
                },
            }
        );
    };

    const handleEditMaterial = useCallback((material: MaterialWithDetails) => {
        if (!canEdit(material)) {
            toast.error("No puedes editar materiales del sistema");
            return;
        }
        openPanel(
            'material-form',
            {
                mode: "edit",
                organizationId: orgId,
                initialData: material,
                units,
                categories,
                providers,
                isAdminMode,
                onSuccess: (updatedMaterial: any) => {
                    closePanel();
                    if (updatedMaterial) updateItem(material.id, updatedMaterial);
                },
            }
        );
    }, [canEdit, isAdminMode, orgId, units, categories, providers, addItem, updateItem, openPanel]);


    const handleInlineUpdate = useCallback(async (material: MaterialWithDetails, updates: Record<string, any>) => {
        try {
            // Note: Currently inline updates are simple. updateItem is optimistic.
            // Ideally we call server action here like `updateMaterialInline`
            // But we can trigger the full form submission invisibly or build a specific action if we need to.
            // For now we map it to updateMaterial? No, updateMaterial uses FormData.
            // Since there's no updateMaterialInline in actions.ts, we skip it or show toast for now.
            toast.error("Actualización en línea actualmente en desarrollo.");
            // Revert state change
            router.refresh();
        } catch {
            toast.error("Error inesperado al actualizar");
            router.refresh();
        }
    }, [isAdminMode, router]);


    const columns = useMemo(() => getMaterialColumns({
        categories,
        units,
        isAdminMode,
        // Uncomment when inline updates are ready on server:
        // onInlineUpdate: handleInlineUpdate,
    }), [categories, units, isAdminMode]);

    // ========================================================================
    // Category Handlers (Admin only)
    // ========================================================================

    const [categoryDeleteModalOpen, setCategoryDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

    const handleConfirmDeleteCategory = async (replacementId: string | null) => {
        if (!categoryToDelete) return;
        const deletedId = categoryToDelete.id;
        setCategoryDeleteModalOpen(false);
        setCategoryToDelete(null);
        try {
            const result = await deleteMaterialCategory(deletedId);
            if (result.error) toast.error(result.error);
            else { toast.success("Categoría eliminada"); router.refresh(); }
        } catch (error) {
            toast.error("Error al eliminar la categoría");
        }
    };


    // ========================================================================
    // Import Configuration
    // ========================================================================

    const materialsImportConfig: ImportConfig<any> = {
        entityLabel: "Materiales",
        entityId: "materials_catalog",
        description: "Importá tu catálogo de materiales e insumos desde un archivo Excel o CSV.",
        docsPath: "/docs/catalogo-tecnico/materiales",
        columns: [
            { id: "name", label: "Nombre", required: true, example: "Cemento Portland" },
            { id: "code", label: "Código", required: false, example: "MAT-001" },
            { id: "description", label: "Descripción", required: false, example: "Cemento tipo I" },
            { id: "material_type", label: "Tipo", required: false, example: "Material" },
            {
                id: "category_name", label: "Categoría", required: false, example: "Materiales",
                foreignKey: { table: 'material_categories', labelField: 'name', valueField: 'id', fetchOptions: async () => categories.map(c => ({ id: c.id, label: c.name })) }
            },
            {
                id: "unit_name", label: "Unidad", required: false, example: "kg",
                foreignKey: { table: 'units', labelField: 'name', valueField: 'id', fetchOptions: async () => units.map(u => ({ id: u.id, label: `${u.name} (${u.abbreviation})` })), allowCreate: true }
            },
            {
                id: "provider_name", label: "Proveedor", required: false, example: "Loma Negra",
                foreignKey: { table: 'contacts', labelField: 'full_name', valueField: 'id', fetchOptions: async () => providers.map(p => ({ id: p.id, label: p.name || 'Sin nombre' })), allowCreate: true }
            },
            { id: "unit_price", label: "Precio Unitario", required: false, example: "150.00" },
            {
                id: "currency_code", label: "Moneda", required: false, example: "ARS",
                foreignKey: { table: 'currencies', labelField: 'code', valueField: 'id', fetchOptions: async () => { const { useOrganizationStore } = await import("@/stores/organization-store"); const currs = useOrganizationStore.getState().currencies; return (currs || []).map((c: any) => ({ id: c.code, label: `${c.name} (${c.code})` })); } }
            },
            { id: "price_date", label: "Fecha del Precio", required: false, example: "2024-01-15" },
            {
                id: "sale_unit_name", label: "Unidad de Venta", required: false, example: "Bolsa",
                foreignKey: { table: 'units', labelField: 'name', valueField: 'id', fetchOptions: async () => units.map(u => ({ id: u.id, label: `${u.name} (${u.abbreviation})` })), allowCreate: true }
            },
            { id: "sale_unit_quantity", label: "Cantidad por Unidad de Venta", required: false, example: "25" },
        ],
        onImport: async (records) => {
            const batch = await createImportBatch(orgId, "materials_catalog", records.length);
            const result = await importMaterialsCatalogBatch(orgId, records, batch.id);
            router.refresh();
            return { success: result.success, errors: result.errors, batchId: batch.id, created: result.created };
        },
        onRevert: async (batchId) => {
            await revertImportBatch(batchId, 'materials');
            router.refresh();
        }
    };

    const handleImport = () => {
        openModal(<BulkImportModal config={materialsImportConfig} organizationId={orgId} />, { title: "Importar Materiales", size: "xl" });
    };

    const handleImportHistory = () => {
        openModal(<ImportHistoryModal organizationId={orgId} entityType="materials_catalog" entityTable="materials" onRevert={() => router.refresh()} />, { title: "Historial de Importaciones", size: "lg" });
    };

    const materialReplacementOptions = materialToDelete ? materials.filter(m => m.id !== materialToDelete.id && canEdit(m)).map(m => ({ id: m.id, name: m.name })) : [];
    const categoryReplacementOptions = categoryToDelete ? categoryHierarchy.filter(c => c.id !== categoryToDelete.id).map(c => ({ id: c.id, name: c.name || "Sin nombre" })) : [];

    // Header actions
    const headerAction = (
        <PageHeaderActionPortal>
            <div className="flex items-center">
                <button
                    onClick={handleCreateMaterial}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-l-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    <span>Nuevo {activeTab === 'consumable' ? "Insumo" : "Material"}</span>
                </button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center justify-center h-8 w-8 rounded-r-lg border-l border-primary-foreground/20 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={handleImport}>
                            <Upload className="h-4 w-4 mr-2" /> Importar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleImportHistory}>
                            <History className="h-4 w-4 mr-2" /> Historial de Importaciones
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </PageHeaderActionPortal>
    );

    const sidebarAction = !isAdminMode ? (
        <Select value={sidebarOrigin} onValueChange={(v) => setSidebarOrigin(v as "system" | "own")}>
            <SelectTrigger className="h-6 text-xs font-medium border-transparent bg-transparent shadow-none hover:bg-muted focus:ring-0 px-2 py-0 min-h-0 min-w-[80px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="own">Propios</SelectItem>
            </SelectContent>
        </Select>
    ) : undefined;

    return (
        <>
            {headerAction}

            <ContextSidebar title="Categorías" action={sidebarAction}>
                <CategoriesSidebar
                    categories={sidebarCategories}
                    materialCounts={materialCounts}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={setSelectedCategoryId}
                    totalMaterials={totalForCurrentType}
                    // TODO: Implement category edit/delete UI in CategoriesSidebar or custom tree
                />
            </ContextSidebar>

            {optimisticItems.length === 0 ? (
                <ViewEmptyState
                    mode="empty"
                    icon={Package}
                    viewName="Materiales e Insumos"
                    featureDescription="Los materiales e insumos son los productos físicos y consumibles que utilizás en tus proyectos de construcción. Desde aquí podés gestionar el catálogo, definir precios, asociar proveedores y organizar por categorías."
                    onAction={handleCreateMaterial}
                    actionLabel="Nuevo Material"
                    docsPath="/docs/catalogo-tecnico/materiales"
                />
            ) : (
                <div className="h-full flex flex-col">
                    <div className="mb-4">
                        <ToolbarCard
                            filters={filters}
                            searchPlaceholder="Buscar materiales..."
                            left={
                                <ToolbarTabs
                                    value={activeTab}
                                    onValueChange={(v) => setActiveTab(v as 'all' | 'material' | 'consumable')}
                                    options={[
                                        { label: "Todos", value: "all", icon: LayoutGrid },
                                        { label: "Materiales", value: "material", icon: Package },
                                        { label: "Insumos", value: "consumable", icon: Wrench },
                                    ]}
                                />
                            }
                        />
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        {filters.hasActiveFilters && filteredMaterials.length === 0 ? (
                            <ViewEmptyState
                                mode="no-results"
                                icon={Package}
                                viewName="materiales e insumos"
                                filterContext="con este criterio"
                                onResetFilters={() => {
                                    filters.clearAll();
                                    setSelectedCategoryId(null);
                                    setActiveTab("all");
                                }}
                            />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredMaterials}
                                enableContextMenu
                                enableRowSelection
                                onEdit={handleEditMaterial}
                                onDelete={handleDelete}
                                onBulkDelete={handleBulkDelete}
                                globalFilter={filters.searchQuery}
                                onGlobalFilterChange={filters.setSearchQuery}
                            />
                        )}
                    </div>
                </div>
            )}

            <DeleteReplacementModal
                isOpen={deleteModalOpen}
                onClose={() => { setDeleteModalOpen(false); setMaterialToDelete(null); }}
                onConfirm={handleConfirmCustomDeleteMaterial}
                itemToDelete={materialToDelete ? { id: materialToDelete.id, name: materialToDelete.name } : null}
                replacementOptions={materialReplacementOptions}
                entityLabel="material"
                title={isAdminMode ? "Eliminar Material del Sistema" : "Eliminar Material"}
                description={`Estás a punto de eliminar "${materialToDelete?.name}".`}
            />

            <DeleteReplacementModal
                isOpen={categoryDeleteModalOpen}
                onClose={() => { setCategoryDeleteModalOpen(false); setCategoryToDelete(null); }}
                onConfirm={handleConfirmDeleteCategory}
                itemToDelete={categoryToDelete ? { id: categoryToDelete.id, name: categoryToDelete.name || "Sin nombre" } : null}
                replacementOptions={categoryReplacementOptions}
                entityLabel="categoría"
                title="Eliminar Categoría"
                description={`Estás a punto de eliminar "${categoryToDelete?.name}".`}
            />

            <AlertDialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar {materialsToBulkDelete.length} ítems?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Los materiales seleccionados serán eliminados permanentemente (soft-delete). No habrá opción de reemplazar asociaciones para los ítems al hacerlo masivamente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isBulkDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleConfirmBulkDelete} 
                            disabled={isBulkDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isBulkDeleting ? "Eliminando..." : "Eliminar " + materialsToBulkDelete.length}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
