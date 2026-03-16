"use client";

/**
 * Contacts — List Component
 * Standard 19.0 - Lean View Pattern
 *
 * Orquesta hooks + UI. Grid/Table toggle, filtros, empty states, saved views.
 * Forms se abren via openPanel (no openModal).
 */

import { useState, useMemo, useCallback } from "react";
import { ContactWithRelations, ContactCategory } from "@/types/contact";
import { Plus, LayoutGrid, List, Upload, Users, ShieldCheck, Building2 } from "lucide-react";
import { ContactsDataTable } from "./contacts-data-table";
import { usePanel } from "@/stores/panel-store";
import { useModal } from "@/stores/modal-store";
import { useRouter } from "@/i18n/routing";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { PageHeaderActionPortal } from "@/components/layout";
import {
    FilterPopover,
    SearchButton,
    DisplayButton,
    ToolbarCard,
    ViewsTabs,
    ViewEditorBar,
    ActiveFiltersBar,
} from "@/components/shared/toolbar-controls";
import { BulkImportModal } from "@/components/shared/import/import-modal";
import { createImportBatch, importContactsBatch, revertImportBatch, type ImportConfig } from "@/lib/import";
import { getContactCategories, createContactCategory } from "@/actions/contacts";
import { normalizeEmail, normalizePhone } from "@/lib/import/normalizers";
import { ViewEmptyState } from "@/components/shared/empty-state";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import type { SavedView } from "@/features/files/types";
import { createSavedView, updateSavedView, deleteSavedView } from "@/features/files/actions";

interface ContactsListProps {
    organizationId: string;
    initialContacts: ContactWithRelations[];
    contactCategories: ContactCategory[];
    organizationName: string;
    organizationLogoUrl: string | null;
    savedViews: SavedView[];
}

type ViewMode = "grid" | "table";

