"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useTableActions } from "@/hooks/use-table-actions";
import { usePanel } from "@/stores/panel-store";
import { useOrganizationStore } from "@/stores/organization-store";
import { useShallow } from "zustand/react/shallow";
import { PageHeaderActionPortal } from "@/components/layout";
import { ToolbarTabs } from "@/components/layout/dashboard/toolbar/toolbar-tabs";
import { ToolbarCard } from "@/components/shared/toolbar-controls";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { MaterialListItem } from "@/components/shared/list-item";
import { ContextSidebar } from "@/stores/sidebar-store";
import { CategoriesSidebar } from "../components/categories-sidebar";
import { getMaterialColumns } from "@/features/materials/tables/materials-columns";
import { deleteMaterial } from "@/features/materials/actions";
import { upsertMaterialPrice } from "@/features/materials/actions";
import { ImportConfig } from "@/lib/import";
import { BulkImportModal } from "@/components/shared/import/import-modal";
import { ImportHistoryModal } from "@/components/shared/import/import-history-modal";
import { createImportBatch, importMaterialsCatalogBatch, revertImportBatch } from "@/lib/import";
import { useModal } from "@/stores/modal-store";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
    Plus, Package, MoreHorizontal, Wrench, LayoutGrid, Table2,
    Upload, History,
} from "lucide-react";
import type { MaterialCategory, Unit } from "@/features/materials/forms/material-form";
import type { MaterialCategory as MaterialCategoryType } from "../types";

// ============================================================================
// Types
// ============================================================================

export interface MaterialWithDetails {
    id: string;
    name: string;
    code?: string | null;
    material_type?: string;
    unit_id?: string | null;
    unit_name?: string | null;
    unit_symbol?: string | null;
    category_id?: string | null;
    category_name?: string | null;
    organization_id?: string | null;
    is_system?: boolean;
    default_provider_id?: string | null;
    default_sale_unit_id?: string | null;
    default_sale_unit_quantity?: number | null;
    sale_unit_name?: string | null;
    sale_unit_symbol?: string | null;
    org_unit_price?: number | null;
    org_price_currency_id?: string | null;
    org_price_valid_from?: string | null;
    organization_name?: string | null;
    organization_logo_url?: string | null;
    // Enriched by view
    currency_symbol?: string | null;
}

export interface MaterialCategoryNode {
    id: string;
    name: string;
    parent_id: string | null;
    children?: MaterialCategoryNode[];
}

// ============================================================================
// View Mode
// ============================================================================

type ViewMode = "table" | "cards";

const VIEW_OPTIONS = [
    { value: "table", icon: Table2, label: "Tabla" },
    { value: "cards", icon: LayoutGrid, label: "Tarjetas" },
];

// ============================================================================
// Props
// ============================================================================

export interface MaterialsCatalogViewProps {
    materials: MaterialWithDetails[];
    allMaterials?: MaterialWithDetails[];
    units: Unit[];
    categories: MaterialCategory[];
    categoryHierarchy: MaterialCategoryNode[];
    orgId: string;
    isAdminMode?: boolean;
    providers?: { id: string; name: string }[];
}

// ============================================================================
// Component
// ============================================================================