export function ContactsList({ organizationId, initialContacts, contactCategories, organizationName, organizationLogoUrl, savedViews }: ContactsListProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const { openPanel } = usePanel();
    const { openModal } = useModal();
    const router = useRouter();

    // ─── Saved Views state ─────────────────────────────────
    const [localViews, setLocalViews] = useState<SavedView[]>(savedViews);
    const [activeViewId, setActiveViewId] = useState<string | null>(null);
    const [editingView, setEditingView] = useState<{ id: string | null; name: string } | null>(null);
    const [editName, setEditName] = useState("");

    // 🚀 OPTIMISTIC UI: Lifted to parent to handle create/edit/delete
    const {
        optimisticItems: optimisticContacts,
        removeItem: optimisticRemove,
    } = useOptimisticList({
        items: initialContacts,
        getItemId: (contact) => contact.id,
    });

    // ─── Facet options ─────────────────────────────────────
    const categoryFilterOptions = useMemo(() =>
        contactCategories.map(cat => ({ label: cat.name, value: cat.id })),
        [contactCategories]
    );

    const seencelFilterOptions = useMemo(() => [
        { label: "En Seencel", value: "yes", icon: ShieldCheck },
        { label: "No en Seencel", value: "no" },
    ], []);

    const orgMemberFilterOptions = useMemo(() => [
        { label: "De la Organización", value: "yes", icon: Building2 },
        { label: "No de la Organización", value: "no" },
    ], []);

    // ─── Filters (useTableFilters standard) ────────────────
    const filters = useTableFilters({
        facets: [
            ...(categoryFilterOptions.length > 0
                ? [{ key: "category", title: "Categoría", options: categoryFilterOptions }]
                : []),
            { key: "seencel", title: "Seencel", icon: ShieldCheck, options: seencelFilterOptions },
            { key: "orgMember", title: "Organización", icon: Building2, options: orgMemberFilterOptions },
        ],
    });

    // Extract company contacts for the form
    const companyContacts = useMemo(() => {
        return optimisticContacts
            .filter(c => c.contact_type === 'company')
            .map(c => ({ id: c.id, name: c.full_name || c.first_name || "" }));
    }, [optimisticContacts]);

    // ─── Filtered data ────────────────────────────────────
    const filteredContacts = useMemo(() => {
        let result = optimisticContacts;

        // Category facet
        const categoryFilter = filters.facetValues.category;
        if (categoryFilter?.size > 0) {
            result = result.filter(c =>
                c.contact_categories?.some(cat => categoryFilter.has(cat.id))
            );
        }

        // Seencel facet
        const seencelFilter = filters.facetValues.seencel;
        if (seencelFilter?.size > 0 && seencelFilter.size < 2) {
            const wantSeencel = seencelFilter.has("yes");
            result = result.filter(c => wantSeencel ? !!c.linked_user_id : !c.linked_user_id);
        }

        // Org member facet
        const orgMemberFilter = filters.facetValues.orgMember;
        if (orgMemberFilter?.size > 0 && orgMemberFilter.size < 2) {
            const wantOrgMember = orgMemberFilter.has("yes");
            result = result.filter(c => wantOrgMember ? c.is_organization_member : !c.is_organization_member);
        }

        // Search
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            result = result.filter(c =>
                (c.full_name?.toLowerCase().includes(query)) ||
                (c.email?.toLowerCase().includes(query)) ||
                (c.phone?.includes(query)) ||
                (c.resolved_company_name?.toLowerCase().includes(query)) ||
                (c.location?.toLowerCase().includes(query)) ||
                (c.contact_categories?.some(cat => cat.name.toLowerCase().includes(query)))
            );
        }

        return result;
    }, [optimisticContacts, filters.facetValues, filters.searchQuery]);

    // ─── Panel handlers ───────────────────────────────────
    const handleOpenCreate = useCallback(() => {
        openPanel('contact-form', {
            organizationId,
            contactCategories,
            companyContacts,
            onSuccess: () => {
                router.refresh();
            },
        });
    }, [organizationId, contactCategories, companyContacts, openPanel, router]);

    // ─── Saved Views handlers ─────────────────────────────
    const handleSelectView = useCallback((viewId: string | null) => {
        setActiveViewId(viewId);
        if (!viewId) {
            filters.clearAll();
            return;
        }
        const view = localViews.find(v => v.id === viewId);
        if (!view) return;
        // Apply view filters
        const savedFilters = view.filters as Record<string, any> | null;
        filters.clearAll();
        if (savedFilters?.search) filters.setSearchQuery(savedFilters.search);
        if (savedFilters?.facets) {
            Object.entries(savedFilters.facets).forEach(([key, values]) => {
                if (Array.isArray(values)) values.forEach(v => filters.toggleFacet(key, v));
            });
        }
        if (view.view_mode) setViewMode(view.view_mode as ViewMode);
    }, [localViews, filters]);

    const getCurrentFilters = useCallback(() => {
        const facets: Record<string, string[]> = {};
        Object.entries(filters.facetValues).forEach(([key, values]) => {
            if (values.size > 0) facets[key] = Array.from(values);
        });
        return {
            search: filters.searchQuery || undefined,
            facets: Object.keys(facets).length > 0 ? facets : undefined,
        };
    }, [filters]);

    const handleCreateView = useCallback(async (name: string) => {
        const tempId = `temp-${Date.now()}`;
        const optimisticView: SavedView = {
            id: tempId,
            organization_id: organizationId,
            name,
            entity_type: "contacts",
            view_mode: viewMode,
            filters: getCurrentFilters(),
            is_default: false,
            position: localViews.length,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setLocalViews(prev => [...prev, optimisticView]);
        setActiveViewId(tempId);
        setEditingView(null);
        const result = await createSavedView({
            organizationId,
            name,
            entityType: "contacts",
            viewMode,
            filters: getCurrentFilters(),
        });
        if (result.success && result.data) {
            setLocalViews(prev => prev.map(v => v.id === tempId ? { ...v, id: result.data.id } : v));
            setActiveViewId(result.data.id);
        } else {
            toast.error("Error al crear la vista");
            setLocalViews(prev => prev.filter(v => v.id !== tempId));
            setActiveViewId(null);
        }
    }, [organizationId, viewMode, localViews.length, getCurrentFilters]);

    const handleRenameView = useCallback(async (viewId: string, newName: string) => {
        setLocalViews(prev => prev.map(v => v.id === viewId ? { ...v, name: newName } : v));
        const result = await updateSavedView(viewId, { name: newName });
        if (!result.success) {
            toast.error("Error al renombrar la vista");
            router.refresh();
        }
    }, [router]);

    const handleUpdateViewFilters = useCallback(async (viewId: string) => {
        const currentFilters = getCurrentFilters();
        setLocalViews(prev => prev.map(v => v.id === viewId ? { ...v, filters: currentFilters, view_mode: viewMode } : v));
        const result = await updateSavedView(viewId, { filters: currentFilters, viewMode });
        if (result.success) {
            toast.success("Filtros de la vista actualizados");
        } else {
            toast.error("Error al actualizar los filtros");
            router.refresh();
        }
    }, [getCurrentFilters, viewMode, router]);

    const handleDeleteView = useCallback(async (viewId: string) => {
        setLocalViews(prev => prev.filter(v => v.id !== viewId));
        if (activeViewId === viewId) {
            setActiveViewId(null);
            filters.clearAll();
        }
        const result = await deleteSavedView(viewId);
        if (!result.success) {
            toast.error("Error al eliminar la vista");
            router.refresh();
        }
    }, [activeViewId, filters, router]);

    const handleStartCreate = useCallback(() => {
        setEditingView({ id: null, name: "" });
        setEditName("");
    }, []);

    const handleStartEdit = useCallback((viewId: string) => {
        const view = localViews.find(v => v.id === viewId);
        if (!view) return;
        setEditingView({ id: viewId, name: view.name });
        setEditName(view.name);
        setActiveViewId(viewId);
        // Apply view filters
        const savedFilters = view.filters as Record<string, any> | null;
        filters.clearAll();
        if (savedFilters?.search) filters.setSearchQuery(savedFilters.search);
        if (savedFilters?.facets) {
            Object.entries(savedFilters.facets).forEach(([key, values]) => {
                if (Array.isArray(values)) values.forEach(v => filters.toggleFacet(key, v));
            });
        }
        if (view.view_mode) setViewMode(view.view_mode as ViewMode);
    }, [localViews, filters]);

    const handleCancelEdit = useCallback(() => {
        setEditingView(null);
    }, []);

    const handleSaveEditedView = useCallback(async () => {
        if (!editingView) return;
        const name = editName.trim();
        if (!name) return;
        if (editingView.id === null) {
            await handleCreateView(name);
        } else {
            if (name !== editingView.name) await handleRenameView(editingView.id, name);
            await handleUpdateViewFilters(editingView.id);
            setEditingView(null);
        }
    }, [editingView, editName, handleCreateView, handleRenameView, handleUpdateViewFilters]);

    // ─── Import config ────────────────────────────────────
    const contactImportConfig: ImportConfig<any> = useMemo(() => ({
        entityLabel: "Contactos",
        entityId: "contactos",
        columns: [
            { id: "first_name", label: "Nombre", required: true, example: "Juan" },
            { id: "last_name", label: "Apellido", required: false, example: "Pérez" },
            {
                id: "email",
                label: "Email",
                type: "email",
                unique: true,
                normalization: normalizeEmail,
                validation: (val) => {
                    const normalized = normalizeEmail(val);
                    if (!normalized) return undefined;
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(normalized)) return "Email inválido";
                }
            },
            {
                id: "phone",
                label: "Teléfono",
                type: "phone",
                normalization: normalizePhone
            },
            { id: "company_name", label: "Empresa", required: false },
            { id: "location", label: "Ubicación", required: false },
            { id: "notes", label: "Notas", required: false },
            {
                id: "contact_categories",
                label: "Categoría",
                required: false,
                example: "Cliente",
                foreignKey: {
                    table: 'contact_categories',
                    labelField: 'name',
                    valueField: 'id',
                    fetchOptions: async (orgId) => {
                        const categories = await getContactCategories(orgId);
                        return categories.map(c => ({ id: c.id, label: c.name }));
                    },
                    allowCreate: true,
                    createAction: async (orgId, name) => {
                        const newCategory = await createContactCategory(orgId, name);
                        return { id: newCategory.id };
                    }
                }
            },
        ],
        onImport: async (data) => {
            try {
                const batch = await createImportBatch(organizationId, "contacts", data.length);
                await importContactsBatch(organizationId, data, batch.id);
                return { success: data.length, errors: [], batchId: batch.id };
            } catch (error) {
                console.error("Import error:", error);
                throw error;
            }
        },
        onRevert: async (batchId) => {
            await revertImportBatch(batchId, 'contacts');
        }
    }), [organizationId]);

    const handleOpenImport = useCallback(() => {
        openModal(
            <BulkImportModal config={contactImportConfig} organizationId={organizationId} />,
            {
                size: "2xl",
                title: `Importar ${contactImportConfig.entityLabel}`,
                description: "Sigue los pasos para importar datos masivamente."
            }
        );
    }, [contactImportConfig, organizationId, openModal]);

    // ─── Determine content state ─────────────────────────
    const isEmpty = optimisticContacts.length === 0;
    const hasData = optimisticContacts.length > 0;
    const noResults = hasData && filteredContacts.length === 0;

    // ─── View toggle options ─────────────────────────────
    const viewOptions = useMemo(() => [
        { value: "grid", label: "Grilla", icon: LayoutGrid },
        { value: "table", label: "Lista", icon: List },
    ], []);

    // ─── Toolbar ─────────────────────────────────────────
    const toolbar = (
        <ToolbarCard
            left={
                <ViewsTabs
                    views={localViews}
                    activeViewId={activeViewId}
                    onSelectView={handleSelectView}
                    onStartCreate={handleStartCreate}
                    onStartEdit={handleStartEdit}
                    onRenameView={handleRenameView}
                    onUpdateFilters={handleUpdateViewFilters}
                    onDeleteView={handleDeleteView}
                />
            }
            right={
                <>
                    <SearchButton filters={filters} placeholder="Buscar contactos..." />
                    <FilterPopover filters={filters} />
                    <DisplayButton
                        viewMode={viewMode}
                        onViewModeChange={(v) => setViewMode(v as ViewMode)}
                        viewModeOptions={viewOptions}
                    />
                </>
            }
            bottom={
                editingView ? (
                    <ViewEditorBar
                        name={editName}
                        onNameChange={setEditName}
                        onCancel={handleCancelEdit}
                        onSave={handleSaveEditedView}
                    />
                ) : filters.hasActiveFilters ? (
                    <ActiveFiltersBar
                        filters={filters}
                        onSaveView={handleStartCreate}
                    />
                ) : undefined
            }
        />
    );

    // ─── Render ──────────────────────────────────────────
    return (
        <>
            {/* Primary Action → Header via PageHeaderActionPortal */}
            <PageHeaderActionPortal>
                <div className="flex items-center">
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-l-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Nuevo Contacto</span>
                    </button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="flex items-center justify-center h-8 w-8 rounded-r-lg border-l border-primary-foreground/20 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={handleOpenImport}>
                                <Upload className="h-4 w-4 mr-2" />
                                Importar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </PageHeaderActionPortal>

            {/* Empty state — no contacts at all */}
            {isEmpty ? (
                <ViewEmptyState
                    mode="empty"
                    icon={Users}
                    viewName="Contactos"
                    featureDescription="Los contactos son las personas y empresas con las que trabajás: clientes, proveedores, subcontratistas y socios. Organizalos con etiquetas, vincularlos a proyectos y mantenelos actualizados."
                    onAction={handleOpenCreate}
                    actionLabel="Nuevo Contacto"
                    docsPath="/docs/contactos/introduccion"
                />
            ) : (
                /* Inline toolbar + content */
                <div className="flex flex-col gap-0.5 flex-1 min-h-0">
                    {toolbar}

                    {/* Content */}
                    {noResults ? (
                        <ViewEmptyState
                            mode="no-results"
                            icon={Users}
                            viewName="contactos"
                            onResetFilters={filters.clearAll}
                        />
                    ) : (
                        <ContactsDataTable
                            organizationId={organizationId}
                            contacts={filteredContacts}
                            contactCategories={contactCategories}
                            viewMode={viewMode}
                            organizationName={organizationName}
                            organizationLogoUrl={organizationLogoUrl}
                            companyContacts={companyContacts}
                            onDeleteContact={optimisticRemove}
                            searchQuery={filters.searchQuery}
                            onClearFilters={filters.clearAll}
                        />
                    )}
                </div>
            )}
        </>
    );
}