export function MaterialsCatalogView({
    materials,
    allMaterials,
    units,
    categories,
    categoryHierarchy,
    orgId,
    isAdminMode = false,
    providers = [],
}: MaterialsCatalogViewProps) {
    const router = useRouter();
    const { openModal } = useModal();
    const { openPanel, closePanel } = usePanel();

    // ── View mode & tabs ──
    const [viewMode, setViewMode] = useState<ViewMode>("table");
    const [activeTab, setActiveTab] = useState<"all" | "material" | "consumable">("all");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // ── Currencies from store for price display ──
    const currencies = useOrganizationStore(useShallow(s => s.currencies));

    // ── Source materials ──
    const sourceMaterials = useMemo(() => {
        if (!isAdminMode || !allMaterials) return materials;
        return allMaterials;
    }, [isAdminMode, materials, allMaterials]);

    const { optimisticItems, addItem, removeItem, updateItem } = useOptimisticList({
        items: sourceMaterials,
        getItemId: (m) => m.id,
    });

    // Enrich materials with currency_symbol resolved from store
    const enrichedItems = useMemo(() => {
        return optimisticItems.map(m => {
            if (m.currency_symbol || !m.org_price_currency_id) return m;
            const curr = currencies?.find((c: any) => c.id === m.org_price_currency_id);
            return { ...m, currency_symbol: curr?.symbol || "$" };
        });
    }, [optimisticItems, currencies]);

    // ── Filters ──
    const filters = useTableFilters({});

    // ── canEdit ──
    const canEdit = useCallback((material: MaterialWithDetails) => {
        if (isAdminMode) return material.is_system;
        return !material.is_system;
    }, [isAdminMode]);

    // ── Delete (useTableActions) ──
    const { DeleteConfirmDialog } = useTableActions<MaterialWithDetails>({
        entityName: "material",
        entityNamePlural: "materiales",
        onDelete: async (material: MaterialWithDetails) => {
            removeItem(material.id);
            const result = await deleteMaterial(material.id, null, isAdminMode);
            if (result.error) {
                router.refresh();
                return { success: false };
            }
            return { success: true };
        },
    });

    // ── Price update ──
    const handlePriceUpdate = useCallback(async (row: MaterialWithDetails, newPrice: number) => {
        const currencyId = row.org_price_currency_id || currencies?.find((c: any) => c.is_default)?.id;
        if (!currencyId) {
            toast.error("No se encontró una moneda configurada");
            return;
        }
        try {
            await upsertMaterialPrice({
                material_id: row.id,
                organization_id: orgId,
                currency_id: currencyId,
                unit_price: newPrice,
            });
            toast.success(`Precio de "${row.name}" actualizado`);
            router.refresh();
        } catch (err) {
            toast.error("Error al guardar precio");
        }
    }, [orgId, currencies, router]);

    // ── Filtered data ──
    const filteredMaterials = useMemo(() => {
        let filtered = enrichedItems;

        if (activeTab !== "all") {
            filtered = filtered.filter(m => m.material_type === activeTab);
        }
        if (selectedCategoryId === "sin-categoria") {
            filtered = filtered.filter(m => !m.category_id);
        } else if (selectedCategoryId !== null) {
            filtered = filtered.filter(m => m.category_id === selectedCategoryId);
        }

        return filtered.sort((a, b) => (a.name || "").localeCompare(b.name || "", "es"));
    }, [enrichedItems, activeTab, selectedCategoryId]);

    // ── Sidebar categories + counts ──
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

    // ── Columns ──
    const columns = useMemo(() => getMaterialColumns({
        categories,
        units,
        isAdminMode,
        onPriceUpdate: !isAdminMode ? handlePriceUpdate : undefined,
    }), [categories, units, isAdminMode, handlePriceUpdate]);

    // ── Actions: create, edit ──
    const handleCreateMaterial = () => {
        openPanel('material-form', {
            mode: "create",
            organizationId: orgId,
            units, categories, providers, isAdminMode,
            onSuccess: (newMaterial: any) => {
                closePanel();
                if (newMaterial) addItem(newMaterial as MaterialWithDetails);
            },
        });
    };

    const handleEditMaterial = useCallback((material: MaterialWithDetails) => {
        if (!canEdit(material)) {
            toast.error("No puedes editar materiales del sistema");
            return;
        }
        openPanel('material-form', {
            mode: "edit",
            organizationId: orgId,
            initialData: material,
            units, categories, providers, isAdminMode,
            onSuccess: (updatedMaterial: any) => {
                closePanel();
                if (updatedMaterial) updateItem(material.id, updatedMaterial);
            },
        });
    }, [canEdit, isAdminMode, orgId, units, categories, providers, openPanel, closePanel, updateItem]);

    const handleDelete = useCallback((material: MaterialWithDetails) => {
        if (!canEdit(material)) {
            toast.error("No puedes eliminar materiales del sistema");
            return;
        }
        removeItem(material.id);
        deleteMaterial(material.id, null, isAdminMode).then(result => {
            if (result.error) {
                toast.error(result.error);
                router.refresh();
            } else {
                toast.success("Material eliminado");
            }
        });
    }, [canEdit, isAdminMode, removeItem, router]);

    // ── Import ──
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

    // ── Active filters check ──
    const hasActiveFilters = filters.hasActiveFilters || selectedCategoryId !== null || activeTab !== "all";

    // ═════════════════════════════════════════════════════════════
    // Render
    // ═════════════════════════════════════════════════════════════

    return (
        <>
            {/* Header Action */}
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

            {/* Context Sidebar — Categorías */}
            <ContextSidebar title="Categorías">
                <CategoriesSidebar
                    categories={sidebarCategories}
                    materialCounts={materialCounts}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={setSelectedCategoryId}
                    totalMaterials={totalForCurrentType}
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
                            display={{
                                viewMode,
                                onViewModeChange: (v) => setViewMode(v as ViewMode),
                                viewModeOptions: VIEW_OPTIONS,
                            }}
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
                        {hasActiveFilters && filteredMaterials.length === 0 ? (
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
                                totalCount={optimisticItems.length}
                            />
                        ) : (
                            <DataTable
                                viewMode={viewMode === "cards" ? "grid" : "table"}
                                gridClassName="flex flex-col gap-2 pb-8"
                                columns={columns}
                                data={filteredMaterials}
                                enableContextMenu
                                enableRowSelection
                                onEdit={handleEditMaterial}
                                onDelete={handleDelete}
                                groupBy="category_name"
                                getGroupValue={(row) => row.category_name || "Sin Categoría"}
                                renderGroupHeader={(groupValue, groupRows) => (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-muted-foreground tracking-wider">
                                            {groupValue}
                                        </span>
                                        <span className="text-xs text-muted-foreground">({groupRows.length})</span>
                                    </div>
                                )}
                                globalFilter={filters.searchQuery}
                                onGlobalFilterChange={filters.setSearchQuery}
                                renderGridItem={(row) => (
                                    <MaterialListItem
                                        material={row}
                                        canEdit={canEdit(row)}
                                        isAdminMode={isAdminMode}
                                        organizationId={orgId}
                                        onEdit={handleEditMaterial}
                                        onDelete={handleDelete}
                                        onPriceUpdated={(materialId, newPrice) => {
                                            handlePriceUpdate(row, newPrice);
                                        }}
                                    />
                                )}
                            />
                        )}
                    </div>
                </div>
            )}

            <DeleteConfirmDialog />
        </>
    );
}
